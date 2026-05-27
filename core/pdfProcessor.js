const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const os = require('os');
const { spawn } = require('child_process');
const conversionManager = require('./conversionManager');

// Page sizes in PostScript points (72 points per inch)
const PAGE_SIZES = {
    A4: { width: 595.27, height: 841.89 },
    LETTER: { width: 612.00, height: 792.00 }
};

const MARGINS = {
    NONE: 0,
    SMALL: 15,
    LARGE: 30
};

/**
 * Creates a unique output path in the target folder.
 * If a file exists, appends " (1)", " (2)", etc.
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
 * Compiles a list of image paths into a single PDF.
 */
async function getFfmpegPath() {
    try {
        const status = await conversionManager.getEngineStatus();
        return status?.engines?.ffmpeg?.executable || 'ffmpeg';
    } catch {
        return 'ffmpeg';
    }
}

function compressImage(ffmpegPath, inputPath, outputPath, quality) {
    return new Promise((resolve, reject) => {
        const qscale = Math.round(31 - (quality / 100) * 29);
        const args = [
            '-y',
            '-i', inputPath,
            '-qscale:v', String(qscale),
            outputPath
        ];
        const proc = spawn(ffmpegPath, args, { windowsHide: true });
        
        let stderr = '';
        proc.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        
        proc.on('close', (code) => {
            if (code === 0) {
                resolve(outputPath);
            } else {
                reject(new Error(`ffmpeg image compression failed: ${stderr}`));
            }
        });
        
        proc.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Compiles a list of image paths into a single PDF.
 */
async function compileImagesToPDF({ imagePaths, outputFolder, pdfName, pageSize = 'A4', orientation = 'PORTRAIT', marginType = 'NONE', quality = 100 }) {
    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
        throw new Error('No images selected for PDF creation.');
    }
    if (!outputFolder) {
        throw new Error('Output folder is not defined.');
    }

    console.log(`[pdfProcessor] Starting PDF compilation of ${imagePaths.length} images at quality ${quality}...`);

    // Ensure output directory exists
    await fs.promises.mkdir(outputFolder, { recursive: true });

    // Create a new PDF Document
    const pdfDoc = await PDFDocument.create();

    const marginValue = MARGINS[marginType.toUpperCase()] ?? 0;
    const isLandscape = orientation.toUpperCase() === 'LANDSCAPE';
    const ffmpegPath = await getFfmpegPath();
    const tempFiles = [];

    try {
        for (const imgPath of imagePaths) {
            if (!fs.existsSync(imgPath)) {
                console.warn(`[pdfProcessor] Image does not exist, skipping: ${imgPath}`);
                continue;
            }

            let ext = path.extname(imgPath).toLowerCase();
            let currentPath = imgPath;

            // If quality is less than 100, compress the image to a temporary file via ffmpeg
            if (quality < 100) {
                try {
                    const tempOutPath = path.join(os.tmpdir(), `converthub_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
                    await compressImage(ffmpegPath, imgPath, tempOutPath, quality);
                    currentPath = tempOutPath;
                    tempFiles.push(tempOutPath);
                    ext = '.jpg';
                } catch (compErr) {
                    console.warn(`[pdfProcessor] Compression failed for ${imgPath}, embedding original:`, compErr);
                }
            }

            const imgBytes = await fs.promises.readFile(currentPath);
            let image;

            // Embed the image
            if (ext === '.png') {
                image = await pdfDoc.embedPng(imgBytes);
            } else if (ext === '.jpg' || ext === '.jpeg') {
                image = await pdfDoc.embedJpg(imgBytes);
            } else {
                // Fallback: try embedding as JPEG
                try {
                    image = await pdfDoc.embedJpg(imgBytes);
                } catch (e) {
                    console.warn(`[pdfProcessor] Failed to embed image as JPEG, skipping: ${imgPath}`, e);
                    continue;
                }
            }

            const imgWidth = image.width;
            const imgHeight = image.height;

            let pageWidth, pageHeight;

            // Compute page size
            if (pageSize.toUpperCase() === 'FIT') {
                pageWidth = imgWidth + (2 * marginValue);
                pageHeight = imgHeight + (2 * marginValue);
            } else {
                const sizeDef = PAGE_SIZES[pageSize.toUpperCase()] || PAGE_SIZES.A4;
                if (isLandscape) {
                    pageWidth = sizeDef.height;
                    pageHeight = sizeDef.width;
                } else {
                    pageWidth = sizeDef.width;
                    pageHeight = sizeDef.height;
                }
            }

            // Add a page to the PDF
            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Scale image to fit the page bounds (accounting for margins)
            const availWidth = pageWidth - (2 * marginValue);
            const availHeight = pageHeight - (2 * marginValue);

            const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
            const placedWidth = imgWidth * scale;
            const placedHeight = imgHeight * scale;

            // Center the image inside the margins
            const x = marginValue + (availWidth - placedWidth) / 2;
            const y = marginValue + (availHeight - placedHeight) / 2;

            page.drawImage(image, {
                x,
                y,
                width: placedWidth,
                height: placedHeight
            });
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const cleanName = pdfName ? pdfName.trim().replace(/[/\\?%*:|"<>]/g, '_') : 'Compiled_Images';
        const finalPath = createUniquePath(outputFolder, cleanName, 'pdf');

        await fs.promises.writeFile(finalPath, pdfBytes);
        console.log(`[pdfProcessor] PDF compiled successfully: ${finalPath}`);

        return {
            success: true,
            outputPath: finalPath,
            fileName: path.basename(finalPath)
        };
    } finally {
        // Clean up temporary files
        for (const file of tempFiles) {
            try {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                }
            } catch (err) {
                console.warn(`[pdfProcessor] Failed to delete temp file ${file}:`, err);
            }
        }
    }
}

/**
 * Saves a base64-encoded image page directly to disk.
 */
async function saveExtractedPage({ base64Data, outputFolder, fileName }) {
    if (!base64Data) {
        throw new Error('No image data provided.');
    }
    if (!outputFolder) {
        throw new Error('Output folder is not defined.');
    }
    if (!fileName) {
        throw new Error('Filename is not defined.');
    }

    // Ensure output directory exists
    await fs.promises.mkdir(outputFolder, { recursive: true });

    const buffer = Buffer.from(base64Data, 'base64');
    
    // Auto-resolve unique filename to avoid overwrites
    const ext = path.extname(fileName);
    const stem = path.basename(fileName, ext);
    const finalPath = createUniquePath(outputFolder, stem, ext);

    await fs.promises.writeFile(finalPath, buffer);
    console.log(`[pdfProcessor] Saved extracted page to disk: ${finalPath}`);

    return {
        success: true,
        outputPath: finalPath,
        fileName: path.basename(finalPath)
    };
}

module.exports = {
    compileImagesToPDF,
    saveExtractedPage
};
