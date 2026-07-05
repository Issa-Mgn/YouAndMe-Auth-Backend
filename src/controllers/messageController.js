const { MessageService } = require('../services/messageService');
const { UserService } = require('../services/userService');

const userService = new UserService();

const sendMessage = async (req, res) => {
    try {
        const { uid } = req.user;
        const { content, type, replyToId, duration } = req.body;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        const partnerId = user.couple.user1_id === uid ? user.couple.user2_id : user.couple.user1_id;

        const message = await MessageService.sendMessage(uid, user.couple_id, partnerId, content, type, req.file, replyToId, duration);
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(200).json([]);

        const history = await MessageService.getChatHistory(user.couple_id);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addReaction = async (req, res) => {
    try {
        const { reaction } = req.body;
        const { messageId } = req.params;
        const message = await MessageService.addReaction(messageId, reaction);
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { sendMessage, getChatHistory, addReaction };
