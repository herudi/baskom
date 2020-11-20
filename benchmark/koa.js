const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
    ctx.body = 'Base';
});

app.listen(3000);