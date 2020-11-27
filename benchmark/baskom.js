const baskom = require('../lib');

baskom()
    .get('/', _ => 'Base')
    .get('/json/:name', (req, res) => {
        return { name: req.params.name }
    })
    .get('/hello', (req, res) => {
        return res.send('hello');
    })
    .listen(3000);