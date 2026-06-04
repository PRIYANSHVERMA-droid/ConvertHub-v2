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
    const baseMetadata = await pipeline.metadata();

    // 0. Rotate & Flip (Transformations)
    let rotateAngle = Number(options.rotate) || 0;
    if (rotateAngle !== 0) {
        pipeline = pipeline.rotate(rotateAngle);
    }
    if (options.flipH) {
        pipeline = pipeline.flop(); // Horizontal flip
    }
    if (options.flipV) {
        pipeline = pipeline.flip(); // Vertical flip
    }

    // Determine base dimensions after rotation
    let currentWidth = baseMetadata.width;
    let currentHeight = baseMetadata.height;
    if (rotateAngle === 90 || rotateAngle === 270) {
        currentWidth = baseMetadata.height;
        currentHeight = baseMetadata.width;
    }

    let targetWidth = currentWidth;
    let targetHeight = currentHeight;

    // 1. Resize & Crop
    if (options.resize) {
        const { width, height, fit = 'inside', position = 'center', background = '#000000' } = options.resize;
        
        let sharpBg = { r: 0, g: 0, b: 0, alpha: 1 };
        if (background) {
            const hex = background.replace('#', '');
            if (hex.length === 6) {
                sharpBg = {
                    r: parseInt(hex.substring(0, 2), 16),
                    g: parseInt(hex.substring(2, 4), 16),
                    b: parseInt(hex.substring(4, 6), 16),
                    alpha: 1
                };
            }
        }

        pipeline = pipeline.resize({
            width: width ? Number(width) : null,
            height: height ? Number(height) : null,
            fit: fit,
            position: position,
            background: sharpBg
        });

        // Compute actual output size for correct watermark scaling
        const rWidth = width ? Number(width) : null;
        const rHeight = height ? Number(height) : null;
        if (rWidth && rHeight) {
            if (fit === 'inside') {
                const ratio = Math.min(rWidth / currentWidth, rHeight / currentHeight);
                targetWidth = Math.round(currentWidth * ratio);
                targetHeight = Math.round(currentHeight * ratio);
            } else if (fit === 'outside') {
                const ratio = Math.max(rWidth / currentWidth, rHeight / currentHeight);
                targetWidth = Math.round(currentWidth * ratio);
                targetHeight = Math.round(currentHeight * ratio);
            } else {
                targetWidth = rWidth;
                targetHeight = rHeight;
            }
        } else if (rWidth) {
            const ratio = rWidth / currentWidth;
            targetWidth = rWidth;
            targetHeight = Math.round(currentHeight * ratio);
        } else if (rHeight) {
            const ratio = rHeight / currentHeight;
            targetWidth = Math.round(currentWidth * ratio);
            targetHeight = rHeight;
        }
    }

    // 2. Watermark
    if (options.watermark) {
        const composites = [];
        if (options.watermark.type === 'text') {
            // Text watermark via SVG buffer (simplest way with sharp)
            const { text, font = 'sans-serif', color = '#ffffff', opacity = 0.5, scale = 0.05, rotation = 0, placement = 'CENTER' } = options.watermark;
            
            let fontStack = 'Arial, sans-serif';
            if (font === 'serif') fontStack = '"Times New Roman", Times, serif';
            else if (font === 'monospace') fontStack = '"Courier New", Courier, monospace';
            else if (font === 'cursive') fontStack = '"Brush Script MT", cursive';

            // Scale font size based on targetWidth
            const fontSize = Math.max(12, Math.round(targetWidth * scale));

            let svgContent = '';
            if (placement === 'TILED') {
                const stepX = Math.max(150, fontSize * text.length * 0.6 + 100);
                const stepY = Math.max(100, fontSize + 100);
                
                svgContent = `
                    <svg width="${targetWidth}" height="${targetHeight}">
                        <defs>
                            <pattern id="watermark-tile" width="${stepX}" height="${stepY}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotation})">
                                <text x="${stepX/2}" y="${stepY/2}" font-family="${fontStack}" font-size="${fontSize}" fill="${color}" fill-opacity="${opacity}" text-anchor="middle" dominant-baseline="middle">${text}</text>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#watermark-tile)" />
                    </svg>
                `;
            } else {
                let x = '50%';
                let y = '50%';
                let textAnchor = 'middle';
                let dominantBaseline = 'middle';
                
                const padX = Math.max(15, targetWidth * 0.03);
                const padY = Math.max(15, targetHeight * 0.03);

                if (placement === 'TOP_LEFT') {
                    x = `${padX}`;
                    y = `${padY + fontSize/2}`;
                    textAnchor = 'start';
                } else if (placement === 'TOP_RIGHT') {
                    x = `${targetWidth - padX}`;
                    y = `${padY + fontSize/2}`;
                    textAnchor = 'end';
                } else if (placement === 'BOTTOM_LEFT') {
                    x = `${padX}`;
                    y = `${targetHeight - padY - fontSize/2}`;
                    textAnchor = 'start';
                } else if (placement === 'BOTTOM_RIGHT') {
                    x = `${targetWidth - padX}`;
                    y = `${targetHeight - padY - fontSize/2}`;
                    textAnchor = 'end';
                }

                let transformAttr = '';
                if (rotation !== 0) {
                    if (placement === 'CENTER') {
                        transformAttr = `transform="rotate(${rotation}, ${targetWidth/2}, ${targetHeight/2})"`;
                    } else if (placement === 'TOP_LEFT') {
                        transformAttr = `transform="rotate(${rotation}, ${padX}, ${padY + fontSize/2})"`;
                    } else if (placement === 'TOP_RIGHT') {
                        transformAttr = `transform="rotate(${rotation}, ${targetWidth - padX}, ${padY + fontSize/2})"`;
                    } else if (placement === 'BOTTOM_LEFT') {
                        transformAttr = `transform="rotate(${rotation}, ${padX}, ${targetHeight - padY - fontSize/2})"`;
                    } else if (placement === 'BOTTOM_RIGHT') {
                        transformAttr = `transform="rotate(${rotation}, ${targetWidth - padX}, ${targetHeight - padY - fontSize/2})"`;
                    }
                }

                svgContent = `
                    <svg width="${targetWidth}" height="${targetHeight}">
                        <text x="${x}" y="${y}" font-family="${fontStack}" font-size="${fontSize}" fill="${color}" fill-opacity="${opacity}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" ${transformAttr}>${text}</text>
                    </svg>
                `;
            }

            composites.push({
                input: Buffer.from(svgContent),
                gravity: 'northwest'
            });
        } else if (options.watermark.type === 'image') {
            const { imagePath, opacity = 0.5, scale = 0.2, placement = 'CENTER' } = options.watermark;
            if (fs.existsSync(imagePath)) {
                let watermarkImg = sharp(imagePath);
                const metadata = await watermarkImg.metadata();
                
                let w = Math.round(targetWidth * scale);
                let h = Math.round(metadata.height * (w / metadata.width));

                if (h > targetHeight * 0.9) {
                    h = Math.round(targetHeight * 0.9);
                    w = Math.round(metadata.width * (h / metadata.height));
                }

                watermarkImg = watermarkImg.resize(w, h).ensureAlpha();
                // Apply opacity transparency
                watermarkImg = watermarkImg.linear([1, 1, 1, opacity], [0, 0, 0, 0]);
                const watermarkBuffer = await watermarkImg.toBuffer();
                
                if (placement === 'TILED') {
                    const base64Logo = watermarkBuffer.toString('base64');
                    const logoDataUrl = `data:image/png;base64,${base64Logo}`;
                    const stepX = w + 120;
                    const stepY = h + 120;
                    
                    const svgContent = `
                        <svg width="${targetWidth}" height="${targetHeight}">
                            <defs>
                                <pattern id="logo-tile" width="${stepX}" height="${stepY}" patternUnits="userSpaceOnUse">
                                    <image href="${logoDataUrl}" x="60" y="60" width="${w}" height="${h}" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#logo-tile)" />
                        </svg>
                    `;
                    composites.push({
                        input: Buffer.from(svgContent),
                        gravity: 'northwest'
                    });
                } else {
                    let gravityOption = 'centre';
                    if (placement === 'TOP_LEFT') gravityOption = 'northwest';
                    else if (placement === 'TOP_RIGHT') gravityOption = 'northeast';
                    else if (placement === 'BOTTOM_LEFT') gravityOption = 'southwest';
                    else if (placement === 'BOTTOM_RIGHT') gravityOption = 'southeast';

                    composites.push({
                        input: watermarkBuffer,
                        gravity: gravityOption
                    });
                }
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
