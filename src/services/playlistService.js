const { supabase } = require('../config/supabase');
const { cloudinary } = require('../config/cloudinary');
const { NotificationService } = require('./notificationService');

class PlaylistService {
    async addSong(userId, coupleId, partnerId, title, artist, songFile, coverFile) {
        console.log('PlaylistService.addSong - songFile:', songFile ? 'Present' : 'Missing');
        console.log('PlaylistService.addSong - coverFile:', coverFile ? 'Present' : 'Missing');
        
        // Upload song to Cloudinary
        return new Promise((resolve, reject) => {
            const songStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: `couples/${coupleId}/playlist`,
                },
                async (error, songResult) => {
                    if (error) return reject(error);

                    try {
                        let coverUrl = null;

                        // Upload cover if provided
                        if (coverFile) {
                            const coverUpload = await new Promise((resolveCover, rejectCover) => {
                                const coverStream = cloudinary.uploader.upload_stream(
                                    {
                                        resource_type: 'image',
                                        folder: `couples/${coupleId}/playlist/covers`,
                                    },
                                    (coverError, coverResult) => {
                                        if (coverError) return rejectCover(coverError);
                                        resolveCover(coverResult);
                                    }
                                );
                                coverStream.end(coverFile.buffer);
                            });
                            coverUrl = coverUpload.secure_url;
                        }

                        const { data, error: dbError } = await supabase
                            .from('playlist')
                            .insert({
                                couple_id: coupleId,
                                user_id: userId,
                                song_url: songResult.secure_url,
                                title,
                                artist,
                                cover: coverUrl,
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
            songStream.end(songFile.buffer);
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

    async deleteSong(songId, coupleId) {
        // Verify ownership
        const { data: song, error: fetchError } = await supabase
            .from('playlist')
            .select('*')
            .eq('id', songId)
            .eq('couple_id', coupleId)
            .single();

        if (fetchError) throw fetchError;
        if (!song) throw new Error('Song not found');

        // Delete from database
        const { error: deleteError } = await supabase
            .from('playlist')
            .delete()
            .eq('id', songId);

        if (deleteError) throw deleteError;

        // TODO: Delete from Cloudinary if needed
        return { message: 'Song deleted successfully' };
    }
}

module.exports = { PlaylistService: new PlaylistService() };
