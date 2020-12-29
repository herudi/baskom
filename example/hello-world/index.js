const baskom = require('../../lib');
const serveStatic = require('serve-static');

function midd(req, res, run) {
    req.user = 'herudi';
    run();
}
const app = baskom();
const router = baskom.router();

router.get('/hello/:name', (req, res) => {
    console.log(req.user);
    res.send('hello ' + req.params.name);
});

router.get('/txt', (req, res) => {
    res.sendFile(__dirname + '/test.txt');
});

router.post('/hello', (req, res) => {
    console.log(req.body)
    return 'hello post';
});

app.use('/api', midd, router);
app.use('/assets', serveStatic('public'));

app.listen(3000, () => {
    console.log('> Running ' + 3000);
});