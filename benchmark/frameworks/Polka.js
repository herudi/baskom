const polka = require('polka');

function midd(req, res, next){
    req.foo = 'foo';
    next();
}

polka()
    .use(midd)
    .get('/hello/:name', (req, res) => {
        res.end(`Hello ${req.params.name} - ${req.foo}`);
    })
    .listen(3000);