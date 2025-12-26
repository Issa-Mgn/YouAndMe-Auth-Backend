const { SouvenirService } = require('../services/souvenirService');
const { AgendaService } = require('../services/agendaService');
const { PlaylistService } = require('../services/playlistService');
const { UserService } = require('../services/userService');

const userService = new UserService();

// SOUVENIRS
const addSouvenir = async (req, res) => {
    try {
        const { uid } = req.user;
        const { mediaType } = req.body;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        const partnerId = user.couple.user1_id === uid ? user.couple.user2_id : user.couple.user1_id;

        const souvenir = await SouvenirService.addSouvenir(uid, user.couple_id, partnerId, req.file, mediaType);
        res.status(201).json(souvenir);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSouvenirs = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(200).json([]);

        const souvenirs = await SouvenirService.getSouvenirs(user.couple_id);
        res.status(200).json(souvenirs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// AGENDA
const addEvent = async (req, res) => {
    try {
        const { uid } = req.user;
        const { title, date, category } = req.body;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        const partnerId = user.couple.user1_id === uid ? user.couple.user2_id : user.couple.user1_id;

        const event = await AgendaService.addEvent(uid, user.couple_id, partnerId, title, date, category);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getEvents = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(200).json([]);

        const events = await AgendaService.getEvents(user.couple_id);
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PLAYLIST
const addSong = async (req, res) => {
    try {
        const { uid } = req.user;
        const { title, artist } = req.body;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        const partnerId = user.couple.user1_id === uid ? user.couple.user2_id : user.couple.user1_id;

        const song = await PlaylistService.addSong(uid, user.couple_id, partnerId, title, artist, req.file);
        res.status(201).json(song);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPlaylist = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(200).json([]);

        const songs = await PlaylistService.getPlaylist(user.couple_id);
        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addSouvenir, getSouvenirs,
    addEvent, getEvents,
    addSong, getPlaylist
};
