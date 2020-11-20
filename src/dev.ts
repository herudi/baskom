import baskom from './index';

baskom({
    useDebugError: true
})
    .use(baskom.body())
    .get('/', _ => 'Base')
    .get('/json/:name', (req, res) => {
        return { name: req.params.name }
    })
    .get('/hello/:name', (req, res) => {
        return 'hello ' + req.params.name;
    })
    .post('/hello', (req, res) => {
        console.log(req.body);
        return 'test';
    })
    .listen(3000);