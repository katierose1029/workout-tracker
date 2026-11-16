/* Minimal static file server for E2E runs (no dependencies). Serves the repo root. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = +process.env.E2E_PORT || 4173;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || file.includes(`${path.sep}.git${path.sep}`) || file.includes('node_modules')) {
    res.writeHead(403).end(); return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`E2E server on http://127.0.0.1:${PORT}`));
