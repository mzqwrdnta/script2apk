const { v4: uuidv4 } = require('uuid');
const Logger = require('../utils/logger');
const UploadService = require('./upload.service');
const DetectorService = require('./detector.service');
const ConfiguratorService = require('./configurator.service');
const IconService = require('./icon.service');
const { PermissionService } = require('./permission.service');
const CapacitorEngine = require('../engines/capacitor.engine');
const config = require('../config');
const path = require('path');

// Store active builds
const builds = new Map();

class BuilderService {
    constructor(io) {
        this.io = io;
    }

    /**
     * Proses upload dan deteksi framework
     */
    async processUpload(file) {
        const projectId = uuidv4();
        const logger = new Logger(this.io, projectId);

        const uploadService = new UploadService(logger);
        const detectorService = new DetectorService(logger);

        try {
            // Extract file
            const { workspacePath, projectRoot } = await uploadService.processUpload(file, projectId);

            // Detect framework  
            const detection = detectorService.detect(projectRoot);

            // Get project file tree
            const fileTree = uploadService.getProjectTree(projectRoot);

            // Store build info
            const buildInfo = {
                projectId,
                status: 'detected',
                workspacePath,
                projectRoot,
                detection,
                fileTree,
                iconPath: null,
                permissions: [],
                createdAt: new Date().toISOString(),
                logs: logger.getLogs()
            };

            builds.set(projectId, buildInfo);

            return buildInfo;
        } catch (error) {
            logger.error(`Upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Mulai proses build APK
     */
    async startBuild(projectId, userConfig = {}) {
        const buildInfo = builds.get(projectId);
        if (!buildInfo) {
            throw new Error(`Project not found: ${projectId}`);
        }

        const logger = new Logger(this.io, projectId);
        buildInfo.status = 'building';
        buildInfo.startedAt = new Date().toISOString();

        try {
            // Emit build start
            this.io.to(projectId).emit('build:status', { status: 'building', phase: 'configuring' });

            logger.info('🚀 Memulai build process...');
            logger.info(`Framework: ${buildInfo.detection.framework}`);
            logger.info(`Type: ${buildInfo.detection.type}`);
            if (buildInfo.iconPath) {
                logger.info('🎨 Custom icon: Yes');
            }
            if (userConfig.permissions && userConfig.permissions.length > 0) {
                logger.info(`🔑 Permissions: ${userConfig.permissions.join(', ')}`);
            }

            // 1. Auto-configure
            this.io.to(projectId).emit('build:status', { status: 'building', phase: 'installing' });
            const configurator = new ConfiguratorService(logger);
            const { buildOutputDir } = await configurator.configure(
                buildInfo.projectRoot,
                buildInfo.detection,
                userConfig
            );

            // 2. Process icon if uploaded
            let iconResult = null;
            if (buildInfo.iconPath) {
                this.io.to(projectId).emit('build:status', { status: 'building', phase: 'processing_icon' });
                const iconService = new IconService(logger);
                const iconOutputDir = path.join(buildInfo.workspacePath, 'icons');
                iconResult = await iconService.processIcon(buildInfo.iconPath, iconOutputDir);
            }

            // 3. Build APK
            this.io.to(projectId).emit('build:status', { status: 'building', phase: 'building_apk' });
            const engine = new CapacitorEngine(logger);
            const apkPath = await engine.build(
                buildInfo.projectRoot,
                buildOutputDir,
                {
                    appId: userConfig.appId || config.CAPACITOR_DEFAULTS.appId,
                    appName: userConfig.appName || buildInfo.detection.metadata?.name || config.CAPACITOR_DEFAULTS.appName,
                    projectId,
                    iconResult,
                    permissions: userConfig.permissions || []
                }
            );

            // Update build info
            buildInfo.status = apkPath ? 'completed' : 'completed_no_apk';
            buildInfo.apkPath = apkPath;
            buildInfo.completedAt = new Date().toISOString();
            buildInfo.logs = logger.getLogs();

            this.io.to(projectId).emit('build:status', {
                status: buildInfo.status,
                phase: 'done',
                apkPath: apkPath ? `/api/download/${projectId}` : null
            });

            if (apkPath) {
                logger.success('🎉 Build selesai! APK siap didownload.');
            } else {
                logger.warning('Build selesai tapi APK tidak dihasilkan (butuh Android SDK).');
                logger.info('Capacitor project sudah disiapkan dan bisa di-build manual.');
            }

            return buildInfo;
        } catch (error) {
            buildInfo.status = 'failed';
            buildInfo.error = error.message;
            buildInfo.logs = logger.getLogs();

            this.io.to(projectId).emit('build:status', {
                status: 'failed',
                phase: 'error',
                error: error.message
            });

            logger.error(`❌ Build gagal: ${error.message}`);
            return buildInfo;
        }
    }

    getBuild(projectId) {
        return builds.get(projectId);
    }

    getAllBuilds() {
        return Array.from(builds.values()).map(b => ({
            projectId: b.projectId,
            status: b.status,
            framework: b.detection?.framework,
            createdAt: b.createdAt,
            completedAt: b.completedAt
        }));
    }
}

module.exports = BuilderService;
