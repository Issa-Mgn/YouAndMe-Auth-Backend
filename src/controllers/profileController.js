const { UserService } = require('../services/userService');
const { supabase } = require('../config/supabase');
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
};

const updateProfile = async (req, res) => {
    try {
        const { uid } = req.user;
        const { display_name, mood } = req.body;

        const updateData = {};
        if (display_name) updateData.display_name = display_name;
        if (mood) updateData.mood = mood;

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: 'Nothing to update' });
            return;
        }

        // Mettre à jour les champs fournis
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', uid)
            .select()
            .single();

        if (updateError) throw updateError;

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const updateMood = async (req, res) => {
    try {
        const { uid } = req.user;
        const { mood } = req.body;

        if (!mood) {
            res.status(400).json({ error: 'mood is required' });
            return;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ mood })
            .eq('id', uid)
            .select()
            .single();

        if (updateError) throw updateError;

        res.status(200).json({ mood: updatedUser.mood });
    } catch (error) {
        console.error('Update Mood Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { uploadAvatar, getProfileStats, updateToken, updateProfile, updateMood };
