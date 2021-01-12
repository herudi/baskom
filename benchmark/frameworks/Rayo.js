const rayo = require('rayo');

function midd(req, res, next){
    req.foo = 'foo';
    next();
}

rayo({ port: 3000 })
    .through(midd)
    .get('/hello/:name', (req, res) => {
        res.end(`Hello ${req.params.name} - ${req.foo}`);
    })
    .start();