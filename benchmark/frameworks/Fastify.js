const fastify = require('fastify');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

const app = fastify();
app.addHook('onRequest', midd);
for (let i = 0; i < 1000; i++) {
    app.get('/hello' + i, (req, res) => {
        res.send('hello route ' + i);
    })
}

app.listen(3000);