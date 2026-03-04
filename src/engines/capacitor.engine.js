const fs = require('fs');
const path = require('path');
const CliService = require('../services/cli.service');
const IconService = require('../services/icon.service');
const { PermissionService } = require('../services/permission.service');
const { ensureDir, fileExists, readJsonFile } = require('../utils/helpers');
const config = require('../config');

class CapacitorEngine {
    constructor(logger) {
        this.logger = logger;
        this.cli = new CliService(logger);
    }

    /**
     * Build APK dari web project output
     */
    async build(projectRoot, buildOutputDir, options = {}) {
        this.logger.info('📱 Memulai Capacitor APK build...');

        const appId = options.appId || config.CAPACITOR_DEFAULTS.appId;
        const appName = options.appName || config.CAPACITOR_DEFAULTS.appName;

        // 1. Cek prerequisites
        await this._checkPrerequisites();

        // 2. Setup Capacitor di project
        const capacitorDir = path.join(path.dirname(projectRoot), 'capacitor_build');
        ensureDir(capacitorDir);

        // 3. Initialize Capacitor project
        await this._initCapacitor(capacitorDir, buildOutputDir, appId, appName);

        // 4. Copy web assets ke Capacitor
        await this._copyWebAssets(capacitorDir, buildOutputDir);

        // 5. Add Android platform
        await this._addAndroidPlatform(capacitorDir);

        // 6. Inject Service Worker untuk offline support
        await this._injectOfflineSupport(capacitorDir, buildOutputDir);

        // 7. Sync web assets ke Android project
        await this._syncAndBuild(capacitorDir, true, false); // Just sync, no build yet

        const androidDir = path.join(capacitorDir, 'android');

        // 8. Apply App Name directly to strings.xml
        this._updateAndroidAppName(androidDir, appName);

        // 9. Apply custom icon if provided
        if (options.iconResult) {
            const iconService = new IconService(this.logger);
            await iconService.applyToAndroid(options.iconResult.resDir, androidDir);
        }

        // 10. Apply permissions
        if (options.permissions && options.permissions.length > 0) {
            const permService = new PermissionService(this.logger);
            permService.applyToManifest(androidDir, options.permissions);
        }

        // 11. Build the APK
        await this._syncAndBuild(capacitorDir, false, true); // Build only

        // 12. Temukan APK output
        const apkPath = await this._findApk(capacitorDir);

        // 11. Copy APK ke builds directory
        const outputPath = await this._exportApk(apkPath, appName, options.projectId);

        this.logger.success(`🎉 APK berhasil dibuild: ${outputPath}`);
        return outputPath;
    }

    async _checkPrerequisites() {
        this.logger.info('🔎 Mengecek prerequisites...');

        const hasNode = await this.cli.checkCommand('node');
        const hasNpm = await this.cli.checkCommand('npm');
        const hasJava = await this.cli.checkCommand('java');

        // Log Node.js version
        try {
            const nodeVer = await this.cli.exec('node', ['--version'], { allowNonZero: true });
            this.logger.info(`Node.js version: ${nodeVer.stdout.trim()}`);
        } catch { }

        if (!hasNode || !hasNpm) {
            throw new Error('Node.js dan NPM diperlukan. Install dari https://nodejs.org');
        }

        // Cek ANDROID_HOME atau ANDROID_SDK_ROOT
        const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
        if (!androidHome) {
            this.logger.warning('⚠️ ANDROID_HOME/ANDROID_SDK_ROOT belum diset');
            this.logger.info('Untuk build APK yang sebenarnya, install Android SDK');
            this.logger.info('Download: https://developer.android.com/studio');
            this.logger.info('Melanjutkan dengan debug build mode...');
        } else {
            this.logger.success(`Android SDK ditemukan: ${androidHome}`);
        }

        if (!hasJava) {
            this.logger.warning('⚠️ Java JDK tidak ditemukan. Diperlukan untuk Android build');
            this.logger.info('Install JDK 17: sudo apt install openjdk-17-jdk');
        }
    }

