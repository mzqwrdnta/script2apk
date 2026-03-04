const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { ensureDir } = require('../utils/helpers');

class IconService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Proses icon yang diupload dan generate semua ukuran yang diperlukan Android
     */
    async processIcon(iconPath, outputDir) {
        this.logger.info('🎨 Memproses icon aplikasi...');

        const androidIconSizes = [
            { name: 'mipmap-mdpi', size: 48 },
            { name: 'mipmap-hdpi', size: 72 },
            { name: 'mipmap-xhdpi', size: 96 },
            { name: 'mipmap-xxhdpi', size: 144 },
            { name: 'mipmap-xxxhdpi', size: 192 },
        ];

        const roundIconSizes = androidIconSizes.map(s => ({ ...s }));

        // Adaptive icon foreground (with padding)
        const adaptiveSizes = [
            { name: 'mipmap-mdpi', size: 108 },
            { name: 'mipmap-hdpi', size: 162 },
            { name: 'mipmap-xhdpi', size: 216 },
            { name: 'mipmap-xxhdpi', size: 324 },
            { name: 'mipmap-xxxhdpi', size: 432 },
        ];

        try {
            const iconBuffer = fs.readFileSync(iconPath);

            // Generate standard launcher icons
            for (const icon of androidIconSizes) {
                const dir = path.join(outputDir, icon.name);
                ensureDir(dir);

                await sharp(iconBuffer)
                    .resize(icon.size, icon.size, { fit: 'cover' })
                    .png()
                    .toFile(path.join(dir, 'ic_launcher.png'));

                this.logger.stdout(`  ✓ ${icon.name}/ic_launcher.png (${icon.size}x${icon.size})`);
            }

            // Generate round icons
            for (const icon of roundIconSizes) {
                const dir = path.join(outputDir, icon.name);
                ensureDir(dir);

                // Buat round mask
                const roundedMask = Buffer.from(
                    `<svg width="${icon.size}" height="${icon.size}">
            <circle cx="${icon.size / 2}" cy="${icon.size / 2}" r="${icon.size / 2}" fill="white"/>
          </svg>`
                );

                await sharp(iconBuffer)
                    .resize(icon.size, icon.size, { fit: 'cover' })
                    .composite([{ input: roundedMask, blend: 'dest-in' }])
                    .png()
                    .toFile(path.join(dir, 'ic_launcher_round.png'));

                this.logger.stdout(`  ✓ ${icon.name}/ic_launcher_round.png (round)`);
            }

            // Generate adaptive icon foreground
            for (const icon of adaptiveSizes) {
                const dir = path.join(outputDir, icon.name);
                ensureDir(dir);

                // Foreground dengan padding (icon 66% dari total, centered)
                const innerSize = Math.round(icon.size * 0.66);
                const padding = Math.round((icon.size - innerSize) / 2);

                await sharp(iconBuffer)
                    .resize(innerSize, innerSize, { fit: 'cover' })
                    .extend({
                        top: padding,
                        bottom: icon.size - innerSize - padding,
                        left: padding,
                        right: icon.size - innerSize - padding,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .png()
                    .toFile(path.join(dir, 'ic_launcher_foreground.png'));

                this.logger.stdout(`  ✓ ${icon.name}/ic_launcher_foreground.png (adaptive)`);
            }

            // Generate web icon (512x512) untuk PWA
            const webIconPath = path.join(outputDir, 'web_icon.png');
            await sharp(iconBuffer)
                .resize(512, 512, { fit: 'cover' })
                .png()
                .toFile(webIconPath);
            this.logger.stdout('  ✓ web_icon.png (512x512)');

            // Generate splash icon (di tengah background)
            const splashPath = path.join(outputDir, 'splash.png');
            await sharp({
                create: {
                    width: 2732,
                    height: 2732,
                    channels: 4,
                    background: { r: 10, g: 10, b: 10, alpha: 255 }
                }
            })
                .composite([{
                    input: await sharp(iconBuffer).resize(512, 512).png().toBuffer(),
                    gravity: 'centre'
                }])
                .png()
                .toFile(splashPath);
            this.logger.stdout('  ✓ splash.png (2732x2732)');

            this.logger.success(`🎨 ${androidIconSizes.length * 3 + 2} icon files berhasil digenerate`);

            return {
                webIconPath,
                splashPath,
                resDir: outputDir
            };
        } catch (error) {
            this.logger.error(`Icon processing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply generated icons ke Android project
     */
    async applyToAndroid(resDir, androidProjectDir) {
        this.logger.info('📲 Applying icons ke Android project...');

        const androidResDir = path.join(androidProjectDir, 'app', 'src', 'main', 'res');

        if (!fs.existsSync(androidResDir)) {
            this.logger.warning('Android res directory tidak ditemukan, skip icon apply');
            return;
        }

        const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

        for (const dir of mipmapDirs) {
            const srcDir = path.join(resDir, dir);
            const destDir = path.join(androidResDir, dir);

            if (fs.existsSync(srcDir)) {
                ensureDir(destDir);
                const files = fs.readdirSync(srcDir);
                for (const file of files) {
                    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
                }
            }
        }

        this.logger.success('Icons diterapkan ke Android project');
    }
}

module.exports = IconService;
