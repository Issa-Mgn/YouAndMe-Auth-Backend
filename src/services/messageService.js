const { supabase } = require('../config/supabase');
const { imagekit } = require('../config/imagekit');
const { cloudinary } = require('../config/cloudinary');
const { NotificationService } = require('./notificationService');

class MessageService {
    async sendMessage(userId, coupleId, partnerId, content, type = 'text', file = null, replyToId = null, duration = null) {
        let mediaUrl = null;
        let fileSize = null;
        let mimeType = null;

        if (file) {
            // Capture file size and mime type BEFORE upload
            fileSize = file.size || file.buffer?.length || null;
            mimeType = file.mimetype || null;

            if (type === 'image' || type === 'video') {
                const uploadResponse = await imagekit.upload({
                    file: file.buffer,
                    fileName: `${type}_${Date.now()}`,
                    folder: `/couples/${coupleId}/messages`,
                });
                mediaUrl = uploadResponse.url;
                // ImageKit may also provide file size
                fileSize = fileSize || uploadResponse.size;
            } else {
                // Audio or Document -> Cloudinary
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto', folder: `couples/${coupleId}/messages` },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                mediaUrl = uploadResult.secure_url;
                // Cloudinary provides bytes
                fileSize = fileSize || uploadResult.bytes;
            }
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                couple_id: coupleId,
                sender_id: userId,
                content,
                type,
                media_url: mediaUrl,
                file_size: fileSize,
                mime_type: mimeType,
                reply_to_id: replyToId,
                duration: duration,
            })
            .select()
            .single();

        if (error) throw error;

        // Emit via Socket.io
        const app = require('../app');
        const io = app.get('io');
        if (io) {
            io.to(coupleId).emit('new_message', data);
        }

        // Notify Partner via Push
        const notificationBody = type === 'text' ? content : `Un nouveau ${type} a été envoyé.`;
        await NotificationService.notifyPartner(partnerId, 'Nouveau message 💌', notificationBody, {
            type: 'message',
            message_id: data.id
        });

        return data;
    }

    async getChatHistory(coupleId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    async addReaction(messageId, reaction) {
        const { data, error } = await supabase
            .from('messages')
            .update({ reaction })
            .eq('id', messageId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = { MessageService: new MessageService() };
