// ===== APK Builder - Dashboard Client =====

const socket = io();
let currentProjectId = null;
let currentStep = 1;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    setupUploadZone();
    setupDatabaseToggle();
    setupIconUpload();
    setupPermissions();
    setupSocketEvents();
});

// ==================== UPLOAD ZONE ====================

function setupUploadZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

async function handleFile(file) {
    // Validate
    if (!file.name.endsWith('.zip')) {
        showToast('Hanya file .zip yang didukung', 'error');
        return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
        showToast('File terlalu besar. Maximum 500MB', 'error');
        return;
    }

    // Show progress
    const progressEl = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const dropZone = document.getElementById('drop-zone');

    dropZone.style.display = 'none';
    progressEl.style.display = 'block';

    const formData = new FormData();
    formData.append('project', file);

    try {
        progressText.textContent = `Uploading ${file.name}...`;
        progressFill.style.width = '30%';

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '80%';

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        progressFill.style.width = '100%';
        progressText.textContent = 'Upload selesai! Menganalisa project...';

        currentProjectId = data.projectId;

        // Join socket room
        socket.emit('join:project', currentProjectId);

        // Show detection results
        setTimeout(() => {
            displayDetection(data.detection, data.fileTree);
            goToStep(2);
        }, 800);

    } catch (error) {
        showToast(error.message, 'error');
        dropZone.style.display = 'block';
        progressEl.style.display = 'none';
    }
}

// ==================== DETECTION DISPLAY ====================

function displayDetection(detection, fileTree) {
    // Framework info
    const frameworkNames = {
        'react-cra': 'React (CRA)',
        'react-vite': 'React (Vite)',
        'react': 'React',
        'nextjs': 'Next.js',
        'vue': 'Vue.js',
        'nuxtjs': 'Nuxt.js',
        'angular': 'Angular',
        'svelte': 'Svelte',
        'sveltekit': 'SvelteKit',
        'laravel': 'Laravel',
        'express': 'Express.js',
        'django': 'Django',
        'flask': 'Flask',
        'static': 'Static HTML',
        'nodejs': 'Node.js'
    };

    document.getElementById('detected-framework').textContent =
        frameworkNames[detection.framework] || detection.framework;
    document.getElementById('detected-type').textContent = detection.type;
    document.getElementById('detected-build-cmd').textContent =
        detection.buildCommand || '(tidak perlu build)';
    document.getElementById('detected-output-dir').textContent = detection.outputDir || '-';

    // App name from detection
    if (detection.metadata?.name) {
        document.getElementById('app-name').value = detection.metadata.name;
    }

    // Database detection
    if (detection.hasDatabase) {
        document.getElementById('db-detection').style.display = 'flex';
        document.getElementById('detected-db').textContent = detection.databaseType || 'Detected';
        document.getElementById('db-config').style.display = 'block';

        // Pre-fill database config
        if (detection.databaseConfig) {
            const dc = detection.databaseConfig;
            if (dc.DB_HOST) document.getElementById('db-host').value = dc.DB_HOST;
            if (dc.DB_PORT) document.getElementById('db-port').value = dc.DB_PORT;
            if (dc.DB_DATABASE) document.getElementById('db-name').value = dc.DB_DATABASE;
            if (dc.DB_USERNAME) document.getElementById('db-user').value = dc.DB_USERNAME;
        }
    }

    // File tree
    renderFileTree(fileTree);
}

function renderFileTree(tree) {
    const container = document.getElementById('file-tree');
    if (!tree || tree.length === 0) {
        container.innerHTML = '<span class="tree-item">No files found</span>';
        return;
    }

    const html = tree.map(item => {
        const indent = '  '.repeat(item.depth);
        const icon = item.type === 'directory' ? '📁' : getFileIcon(item.name);
        const cssClass = item.type === 'directory' ? 'dir' : '';
        return `<div class="tree-item ${cssClass}">${indent}<span class="icon">${icon}</span>${item.name}</div>`;
    }).join('');

    container.innerHTML = html;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        js: '📄', jsx: '⚛️', ts: '📘', tsx: '⚛️',
        json: '📋', html: '🌐', css: '🎨', scss: '🎨',
        php: '🐘', py: '🐍', rb: '💎',
        md: '📝', txt: '📝', env: '🔒',
        png: '🖼️', jpg: '🖼️', svg: '🖼️',
        lock: '🔒', yml: '⚙️', yaml: '⚙️'
    };
    return icons[ext] || '📄';
}

