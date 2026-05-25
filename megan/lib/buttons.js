// Megan-Prime Buttons Handler - Updated with send method and channel promo
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');

class Buttons {
    constructor(sock, bot) {
        this.sock = sock;
        this.bot = bot;
        this.channelLink = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
        this.logoUrl = 'https://files.catbox.moe/0v8bkv.png';
    }

    async send(jid, options, quoted = null) {
        try {
            const buttonOptions = {
                title: options.title || 'Megan-Prime',
                text: options.text || 'Choose an option:',
                footer: options.footer || '© Megan-Prime',
                buttons: options.buttons || []
            };
            return await sendButtons(this.sock, jid, buttonOptions, { quoted });
        } catch (error) {
            console.error('Button error:', error);
            return null;
        }
    }

    async sendInteractive(jid, options, quoted = null) {
        try {
            return await sendInteractiveMessage(this.sock, jid, {
                text: options.text,
                footer: options.footer,
                interactiveButtons: options.buttons || []
            }, { quoted });
        } catch (error) {
            console.error('Interactive button error:', error);
            return null;
        }
    }

    async sendWithImage(jid, options, quoted = null) {
        try {
            const imageBuffer = await this.getImageBuffer(this.logoUrl);
            const buttonOptions = {
                title: options.title || 'Megan-Prime',
                text: options.text || 'Choose an option:',
                footer: options.footer || '© Megan-Prime',
                buttons: options.buttons || []
            };
            return await sendButtons(this.sock, jid, buttonOptions, { quoted, image: imageBuffer });
        } catch (error) {
            console.error('Image button error:', error);
            return await this.send(jid, options, quoted);
        }
    }

    async getImageBuffer(url) {
        try {
            const axios = require('axios');
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
            return Buffer.from(response.data);
        } catch (error) {
            return null;
        }
    }

    async sendStartup(jid, bot) {
        const commandCount = bot.commands.size;
        const mode = await bot.db?.getSetting('mode', 'public') || 'public';
        const sessionData = process.env.SESSION || '';
        const buttons = [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Join Channel',
                    url: this.channelLink
                })
            }
        ];
        if (sessionData) {
            buttons.unshift({
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copy Session',
                    copy_code: sessionData
                })
            });
        }
        const text = `✅ *${bot.config.BOT_NAME} CONNECTED*\n\n` +
                     `📱 *Bot:* ${bot.config.BOT_NAME}\n` +
                     `👑 *Owner:* ${bot.config.OWNER_NAME}\n` +
                     `📞 *Number:* ${bot.config.OWNER_NUMBER}\n` +
                     `🔧 *Prefix:* ${bot.config.PREFIX}\n` +
                     `📚 *Commands:* ${commandCount}\n` +
                     `⚙️ *Mode:* ${mode}\n\n` +
                     `> Megan-Prime | TrackerWanga`;
        return await this.sendWithImage(jid, {
            title: '✅ Megan-Prime ONLINE',
            text: text,
            footer: 'Bot is ready!',
            buttons: buttons
        });
    }

    async sendWelcome(jid, sender, quoted = null) {
        const senderNumber = sender.split('@')[0];
        const prefix = this.bot.config.PREFIX;
        return await this.sendInteractive(jid, {
            text: `👋 Hello @${senderNumber}!\n\nI'm here to help. Use the menu below or type ${prefix}menu.`,
            footer: 'Choose an option:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Menu',
                        id: 'show_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendMenu(jid, sender, isOwner, quoted = null) {
        const senderNumber = sender.split('@')[0];
        const prefix = this.bot.config.PREFIX;
        const buttons = [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🤖 AI Chat',
                    id: 'menu_ai'
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '⬇️ Download',
                    id: 'menu_download'
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '👥 Group',
                    id: 'menu_group'
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🛠️ Tools',
                    id: 'menu_tools'
                })
            }
        ];
        if (isOwner) {
            buttons.push({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '👑 Owner',
                    id: 'menu_owner'
                })
            });
        }
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '📢 Channel',
                url: this.channelLink
            })
        });
        return await this.sendInteractive(jid, {
            text: `Welcome @${senderNumber}!\n\n• Prefix: ${prefix}\n• Commands: ${this.bot.commands.size}\n• Status: ${isOwner ? '👑 Owner' : '👤 User'}`,
            footer: 'Select a category:',
            buttons: buttons
        }, quoted);
    }

    async sendAIMenu(jid, prefix, quoted = null) {
        return await this.sendInteractive(jid, {
            text: `🤖 *AI COMMANDS*\n\n• ${prefix}megan - Megan AI\n• ${prefix}gemini - Gemini\n• ${prefix}mistral - Mistral\n• ${prefix}deepseek - DeepSeek\n• ${prefix}duckai - DuckAI\n• ${prefix}codellama - Coding\n• ${prefix}teacher - Learning`,
            footer: 'Choose an option:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '◀️ Back',
                        id: 'back_to_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendDownloadMenu(jid, prefix, quoted = null) {
        return await this.sendInteractive(jid, {
            text: `⬇️ *DOWNLOAD COMMANDS*\n\n• ${prefix}play - Audio\n• ${prefix}ytmp3 - YouTube MP3\n• ${prefix}ytmp4 - YouTube Video\n• ${prefix}ig - Instagram\n• ${prefix}fb - Facebook\n• ${prefix}tt - TikTok`,
            footer: 'Choose an option:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '◀️ Back',
                        id: 'back_to_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendGroupMenu(jid, prefix, quoted = null) {
        return await this.sendInteractive(jid, {
            text: `👥 *GROUP COMMANDS*\n\n• ${prefix}add - Add members\n• ${prefix}remove - Remove members\n• ${prefix}promote - Make admin\n• ${prefix}demote - Remove admin\n• ${prefix}tagall - Tag everyone\n• ${prefix}invite - Get link\n• ${prefix}lock - Lock messages`,
            footer: 'Choose an option:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '◀️ Back',
                        id: 'back_to_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendToolsMenu(jid, prefix, quoted = null) {
        return await this.sendInteractive(jid, {
            text: `🛠️ *TOOLS*\n\n• ${prefix}sticker - Make sticker\n• ${prefix}toimage - Sticker to image\n• ${prefix}tts - Text to speech\n• ${prefix}translate - Translate\n• ${prefix}screenshot - Website SS\n• ${prefix}binary - Text to binary\n• ${prefix}hash - Generate hashes`,
            footer: 'Choose an option:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '◀️ Back',
                        id: 'back_to_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendOwnerMenu(jid, prefix, quoted = null) {
        return await this.sendInteractive(jid, {
            text: `👑 *OWNER COMMANDS*\n\n• ${prefix}mode - Change mode\n• ${prefix}setprefix - Change prefix\n• ${prefix}setbotname - Change name\n• ${prefix}setbotpic - Set profile pic\n• ${prefix}block - Block user\n• ${prefix}unblock - Unblock\n• ${prefix}listblocked - Blocked list`,
            footer: 'Owner only:',
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '◀️ Back',
                        id: 'back_to_menu'
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Channel',
                        url: this.channelLink
                    })
                }
            ]
        }, quoted);
    }

    async sendChannelPromo(jid, sender, quoted = null) {
        const senderNumber = sender.split('@')[0];
        return await this.sendInteractive(jid, {
            text: `Hey @${senderNumber}! 👋\n\nJoin our official channel for updates and new features!`,
            footer: 'Click below:',
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Join Now',
                        url: this.channelLink
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: '✅ Done',
                        id: 'channel_joined'
                    })
                }
            ]
        }, quoted);
    }
}

module.exports = Buttons;
