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

module.exports = { uploadAvatar };