// ==================== ICON UPLOAD ====================

function setupIconUpload() {
    const iconInput = document.getElementById('icon-input');
    const iconPreview = document.getElementById('icon-preview');
    const iconImg = document.getElementById('icon-img');
    const iconFilename = document.getElementById('icon-filename');
    const iconPlaceholder = iconPreview.querySelector('.icon-placeholder');

    iconInput.addEventListener('change', async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            showToast('Ukuran icon maksimal 10MB', 'error');
            iconInput.value = '';
            return;
        }

        // Preview image locally
        const reader = new FileReader();
        reader.onload = (e) => {
            iconImg.src = e.target.result;
            iconImg.style.display = 'block';
            if (iconPlaceholder) iconPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);

        iconFilename.textContent = file.name;

        // Auto-upload icon if project is ready
        if (currentProjectId) {
            try {
                const formData = new FormData();
                formData.append('icon', file);

                iconFilename.textContent = 'Uploading...';

                const response = await fetch(`/api/icon/${currentProjectId}`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Gagal upload icon');

                iconFilename.textContent = file.name + ' (Uploaded ✅)';
            } catch (error) {
                showToast(error.message, 'error');
                iconFilename.textContent = file.name + ' (Gagal ❌)';
            }
        }
    });
}

// ==================== PERMISSIONS ====================

async function setupPermissions() {
    try {
        const response = await fetch('/api/permissions');
        if (!response.ok) throw new Error('Failed to load');

        const permissions = await response.json();
        const grid = document.getElementById('permissions-grid');

        grid.innerHTML = permissions.map(p => `
            <label class="permission-item" for="perm-${p.key}">
                <input type="checkbox" class="permission-checkbox" id="perm-${p.key}" name="permissions" value="${p.key}">
                <div class="permission-info">
                    <div class="permission-title">
                        <span>${p.icon}</span> ${p.label}
                    </div>
                    <div class="permission-desc">${p.description}</div>
                </div>
            </label>
        `).join('');

        // Handle styling on check
        document.querySelectorAll('.permission-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const parent = e.target.closest('.permission-item');
                if (e.target.checked) parent.classList.add('selected');
                else parent.classList.remove('selected');
            });
        });
    } catch (err) {
        document.getElementById('permissions-grid').innerHTML =
            '<div class="loading-text">Gagal memuat daftar permission</div>';
    }
}

// ==================== DATABASE CONFIG TOGGLE ====================

function setupDatabaseToggle() {
    document.querySelectorAll('input[name="db-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isOnline = e.target.value === 'online';
            document.getElementById('api-url-group').style.display = isOnline ? 'block' : 'none';
            document.getElementById('db-fields').style.display = isOnline ? 'none' : 'block';
        });
    });
}

// ==================== BUILD ====================

