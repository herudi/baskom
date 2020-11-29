const polka = require('polka');

polka()
    .get('/hello/:name', (req, res) => {
        res.end(`Hello ${req.params.name}`);
    })
    .listen(3000);