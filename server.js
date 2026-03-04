const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const config = require('./src/config');
const BuilderService = require('./src/services/builder.service');
const { ANDROID_PERMISSIONS } = require('./src/services/permission.service');
const { ensureDir } = require('./src/utils/helpers');

// Ensure directories exist
ensureDir(config.UPLOADS_DIR);
ensureDir(config.WORKSPACE_DIR);
ensureDir(config.BUILDS_DIR);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
    maxHttpBufferSize: 10 * 1024 * 1024 // 10MB for socket
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload config - project ZIP
const uploadProject = multer({
    dest: config.UPLOADS_DIR,
    limits: { fileSize: config.MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file .zip yang didukung'));
        }
    }
});

// File upload config - icon image
const uploadIcon = multer({
    dest: config.UPLOADS_DIR,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for icon
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format icon: .png, .jpg, .jpeg, .webp, .svg'));
        }
    }
});

// Builder service instance
const builder = new BuilderService(io);

// ===================API ROUTES ====================

// Upload project
app.post('/api/upload', uploadProject.single('project'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Kirim file .zip' });
        }

        const result = await builder.processUpload(req.file);

        res.json({
            success: true,
            projectId: result.projectId,
            detection: result.detection,
            fileTree: result.fileTree,
            message: `Framework terdeteksi: ${result.detection.framework} (${result.detection.type})`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload app icon
app.post('/api/icon/:projectId', uploadIcon.single('icon'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const build = builder.getBuild(projectId);

        if (!build) {
            return res.status(404).json({ error: 'Project tidak ditemukan' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No icon file uploaded' });
        }

        // Save icon path to build info
        build.iconPath = req.file.path;
        build.iconOriginalName = req.file.originalname;

        res.json({
            success: true,
            message: 'Icon berhasil diupload',
            filename: req.file.originalname
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available permissions
app.get('/api/permissions', (req, res) => {
    const permissions = Object.entries(ANDROID_PERMISSIONS).map(([key, value]) => ({
        key,
        label: value.label,
        icon: value.icon,
        description: value.description,
        count: value.permissions.length
    }));
    res.json(permissions);
});

// Start build
app.post('/api/build/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const userConfig = req.body || {};

        const build = builder.getBuild(projectId);
        if (!build) {
            return res.status(404).json({ error: 'Project tidak ditemukan' });
        }

        // Start build in background
        res.json({
            success: true,
            projectId,
            message: 'Build dimulai. Pantau progress di terminal.'
        });

        // Run build asynchronously
        builder.startBuild(projectId, userConfig);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get build status
app.get('/api/build/:projectId', (req, res) => {
    const build = builder.getBuild(req.params.projectId);
    if (!build) {
        return res.status(404).json({ error: 'Project tidak ditemukan' });
    }

    res.json({
        projectId: build.projectId,
        status: build.status,
        detection: build.detection,
        createdAt: build.createdAt,
        completedAt: build.completedAt,
        error: build.error,
        apkPath: build.apkPath ? `/api/download/${build.projectId}` : null,
        logs: build.logs
    });
});

// Download APK
app.get('/api/download/:projectId', (req, res) => {
    const build = builder.getBuild(req.params.projectId);
    if (!build || !build.apkPath) {
        return res.status(404).json({ error: 'APK tidak tersedia' });
    }

    if (!fs.existsSync(build.apkPath)) {
        return res.status(404).json({ error: 'APK file tidak ditemukan' });
    }

    res.download(build.apkPath);
});

// List all builds
app.get('/api/builds', (req, res) => {
    res.json(builder.getAllBuilds());
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join project room untuk terima log spesifik
    socket.on('join:project', (projectId) => {
        socket.join(projectId);
        console.log(`📡 Client ${socket.id} joined project: ${projectId}`);

        // Kirim existing logs
        const build = builder.getBuild(projectId);
        if (build && build.logs) {
            socket.emit('build:logs', build.logs);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error('Server error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: `File terlalu besar. Maximum ${config.MAX_FILE_SIZE / 1024 / 1024}MB` });
        }
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || 'Internal server error' });
});

// ==================== START SERVER ====================

server.listen(config.PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     🔨 APK Builder - Ready!              ║');
    console.log(`║     🌐 http://localhost:${config.PORT}              ║`);
    console.log('║     📱 Upload project → Get APK          ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});
