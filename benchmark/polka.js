const polka = require('polka');
function foo(req, res, run){
    req.foo = 'foo';
    run();
}
polka()
    .use(foo)
    .get('/', (req, res) => {
        res.end('Base');
    })
    .get('/json/:name', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ name: req.params.name }));
    })
    .get('/hello/:name', (req, res) => {
        res.end('hello ' + req.params.name);
    })
    .listen(3000)