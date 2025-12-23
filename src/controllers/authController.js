const { UserService } = require('../services/userService');

const userService = new UserService();

const syncUser = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { displayName } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await userService.syncUser(uid, email, displayName);
        res.status(200).json(user);
    } catch (error) {
        console.error('Sync User Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { syncUser };
