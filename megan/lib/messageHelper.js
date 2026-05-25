// Megan-Prime Message Helper - Complete Message Processing
const { downloadMediaMessage } = require('gifted-baileys');

class MessageHelper {
    static extractText(message) {
        if (!message) return '';
        
        if (message.conversation) return message.conversation;
        if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
        if (message.imageMessage?.caption) return message.imageMessage.caption;
        if (message.videoMessage?.caption) return message.videoMessage.caption;
        if (message.audioMessage?.caption) return message.audioMessage?.caption || '';
        if (message.documentMessage?.caption) return message.documentMessage.caption;
        
        return '';
    }

    static getMessageType(message) {
        if (!message) return 'text';
        
        if (message.imageMessage) {
            return message.imageMessage.viewOnce ? 'view_once_image' : 'image';
        }
        if (message.videoMessage) {
            return message.videoMessage.viewOnce ? 'view_once_video' : 'video';
        }
        if (message.audioMessage) {
            return message.audioMessage.viewOnce ? 'view_once_audio' : 'audio';
        }
        if (message.pttMessage) return 'voice_note';
        if (message.stickerMessage) return 'sticker';
        if (message.documentMessage) return 'document';
        if (message.locationMessage) return 'location';
        if (message.contactMessage) return 'contact';
        if (message.viewOnceMessage) return 'view_once';
        if (message.viewOnceMessageV2) return 'view_once_v2';
        if (message.viewOnceMessageV2Extension) return 'view_once_v2_ext';
        
        return 'text';
    }

    static extractLinks(text) {
        if (!text) return [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    static extractCode(text) {
        if (!text) return { hasCode: false, language: null, code: null };
        
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const match = codeBlockRegex.exec(text);
        
        if (match) {
            return {
                hasCode: true,
                language: match[1] || 'unknown',
                code: match[2].trim()
            };
        }
        
        return { hasCode: false, language: null, code: null };
    }

    static extractMentions(text) {
        if (!text) return [];
        const mentionRegex = /@(\d+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(`${match[1]}@s.whatsapp.net`);
        }
        return mentions;
    }

    static isCommand(text, prefix) {
        if (!text || typeof text !== 'string') return false;
        return text.startsWith(prefix);
    }

    static parseCommand(text, prefix) {
        if (!text || !text.startsWith(prefix)) return null;
        
        const withoutPrefix = text.slice(prefix.length).trim();
        const parts = withoutPrefix.split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        return { name, args, fullText: withoutPrefix };
    }

    static createReply(sock, jid, quotedMsg) {
        return async (text, options = {}) => {
            console.log(`📤 [OUTGOING] Reply to ${jid}: ${text.substring(0, 100)}...`);
            return await sock.sendMessage(jid, { text, ...options }, { quoted: quotedMsg });
        };
    }

    static createReact(sock, key) {
        return async (emoji) => {
            console.log(`😊 [OUTGOING] React to ${key.remoteJid}: ${emoji}`);
            return await sock.sendMessage(key.remoteJid, {
                react: { key, text: emoji }
            });
        };
    }

    static async downloadMedia(msg) {
        try {
            console.log('📥 [MEDIA] Downloading media...');
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
            console.log(`📥 [MEDIA] Downloaded ${buffer.length} bytes`);
            return buffer;
        } catch (error) {
            console.error('❌ [MEDIA] Download failed:', error.message);
            return null;
        }
    }

    static async extractMessageMetadata(msg, sock) {
        const metadata = {
            messageId: msg.key?.id || 'unknown',
            chatJid: msg.key?.remoteJid || 'unknown',
            senderJid: msg.key?.participant || msg.key?.remoteJid || 'unknown',
            textContent: MessageHelper.extractText(msg.message),
            messageType: MessageHelper.getMessageType(msg.message),
            hasLink: false,
            links: [],
            hasCode: false,
            codeLanguage: null,
            hasMention: false,
            mentionedJids: [],
            mediaCaption: null,
            mediaUrl: null,
            mediaMimeType: null,
            isViewOnce: false,
            isReply: false,
            repliedTo: null,
            timestamp: Date.now()
        };

        // Extract links
        if (metadata.textContent) {
            metadata.links = MessageHelper.extractLinks(metadata.textContent);
            metadata.hasLink = metadata.links.length > 0;
            
            const codeInfo = MessageHelper.extractCode(metadata.textContent);
            metadata.hasCode = codeInfo.hasCode;
            metadata.codeLanguage = codeInfo.language;
            
            metadata.mentionedJids = MessageHelper.extractMentions(metadata.textContent);
            metadata.hasMention = metadata.mentionedJids.length > 0;
        }

        // Check for media
        if (msg.message?.imageMessage) {
            metadata.mediaCaption = msg.message.imageMessage.caption;
            metadata.mediaMimeType = msg.message.imageMessage.mimetype;
            metadata.isViewOnce = !!msg.message.imageMessage.viewOnce;
        } else if (msg.message?.videoMessage) {
            metadata.mediaCaption = msg.message.videoMessage.caption;
            metadata.mediaMimeType = msg.message.videoMessage.mimetype;
            metadata.isViewOnce = !!msg.message.videoMessage.viewOnce;
        } else if (msg.message?.audioMessage) {
            metadata.mediaCaption = msg.message.audioMessage.caption;
            metadata.mediaMimeType = msg.message.audioMessage.mimetype;
            metadata.isViewOnce = !!msg.message.audioMessage.viewOnce;
        }

        // Check for reply
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (contextInfo?.stanzaId) {
            metadata.isReply = true;
            metadata.repliedTo = contextInfo.stanzaId;
        }

        console.log(`📋 [MESSAGE] Metadata extracted: ${metadata.messageType} from ${metadata.senderJid}`);
        return metadata;
    }
}

module.exports = MessageHelper;
