const polka = require('polka');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

const app = polka();
app.use(midd);
for (let i = 0; i < 1000; i++) {
    app.get('/hello' + i, (req, res) => {
        res.end('hello route ' + i);
    })
}

app.listen(3000);