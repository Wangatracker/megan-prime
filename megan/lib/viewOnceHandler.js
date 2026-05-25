// Megan-Prime View Once Handler - Downloads ALL incoming media immediately
const { downloadMediaMessage } = require('gifted-baileys');
const fs = require('fs-extra');
const path = require('path');
const Uploader = require('./upload');
const { resolveRealJid } = require('./lidResolver');

async function handleViewOnce(sock, message, db, ownerJid) {
    try {
        if (!message?.message) return;
        if (message.key?.fromMe) return;

        const autoViewOnce = await db.getSetting('autoviewonce', 'on');
        if (autoViewOnce !== 'on') return;

        const msgContent = message.message;
        const from = (message.key?.participant || message.key?.remoteJid || '').split('@')[0];

        // Check for ANY media type
        let mediaType = null;
        let mediaData = null;

        // Check all possible message types
        if (msgContent.imageMessage) { mediaType = 'imageMessage'; mediaData = msgContent.imageMessage; }
        else if (msgContent.videoMessage) { mediaType = 'videoMessage'; mediaData = msgContent.videoMessage; }
        else if (msgContent.audioMessage) { mediaType = 'audioMessage'; mediaData = msgContent.audioMessage; }
        else if (msgContent.viewOnceMessage) {
            const inner = msgContent.viewOnceMessage.message;
            if (inner?.imageMessage) { mediaType = 'imageMessage'; mediaData = inner.imageMessage; }
            else if (inner?.videoMessage) { mediaType = 'videoMessage'; mediaData = inner.videoMessage; }
            else if (inner?.audioMessage) { mediaType = 'audioMessage'; mediaData = inner.audioMessage; }
        }
        else if (msgContent.viewOnceMessageV2) {
            const inner = msgContent.viewOnceMessageV2.message;
            if (inner?.imageMessage) { mediaType = 'imageMessage'; mediaData = inner.imageMessage; }
            else if (inner?.videoMessage) { mediaType = 'videoMessage'; mediaData = inner.videoMessage; }
            else if (inner?.audioMessage) { mediaType = 'audioMessage'; mediaData = inner.audioMessage; }
        }
        else if (msgContent.viewOnceMessageV2Extension) {
            const inner = msgContent.viewOnceMessageV2Extension.message;
            if (inner?.imageMessage) { mediaType = 'imageMessage'; mediaData = inner.imageMessage; }
            else if (inner?.videoMessage) { mediaType = 'videoMessage'; mediaData = inner.videoMessage; }
            else if (inner?.audioMessage) { mediaType = 'audioMessage'; mediaData = inner.audioMessage; }
        }

        if (!mediaType || !mediaData) return;

        console.log(`\n👁️ [AUTO-CAPTURE] ${mediaType} from ${from}`);
        
        // Check if media has CDN URL (view-once might not have url directly)
        const hasUrl = mediaData.url || mediaData.directPath;
        const isViewOnce = !!mediaData.viewOnce || 
                          !!msgContent.viewOnceMessage || 
                          !!msgContent.viewOnceMessageV2 || 
                          !!msgContent.viewOnceMessageV2Extension;
        
        console.log(`👁️ [AUTO-CAPTURE] Has URL: ${!!hasUrl}, Is ViewOnce: ${isViewOnce}`);
        console.log(`👁️ [AUTO-CAPTURE] Available keys: ${Object.keys(mediaData).join(', ')}`);

        // Try to download the media
        let buffer = null;
        
        // Method 1: Download using the message directly
        try {
            buffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
                { logger: console, reuploadRequest: true }
            );
            if (buffer) console.log(`👁️ [AUTO-CAPTURE] Method 1 success: ${buffer.length} bytes`);
        } catch (e1) {
            console.log(`👁️ [AUTO-CAPTURE] Method 1 failed: ${e1.message}`);
        }

        // Method 2: Try with just the media content
        if (!buffer) {
            try {
                buffer = await downloadMediaMessage(
                    { message: { [mediaType]: mediaData } },
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: true }
                );
                if (buffer) console.log(`👁️ [AUTO-CAPTURE] Method 2 success: ${buffer.length} bytes`);
            } catch (e2) {
                console.log(`👁️ [AUTO-CAPTURE] Method 2 failed: ${e2.message}`);
            }
        }

        if (!buffer) {
            console.log(`👁️ [AUTO-CAPTURE] ❌ All download methods failed`);
            return;
        }

        // Save to messageStore for later use
        if (message.key?.id) {
            // Store buffer reference in message store
            const msgEntry = {
                messageId: message.key.id,
                chatJid: message.key.remoteJid,
                senderJid: message.key.participant || message.key.remoteJid,
                mediaBuffer: buffer.toString('base64'),
                mediaType: mediaType,
                mediaMimeType: mediaData.mimetype,
                captured: true,
                timestamp: Date.now()
            };
            
            try {
                const tempDir = path.join(process.cwd(), 'media_store');
                await fs.ensureDir(tempDir);
                const mediaFile = path.join(tempDir, `${message.key.id}.${mediaType.includes('image') ? 'jpg' : mediaType.includes('video') ? 'mp4' : 'mp3'}`);
                await fs.writeFile(mediaFile, buffer);
                console.log(`👁️ [AUTO-CAPTURE] Saved to: ${mediaFile}`);
            } catch(e) {
                console.log(`👁️ [AUTO-CAPTURE] Save error: ${e.message}`);
            }
        }

        // Upload and send to owner
        const sender = message.key.participant || message.key.remoteJid;
        const resolvedSender = await resolveRealJid(sock, sender);
        const senderNum = resolvedSender.split('@')[0].split(':')[0];
        const botName = await db.getSetting('bot_name', 'Megan-Prime');

        let ext = 'bin';
        if (mediaType.includes('image')) ext = 'jpg';
        else if (mediaType.includes('video')) ext = 'mp4';
        else if (mediaType.includes('audio')) ext = 'mp3';

        const filename = `autocapture_${Date.now()}.${ext}`;
        const { url, success } = await Uploader.uploadAuto(buffer, filename);

        if (success && url && ownerJid) {
            const caption = `👁️ *AUTO CAPTURED*\n\n` +
                           `📤 *From:* @${senderNum}\n` +
                           `📎 *Type:* ${mediaType}\n` +
                           `${mediaData.caption ? `📝 *Caption:* ${mediaData.caption}\n` : ''}` +
                           `🔐 *ViewOnce:* ${isViewOnce ? 'Yes' : 'No'}\n` +
                           `🔗 *Link:* ${url}\n` +
                           `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
                           `> _Captured by ${botName}_`;

            const mime = mediaData.mimetype || "";
            if (mediaType.includes('image')) {
                await sock.sendMessage(ownerJid, { image: buffer, caption, mimetype: mime, mentions: [`${senderNum}@s.whatsapp.net`] });
            } else if (mediaType.includes('video')) {
                await sock.sendMessage(ownerJid, { video: buffer, caption, mimetype: mime, mentions: [`${senderNum}@s.whatsapp.net`] });
            } else if (mediaType.includes('audio')) {
                await sock.sendMessage(ownerJid, { audio: buffer, ptt: true, mimetype: mime || "audio/mp4", caption, mentions: [`${senderNum}@s.whatsapp.net`] });
            }
            console.log(`👁️ [AUTO-CAPTURE] ✅ Sent to owner!`);
        }

    } catch (error) {
        console.error('👁️ [AUTO-CAPTURE] ❌ Error:', error.message);
    }
}

module.exports = { handleViewOnce };
