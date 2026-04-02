/**
 * Cross-platform prebuild script.
 * Kills any running app / electron instances, then cleans the relevant dist output.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';

// ── Kill running instances (best-effort, ignore failures) ────────────────────
try {
  if (isWin) {
    execSync('taskkill /F /IM "Rhythm Plus V2.exe" /T', { stdio: 'ignore' });
    execSync('taskkill /F /IM "electron.exe" /T', { stdio: 'ignore' });
    execSync('ping -n 3 127.0.0.1 >nul', { stdio: 'ignore', shell: true }); // ~2s pause
  } else {
    execSync('pkill -f "Rhythm Plus V2" 2>/dev/null; true', { stdio: 'ignore', shell: true });
    execSync('pkill -f "electron" 2>/dev/null; true', { stdio: 'ignore', shell: true });
  }
} catch (_) {}

// ── Clean platform-specific dist output ─────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
let targets;

if (isWin) {
  targets = [
    path.join(distDir, 'win-unpacked'),
    path.join(distDir, 'win-unpacked', 'resources', 'app.asar'),
  ];
} else if (process.platform === 'darwin') {
  targets = [path.join(distDir, 'mac')];
} else {
  // Linux
  targets = [path.join(distDir, 'linux-unpacked')];
}

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
    console.log('[prebuild] Removed:', target);
  } catch (_) {}
}
