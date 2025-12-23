const dotenv = require('dotenv');

dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal \n with actual newlines if present in string
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    imagekit: {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    },
};

module.exports = { config };
