// Megan-Prime Configuration

require('dotenv').config();

const config = {
    BOT_NAME: process.env.BOT_NAME || 'Megan-Prime',
    OWNER_NAME: process.env.OWNER_NAME || 'TrackerWanga',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '254119387715',
    PREFIX: process.env.PREFIX || '.',
    MODE: process.env.MODE || 'public',
    FOOTER: process.env.FOOTER || '© Megan-Prime',
    TIMEZONE: process.env.TIMEZONE || 'Africa/Nairobi',

    DATABASE: {
        ENABLED: process.env.DATABASE_ENABLED !== 'false',
        STORAGE: process.env.DATABASE_PATH || './database.sqlite'
    },

    CACHE: {
        MESSAGES: true,
        STORE_MESSAGES: true,
        MAX_STORE: 200,
        CLEANUP_INTERVAL: 30000
    },

    LOG_LEVEL: 'silent',
    BROWSER: ["Megan-Prime", "Chrome", "120.0.0.0"],

    FEATURES: {
        ANTI_DELETE: process.env.ANTI_DELETE || 'on',
        ANTI_EDIT: process.env.ANTI_EDIT || 'on',
        ANTI_CALL: process.env.ANTI_CALL || 'off',
        AUTO_READ: process.env.AUTO_READ || 'off',
        AUTO_REACT: process.env.AUTO_REACT || 'off',
        CHATBOT: process.env.CHATBOT || 'off'
    },

    STATUS: {
        AUTO_VIEW: process.env.AUTO_VIEW_STATUS === 'on',
        AUTO_REACT: process.env.AUTO_REACT_STATUS === 'on',
        AUTO_DOWNLOAD: process.env.AUTO_DOWNLOAD_STATUS === 'on',
        REACT_EMOJIS: process.env.STATUS_REACT_EMOJIS || '💛,❤️,💜,🤍,💙,👍,🔥'
    }
};

config.getOwnerJid = function() {
    return this.OWNER_NUMBER.includes('@') ?
        this.OWNER_NUMBER : `${this.OWNER_NUMBER}@s.whatsapp.net`;
};

module.exports = config;
