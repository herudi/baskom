const http = require('http');

http.createServer((req, res) => {
	if (req.url === '/') return res.end('Base');
}).listen(3000);