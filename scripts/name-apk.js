// Copies the release APK to dist/tempo-<version>.apk, the name people see when it is shared.
// Runs automatically after `npm run build:apk` (npm "post" script).
const fs = require('fs');
const path = require('path');

const { version } = require('../app.json').expo;
const root = path.join(__dirname, '..');
const from = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const to = path.join(root, 'dist', `tempo-${version}.apk`);

fs.mkdirSync(path.dirname(to), { recursive: true });
fs.copyFileSync(from, to);
console.log(`APK ready: ${path.relative(root, to)}`);
