const polka = require('polka');

function midd(req, res, next){
    req.foo = 'foo';
    next();
}

polka()
    .use(midd)
    .get('/hello/:name', (req, res) => {
        let random = Math.random().toString(36).substring(7);
        res.end(`Hello ${req.params.name} - ${random} - ${req.foo}`);
    })
    .listen(3000);