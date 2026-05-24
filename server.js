var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 8888;
var ROOT = __dirname;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css'
};

var server = http.createServer(function(req, res) {
  var safePath = path.normalize(req.url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
  var filePath = path.join(ROOT, safePath);

  // Security: don't serve files outside ROOT
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, function(err, stats) {
    if (err || !stats.isFile()) {
      // Fallback to index.html
      filePath = path.join(ROOT, 'wrong-questions-app.html');
      fs.readFile(filePath, function(e2, data) {
        if (e2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    var mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, function(e2, data) {
      if (e2) { res.writeHead(500); res.end('Error'); return; }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Server running at http://0.0.0.0:' + PORT + '/');
  console.log('Access from iPhone: http://192.168.3.166:' + PORT + '/wrong-questions-app.html');
});
