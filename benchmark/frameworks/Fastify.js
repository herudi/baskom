const fastify = require('fastify');

fastify()
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name}`);
    })
    .listen(3000);