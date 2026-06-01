const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Creates a unique output path in the target folder.
 */
function createUniquePath(targetDir, desiredName, extension) {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    let attempt = 0;
    let candidate = path.join(targetDir, `${desiredName}${ext}`);

    while (fs.existsSync(candidate)) {
        attempt += 1;
        candidate = path.join(targetDir, `${desiredName} (${attempt})${ext}`);
    }

    return candidate;
}

/**
 * Process an image: resize, crop, compress, watermark, convert.
 */
async function processImage({ inputPath, outputFolder, options }) {
    if (!inputPath || !fs.existsSync(inputPath)) {
        throw new Error('Input image does not exist.');
    }
    if (!outputFolder) {
        throw new Error('Output folder is not defined.');
    }

    await fs.promises.mkdir(outputFolder, { recursive: true });

    let pipeline = sharp(inputPath);

    // 1. Resize & Crop
    if (options.resize) {
        const { width, height, fit = 'cover', position = 'center', background = { r: 0, g: 0, b: 0, alpha: 1 } } = options.resize;
        pipeline = pipeline.resize({
            width: width ? Number(width) : null,
            height: height ? Number(height) : null,
            fit: fit,
            position: position,
            background: background
        });
    }

    // 2. Watermark
    if (options.watermark) {
        const composites = [];
        if (options.watermark.type === 'text') {
            // Text watermark via SVG buffer (simplest way with sharp)
            const { text, fontSize = 48, color = '#ffffff', opacity = 0.5, gravity = 'center' } = options.watermark;
            const svg = `
                <svg width="800" height="600">
                    <text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}" fill="${color}" fill-opacity="${opacity}" text-anchor="middle" dominant-baseline="middle">${text}</text>
                </svg>
            `;
            composites.push({
                input: Buffer.from(svg),
                gravity: gravity
            });
        } else if (options.watermark.type === 'image') {
            const { imagePath, opacity = 0.5, gravity = 'center', scale = 1 } = options.watermark;
            if (fs.existsSync(imagePath)) {
                let watermarkImg = sharp(imagePath);
                const metadata = await watermarkImg.metadata();
                if (scale !== 1) {
                    watermarkImg = watermarkImg.resize(Math.round(metadata.width * scale));
                }
                const watermarkBuffer = await watermarkImg.ensureAlpha(opacity).toBuffer();
                composites.push({
                    input: watermarkBuffer,
                    gravity: gravity
                });
            }
        }
        if (composites.length > 0) {
            pipeline = pipeline.composite(composites);
        }
    }

    // 3. Format & Compression
    const format = options.format || path.extname(inputPath).slice(1).toLowerCase() || 'jpg';
    const quality = Number(options.quality) || 80;

    if (format === 'jpg' || format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
    } else if (format === 'avif') {
        pipeline = pipeline.avif({ quality });
    }

    if (options.stripMetadata) {
        pipeline = pipeline.withMetadata({ strip: true });
    }

    const stem = path.basename(inputPath, path.extname(inputPath));
    const finalPath = createUniquePath(outputFolder, stem, format);

    await pipeline.toFile(finalPath);

    return {
        success: true,
        outputPath: finalPath,
        fileName: path.basename(finalPath)
    };
}

module.exports = {
    processImage
};
