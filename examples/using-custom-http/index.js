const baskom = require('../../lib');
const low = require('low-http-server');

const app = baskom({
    useServer: low()
});

app.get('/hello', async (req, res) => {
    return { name: 'hello' };
});

app.listen(3000);