async function startBuild() {
    if (!currentProjectId) {
        showToast('Tidak ada project yang diupload', 'error');
        return;
    }

    // Gather config
    const userConfig = {
        appName: document.getElementById('app-name').value || 'My App',
        appId: document.getElementById('app-id').value || 'com.apkbuilder.app',
        permissions: Array.from(document.querySelectorAll('.permission-checkbox:checked')).map(cb => cb.value)
    };

    // Database config
    const dbMode = document.querySelector('input[name="db-mode"]:checked');
    if (dbMode && document.getElementById('db-config').style.display !== 'none') {
        userConfig.database = {
            mode: dbMode.value,
            apiUrl: document.getElementById('api-url').value
        };

        if (dbMode.value === 'offline') {
            userConfig.database.host = document.getElementById('db-host').value;
            userConfig.database.port = document.getElementById('db-port').value;
            userConfig.database.name = document.getElementById('db-name').value;
            userConfig.database.user = document.getElementById('db-user').value;
            userConfig.database.pass = document.getElementById('db-pass').value;
        }
    }

    // Go to build step
    goToStep(3);

    try {
        const response = await fetch(`/api/build/${currentProjectId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userConfig)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Build start failed');
        }

    } catch (error) {
        appendTerminalLine('error', `Build gagal dimulai: ${error.message}`);
    }
}

// ==================== SOCKET.IO EVENTS ====================

function setupSocketEvents() {
    // Real-time build logs
    socket.on('build:log', (entry) => {
        appendTerminalLine(entry.type, entry.message);
    });

    // Existing logs when reconnecting
    socket.on('build:logs', (logs) => {
        logs.forEach(entry => appendTerminalLine(entry.type, entry.message));
    });

    // Build status updates
    socket.on('build:status', (data) => {
        updateBuildStatus(data);
    });
}

function appendTerminalLine(type, message) {
    const terminal = document.getElementById('terminal-body');
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });

    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;

    if (type === 'command') {
        line.textContent = message.replace(/^\$\s*/, '');
    } else {
        line.innerHTML = `<span class="terminal-time">${time}</span>${escapeHtml(message)}`;
    }

    terminal.appendChild(line);

    // Auto-scroll
    terminal.scrollTop = terminal.scrollHeight;
}

function updateBuildStatus(data) {
    const badge = document.getElementById('build-status-badge');
    const phase = document.getElementById('build-phase');

    const phaseLabels = {
        'configuring': 'Mengkonfigurasi project...',
        'installing': 'Menginstall dependencies...',
        'building_apk': 'Building APK...',
        'done': 'Build selesai!',
        'error': 'Build gagal'
    };

    phase.textContent = phaseLabels[data.phase] || data.phase;

    // Update stages
    const stageMap = {
        'installing': ['stage-install'],
        'configuring': ['stage-install'],
        'building_apk': ['stage-install', 'stage-build', 'stage-capacitor'],
        'done': ['stage-install', 'stage-build', 'stage-capacitor', 'stage-apk'],
        'error': []
    };

    // Mark completed stages
    const completedStages = stageMap[data.phase] || [];
    ['stage-install', 'stage-build', 'stage-capacitor', 'stage-apk'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'build-stage';
        const statusEl = document.getElementById(id + '-status');

        if (completedStages.includes(id)) {
            el.classList.add('done');
            statusEl.textContent = '✓ done';
        }
    });

    // Current active stage
    if (data.phase === 'installing') {
        document.getElementById('stage-install').className = 'build-stage active';
        document.getElementById('stage-install-status').textContent = 'running...';
    } else if (data.phase === 'building_apk') {
        document.getElementById('stage-capacitor').className = 'build-stage active';
        document.getElementById('stage-capacitor-status').textContent = 'running...';
    }

    // Build complete
    if (data.status === 'completed' || data.status === 'completed_no_apk') {
        badge.innerHTML = `<div class="status-dot success"></div><span>Selesai</span>`;

        setTimeout(() => {
            goToStep(4);
            if (data.apkPath) {
                document.getElementById('download-info').style.display = 'block';
                document.getElementById('download-failed').style.display = 'none';
                document.getElementById('download-btn').setAttribute('data-url', data.apkPath);

                // Update file name
                if (data.apkPath) {
                    const filename = data.apkPath.split('/').pop() || 'app.apk';
                    document.getElementById('download-filename').textContent = filename;
                }

            } else {
                document.getElementById('download-info').style.display = 'none';
                document.getElementById('download-failed').style.display = 'block';
            }
        }, 1500);
    }

    if (data.status === 'failed') {
        badge.innerHTML = `<div class="status-dot error"></div><span>Gagal</span>`;

        // Mark current stage as error
        ['stage-install', 'stage-build', 'stage-capacitor', 'stage-apk'].forEach(id => {
            const el = document.getElementById(id);
            if (el.classList.contains('active')) {
                el.className = 'build-stage error';
                document.getElementById(id + '-status').textContent = '✗ error';
            }
        });
    }
}

// ==================== STEP NAVIGATION ====================

function goToStep(step) {
    currentStep = step;

    // Update step indicators
    for (let i = 1; i <= 4; i++) {
        const indicator = document.getElementById(`step-${i}-indicator`);
        indicator.className = 'step';
        if (i < step) indicator.classList.add('completed');
        if (i === step) indicator.classList.add('active');
    }

    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, idx) => {
        line.style.background = idx < step - 1 ? 'var(--success)' : 'var(--border)';
    });

    // Show/hide sections
    const sections = ['step-upload', 'step-configure', 'step-build', 'step-download'];
    sections.forEach((id, idx) => {
        const el = document.getElementById(id);
        el.className = 'step-content' + (idx === step - 1 ? ' active' : '');
    });
}

// ==================== UTILITIES ====================

function clearTerminal() {
    document.getElementById('terminal-body').innerHTML = '';
}

function downloadApk() {
    const btn = document.getElementById('download-btn');
    const url = btn.getAttribute('data-url');
    if (url) {
        window.open(url, '_blank');
    }
}

function resetApp() {
    currentProjectId = null;

    // Reset upload zone
    document.getElementById('drop-zone').style.display = 'block';
    document.getElementById('upload-progress').style.display = 'none';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('file-input').value = '';

    // Reset Icon
    document.getElementById('icon-input').value = '';
    document.getElementById('icon-img').style.display = 'none';
    document.getElementById('icon-img').src = '';
    const placeholder = document.querySelector('.icon-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    document.getElementById('icon-filename').textContent = 'Belum ada file dipilih';

    // Reset Permissions
    document.querySelectorAll('.permission-checkbox').forEach(cb => {
        cb.checked = false;
        cb.closest('.permission-item').classList.remove('selected');
    });

    // Reset detection
    document.getElementById('db-config').style.display = 'none';
    document.getElementById('db-detection').style.display = 'none';

    // Reset terminal
    clearTerminal();
    appendTerminalLine('info', 'Waiting for build to start...');

    // Reset stages
    ['stage-install', 'stage-build', 'stage-capacitor', 'stage-apk'].forEach(id => {
        document.getElementById(id).className = 'build-stage';
        document.getElementById(id + '-status').textContent = 'waiting';
    });

    document.getElementById('build-status-badge').innerHTML =
        '<div class="status-dot pulsing"></div><span>Building</span>';
    document.getElementById('build-phase').textContent = 'Initializing...';

    // Go to step 1
    goToStep(1);
}

async function showBuilds() {
    const modal = document.getElementById('builds-modal');
    modal.style.display = 'flex';

    try {
        const response = await fetch('/api/builds');
        const builds = await response.json();

        const list = document.getElementById('builds-list');
        if (builds.length === 0) {
            list.innerHTML = '<p class="empty-state">Belum ada build history</p>';
            return;
        }

        list.innerHTML = builds.map(b => `
      <div class="build-item">
        <div class="build-item-info">
          <span class="build-item-framework">${b.framework || 'Unknown'}</span>
          <span class="build-item-date">${new Date(b.createdAt).toLocaleString('id-ID')}</span>
        </div>
        <span class="build-item-status ${b.status}">${b.status}</span>
      </div>
    `).join('');

    } catch {
        document.getElementById('builds-list').innerHTML =
            '<p class="empty-state">Gagal memuat build history</p>';
    }
}

function closeModal() {
    document.getElementById('builds-modal').style.display = 'none';
}

function showToast(message, type = 'info') {
    // Simple alert for now
    alert(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});
