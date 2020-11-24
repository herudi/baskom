const baskom = require('../../lib');
const http = require('http');

const app = baskom();

app.get('/hello', async (req, res) => {
    return { name: 'hello' };
});

const server = http.createServer(app.server());

server.listen(3000, () => {
    console.log('Running ' + 3000)
})

