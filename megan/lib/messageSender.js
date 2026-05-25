// Megan-Prime Message Sender - Theme Support
const { createContext, createSimpleContext } = require('./newsletterContext');
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');
const config = require('../config');

class MessageSender {
    constructor(bot) {
        this.bot = bot;
        this.sock = bot.sock;
        this.db = bot.db;
    }

    async getTheme() {
        if (this.db) {
            return await this.db.getSetting('theme', 'normal');
        }
        return 'normal';
    }

    async getButtonsEnabled() {
        if (this.db) {
            return await this.db.getSetting('buttons_enabled', 'on');
        }
        return 'on';
    }

    async sendMessage(jid, text, options = {}) {
        const theme = await this.getTheme();
        const quoted = options.quoted || null;
        const userJid = options.userJid || jid;

        if (theme === 'newsletter') {
            const context = createContext(userJid, {
                title: options.title || config.BOT_NAME,
                body: options.body || text.substring(0, 100)
            });
            return await this.sock.sendMessage(jid, { text }, { ...context, quoted });
        } else if (theme === 'newsletter-simple') {
            const context = createSimpleContext(userJid, {
                title: options.title || config.BOT_NAME,
                body: options.body || text.substring(0, 100)
            });
            return await this.sock.sendMessage(jid, { text }, { ...context, quoted });
        } else {
            // Normal mode
            return await this.sock.sendMessage(jid, { text }, { quoted });
        }
    }

    async sendWithButtons(jid, text, buttons, options = {}) {
        const buttonsEnabled = await this.getButtonsEnabled();
        const theme = await this.getTheme();
        const quoted = options.quoted || null;
        const userJid = options.userJid || jid;

        if (buttonsEnabled === 'off' || !buttons || buttons.length === 0) {
            return await this.sendMessage(jid, text, options);
        }

        const buttonOptions = {
            title: options.title || config.BOT_NAME,
            text: text,
            footer: options.footer || '> Megan-Prime | TrackerWanga',
            buttons: buttons
        };

        try {
            if (theme === 'newsletter' || theme === 'newsletter-simple') {
                // Newsletter style with buttons
                return await sendButtons(this.sock, jid, buttonOptions, { quoted });
            } else {
                // Normal interactive buttons
                return await sendInteractiveMessage(this.sock, jid, {
                    text: text,
                    footer: options.footer || '> Megan-Prime | TrackerWanga',
                    interactiveButtons: buttons
                }, { quoted });
            }
        } catch (error) {
            console.log('⚠️ Button send failed, falling back to text:', error.message);
            return await this.sendMessage(jid, text, options);
        }
    }

    async sendAwayMessage(jid, text, quoted = null) {
        const userJid = jid;
        const buttonsEnabled = await this.getButtonsEnabled();
        const prefix = config.PREFIX;

        if (buttonsEnabled === 'on') {
            const buttons = [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Menu',
                        id: 'show_menu'
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'ℹ️ Help',
                        id: 'show_help'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37'
                    })
                }
            ];

            try {
                return await sendInteractiveMessage(this.sock, jid, {
                    text: text,
                    footer: '> Megan-Prime | TrackerWanga',
                    interactiveButtons: buttons
                }, { quoted });
            } catch (error) {
                console.log('⚠️ Away buttons failed, using text');
            }
        }

        return await this.sendMessage(jid, text, { quoted });
    }
}

module.exports = MessageSender;
