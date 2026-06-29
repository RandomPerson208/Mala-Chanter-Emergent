const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');
const fallbackPath = path.join(dist, '404.html');

if (!fs.existsSync(indexPath)) {
  throw new Error('dist/index.html was not found. Run expo export before preparing the PWA.');
}

fs.copyFileSync(indexPath, fallbackPath);
console.log('Prepared PWA export with SPA fallback at dist/404.html.');
