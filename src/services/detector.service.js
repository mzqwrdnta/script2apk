const fs = require('fs');
const path = require('path');
const { readJsonFile, findFileRecursive } = require('../utils/helpers');

class DetectorService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Auto-detect framework dari project folder
     */
    detect(projectPath) {
        this.logger.info('🔍 Mendeteksi framework project...');

        const result = {
            framework: 'unknown',
            type: 'unknown', // frontend, backend, fullstack
            buildCommand: null,
            devCommand: null,
            installCommand: null,
            outputDir: 'dist',
            hasDatabase: false,
            databaseType: null,
            databaseConfig: null,
            packageManager: 'npm',
            serverPort: null,
            dependencies: {},
            devDependencies: {},
            metadata: {}
        };

        // Cek package.json
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const pkg = readJsonFile(packageJsonPath);
            if (pkg) {
                result.dependencies = pkg.dependencies || {};
                result.devDependencies = pkg.devDependencies || {};
                result.metadata.name = pkg.name;
                result.metadata.version = pkg.version;

                // Deteksi package manager
                if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
                    result.packageManager = 'yarn';
                } else if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
                    result.packageManager = 'pnpm';
                }

                result.installCommand = result.packageManager === 'yarn' ? 'yarn install' :
                    result.packageManager === 'pnpm' ? 'pnpm install' : 'npm install';

                // Detect framework
                this._detectNodeFramework(result, pkg, projectPath);
            }
        }

        // Cek composer.json (Laravel/PHP)
        const composerPath = path.join(projectPath, 'composer.json');
        if (fs.existsSync(composerPath)) {
            const composer = readJsonFile(composerPath);
            if (composer) {
                this._detectPhpFramework(result, composer, projectPath);
            }
        }

        // Cek requirements.txt / Pipfile (Python)
        if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
            fs.existsSync(path.join(projectPath, 'Pipfile'))) {
            this._detectPythonFramework(result, projectPath);
        }

        // Cek static site
        if (result.framework === 'unknown') {
            if (fs.existsSync(path.join(projectPath, 'index.html'))) {
                result.framework = 'static';
                result.type = 'frontend';
                result.outputDir = '.';
                result.buildCommand = null; // no build needed
            }
        }

        // Detect database
        this._detectDatabase(result, projectPath);

        this.logger.success(`Framework terdeteksi: ${result.framework} (${result.type})`);
        if (result.hasDatabase) {
            this.logger.info(`💾 Database terdeteksi: ${result.databaseType}`);
        }

        return result;
    }

    _detectNodeFramework(result, pkg, projectPath) {
        const allDeps = { ...result.dependencies, ...result.devDependencies };
        const scripts = pkg.scripts || {};

        // React (Create React App)
        if (allDeps['react-scripts']) {
            result.framework = 'react-cra';
            result.type = 'frontend';
            result.buildCommand = `${result.packageManager === 'npm' ? 'npx' : result.packageManager} react-scripts build`;
            result.devCommand = scripts.start || 'react-scripts start';
            result.outputDir = 'build';
            return;
        }

        // React (Vite)
        if (allDeps['react'] && allDeps['vite']) {
            result.framework = 'react-vite';
            result.type = 'frontend';
            result.buildCommand = `${result.packageManager === 'npm' ? 'npx' : result.packageManager} vite build`;
            result.devCommand = scripts.dev || 'vite';
            result.outputDir = 'dist';
            return;
        }

        // React (generic)
        if (allDeps['react'] && !allDeps['next']) {
            result.framework = 'react';
            result.type = 'frontend';
            result.buildCommand = scripts.build ? `${result.packageManager} run build` : null;
            result.devCommand = scripts.dev || scripts.start;
            result.outputDir = fs.existsSync(path.join(projectPath, 'dist')) ? 'dist' : 'build';
            return;
        }

        // Next.js
        if (allDeps['next']) {
            result.framework = 'nextjs';
            result.type = 'fullstack';
            result.buildCommand = `${result.packageManager} run build`;
            result.devCommand = scripts.dev || 'next dev';
            result.outputDir = 'out'; // next export
            result.serverPort = 3000;
            return;
        }

        // Vue.js
        if (allDeps['vue']) {
            result.framework = allDeps['nuxt'] ? 'nuxtjs' : 'vue';
            result.type = allDeps['nuxt'] ? 'fullstack' : 'frontend';
            result.buildCommand = scripts.build ? `${result.packageManager} run build` : `npx vite build`;
            result.devCommand = scripts.dev || 'vite';
            result.outputDir = 'dist';
            return;
        }

        // Angular
        if (allDeps['@angular/core']) {
            result.framework = 'angular';
            result.type = 'frontend';
            result.buildCommand = 'npx ng build --configuration production';
            result.devCommand = 'ng serve';
            result.outputDir = `dist/${pkg.name || 'app'}`;
            return;
        }

        // Svelte
        if (allDeps['svelte']) {
            result.framework = allDeps['@sveltejs/kit'] ? 'sveltekit' : 'svelte';
            result.type = allDeps['@sveltejs/kit'] ? 'fullstack' : 'frontend';
            result.buildCommand = scripts.build ? `${result.packageManager} run build` : 'npx vite build';
            result.devCommand = scripts.dev || 'vite dev';
            result.outputDir = allDeps['@sveltejs/kit'] ? 'build' : 'dist';
            return;
        }

        // Express / Node.js backend
        if (allDeps['express'] || allDeps['fastify'] || allDeps['koa']) {
            result.framework = allDeps['express'] ? 'express' : allDeps['fastify'] ? 'fastify' : 'koa';
            result.type = 'backend';
            result.buildCommand = scripts.build ? `${result.packageManager} run build` : null;
            result.devCommand = scripts.dev || scripts.start || 'node server.js';
            result.serverPort = 3000;
            return;
        }

        // Generic Node.js with build script
        if (scripts.build) {
            result.framework = 'nodejs';
            result.type = 'frontend';
            result.buildCommand = `${result.packageManager} run build`;
            result.devCommand = scripts.dev || scripts.start;
            result.outputDir = 'dist';
        }
    }

    _detectPhpFramework(result, composer, projectPath) {
        const require_ = composer.require || {};

        if (require_['laravel/framework']) {
            result.framework = 'laravel';
            result.type = 'fullstack';
            result.installCommand = 'composer install';
            result.buildCommand = 'npm run build';
            result.devCommand = 'php artisan serve';
            result.outputDir = 'public';
            result.serverPort = 8000;

            // Cek .env untuk database config
            const envPath = path.join(projectPath, '.env');
            const envExamplePath = path.join(projectPath, '.env.example');
            if (fs.existsSync(envPath) || fs.existsSync(envExamplePath)) {
                const envContent = fs.readFileSync(
                    fs.existsSync(envPath) ? envPath : envExamplePath, 'utf-8'
                );
                const dbMatch = envContent.match(/DB_CONNECTION=(\w+)/);
                if (dbMatch) {
                    result.hasDatabase = true;
                    result.databaseType = dbMatch[1]; // mysql, pgsql, sqlite
                    result.databaseConfig = this._parseEnvDatabase(envContent);
                }
            }
        }
    }

    _detectPythonFramework(result, projectPath) {
        const reqPath = path.join(projectPath, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
            const content = fs.readFileSync(reqPath, 'utf-8').toLowerCase();
            if (content.includes('django')) {
                result.framework = 'django';
                result.type = 'fullstack';
                result.installCommand = 'pip install -r requirements.txt';
                result.buildCommand = 'python manage.py collectstatic --noinput';
                result.devCommand = 'python manage.py runserver';
                result.outputDir = 'staticfiles';
                result.serverPort = 8000;
            } else if (content.includes('flask')) {
                result.framework = 'flask';
                result.type = 'backend';
                result.installCommand = 'pip install -r requirements.txt';
                result.devCommand = 'flask run';
                result.serverPort = 5000;
            }
        }
    }

    _detectDatabase(result, projectPath) {
        if (result.hasDatabase) return; // Already detected (e.g., Laravel)

        // Cek berbagai file konfigurasi database
        const dbIndicators = [
            { file: '.env', patterns: ['DATABASE_URL', 'DB_HOST', 'DB_CONNECTION', 'MONGO_URI', 'MYSQL_'] },
            { file: '.env.example', patterns: ['DATABASE_URL', 'DB_HOST', 'DB_CONNECTION', 'MONGO_URI'] },
            { file: 'prisma/schema.prisma', patterns: ['datasource'] },
            { file: 'knexfile.js', patterns: ['*'] },
            { file: 'ormconfig.json', patterns: ['*'] },
            { file: 'typeorm.config.ts', patterns: ['*'] },
            { file: 'drizzle.config.ts', patterns: ['*'] },
        ];

        for (const indicator of dbIndicators) {
            const filePath = path.join(projectPath, indicator.file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const hasMatch = indicator.patterns[0] === '*' ||
                        indicator.patterns.some(p => content.includes(p));
                    if (hasMatch) {
                        result.hasDatabase = true;
                        result.databaseType = this._guessDbType(content);
                        result.databaseConfig = this._parseEnvDatabase(content);
                        this.logger.info(`Database config ditemukan di: ${indicator.file}`);
                        break;
                    }
                } catch { /* ignore */ }
            }
        }

        // Cek dependencies untuk database packages
        const dbPackages = {
            'mysql2': 'mysql', 'mysql': 'mysql',
            'pg': 'postgresql', 'postgres': 'postgresql',
            'mongodb': 'mongodb', 'mongoose': 'mongodb',
            'sqlite3': 'sqlite', 'better-sqlite3': 'sqlite',
            'prisma': 'prisma', '@prisma/client': 'prisma',
            'typeorm': 'typeorm', 'sequelize': 'sequelize',
            'knex': 'knex', 'drizzle-orm': 'drizzle'
        };

        const allDeps = { ...result.dependencies, ...result.devDependencies };
        for (const [pkg, type] of Object.entries(dbPackages)) {
            if (allDeps[pkg]) {
                result.hasDatabase = true;
                if (!result.databaseType) {
                    result.databaseType = type;
                }
                break;
            }
        }
    }

    _guessDbType(content) {
        if (content.includes('mysql')) return 'mysql';
        if (content.includes('postgres') || content.includes('pgsql')) return 'postgresql';
        if (content.includes('mongo')) return 'mongodb';
        if (content.includes('sqlite')) return 'sqlite';
        return 'unknown';
    }

    _parseEnvDatabase(content) {
        const config = {};
        const lines = content.split('\n');
        const dbKeys = ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'DB_CONNECTION', 'DATABASE_URL'];

        for (const line of lines) {
            const match = line.match(/^([\w]+)=(.*)$/);
            if (match && dbKeys.includes(match[1])) {
                config[match[1]] = match[2].trim();
            }
        }
        return config;
    }
}

module.exports = DetectorService;
