const baskom = require('./../../dist/index');

function foo(req, res, run) {
    req.foo = 'foo';
    run();
}

baskom()
    .use(baskom.body())
    .use(foo)
    .get('/hello/:name', (req, res) => {
        console.log(req.foo)
        res.stream(__dirname + '/test.txt', { 'Content-Type': 'text/plain' });
    })
    .post('/hello', (req, res) => {
        console.log(req.body)
        res.send('hello');
    })
    .listen(3000);