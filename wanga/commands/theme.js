// Megan-Prime Theme Commands - Newsletter Style Toggle
const config = require('../../megan/config');
const commands = [];

// THEME TOGGLE
commands.push({
    name: 'theme',
    description: 'Set message theme style (newsletter/normal) - Owner Only',
    aliases: ['settheme', 'messagestyle'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply('❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga');
        }

        const themes = {
            'newsletter': '📰 Newsletter style - Messages appear as forwarded from channel with thumbnail',
            'normal': '📝 Normal style - Plain text messages',
            'newsletter-simple': '📰 Simple Newsletter - Clean newsletter style',
            'buttons': '🔘 Button style - Messages with interactive buttons'
        };

        if (args.length === 0) {
            const current = await bot.db.getSetting('theme', 'normal');
            let themeList = `🎨 *THEME SETTINGS*\n\nCurrent: *${current}*\n\n*Available Themes:*\n`;
            for (const [name, desc] of Object.entries(themes)) {
                themeList += `• ${name} - ${desc}\n`;
            }
            themeList += `\n*Usage:* ${config.PREFIX}theme <name>\n\n> Megan-Prime | TrackerWanga`;
            await react('🎨');
            return reply(themeList);
        }

        const theme = args[0].toLowerCase();
        if (!themes[theme]) {
            await react('❌');
            return reply(`❌ Invalid theme. Use: ${Object.keys(themes).join(', ')}\n\n> Megan-Prime | TrackerWanga`);
        }

        await bot.db.setSetting('theme', theme);
        await react('✅');
        await reply(`✅ *Theme Updated*\n\nStyle set to: *${theme}*\n${themes[theme]}\n\n> Megan-Prime | TrackerWanga`);
    }
});

// NEWSLETTER INFO
commands.push({
    name: 'newsletter',
    description: 'Show newsletter/channel information',
    aliases: ['channel', 'nl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const { NEWSLETTER_JID, NEWSLETTER_URL } = require('../../megan/lib/newsletterContext');
        
        const info = `📰 *NEWSLETTER / CHANNEL*\n\n` +
            `🆔 *JID:* ${NEWSLETTER_JID}\n` +
            `🔗 *URL:* ${NEWSLETTER_URL}\n\n` +
            `*Theme:* ${await bot.db.getSetting('theme', 'normal')}\n\n` +
            `Change style: ${config.PREFIX}theme <name>\n\n` +
            `> Megan-Prime | TrackerWanga`;
        
        await react('📰');
        await reply(info);
    }
});

// BUTTONS TOGGLE
commands.push({
    name: 'buttons',
    description: 'Toggle button messages (on/off) - Owner Only',
    aliases: ['btn', 'buttonmode'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply('❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga');
        }

        if (args.length === 0) {
            const current = await bot.db.getSetting('buttons_enabled', 'on');
            await react('🔘');
            return reply(`🔘 *BUTTONS*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n*Usage:* ${config.PREFIX}buttons on/off\n\n> Megan-Prime | TrackerWanga`);
        }

        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) {
            await react('❌');
            return reply('❌ Use: on or off\n\n> Megan-Prime | TrackerWanga');
        }

        await bot.db.setSetting('buttons_enabled', option);
        await react('✅');
        await reply(`✅ *Buttons ${option === 'on' ? 'enabled' : 'disabled'}*\n\n> Megan-Prime | TrackerWanga`);
    }
});

module.exports = { commands };
