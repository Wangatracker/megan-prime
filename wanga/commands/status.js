// Megan-Prime Status Commands - Complete with both old and new style commands
const config = require('../../megan/config');
const timeUtils = require('../../megan/lib/timeUtils');
const commands = [];

// STATUSCHECK
commands.push({
    name: 'statuscheck',
    description: 'Check current status feature settings',
    aliases: ['sc', 'statuscfg'],
    async execute({ msg, from, sender, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) {
            isActuallyOwner = ownerManager.isOwner(sender);
        }
        const statusView = await bot.db.getSetting('status_auto_view', 'on');
        const statusReact = await bot.db.getSetting('status_auto_react', 'off');
        const statusDownload = await bot.db.getSetting('status_auto_download', 'off');
        const statusEmojis = await bot.db.getSetting('status_react_emojis', '💛,❤️,💜,💙,👍,🔥');
        const ownerNumber = bot.config.OWNER_NUMBER;
        const yourNumber = sender.match(/(\d+)/)?.[1] || 'unknown';
        const message = `📱 *STATUS FEATURE SETTINGS*\n\n` +
            `👑 *Owner:* ${ownerNumber}\n` +
            `👤 *Your Number:* ${yourNumber}\n` +
            `🔑 *Is Owner:* ${isActuallyOwner ? '✅ YES' : '❌ NO'}\n\n` +
            `👁️ *Auto-View Status:* ${statusView === 'on' ? '✅ ON' : '❌ OFF'}\n` +
            `❤️ *Auto-React Status:* ${statusReact === 'on' ? '✅ ON' : '❌ OFF'}\n` +
            `📥 *Auto-Download Status:* ${statusDownload === 'on' ? '✅ ON' : '❌ OFF'}\n\n` +
            `😊 *Status React Emojis:*\n${statusEmojis}\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: message }, { quoted: msg });
        if (react) await react('✅');
    }
});

// OLD STYLE: SET COMMAND
commands.push({
    name: 'set',
    description: 'Change status settings (Owner only) - Old style',
    async execute({ msg, from, sender, bot, sock, react, reply, args, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) {
            const ownerNumber = bot.config.OWNER_NUMBER;
            const yourNumber = sender.match(/(\d+)/)?.[1] || 'unknown';
            return reply(`❌ *Owner only command!*\n\nYour number: ${yourNumber}\nOwner number: ${ownerNumber}\n\nUse .statuscheck to see your status.`);
        }
        if (args.length < 2) {
            return reply(`📝 *Usage:*\n.set statusview on/off\n.set statusreact on/off\n.set statusdownload on/off\n.set statusemojis 💛,❤️,💜`);
        }
        const setting = args[0].toLowerCase();
        const value = args.slice(1).join(' ');
        if (setting === 'statusview') {
            const newValue = value === 'on' ? 'on' : 'off';
            await bot.db.setSetting('status_auto_view', newValue);
            await react('✅');
            return reply(`✅ Status auto-view set to: ${newValue === 'on' ? 'ON' : 'OFF'}`);
        }
        if (setting === 'statusreact') {
            const newValue = value === 'on' ? 'on' : 'off';
            await bot.db.setSetting('status_auto_react', newValue);
            await react('✅');
            return reply(`✅ Status auto-react set to: ${newValue === 'on' ? 'ON' : 'OFF'}`);
        }
        if (setting === 'statusdownload') {
            const newValue = value === 'on' ? 'on' : 'off';
            await bot.db.setSetting('status_auto_download', newValue);
            await react('✅');
            return reply(`✅ Status auto-download set to: ${newValue === 'on' ? 'ON' : 'OFF'}`);
        }
        if (setting === 'statusemojis') {
            await bot.db.setSetting('status_react_emojis', value);
            await react('✅');
            return reply(`✅ Status react emojis set to: ${value}`);
        }
        return reply(`❌ Unknown setting: ${setting}\nAvailable: statusview, statusreact, statusdownload, statusemojis`);
    }
});

// NEW STYLE: AUTO VIEW STATUS
commands.push({
    name: 'autoviewstatus',
    description: 'Toggle auto-view status (on/off) - Owner Only',
    aliases: ['avs'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_view', 'on');
            await react('ℹ️');
            return reply(`*👁️ AUTO VIEW STATUS*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n*Options:*\n• on - Auto-view statuses\n• off - Manual view only\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) {
            await react('❌');
            return reply(`❌ *Invalid Option*\n\nUse: on or off\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('status_auto_view', option);
        await react('✅');
        return reply(`*✅ AUTO VIEW UPDATED*\n\nAuto-view status turned *${option}*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// AUTO DOWNLOAD STATUS
commands.push({
    name: 'autodownloadstatus',
    description: 'Toggle auto-download status (on/off) - Owner Only',
    aliases: ['ads'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_download', 'off');
            await react('ℹ️');
            return reply(`*📥 AUTO DOWNLOAD STATUS*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) { await react('❌'); return reply(`❌ Use on or off\n\n> Megan-Prime | TrackerWanga`); }
        await react('🔄');
        await bot.db.setSetting('status_auto_download', option);
        await react('✅');
        return reply(`*✅ AUTO DOWNLOAD UPDATED*\n\nAuto-download status turned *${option}*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// AUTO REACT STATUS
commands.push({
    name: 'autoreactstatus',
    description: 'Toggle auto-react status (on/off) - Owner Only',
    aliases: ['ars'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_react', 'off');
            await react('ℹ️');
            return reply(`*🎯 AUTO REACT STATUS*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) { await react('❌'); return reply(`❌ Use on or off\n\n> Megan-Prime | TrackerWanga`); }
        await react('🔄');
        await bot.db.setSetting('status_auto_react', option);
        await react('✅');
        return reply(`*✅ AUTO REACT UPDATED*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// SET STATUS EMOJI
commands.push({
    name: 'setstatusemoji',
    description: 'Set emojis for status reactions - Owner Only',
    aliases: ['sse'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_react_emojis', '💛,❤️,💜,💙,👍,🔥');
            await react('ℹ️');
            return reply(`*🎯 STATUS REACTION EMOJIS*\n\nCurrent: ${current}\n\n> Megan-Prime | TrackerWanga`);
        }
        const emojis = args.join(' ');
        await react('🔄');
        await bot.db.setSetting('status_react_emojis', emojis);
        await react('✅');
        return reply(`*✅ EMOJIS UPDATED*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// ANTI DELETE STATUS
commands.push({
    name: 'antideletestatus',
    description: 'Toggle anti-delete for status (on/off) - Owner Only',
    aliases: ['ads2'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_anti_delete', 'off');
            await react('ℹ️');
            return reply(`*🚨 ANTI-DELETE STATUS*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) { await react('❌'); return reply(`❌ Use on or off\n\n> Megan-Prime | TrackerWanga`); }
        await react('🔄');
        await bot.db.setSetting('status_anti_delete', option);
        await react('✅');
        return reply(`*✅ ANTI-DELETE UPDATED*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// AUTO VIEW ONCE
commands.push({
    name: 'autoviewonce',
    description: 'Toggle auto-save view once media (on/off) - Owner Only',
    aliases: ['avo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, ownerManager }) {
        let isActuallyOwner = isOwner;
        if (ownerManager && !isActuallyOwner) { isActuallyOwner = ownerManager.isOwner(sender); }
        if (!isActuallyOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autoviewonce', 'on');
            await react('ℹ️');
            return reply(`*🔐 AUTO VIEW ONCE*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) { await react('❌'); return reply(`❌ Use on or off\n\n> Megan-Prime | TrackerWanga`); }
        await react('🔄');
        await bot.db.setSetting('autoviewonce', option);
        await react('✅');
        return reply(`*✅ AUTO VIEW ONCE UPDATED*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// STATUS HELP
commands.push({
    name: 'statushelp',
    description: 'Show all status-related commands',
    aliases: ['helpstatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const helpText = `*📱 STATUS COMMANDS*\n\n` +
            `*👑 OWNER ONLY SETTINGS*\n` +
            `• ${config.PREFIX}statuscheck - Show current settings\n` +
            `• ${config.PREFIX}set statusview on/off - Old style\n` +
            `• ${config.PREFIX}autoviewstatus on/off - New style\n` +
            `• ${config.PREFIX}set statusreact on/off - Old style\n` +
            `• ${config.PREFIX}autoreactstatus on/off - New style\n` +
            `• ${config.PREFIX}set statusdownload on/off - Old style\n` +
            `• ${config.PREFIX}autodownloadstatus on/off - New style\n` +
            `• ${config.PREFIX}set statusemojis ❤️,👍,🔥\n` +
            `• ${config.PREFIX}setstatusemoji ❤️,👍,🔥\n` +
            `• ${config.PREFIX}antideletestatus on/off\n` +
            `• ${config.PREFIX}autoviewonce on/off\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        await react('✅');
    }
});

module.exports = { commands };
