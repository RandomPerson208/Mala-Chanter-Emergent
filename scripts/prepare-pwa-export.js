const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');
const fallbackPath = path.join(dist, '404.html');
const rawBasePath = process.argv[2] || '';
const basePath = rawBasePath.replace(/\/$/, '');
const assetPath = (file) => `${basePath}/${file.replace(/^\//, '')}`;

if (!fs.existsSync(indexPath)) {
  throw new Error('dist/index.html was not found. Run expo export before preparing the PWA.');
}

function pwaHeadTags() {
  return [
    '<meta name="description" content="ZenMala is an offline-ready meditation counter for mantra practice, mala history, and chanting stats.">',
    '<meta name="application-name" content="ZenMala">',
    '<meta name="theme-color" content="#141311">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="ZenMala">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="format-detection" content="telephone=no">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="ZenMala">',
    '<meta property="og:title" content="ZenMala">',
    '<meta property="og:description" content="An offline-ready mala counter for mantra practice.">',
    `<meta property="og:image" content="${assetPath('icon-512.png')}">`,
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="ZenMala">',
    '<meta name="twitter:description" content="An offline-ready mala counter for mantra practice.">',
    `<link rel="manifest" href="${assetPath('manifest.webmanifest')}">`,
    `<link rel="apple-touch-icon" href="${assetPath('apple-touch-icon.png')}">`,
    `<link rel="icon" type="image/png" sizes="48x48" href="${assetPath('favicon.png')}">`,
    `<link rel="icon" type="image/png" sizes="192x192" href="${assetPath('icon-192.png')}">`,
    `<link rel="icon" type="image/png" sizes="512x512" href="${assetPath('icon-512.png')}">`,
  ].join('\n    ');
}

function serviceWorkerScript() {
  return `<script>
(function () {
  if (!("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  if (location.hostname === "localhost" && location.port === "8081") return;

  var basePath = ${JSON.stringify(basePath)};
  var scope = (basePath || "") + "/";
  var swUrl = (basePath || "") + "/sw.js";

  window.addEventListener("load", function () {
    navigator.serviceWorker.register(swUrl, { scope: scope }).catch(function () {});
  });
})();
</script>`;
}

function applyPwaHtml(html) {
  let next = html;
  if (basePath) {
    next = next.replace(/(["'])\/_expo\//g, `$1${basePath}/_expo/`);
  }
  if (!next.includes('manifest.webmanifest')) {
    next = next.replace('</head>', `    ${pwaHeadTags()}\n  </head>`);
  }
  if (!next.includes('serviceWorker')) {
    next = next.replace('</body>', `${serviceWorkerScript()}\n</body>`);
  }
  return next;
}

function patchExpoRouterBasePath(source) {
  if (!basePath) return source;

  let next = source;
  next = next.replace(
    /appendBaseUrl=function\(([^,]+),([^=]+)=""\)/g,
    `appendBaseUrl=function($1,$2=${JSON.stringify(basePath)})`
  );
  next = next.replace(
    /getUrlWithReactNavigationConcessions=function\(([^,]+),([^=]+)=""\)/g,
    `getUrlWithReactNavigationConcessions=function($1,$2=${JSON.stringify(basePath)})`
  );
  next = next.replace(
    /function ([A-Za-z_$][\w$]*)\(([^,]+),([^=]+)=""\)\{return \3\?\2\.replace\(/g,
    `function $1($2,$3=${JSON.stringify(basePath)}){return $3?$2.replace(`
  );
  return next;
}

function patchExportedBundles() {
  const expoDir = path.join(dist, '_expo');
  if (!basePath || !fs.existsSync(expoDir)) return;

  const pending = [expoDir];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const before = fs.readFileSync(entryPath, 'utf8');
        const after = patchExpoRouterBasePath(before);
        if (after !== before) fs.writeFileSync(entryPath, after);
      }
    }
  }
}

const html = applyPwaHtml(fs.readFileSync(indexPath, 'utf8'));
fs.writeFileSync(indexPath, html);
fs.writeFileSync(fallbackPath, html);
patchExportedBundles();

console.log(`Prepared PWA export with manifest tags, service worker registration, and dist/404.html${basePath ? ` for ${basePath}` : ''}.`);
