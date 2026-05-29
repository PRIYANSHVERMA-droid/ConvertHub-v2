const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const os = require('os');
const { spawn } = require('child_process');
const conversionManager = require('./conversionManager');
const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');

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

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
}

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

async function getSevenZipPath() {
    const localPath = process.platform === 'win32'
        ? path.resolve(__dirname, '..', 'engines', '7zip', '7za.exe')
        : null;

    if (localPath && fs.existsSync(localPath)) {
        return localPath;
    }

    return process.platform === 'win32' ? '7za.exe' : '7z';
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
async function compileImagesToPDF({ imagePaths, outputFolder, pdfName, pageSize = 'A4', orientation = 'PORTRAIT', marginType = 'NONE', quality = 100, layout = 'CENTER', pageNumbers = false, backgroundColor = '#ffffff', title = '', author = '', password = '' }) {
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
    if (title) pdfDoc.setTitle(title);
    if (author) pdfDoc.setAuthor(author);

    const marginValue = MARGINS[marginType.toUpperCase()] ?? 0;
    const isLandscape = orientation.toUpperCase() === 'LANDSCAPE';
    const ffmpegPath = await getFfmpegPath();
    const tempFiles = [];
    const bgColor = hexToRgb(backgroundColor);

    try {
        let pageIdx = 1;
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
                // Fallback for unsupported types like WEBP: convert to JPEG before embedding
                try {
                    const tempOutPath = path.join(os.tmpdir(), `converthub_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
                    await compressImage(ffmpegPath, currentPath, tempOutPath, Math.min(Math.max(quality, 10), 100));
                    currentPath = tempOutPath;
                    tempFiles.push(tempOutPath);
                    const jpegBytes = await fs.promises.readFile(currentPath);
                    image = await pdfDoc.embedJpg(jpegBytes);
                    ext = '.jpg';
                } catch (conversionError) {
                    console.warn(`[pdfProcessor] Failed to convert unsupported image format to JPEG, skipping: ${imgPath}`, conversionError);
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

            // Background Color
            page.drawRectangle({
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
                color: rgb(bgColor.r, bgColor.g, bgColor.b),
            });

            // Scale image to fit the page bounds (accounting for margins)
            const availWidth = pageWidth - (2 * marginValue);
            const availHeight = pageHeight - (2 * marginValue);

            let placedWidth, placedHeight, x, y;

            if (layout.toUpperCase() === 'STRETCH') {
                placedWidth = availWidth;
                placedHeight = availHeight;
                x = marginValue;
                y = marginValue;
            } else {
                const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
                placedWidth = imgWidth * scale;
                placedHeight = imgHeight * scale;
                x = marginValue + (availWidth - placedWidth) / 2;
                y = marginValue + (availHeight - placedHeight) / 2;
            }

            page.drawImage(image, {
                x,
                y,
                width: placedWidth,
                height: placedHeight
            });

            if (pageNumbers) {
                const text = `Page ${pageIdx}`;
                const fontSize = 10;
                const textWidth = page.getFont('Helvetica').widthOfTextAtSize(text, fontSize);
                page.drawText(text, {
                    x: (pageWidth - textWidth) / 2,
                    y: marginValue / 2 || 10,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                });
            }
            pageIdx++;
        }

        // Save the PDF
        let pdfBytes = await pdfDoc.save();
        
        // Encrypt if password is provided
        if (password) {
            try {
                pdfBytes = await encryptPDF(pdfBytes, password);
            } catch (encErr) {
                console.warn(`[pdfProcessor] Encryption failed:`, encErr);
                // We continue with unencrypted PDF but log the warning
            }
        }

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

async function createImagesZip({ filePaths, outputFolder, zipName }) {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
        throw new Error('No extracted images were provided for ZIP creation.');
    }
    if (!outputFolder) {
        throw new Error('Output folder is not defined.');
    }

    await fs.promises.mkdir(outputFolder, { recursive: true });

    const sourceDir = path.dirname(filePaths[0]);
    const normalizedSourceDir = path.normalize(sourceDir).toLowerCase();
    const safeFiles = [];

    for (const filePath of filePaths) {
        if (!filePath || !fs.existsSync(filePath)) {
            continue;
        }
        if (path.normalize(path.dirname(filePath)).toLowerCase() !== normalizedSourceDir) {
            throw new Error('All images must be in the same folder before creating a ZIP.');
        }
        safeFiles.push(path.basename(filePath));
    }

    if (safeFiles.length === 0) {
        throw new Error('No extracted image files exist for ZIP creation.');
    }

    const sevenZipPath = await getSevenZipPath();
    const cleanName = zipName ? zipName.trim().replace(/[/\\?%*:|"<>]/g, '_') : 'Extracted_Images';
    const finalPath = createUniquePath(outputFolder, cleanName, 'zip');
    const listPath = path.join(os.tmpdir(), `converthub_zip_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);

    try {
        await fs.promises.writeFile(listPath, safeFiles.join(os.EOL), 'utf8');

        await new Promise((resolve, reject) => {
            const args = ['a', '-tzip', finalPath, `@${listPath}`, '-y'];
            const proc = spawn(sevenZipPath, args, { cwd: sourceDir, windowsHide: true });
            let stderr = '';
            let stdout = '';

            proc.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });
            proc.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            proc.on('error', (error) => {
                reject(new Error(error.code === 'ENOENT'
                    ? `7-Zip not found at: ${sevenZipPath}`
                    : `Failed to start 7-Zip: ${error.message}`));
            });
            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr.trim() || stdout.trim() || `7-Zip exited with code ${code}`));
                    return;
                }
                resolve();
            });
        });

        return {
            success: true,
            outputPath: finalPath,
            fileName: path.basename(finalPath)
        };
    } finally {
        try {
            if (fs.existsSync(listPath)) {
                await fs.promises.unlink(listPath);
            }
        } catch (error) {
            console.warn(`[pdfProcessor] Failed to delete ZIP list file ${listPath}:`, error);
        }
    }
}

module.exports = {
    compileImagesToPDF,
    saveExtractedPage,
    createImagesZip
};
