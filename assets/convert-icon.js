const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function extractLargestPngFrame(icoPath) {
    const buffer = fs.readFileSync(icoPath);
    if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
        return null;
    }

    const frameCount = buffer.readUInt16LE(4);
    let bestFrame = null;

    for (let index = 0; index < frameCount; index += 1) {
        const entryOffset = 6 + index * 16;
        if (entryOffset + 16 > buffer.length) break;

        const width = buffer[entryOffset] || 256;
        const height = buffer[entryOffset + 1] || 256;
        const size = buffer.readUInt32LE(entryOffset + 8);
        const offset = buffer.readUInt32LE(entryOffset + 12);
        const frame = buffer.subarray(offset, offset + size);
        const isPng = frame.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

        if (isPng && (!bestFrame || width * height > bestFrame.width * bestFrame.height)) {
            bestFrame = { width, height, frame };
        }
    }

    return bestFrame?.frame || null;
}

async function convertIcon() {
    const icoPath = path.join(__dirname, 'app-icon.ico');
    const pngPath = path.join(__dirname, 'app-icon.png');
    
    try {
        console.log(`Converting ${icoPath} to ${pngPath} using sharp...`);
        const input = extractLargestPngFrame(icoPath) || icoPath;
        await sharp(input)
            .resize(256, 256)
            .png()
            .toFile(pngPath);
        console.log('Icon conversion successful!');
    } catch (err) {
        console.error('Error converting icon:', err);
    }
}

convertIcon();
