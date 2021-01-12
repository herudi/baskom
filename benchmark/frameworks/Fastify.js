const fastify = require('fastify');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

fastify()
    .addHook('onRequest', midd)
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name} - ${req.foo}`);
    })
    .listen(3000);