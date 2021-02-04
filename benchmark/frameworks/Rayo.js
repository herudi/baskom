const rayo = require('rayo');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

const app = rayo({ port: 3000 });
app.through(midd);
for (let i = 0; i < 1000; i++) {
    app.get('/hello' + i, (req, res) => {
        res.end('hello route ' + i);
    })
}

app.start();