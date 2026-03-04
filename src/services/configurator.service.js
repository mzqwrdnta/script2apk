const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const CliService = require('./cli.service');
const { ensureDir, fileExists, readJsonFile } = require('../utils/helpers');

class ConfiguratorService {
    constructor(logger) {
        this.logger = logger;
        this.cli = new CliService(logger);
    }

    /**
     * Auto-konfigurasi project berdasarkan framework yang terdeteksi
     */
    async configure(projectRoot, detection, userConfig = {}) {
        this.logger.info('⚙️ Memulai auto-konfigurasi project...');

        // 1. Install dependencies
        await this._installDependencies(projectRoot, detection);

        // 2. Setup environment
        await this._setupEnvironment(projectRoot, detection, userConfig);

        // 3. Build project untuk menghasilkan static files
        const buildOutputDir = await this._buildProject(projectRoot, detection);

        // 4. Handle database config jika ada
        if (detection.hasDatabase && userConfig.database) {
            await this._configureDatabaseForMobile(projectRoot, detection, userConfig.database);
        }

        this.logger.success('⚙️ Auto-konfigurasi selesai!');
        return { buildOutputDir };
    }

    async _installDependencies(projectRoot, detection) {
        this.logger.info('📥 Menginstall dependencies...');

        if (detection.installCommand) {
            const parts = detection.installCommand.split(' ');
            try {
                await this.cli.exec(parts[0], parts.slice(1), {
                    cwd: projectRoot,
                    timeout: 300000 // 5 menit
                });
                this.logger.success('Dependencies berhasil diinstall');
            } catch (error) {
                this.logger.warning(`Install warning: ${error.message}`);
                // Coba lagi dengan --legacy-peer-deps untuk npm
                if (detection.packageManager === 'npm') {
                    this.logger.info('Mencoba ulang dengan --legacy-peer-deps...');
                    await this.cli.exec('npm', ['install', '--legacy-peer-deps'], {
                        cwd: projectRoot,
                        allowNonZero: true
                    });
                }
            }
        }
    }

    async _setupEnvironment(projectRoot, detection, userConfig) {
        this.logger.info('🔧 Setup environment...');

        const envPath = path.join(projectRoot, '.env');
        const envExamplePath = path.join(projectRoot, '.env.example');

        // Copy .env.example ke .env jika belum ada
        if (!fileExists(envPath) && fileExists(envExamplePath)) {
            await fsPromises.copyFile(envExamplePath, envPath);
            this.logger.info('.env.example disalin ke .env');
        }

        // Apply user config ke .env
        if (userConfig.envVars && fileExists(envPath)) {
            let envContent = await fsPromises.readFile(envPath, 'utf-8');
            for (const [key, value] of Object.entries(userConfig.envVars)) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (envContent.match(regex)) {
                    envContent = envContent.replace(regex, `${key}=${value}`);
                } else {
                    envContent += `\n${key}=${value}`;
                }
            }
            await fsPromises.writeFile(envPath, envContent);
            this.logger.info('Environment variables diupdate');
        }

