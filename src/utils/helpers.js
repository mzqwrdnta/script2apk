const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
}

function cleanDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function findFileRecursive(dir, filename, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return null;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile() && entry.name === filename) {
                return fullPath;
            }
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'vendor') {
                const found = findFileRecursive(fullPath, filename, maxDepth, currentDepth + 1);
                if (found) return found;
            }
        }
    } catch {
        return null;
    }
    return null;
}

function getProjectRoot(extractedPath) {
    const entries = fs.readdirSync(extractedPath, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== '__MACOSX');
    const files = entries.filter(e => e.isFile());

    // Jika hanya ada satu folder dan tidak ada file penting, itu mungkin root sebenarnya
    if (dirs.length === 1 && files.length === 0) {
        return path.join(extractedPath, dirs[0].name);
    }

    // Cek apakah ada package.json, composer.json, index.html di level ini
    const hasProjectFile = files.some(f =>
        ['package.json', 'composer.json', 'requirements.txt', 'index.html', 'Gemfile'].includes(f.name)
    );

    if (hasProjectFile) {
        return extractedPath;
    }

    // Coba level satu di bawah
    if (dirs.length === 1) {
        return path.join(extractedPath, dirs[0].name);
    }

    return extractedPath;
}

module.exports = {
    ensureDir,
    cleanDir,
    fileExists,
    readJsonFile,
    findFileRecursive,
    getProjectRoot
};
