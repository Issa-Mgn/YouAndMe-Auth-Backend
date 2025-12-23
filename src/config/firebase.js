const admin = require('firebase-admin');
const { config } = require('./env');

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: config.firebase.projectId,
                clientEmail: config.firebase.clientEmail,
                privateKey: config.firebase.privateKey,
            }),
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const firebaseAuth = admin.auth();

module.exports = { firebaseAuth };