    async _initCapacitor(capacitorDir, webDir, appId, appName) {
        this.logger.info('🔧 Initializing Capacitor...');

        // Buat package.json minimal
        const packageJson = {
            name: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            version: '1.0.0',
            private: true,
            dependencies: {}
        };

        fs.writeFileSync(
            path.join(capacitorDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // Install Capacitor v6 (compatible with Node.js >= 18)
        this.logger.info('📦 Installing Capacitor v6 (Node.js 18+ compatible)...');
        await this.cli.exec('npm', ['install', '@capacitor/core@^6.0.0', '@capacitor/cli@^6.0.0', '@capacitor/android@^6.0.0'], {
            cwd: capacitorDir,
            timeout: 120000
        });

        // Buat capacitor.config.json
        const capConfig = {
            appId: appId,
            appName: appName,
            webDir: 'www',
            bundledWebRuntime: false,
            server: {
                androidScheme: 'https'
            },
            plugins: {
                SplashScreen: {
                    launchShowDuration: 2000,
                    launchAutoHide: true,
                    backgroundColor: '#0a0a0a'
                }
            }
        };

        fs.writeFileSync(
            path.join(capacitorDir, 'capacitor.config.json'),
            JSON.stringify(capConfig, null, 2)
        );

        this.logger.success('Capacitor initialized');
    }

    async _copyWebAssets(capacitorDir, buildOutputDir) {
        this.logger.info('📋 Menyalin web assets ke Capacitor...');

        const wwwDir = path.join(capacitorDir, 'www');
        ensureDir(wwwDir);

        // Copy semua file dari build output ke www/
        this._copyDirRecursive(buildOutputDir, wwwDir);

        // Pastikan index.html ada
        if (!fileExists(path.join(wwwDir, 'index.html'))) {
            this.logger.warning('index.html tidak ditemukan di build output');
            // Cari di subdirectories
            const entries = fs.readdirSync(wwwDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const subIndex = path.join(wwwDir, entry.name, 'index.html');
                    if (fileExists(subIndex)) {
                        // Move contents up one level
                        const subDir = path.join(wwwDir, entry.name);
                        const subEntries = fs.readdirSync(subDir);
                        for (const se of subEntries) {
                            const src = path.join(subDir, se);
                            const dest = path.join(wwwDir, se);
                            fs.renameSync(src, dest);
                        }
                        fs.rmSync(subDir, { recursive: true, force: true });
                        this.logger.info(`index.html ditemukan di subfolder: ${entry.name}`);
                        break;
                    }
                }
            }
        }

        this.logger.success('Web assets disalin');
    }

    _copyDirRecursive(src, dest) {
        ensureDir(dest);
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                this._copyDirRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    async _addAndroidPlatform(capacitorDir) {
        this.logger.info('🤖 Menambahkan platform Android...');

        try {
            const result = await this.cli.exec('npx', ['cap', 'add', 'android'], {
                cwd: capacitorDir,
                allowNonZero: true
            });
            // Cek apakah output mengandung fatal error
            const output = (result.stdout || '') + (result.stderr || '');
            if (output.includes('[fatal]')) {
                throw new Error(`Capacitor fatal error: ${output}`);
            }
            this.logger.success('Platform Android ditambahkan');
        } catch (error) {
            // Platform mungkin sudah ada
            if (error.message && error.message.includes('already exists')) {
                this.logger.info('Platform Android sudah ada, melanjutkan...');
            } else {
                throw error;
            }
        }
    }

    async _injectOfflineSupport(capacitorDir, buildOutputDir) {
        this.logger.info('📴 Menambahkan offline support...');

        const wwwDir = path.join(capacitorDir, 'www');

        // Buat service worker
        const swContent = `
// Service Worker untuk offline support
const CACHE_NAME = 'app-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});
`;

        fs.writeFileSync(path.join(wwwDir, 'sw.js'), swContent);

        // Inject service worker registration ke index.html
        const indexPath = path.join(wwwDir, 'index.html');
        if (fileExists(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            if (!html.includes('serviceWorker')) {
                const swScript = `
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.log('SW registration failed:', err));
}
</script>`;
                html = html.replace('</body>', `${swScript}\n</body>`);
                fs.writeFileSync(indexPath, html);
            }
        }

        // Buat manifest.json
        const manifest = {
            name: 'App',
            short_name: 'App',
            start_url: '/',
            display: 'standalone',
            background_color: '#0a0a0a',
            theme_color: '#7c3aed'
        };

        fs.writeFileSync(path.join(wwwDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

        this.logger.success('Offline support ditambahkan');
    }

    _updateAndroidAppName(androidDir, appName) {
        this.logger.info(`📝 Mengupdate nama aplikasi menjadi "${appName}"...`);
        const stringsXmlPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');

        if (fileExists(stringsXmlPath)) {
            let content = fs.readFileSync(stringsXmlPath, 'utf-8');
            // Change <string name="app_name">My App</string>
            content = content.replace(/<string name="app_name">.*<\/string>/, `<string name="app_name">${appName}</string>`);
            // Change title_activity_main if present
            content = content.replace(/<string name="title_activity_main">.*<\/string>/, `<string name="title_activity_main">${appName}</string>`);

            fs.writeFileSync(stringsXmlPath, content);
            this.logger.success('Nama aplikasi diupdate di strings.xml');
        } else {
            this.logger.warning('strings.xml tidak ditemukan, nama aplikasi mungkin tidak berubah');
        }
    }

    async _syncAndBuild(capacitorDir, doSync = true, doBuild = true) {
        if (doSync) {
            this.logger.info('🔄 Syncing proyek ke Capacitor Android...');
            await this.cli.exec('npx', ['cap', 'sync', 'android'], {
                cwd: capacitorDir,
                timeout: 120000
            });
        }

        if (doBuild) {
            // Check apakah Android SDK tersedia untuk actual build
            const androidDir = path.join(capacitorDir, 'android');
            const gradlew = path.join(androidDir, 'gradlew');

            if (fileExists(gradlew)) {
                this.logger.info('🔨 Building APK dengan Gradle...');

                // Pastikan gradlew executable
                fs.chmodSync(gradlew, '755');

                // Tambahkan gradle.properties untuk optimasi memory
                this._optimizeGradleMemory(androidDir);

                try {
                    await this.cli.exec('./gradlew', ['assembleDebug'], {
                        cwd: androidDir,
                        timeout: 600000, // 10 menit
                        env: {
                            JAVA_HOME: process.env.JAVA_HOME || ''
                        }
                    });
                    this.logger.success('APK build selesai!');
                } catch (error) {
                    this.logger.error(`Gradle build gagal: ${error.message}`);
                    this.logger.info('Tips: Pastikan Java JDK 17 dan Android SDK terinstall');
                    this.logger.info('  - sudo apt install openjdk-17-jdk');
                    this.logger.info('  - Install Android Studio: https://developer.android.com/studio');
                    this.logger.info('  - Set ANDROID_HOME environment variable');
                    throw error;
                }
            } else {
                this.logger.warning('gradlew tidak ditemukan - Android project setup mungkin tidak lengkap');
                this.logger.info('Capacitor project sudah disiapkan di: ' + capacitorDir);
                this.logger.info('Untuk build manual: cd android && ./gradlew assembleDebug');
            }
        }
    }

    _optimizeGradleMemory(androidDir) {
        this.logger.info('⚙️ Mengoptimalkan memori Gradle...');
        const gradlePropsPath = path.join(androidDir, 'gradle.properties');

        // Default properties yang mengoptimalkan kecepatan build
        const optimizedProps = `
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
android.useAndroidX=true
android.enableJetifier=true
`;

        try {
            if (fileExists(gradlePropsPath)) {
                let content = fs.readFileSync(gradlePropsPath, 'utf-8');
                if (!content.includes('org.gradle.jvmargs')) {
                    fs.writeFileSync(gradlePropsPath, content + '\n' + optimizedProps);
                }
            } else {
                fs.writeFileSync(gradlePropsPath, optimizedProps);
            }
        } catch (error) {
            this.logger.warning(`Gagal mengoptimalkan gradle.properties: ${error.message}`);
        }
    }

    async _findApk(capacitorDir) {
        const apkPaths = [
            path.join(capacitorDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
            path.join(capacitorDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
            path.join(capacitorDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
        ];

        for (const apkPath of apkPaths) {
            if (fileExists(apkPath)) {
                this.logger.success(`APK ditemukan: ${apkPath}`);
                return apkPath;
            }
        }

        // Cari secara rekursif
        this.logger.info('Mencari APK file...');
        const outputDir = path.join(capacitorDir, 'android', 'app', 'build', 'outputs');
        if (fileExists(outputDir)) {
            const found = this._findFileByExtension(outputDir, '.apk');
            if (found) return found;
        }

        this.logger.warning('APK file tidak ditemukan. Capacitor project sudah disiapkan.');
        return null;
    }

    _findFileByExtension(dir, ext) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isFile() && entry.name.endsWith(ext)) {
                    return fullPath;
                }
                if (entry.isDirectory()) {
                    const found = this._findFileByExtension(fullPath, ext);
                    if (found) return found;
                }
            }
        } catch { }
        return null;
    }

    async _exportApk(apkPath, appName, projectId) {
        if (!apkPath) {
            this.logger.info('APK tidak tersedia untuk export');
            return null;
        }

        const outputDir = path.join(config.BUILDS_DIR, projectId || 'latest');
        ensureDir(outputDir);

        const outputName = `${appName.replace(/[^a-zA-Z0-9]/g, '_')}.apk`;
        const outputPath = path.join(outputDir, outputName);

        fs.copyFileSync(apkPath, outputPath);
        this.logger.success(`APK disalin ke: ${outputPath}`);

        return outputPath;
    }
}

module.exports = CapacitorEngine;
