const baskom = require('baskom');

function midd(req, res, next){
    req.foo = 'foo';
    next();
}

baskom()
    .use(midd)
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name} - ${req.foo}`);
    })
    .listen(3000);