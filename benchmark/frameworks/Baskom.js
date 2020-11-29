const baskom = require('baskom');

baskom()
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name}`);
    })
    .listen(3000);