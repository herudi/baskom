const baskom = require('../../lib');
const { Nuxt, Builder } = require('nuxt');

const dev = process.env.NODE_ENV !== 'production';
const nuxt = new Nuxt({ dev });
const app = baskom();

app.use(nuxt.render);

if (dev) {
    (async () => {
        try {
            const builder = new Builder(nuxt);
            await builder.build();
            app.listen(3000, () => {
                console.log('Running ' + 3000);
            });
        } catch (error) {
            console.error(error.stack)
            process.exit(1)
        }
    })();
} else {
    app.listen(3000, () => {
        console.log('Running ' + 3000);
    });
}