// Megan-Prime Newsletter Context Helper
const config = require('../config');

const NEWSLETTER_JID = config.NEWSLETTER_JID || '120363404978384902@newsletter';
const NEWSLETTER_URL = config.NEWSLETTER_URL || 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const BOT_PIC = config.BOT_PIC || 'https://files.catbox.moe/0v8bkv.png';

const createContext = (userJid, options = {}) => ({
    contextInfo: {
        mentionedJid: [userJid],
        forwardingScore: 5,
        isForwarded: true,
        businessMessageForwardInfo: {
            businessOwnerJid: NEWSLETTER_JID,
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            newsletterName: config.BOT_NAME,
            serverMessageId: Math.floor(100000 + Math.random() * 900000)
        },
        externalAdReply: {
            title: options.title || config.BOT_NAME,
            body: options.body || "Powered by Megan-Prime | TrackerWanga",
            thumbnailUrl: options.thumbnailUrl || BOT_PIC,
            mediaType: 1,
            mediaUrl: options.mediaUrl || BOT_PIC,
            sourceUrl: options.sourceUrl || NEWSLETTER_URL,
            showAdAttribution: true,
            renderLargerThumbnail: false
        }
    }
});

const createSimpleContext = (userJid, options = {}) => ({
    contextInfo: {
        mentionedJid: [userJid],
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            newsletterName: config.BOT_NAME,
            serverMessageId: Math.floor(100000 + Math.random() * 900000)
        },
        externalAdReply: {
            title: options.title || config.BOT_NAME,
            body: options.body || "Powered by Megan-Prime | TrackerWanga",
            thumbnailUrl: BOT_PIC,
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true
        }
    }
});

module.exports = { createContext, createSimpleContext, NEWSLETTER_JID, NEWSLETTER_URL, BOT_PIC };
