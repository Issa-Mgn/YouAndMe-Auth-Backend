const { UserService } = require('../services/userService');
const { imagekit } = require('../config/imagekit');

const userService = new UserService();

const uploadAvatar = async (req, res) => {
    try {
        const { uid } = req.user;
        let fileBuffer;
        let fileName;

        if (req.file) {
            // Multipart
            fileBuffer = req.file.buffer;
            fileName = req.file.originalname;
        } else if (req.body.image_base64) {
            // Base64
            fileBuffer = Buffer.from(req.body.image_base64, 'base64');
            fileName = `avatar_${uid}_${Date.now()}.jpg`;
        } else {
            res.status(400).json({ error: 'No image provided' });
            return;
        }

        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: '/avatars',
        });

        // Update User in DB
        const updatedUser = await userService.updateAvatar(uid, uploadResponse.url);
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const getProfileStats = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) {
            return res.status(200).json({ moments: 0, days: 0, hearts: 0, videos: 0 });
        }
        const stats = await userService.getStats(uid, user.couple_id);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateToken = async (req, res) => {
    try {
        const { uid } = req.user;
        const { token } = req.body;
        await userService.updateFcmToken(uid, token);
        res.status(200).json({ message: 'Token updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { uploadAvatar, getProfileStats, updateToken };
