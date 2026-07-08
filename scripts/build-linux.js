const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const args = ['electron-builder', '--linux'];

if (process.platform === 'linux') {
  args.push('AppImage', 'deb');
} else {
  args.push('deb');
}

if (process.argv.length > 2) {
  args.push(...process.argv.slice(2));
}

const result = spawnSync(command, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
