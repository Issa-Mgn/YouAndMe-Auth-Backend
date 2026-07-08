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

const deleteSouvenir = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        await SouvenirService.deleteSouvenir(id, user.couple_id);
        res.status(200).json({ message: 'Souvenir deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const likeSouvenir = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        await SouvenirService.likeSouvenir(id, uid);
        res.status(200).json({ message: 'Souvenir liked' });
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

const deleteEvent = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        await AgendaService.deleteEvent(id, user.couple_id);
        res.status(200).json({ message: 'Event deleted' });
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

        const songFile = req.files?.song ? req.files.song[0] : null;
        const coverFile = req.files?.cover ? req.files.cover[0] : null;

        const song = await PlaylistService.addSong(uid, user.couple_id, partnerId, title, artist, songFile, coverFile);
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

const deleteSong = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const user = await userService.getUserByUid(uid);

        if (!user.couple_id) return res.status(400).json({ error: 'Not paired' });

        await PlaylistService.deleteSong(id, user.couple_id);
        res.status(200).json({ message: 'Song deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addSouvenir, getSouvenirs, deleteSouvenir, likeSouvenir,
    addEvent, getEvents, deleteEvent,
    addSong, getPlaylist, deleteSong
};
