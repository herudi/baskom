const baskom = require('../../lib');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

(async () => {
    try {
        await app.prepare();
        const server = baskom();
        server.get('/baskom-post/:id', async (req, res) => {
            return app.render(req, res, '/post', { id: req.params.id })
        });
        server.get('*', async (req, res) => {
            return handle(req, res);
        });
        server.listen(3000, () => {
            console.log('Running ' + 3000);
        });
    } catch (error) {
        console.error(error.stack)
        process.exit(1)
    }
})();