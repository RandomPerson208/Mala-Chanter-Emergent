const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'www');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

const htmlPath = path.join(webDir, 'index.html');
const manifestPath = path.join(webDir, 'manifest.webmanifest');
const swPath = path.join(webDir, 'sw.js');
const cssPath = path.join(webDir, 'styles.css');
const jsPath = path.join(webDir, 'app.js');

for (const file of [htmlPath, manifestPath, swPath, cssPath, jsPath]) {
  assert(fs.existsSync(file), `Missing ${path.relative(root, file)}.`);
}

const html = read(htmlPath);
const manifest = JSON.parse(read(manifestPath));
const sw = read(swPath);
const app = read(jsPath);
const pkg = JSON.parse(read(path.join(root, 'package.json')));

assert(manifest.name === 'ZenMala', 'Manifest name should be ZenMala.');
assert(manifest.display === 'standalone', 'Manifest display should be standalone.');
assert(manifest.start_url === './', 'Manifest start_url should stay relative for GitHub Pages.');
assert(manifest.scope === './', 'Manifest scope should stay relative for GitHub Pages.');
assert(html.includes('manifest.webmanifest'), 'HTML should link the web manifest.');
assert(html.includes('./styles.css'), 'HTML should load styles.css.');
assert(html.includes('./app.js'), 'HTML should load app.js.');
assert(sw.includes('CACHE_NAME'), 'Service worker should define a cache name.');
assert(sw.includes('./manifest.webmanifest'), 'Service worker should cache manifest.webmanifest.');
assert(sw.includes('./index.html'), 'Service worker should cache index.html.');
assert(sw.includes('./styles.css'), 'Service worker should cache styles.css.');
assert(sw.includes('./app.js'), 'Service worker should cache app.js.');
assert(app.includes('localStorage'), 'App should persist local practice data.');
assert(app.includes('serviceWorker'), 'App should register the service worker.');
new Function(sw);
new Function(app);

for (const icon of manifest.icons || []) {
  assert(fs.existsSync(path.join(webDir, icon.src)), `Missing manifest icon: ${icon.src}`);
}

for (const shortcut of manifest.shortcuts || []) {
  assert(shortcut.url && shortcut.url.startsWith('./'), `Shortcut URL should be relative: ${shortcut.name}`);
  for (const icon of shortcut.icons || []) {
    assert(fs.existsSync(path.join(webDir, icon.src)), `Missing shortcut icon: ${icon.src}`);
  }
}

const blockedNeedles = ['ex' + 'po', 'react' + '-' + 'native', 'emer' + 'gent'];
const checkFiles = [
  'package.json',
  'capacitor.config.json',
  'README.md',
  '.github/workflows/deploy-pages.yml',
  'www/index.html',
  'www/styles.css',
  'www/app.js',
  'www/manifest.webmanifest',
  'www/sw.js',
];

for (const rel of checkFiles) {
  const content = read(path.join(root, rel)).toLowerCase();
  for (const needle of blockedNeedles) {
    assert(!content.includes(needle), `${rel} should not include ${needle}.`);
  }
}

for (const script of Object.values(pkg.scripts || {})) {
  const lower = script.toLowerCase();
  for (const needle of blockedNeedles) {
    assert(!lower.includes(needle), `Script should not include ${needle}: ${script}`);
  }
}

for (const name of Object.keys(pkg.dependencies || {})) {
  for (const needle of blockedNeedles) {
    assert(!name.toLowerCase().includes(needle), `Dependency should not include ${needle}: ${name}`);
  }
}

console.log('Static PWA, manifest, service worker, and Capacitor webDir look good.');
