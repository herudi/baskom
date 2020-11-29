const rayo = require('rayo');

rayo({ port: 3000 })
    .get('/hello/:name', (req, res) => {
        res.end(`Hello ${req.params.name}`);
    })
    .start();