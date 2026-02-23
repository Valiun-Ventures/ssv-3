const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const port = Number(process.env.PORT) || 4005;
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=UTF-8',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD' });
    return res.end('Method Not Allowed');
  }

  const cleanPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let requestedPath = path.join(rootDir, cleanPath);

  if (cleanPath.endsWith('/')) {
    requestedPath = path.join(requestedPath, 'index.html');
  }

  const resolvedPath = path.resolve(requestedPath);

  // Prevent directory traversal outside rootDir.
  if (!resolvedPath.startsWith(rootDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(resolvedPath, (statErr, stats) => {
    if (statErr) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const filePath = stats.isDirectory()
      ? path.join(resolvedPath, 'index.html')
      : resolvedPath;

    fs.stat(filePath, (fileErr, fileStats) => {
      if (fileErr || !fileStats.isFile()) {
        res.writeHead(404);
        return res.end('Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      if (req.method === 'HEAD') {
        return res.end();
      }

      fs.createReadStream(filePath).pipe(res);
    });
  });
});

server.listen(port, host, () => {
  console.log(`SSV Website serving from ${rootDir} on http://${host}:${port}`);
});
