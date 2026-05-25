// Megan-Prime Away Mode Commands
const config = require('../../megan/config');

const commands = [];

// AWAY MODE TOGGLE
commands.push({
    name: 'awaymode',
    description: 'Toggle away mode (on/off) - Owner Only',
    aliases: ['away'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply('❌ *Owner Only Command*\n\nOnly the bot owner can toggle away mode.\n\n> Megan-Prime | TrackerWanga');
        }

        if (args.length === 0) {
            const current = await bot.db.getSetting('awaymode', 'off');
            const status = current === 'on' ? '🟣 ON' : '⚫ OFF';
            await react('ℹ️');
            return reply(`🟣 *AWAY MODE*\n\nCurrent: ${status}\n\n*Usage:* ${config.PREFIX}awaymode on/off\n\nWhen ON, the bot will respond with your away message in DMs.\nDoes NOT activate in groups or for owner.\n\n> Megan-Prime | TrackerWanga`);
        }

        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) {
            await react('❌');
            return reply(`❌ Invalid option. Use: on or off\n\n> Megan-Prime | TrackerWanga`);
        }

        await bot.db.setSetting('awaymode', option);
        await react(option === 'on' ? '🟣' : '⚫');

        const responseText = option === 'on' 
            ? `🟣 *AWAY MODE ACTIVATED*\n\nThe bot will now respond to DMs with your away message.\n\n⚠️ Away mode does NOT activate in:\n• Groups\n• Messages from owner\n\n> Megan-Prime | TrackerWanga`
            : `⚫ *AWAY MODE DEACTIVATED*\n\nThe bot is now in normal mode.\n\n> Megan-Prime | TrackerWanga`;

        await reply(responseText);
        
        console.log(`🟣 [AWAY] Away mode ${option === 'on' ? 'activated' : 'deactivated'} by owner`);
    }
});

// SET AWAY MESSAGE
commands.push({
    name: 'setawaymessage',
    description: 'Set the away mode auto-reply message - Owner Only',
    aliases: ['setaway', 'awaymessage'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply('❌ *Owner Only Command*\n\nOnly the bot owner can set the away message.\n\n> Megan-Prime | TrackerWanga');
        }

        if (args.length === 0) {
            const current = await bot.db.getSetting('awaymessage', config.AWAY_MODE.MESSAGE);
            await react('ℹ️');
            return reply(`🟣 *AWAY MESSAGE*\n\nCurrent: ${current}\n\n*Usage:* ${config.PREFIX}setawaymessage <your message>\n*Example:* ${config.PREFIX}setawaymessage I'm currently unavailable. I'll respond when I'm back.\n\n> Megan-Prime | TrackerWanga`);
        }

        const message = args.join(' ');
        await bot.db.setSetting('awaymessage', message);
        await react('✅');

        await reply(`✅ *AWAY MESSAGE UPDATED*\n\nNew message:\n${message}\n\n> Megan-Prime | TrackerWanga`);
        
        console.log(`🟣 [AWAY] Away message updated: "${message}"`);
    }
});

// CHECK AWAY STATUS
commands.push({
    name: 'awaystatus',
    description: 'Check current away mode status',
    aliases: ['awayinfo', 'checkaway'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const awayMode = await bot.db.getSetting('awaymode', 'off');
        const awayMessage = await bot.db.getSetting('awaymessage', config.AWAY_MODE.MESSAGE);
        
        const status = awayMode === 'on' ? '🟣 ACTIVE' : '⚫ INACTIVE';
        
        const info = `🟣 *AWAY MODE STATUS*\n\n` +
                    `Status: ${status}\n` +
                    `Message: ${awayMessage}\n\n` +
                    `Works in: Direct Messages only\n` +
                    `Not active in: Groups, Owner messages\n\n` +
                    `> Megan-Prime | TrackerWanga`;

        await react('🟣');
        await reply(info);
    }
});

module.exports = { commands };
