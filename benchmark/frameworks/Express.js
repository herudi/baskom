const express = require('express');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

express()
    .disable('etag')
    .disable('x-powered-by')
    .use(midd)
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name} - ${req.foo}`);
    })
    .listen(3000);