const rayo = require('rayo');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

rayo({ port: 3000, storm: { monitor: false } })
    .through(midd)
    .get('/hello/:name', (req, res) => {
        let random = Math.random().toString(36).substring(7);
        res.end(`Hello ${req.params.name} - ${random} - ${req.foo}`);
    })
    .start();
