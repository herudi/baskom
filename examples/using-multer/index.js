const baskom = require('../../lib');
const multer = require('multer');
const { extname } = require('path');
const storage = multer.diskStorage({
    destination: __dirname + '/uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + extname(file.originalname));
    }
})
const upload = multer({ storage });

baskom()
    .post('/upload', upload.single('file'), (req, res) => {
        console.log(req)
        if (!req.file) {
            res.code(400);
            return 'Failed to upload';
        }
        return 'Success Upload';
    })
    .listen(3000);