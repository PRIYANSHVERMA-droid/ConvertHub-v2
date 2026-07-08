const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ENGINES_ROOT = path.join(ROOT, 'engines');
const SEVEN_ZIP_VERSION = '26.02';
const SEVEN_ZIP_BUILD = '2602';

const TARGETS = {
    darwin: {
        engineDir: path.join(ENGINES_ROOT, 'darwin'),
        ffmpegUrl: process.env.CONVERTHUB_FFMPEG_MAC_URL || 'https://evermeet.cx/ffmpeg/getrelease/zip',
        sevenZipUrl: process.env.CONVERTHUB_7ZIP_MAC_URL || `https://github.com/ip7z/7zip/releases/download/${SEVEN_ZIP_VERSION}/7z${SEVEN_ZIP_BUILD}-mac.tar.xz`
    },
    linux: {
        engineDir: path.join(ENGINES_ROOT, 'linux'),
        ffmpegUrl: process.env.CONVERTHUB_FFMPEG_LINUX_URL || getLinuxFfmpegUrl(),
        sevenZipUrl: process.env.CONVERTHUB_7ZIP_LINUX_URL || getLinuxSevenZipUrl()
    }
};

function getLinuxFfmpegUrl() {
    const arch = process.env.npm_config_arch || process.arch;
    if (arch === 'arm64' || arch === 'aarch64') {
        return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz';
    }
    return 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
}

function getLinuxSevenZipUrl() {
    const arch = process.env.npm_config_arch || process.arch;
    if (arch === 'arm64' || arch === 'aarch64') {
        return `https://github.com/ip7z/7zip/releases/download/${SEVEN_ZIP_VERSION}/7z${SEVEN_ZIP_BUILD}-linux-arm64.tar.xz`;
    }
    return `https://github.com/ip7z/7zip/releases/download/${SEVEN_ZIP_VERSION}/7z${SEVEN_ZIP_BUILD}-linux-x64.tar.xz`;
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function download(url, destination, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error(`Too many redirects while downloading ${url}`));
            return;
        }

        const request = https.get(url, (response) => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                response.resume();
                const nextUrl = new URL(response.headers.location, url).toString();
                download(nextUrl, destination, redirectCount + 1).then(resolve, reject);
                return;
            }

            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Download failed (${response.statusCode}) for ${url}`));
                return;
            }

            const file = fs.createWriteStream(destination);
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', reject);
        });

        request.on('error', reject);
    });
}

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            windowsHide: true,
            ...options
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} exited with code ${code}`));
        });
    });
}

async function extractZip(archivePath, outputDir) {
    ensureDir(outputDir);
    if (process.platform === 'win32') {
        await run('powershell.exe', [
            '-NoProfile',
            '-Command',
            `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${outputDir.replace(/'/g, "''")}' -Force`
        ]);
        return;
    }
    if (process.platform === 'darwin') {
        await run('ditto', ['-x', '-k', archivePath, outputDir]);
        return;
    }
    await run('unzip', ['-o', archivePath, '-d', outputDir]);
}

async function extractTarXz(archivePath, outputDir) {
    ensureDir(outputDir);
    await run('tar', ['-xf', archivePath, '-C', outputDir]);
}

function findExecutable(rootDir, names) {
    const pending = [rootDir];
    while (pending.length > 0) {
        const current = pending.shift();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                pending.push(fullPath);
            } else if (entry.isFile() && names.includes(entry.name)) {
                return fullPath;
            }
        }
    }
    return null;
}

function installExecutable(source, destination) {
    if (!source) {
        throw new Error(`Expected executable was not found in downloaded archive for ${destination}`);
    }
    ensureDir(path.dirname(destination));
    fs.copyFileSync(source, destination);
    fs.chmodSync(destination, 0o755);
    console.log(`[prepare-engines] Installed ${path.relative(ROOT, destination)}`);
}

async function prepareFfmpeg(targetName, config, tempDir) {
    const archivePath = path.join(tempDir, `${targetName}-ffmpeg${config.ffmpegUrl.endsWith('.zip') || config.ffmpegUrl.includes('/zip') ? '.zip' : '.tar.xz'}`);
    const extractDir = path.join(tempDir, `${targetName}-ffmpeg`);
    console.log(`[prepare-engines] Downloading FFmpeg for ${targetName}`);
    await download(config.ffmpegUrl, archivePath);
    if (archivePath.endsWith('.zip')) {
        await extractZip(archivePath, extractDir);
    } else {
        await extractTarXz(archivePath, extractDir);
    }
    installExecutable(findExecutable(extractDir, ['ffmpeg']), path.join(config.engineDir, 'ffmpeg'));
}

async function prepareSevenZip(targetName, config, tempDir) {
    const archivePath = path.join(tempDir, `${targetName}-7zip.tar.xz`);
    const extractDir = path.join(tempDir, `${targetName}-7zip`);
    console.log(`[prepare-engines] Downloading 7-Zip for ${targetName}`);
    await download(config.sevenZipUrl, archivePath);
    await extractTarXz(archivePath, extractDir);
    const executable = findExecutable(extractDir, ['7zz', '7z', '7za']);
    const outputName = executable ? path.basename(executable) : '7zz';
    installExecutable(executable, path.join(config.engineDir, '7zip', outputName));
}

async function prepareTarget(targetName) {
    const config = TARGETS[targetName];
    if (!config) {
        throw new Error(`Unsupported engine target: ${targetName}`);
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `converthub-${targetName}-engines-`));
    try {
        ensureDir(config.engineDir);
        await prepareFfmpeg(targetName, config, tempDir);
        await prepareSevenZip(targetName, config, tempDir);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    const requested = process.argv[2] || process.platform;
    const targets = requested === 'all' ? Object.keys(TARGETS) : [requested];

    for (const target of targets) {
        await prepareTarget(target);
    }
}

main().catch((error) => {
    console.error(`[prepare-engines] ${error.message}`);
    process.exit(1);
});
