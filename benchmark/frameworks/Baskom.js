const baskom = require('baskom');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

const app = baskom();
app.use(midd);
for (let i = 0; i < 1000; i++) {
    app.get('/hello' + i, (req, res) => {
        res.send('hello route ' + i);
    })
}

app.listen(3000);