const baskom = require('../../lib');
const https = require('https');
const { readFileSync } = require('fs');

const credentials = {
    key: readFileSync('sslcert/test.key', 'utf8'), 
    cert: readFileSync('sslcert/test.crt', 'utf8')
};
const app = baskom();

app.get('/hello', _ => {
    return { name: 'hello' };
});

const server = https.createServer(credentials, app.server());

server.listen(3000, () => {
    console.log('Running ' + 3000)
})

