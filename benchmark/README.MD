# Benchmark

Server => Nodejs v12.16.3, Ubuntu 16.04.6 LTS, Memory 16GB, Processor Intel(R) Xeon(R) Gold 6126 CPU @ 2.60GHz.
> note : try to 1000+ route on url http://localhost:3000/hello500

Usage => yarn bench
```bash
┌─────────┬─────────┬──────────────┬─────────┬───────────────┐
│         │ Version │ Requests/sec │ Latency │ Throughput/Mb │
├─────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Baskom  │ 0.2.5   │ 67881.61     │ 1.38    │ 7.44          │
├─────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Fastify │ 3.8.0   │ 59171.2      │ 1.59    │ 8.80          │
├─────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Rayo    │ 1.3.6   │ 35844.81     │ 2.7     │ 3.93          │
├─────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Polka   │ 0.5.2   │ 35280        │ 2.74    │ 3.87          │
├─────────┼─────────┼──────────────┼─────────┼───────────────┤
│ Express │ 4.17.1  │ 9642.4       │ 10.14   │ 2.01          │
└─────────┴─────────┴──────────────┴─────────┴───────────────┘

```

Framework.js
```js
const framework = require('framework');

function midd(req, res, next) {
    req.foo = 'foo';
    next();
}

const app = framework();
app.use(midd);
for (let i = 0; i < 1000; i++) {
    app.get('/hello' + i, (req, res) => {
        res.send('hello route ' + i);
    })
}

app.listen(3000);
```

