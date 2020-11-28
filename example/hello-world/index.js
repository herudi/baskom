const baskom = require('../../lib/index');

function foo(req, res, run){
    req.foo = 'foo';
    run();
}

baskom()
    .use(foo)
    .get('/hello/:name', (req, res) => {
        console.log(req.body);
        res.send('hello '+ req.params.name);
    })
    .get('/txt', (req, res) => {
        res.sendFile(__dirname+'/test.txt');
    })
    .post('/hello', (req, res) => {
        console.log(req.body)
        res.send('hello');
    })
    .listen(3000);