const { supabase } = require('../config/supabase');
const { cloudinary } = require('../config/cloudinary');
const { NotificationService } = require('./notificationService');

class PlaylistService {
    async addSong(userId, coupleId, partnerId, title, artist, file) {
        // Upload to Cloudinary
        // Note: For audio, we use resource_type: 'video' (which includes audio) or 'auto'
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: `couples/${coupleId}/playlist`,
                },
                async (error, result) => {
                    if (error) return reject(error);

                    try {
                        const { data, error: dbError } = await supabase
                            .from('playlist')
                            .insert({
                                couple_id: coupleId,
                                user_id: userId,
                                song_url: result.secure_url,
                                title,
                                artist,
                            })
                            .select()
                            .single();

                        if (dbError) throw dbError;

                        // Notify Partner
                        await NotificationService.notifyPartner(partnerId, 'Nouvelle chanson 🎵', `Votre partenaire a ajouté "${title}" à votre playlist.`);

                        resolve(data);
                    } catch (err) {
                        reject(err);
                    }
                }
            );
            stream.end(file.buffer);
        });
    }

    async getPlaylist(coupleId) {
        const { data, error } = await supabase
            .from('playlist')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}

module.exports = { PlaylistService: new PlaylistService() };
