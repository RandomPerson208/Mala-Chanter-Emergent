const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const manifestPath = path.join(publicDir, 'manifest.webmanifest');
const swPath = path.join(publicDir, 'sw.js');
const manifest = JSON.parse(read(manifestPath));
const sw = read(swPath);

assert(manifest.name === 'ZenMala', 'Manifest name should be ZenMala.');
assert(manifest.display === 'standalone', 'Manifest display should be standalone.');
assert(manifest.start_url === './', 'Manifest start_url should stay relative for GitHub Pages.');
assert(manifest.scope === './', 'Manifest scope should stay relative for GitHub Pages.');
assert(sw.includes('CACHE_NAME'), 'Service worker should define a cache name.');
assert(sw.includes('./manifest.webmanifest'), 'Service worker should cache manifest.webmanifest.');
assert(sw.includes('./index.html'), 'Service worker should cache index.html.');
new Function(sw);

for (const icon of manifest.icons || []) {
  assert(fs.existsSync(path.join(publicDir, icon.src)), `Missing manifest icon: ${icon.src}`);
}

for (const shortcut of manifest.shortcuts || []) {
  assert(shortcut.url && shortcut.url.startsWith('./'), `Shortcut URL should be relative: ${shortcut.name}`);
  for (const icon of shortcut.icons || []) {
    assert(fs.existsSync(path.join(publicDir, icon.src)), `Missing shortcut icon: ${icon.src}`);
  }
}

if (fs.existsSync(distDir)) {
  const html = read(path.join(distDir, 'index.html'));
  assert(html.includes('manifest.webmanifest'), 'Exported HTML should link the web manifest.');
  assert(html.includes('serviceWorker'), 'Exported HTML should register the service worker.');
  assert(fs.existsSync(path.join(distDir, '404.html')), 'dist/404.html should exist for SPA routing.');
  assert(fs.existsSync(path.join(distDir, 'sw.js')), 'dist/sw.js should be copied from public.');

  const basePath = html.match(/var basePath = "([^"]*)"/)?.[1] || '';
  if (basePath) {
    assert(html.includes(`${basePath}/_expo/`), 'Exported HTML should prefix Expo assets for GitHub Pages.');
    const jsFiles = [];
    const pending = [path.join(distDir, '_expo')];
    while (pending.length) {
      const current = pending.pop();
      if (!fs.existsSync(current)) continue;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const entryPath = path.join(current, entry.name);
        if (entry.isDirectory()) pending.push(entryPath);
        if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(entryPath);
      }
    }
    const bundle = jsFiles.map(read).join('\n');
    assert(bundle.includes(`"${basePath}"`), 'Expo Router bundle should include the GitHub Pages base path.');
  }
}

console.log('PWA manifest, icons, service worker, and export fallback look good.');
