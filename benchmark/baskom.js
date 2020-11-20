const baskom = require('../dist/index');

baskom()
    .get('/', _ => 'Base')
    .get('/json/:name', (req, res) => {
        return { name: req.params.name }
    })
    .get('/hello/:name', (req, res) => {
        return 'hello ' + req.params.name;
    })
    .listen(3000);