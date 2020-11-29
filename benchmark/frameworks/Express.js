const express = require('express');

express()
    .get('/hello/:name', (req, res) => {
        res.send(`Hello ${req.params.name}`);
    })
    .listen(3000);