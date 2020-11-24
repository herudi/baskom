const baskom = require('../../lib/index');

function foo(req, res, run){
    req.foo = 'foo';
    run();
}

baskom()
    .use(baskom.body())
    .use(foo)
    .get('/hello/:name', (req, res) => {
        console.log(req.body);
        res.send('hello '+ req.params.name);
    })
    .post('/hello', (req, res) => {
        console.log(req.body)
        res.send('hello');
    })
    .listen(3000);