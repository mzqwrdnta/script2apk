const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

module.exports = {
    PORT: process.env.PORT || 3000,
    ROOT_DIR,
    UPLOADS_DIR: path.join(ROOT_DIR, 'uploads'),
    WORKSPACE_DIR: path.join(ROOT_DIR, 'workspace'),
    BUILDS_DIR: path.join(ROOT_DIR, 'builds'),
    TEMPLATES_DIR: path.join(ROOT_DIR, 'templates'),
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
    SUPPORTED_FRAMEWORKS: [
        'react', 'vue', 'angular', 'nextjs', 'nuxtjs',
        'svelte', 'laravel', 'express', 'static'
    ],
    BUILD_FORMATS: ['apk'],
    CAPACITOR_DEFAULTS: {
        appId: 'com.apkbuilder.app',
        appName: 'MyApp',
        webDir: 'dist'
    }
};
