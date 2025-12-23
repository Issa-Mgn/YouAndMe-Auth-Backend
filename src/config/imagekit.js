const ImageKit = require('imagekit');
const { config } = require('./env');

const imagekit = new ImageKit({
    publicKey: config.imagekit.publicKey || '',
    privateKey: config.imagekit.privateKey || '',
    urlEndpoint: config.imagekit.urlEndpoint || '',
});

module.exports = { imagekit };
