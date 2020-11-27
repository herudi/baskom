const rayo = require('rayo');

rayo({ port: 3000 })
    .get('/', (req, res) => {
        res.end('Base');
    })
    .get('/json/:name', (req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ name: req.params.name }));
    })
    .get('/hello', (req, res) => {
        res.end('hello');
    })
    .start();