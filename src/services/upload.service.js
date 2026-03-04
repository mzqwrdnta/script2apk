const fs = require('fs');
const path = require('path');
const extractZip = require('extract-zip');
const { ensureDir, cleanDir, getProjectRoot } = require('../utils/helpers');
const config = require('../config');

class UploadService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Proses file yang diupload (ZIP)
     */
    async processUpload(file, projectId) {
        this.logger.info('📦 Memproses file upload...');

        const workspacePath = path.join(config.WORKSPACE_DIR, projectId);
        const extractPath = path.join(workspacePath, 'extracted');

        ensureDir(workspacePath);
        cleanDir(extractPath);

        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.zip') {
            await this._extractZip(file.path, extractPath);
        } else {
            // Untuk file non-zip, copy langsung
            this.logger.error(`Format file tidak didukung: ${ext}. Gunakan .zip`);
            throw new Error(`Unsupported file format: ${ext}. Please use .zip`);
        }

        // Find actual project root (handle nested folders)
        const projectRoot = getProjectRoot(extractPath);
        this.logger.success(`📂 Project root: ${projectRoot}`);

        // Cleanup uploaded file
        try { fs.unlinkSync(file.path); } catch { }

        return {
            workspacePath,
            projectRoot,
            extractPath
        };
    }

    async _extractZip(zipPath, targetPath) {
        this.logger.info('📂 Mengekstrak ZIP file...');
        try {
            await extractZip(zipPath, { dir: path.resolve(targetPath) });
            this.logger.success('ZIP berhasil diekstrak');
        } catch (error) {
            this.logger.error(`Gagal mengekstrak ZIP: ${error.message}`);
            throw error;
        }
    }

    /**
     * List isi project untuk preview
     */
    getProjectTree(projectRoot, maxDepth = 3) {
        const tree = [];
        this._buildTree(projectRoot, tree, 0, maxDepth, projectRoot);
        return tree;
    }

    _buildTree(dir, tree, depth, maxDepth, rootDir) {
        if (depth > maxDepth) return;

        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
                .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'vendor' && e.name !== '__MACOSX')
                .sort((a, b) => {
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(rootDir, fullPath);

                tree.push({
                    name: entry.name,
                    path: relativePath,
                    type: entry.isDirectory() ? 'directory' : 'file',
                    depth
                });

                if (entry.isDirectory()) {
                    this._buildTree(fullPath, tree, depth + 1, maxDepth, rootDir);
                }
            }
        } catch { }
    }
}

module.exports = UploadService;
