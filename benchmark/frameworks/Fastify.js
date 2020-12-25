const fastify = require('fastify');

function midd(req, res, next){
    req.foo = 'foo';
    next();
}

fastify()
    .addHook('onRequest', midd)
    .get('/hello/:name', (req, res) => {
        let random = Math.random().toString(36).substring(7);
        res.send(`Hello ${req.params.name} - ${random} - ${req.foo}`);
    })
    .listen(3000);