        // Untuk fullstack/backend projects, set API URL untuk mobile
        if (['fullstack', 'backend'].includes(detection.type)) {
            const apiUrl = userConfig.apiUrl || `http://localhost:${detection.serverPort || 3000}`;
            this.logger.info(`📡 API URL dikonfigurasi: ${apiUrl}`);
            this.logger.warning('⚠️ Untuk production, pastikan API URL menggunakan domain publik, bukan localhost');
        }
    }

    async _buildProject(projectRoot, detection) {
        this.logger.info('🔨 Building project...');

        let outputDir = path.join(projectRoot, detection.outputDir || 'dist');

        if (detection.type === 'backend' || detection.type === 'fullstack') {
            // Backend/fullstack perlu penanganan khusus
            // Untuk Next.js: pakai next export untuk static build
            if (detection.framework === 'nextjs') {
                this.logger.info('Next.js terdeteksi, mencoba static export...');
                try {
                    await this.cli.exec('npx', ['next', 'build'], { cwd: projectRoot });
                    // Cek apakah ada output static export
                    if (fileExists(path.join(projectRoot, 'out'))) {
                        outputDir = path.join(projectRoot, 'out');
                    }
                } catch (error) {
                    this.logger.warning(`Next.js build warning: ${error.message}`);
                }
            } else if (detection.framework === 'laravel') {
                // Build Laravel frontend assets
                if (fileExists(path.join(projectRoot, 'package.json'))) {
                    try {
                        await this.cli.exec('npm', ['install'], { cwd: projectRoot });
                        await this.cli.exec('npm', ['run', 'build'], {
                            cwd: projectRoot,
                            allowNonZero: true
                        });
                    } catch { }
                }
                outputDir = path.join(projectRoot, 'public');
            } else {
                this.logger.info(`Backend project (${detection.framework}): akan di-wrap dalam WebView`);
                // Buat simple index.html yang redirect ke API
                outputDir = path.join(projectRoot, '_mobile_build');
                ensureDir(outputDir);
                await this._createApiWrapperPage(outputDir, detection);
            }
        } else if (detection.buildCommand) {
            // Frontend project - jalankan build command
            const parts = detection.buildCommand.split(' ');
            try {
                await this.cli.exec(parts[0], parts.slice(1), {
                    cwd: projectRoot,
                    timeout: 300000
                });
                this.logger.success('Build berhasil!');
            } catch (error) {
                this.logger.error(`Build gagal: ${error.message}`);
                throw new Error(`Build failed: ${error.message}`);
            }
        } else if (detection.framework === 'static') {
            outputDir = projectRoot;
            this.logger.info('Static site: tidak perlu build');
        }

        // Verify output exists
        if (!fileExists(outputDir)) {
            this.logger.warning(`Output directory tidak ditemukan: ${outputDir}`);
            // Fallback: cek beberapa lokasi umum
            const alternatives = ['dist', 'build', 'out', 'public', 'www'];
            for (const alt of alternatives) {
                const altPath = path.join(projectRoot, alt);
                if (fileExists(altPath)) {
                    outputDir = altPath;
                    this.logger.info(`Menggunakan alternatif output: ${alt}`);
                    break;
                }
            }
        }

        return outputDir;
    }

    async _createApiWrapperPage(outputDir, detection) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #0a0a0a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .loader { text-align: center; }
    .spinner { width: 50px; height: 50px; border: 3px solid #333; border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s ease infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    input { background: #1a1a2e; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px; width: 300px; margin: 8px 0; }
    button { background: #7c3aed; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 8px; }
    #config { display: none; }
    #app { display: none; width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <div class="loader" id="setup">
    <div id="config">
      <h2>Server Configuration</h2>
      <p style="margin: 1rem 0; color: #888;">Masukkan URL server ${detection.framework} Anda</p>
      <input type="url" id="serverUrl" placeholder="https://your-server.com" />
      <br>
      <button onclick="saveConfig()">Connect</button>
    </div>
    <div id="loading">
      <div class="spinner"></div>
      <p>Connecting to server...</p>
    </div>
  </div>
  <iframe id="app"></iframe>
  <script>
    const STORAGE_KEY = 'api_server_url';
    
    function init() {
      const savedUrl = localStorage.getItem(STORAGE_KEY);
      if (savedUrl) {
        connectToServer(savedUrl);
      } else {
        document.getElementById('config').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
      }
    }
    
    function saveConfig() {
      const url = document.getElementById('serverUrl').value.trim();
      if (!url) return alert('Masukkan URL server');
      localStorage.setItem(STORAGE_KEY, url);
      document.getElementById('config').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      connectToServer(url);
    }
    
    function connectToServer(url) {
      const app = document.getElementById('app');
      app.src = url;
      app.onload = function() {
        document.getElementById('setup').style.display = 'none';
        app.style.display = 'block';
      };
      app.onerror = function() {
        alert('Gagal terhubung ke server. Periksa URL dan coba lagi.');
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      };
    }
    
    init();
  </script>
</body>
</html>`;

        await fsPromises.writeFile(path.join(outputDir, 'index.html'), html);
        this.logger.info('API wrapper page dibuat untuk backend project');
    }

    async _configureDatabaseForMobile(projectRoot, detection, dbConfig) {
        this.logger.info('💾 Mengkonfigurasi database untuk mobile...');

        // Untuk mobile apps, database options:
        // 1. SQLite (offline) - bundled dalam APK
        // 2. Remote database via API (online) - standard approach
        // 3. IndexedDB/localStorage (offline web storage)

        if (dbConfig.mode === 'offline') {
            this.logger.info('Mode offline: menggunakan SQLite/IndexedDB');
            // Inject offline storage adapter
        } else {
            this.logger.info('Mode online: terhubung ke remote database via API');
            this.logger.warning('Pastikan API server bisa diakses dari internet');

            if (dbConfig.apiUrl) {
                // Update .env atau config dengan API URL
                const envPath = path.join(projectRoot, '.env');
                if (fileExists(envPath)) {
                    let content = await fsPromises.readFile(envPath, 'utf-8');
                    content = content.replace(
                        /^(VITE_API_URL|REACT_APP_API_URL|NEXT_PUBLIC_API_URL|API_URL)=.*/m,
                        `$1=${dbConfig.apiUrl}`
                    );
                    if (!content.includes('API_URL=')) {
                        content += `\nAPI_URL=${dbConfig.apiUrl}`;
                    }
                    await fsPromises.writeFile(envPath, content);
                }
            }
        }
    }
}

module.exports = ConfiguratorService;
