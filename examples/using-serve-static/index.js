const serveStatic = require('serve-static');
const baskom = require('../../lib');

baskom()
    // static assets available => http://localhost:3000/assets/style.css
    .use('/assets', serveStatic('public'))
    .get('/hello', _ => {
        return { name: 'hello' };
    })
    .listen(3000, () => {
        console.log('Running ' + 3000);
    });