// Megan-Prime User Management Commands
const config = require('../../megan/config');
const commands = [];

const extractPhone = (input) => {
    if (!input) return null;
    let phone = input.replace('@s.whatsapp.net', '');
    phone = phone.replace(/\D/g, '');
    return phone || null;
};

// BLACKLIST USER
commands.push({
    name: 'blacklist',
    description: 'Blacklist a user (add/remove) - Owner Only',
    aliases: ['bl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        const action = args[0]?.toLowerCase();
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[1]) {
            const phone = extractPhone(args[1]);
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!action || !['add', 'remove'].includes(action) || !target) {
            return reply(`🚫 *BLACKLIST*\n\n*Usage:*\n${config.PREFIX}blacklist add <@user/phone>\n${config.PREFIX}blacklist remove <@user/phone>\n\n> Megan-Prime | TrackerWanga`);
        }
        const userShort = target.split('@')[0];
        const blacklist = await bot.db.getSetting('blacklist', []);
        if (action === 'add') {
            if (!blacklist.includes(target)) {
                blacklist.push(target);
                await bot.db.setSetting('blacklist', blacklist);
                await react('✅');
                return reply(`✅ *BLACKLIST ADDED*\n\n@${userShort} added to blacklist.\n\n> Megan-Prime | TrackerWanga`);
            } else { await react('⚠️'); return reply(`⚠️ Already blacklisted.\n\n> Megan-Prime | TrackerWanga`); }
        } else {
            const index = blacklist.indexOf(target);
            if (index > -1) {
                blacklist.splice(index, 1);
                await bot.db.setSetting('blacklist', blacklist);
                await react('✅');
                return reply(`✅ *BLACKLIST REMOVED*\n\n@${userShort} removed.\n\n> Megan-Prime | TrackerWanga`);
            } else { await react('⚠️'); return reply(`⚠️ Not in blacklist.\n\n> Megan-Prime | TrackerWanga`); }
        }
    }
});

// WHITELIST USER
commands.push({
    name: 'whitelist',
    description: 'Whitelist a user (add/remove) - Owner Only',
    aliases: ['wl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        const action = args[0]?.toLowerCase();
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[1]) {
            const phone = extractPhone(args[1]);
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!action || !['add', 'remove'].includes(action) || !target) {
            return reply(`✅ *WHITELIST*\n\n*Usage:*\n${config.PREFIX}whitelist add/remove <@user>\n\n> Megan-Prime | TrackerWanga`);
        }
        const userShort = target.split('@')[0];
        const whitelist = await bot.db.getSetting('whitelist', []);
        if (action === 'add') {
            if (!whitelist.includes(target)) {
                whitelist.push(target);
                await bot.db.setSetting('whitelist', whitelist);
                await react('✅');
                return reply(`✅ *WHITELIST ADDED*\n\n@${userShort}\n\n> Megan-Prime | TrackerWanga`);
            } else { await react('⚠️'); return reply(`⚠️ Already whitelisted.\n\n> Megan-Prime | TrackerWanga`); }
        } else {
            const index = whitelist.indexOf(target);
            if (index > -1) {
                whitelist.splice(index, 1);
                await bot.db.setSetting('whitelist', whitelist);
                await react('✅');
                return reply(`✅ *WHITELIST REMOVED*\n\n@${userShort}\n\n> Megan-Prime | TrackerWanga`);
            } else { await react('⚠️'); return reply(`⚠️ Not in whitelist.\n\n> Megan-Prime | TrackerWanga`); }
        }
    }
});

// LIST BLACKLIST
commands.push({
    name: 'listblacklist',
    description: 'Show all blacklisted users',
    aliases: ['blacklistlist', 'bllist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📋');
        const blacklist = await bot.db.getSetting('blacklist', []);
        if (blacklist.length === 0) { return reply(`📋 *BLACKLIST*\n\nEmpty.\n\n> Megan-Prime | TrackerWanga`); }
        let listText = `🚫 *BLACKLISTED USERS*\n\nTotal: ${blacklist.length}\n\n`;
        blacklist.forEach((jid, index) => { listText += `${index + 1}. @${jid.split('@')[0]}\n`; });
        listText += `\n> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: listText, mentions: blacklist }, { quoted: msg });
        await react('✅');
    }
});

// LIST WHITELIST
commands.push({
    name: 'listwhitelist',
    description: 'Show all whitelisted users',
    aliases: ['whitelistlist', 'wllist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📋');
        const whitelist = await bot.db.getSetting('whitelist', []);
        if (whitelist.length === 0) { return reply(`📋 *WHITELIST*\n\nEmpty.\n\n> Megan-Prime | TrackerWanga`); }
        let listText = `✅ *WHITELISTED USERS*\n\nTotal: ${whitelist.length}\n\n`;
        whitelist.forEach((jid, index) => { listText += `${index + 1}. @${jid.split('@')[0]}\n`; });
        listText += `\n> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: listText, mentions: whitelist }, { quoted: msg });
        await react('✅');
    }
});

// MUTE USER
commands.push({
    name: 'muteuser',
    description: 'Mute a user for specified minutes - Owner Only',
    aliases: ['mute'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        let target = null;
        let duration = 60;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        if (!target || args.length < 1) {
            return reply(`🔇 *MUTE USER*\n\n*Usage:*\n${config.PREFIX}muteuser <@user> [minutes]\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length > 1) { duration = parseInt(args[1]); if (isNaN(duration) || duration < 1) duration = 60; }
        const userShort = target.split('@')[0];
        const mutedUntil = Date.now() + (duration * 60 * 1000);
        const muted = await bot.db.getSetting('muted', {});
        muted[target] = mutedUntil;
        await bot.db.setSetting('muted', muted);
        await react('🔇');
        return reply(`🔇 *USER MUTED*\n\n@${userShort} muted for ${duration} minute(s).\n\n> Megan-Prime | TrackerWanga`);
    }
});

// UNMUTE USER
commands.push({
    name: 'unmuteuser',
    description: 'Unmute a user - Owner Only',
    aliases: ['unmute'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            const phone = extractPhone(args[0]);
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!target) { return reply(`🔊 *UNMUTE USER*\n\n*Usage:*\n${config.PREFIX}unmuteuser <@user/phone>\n\n> Megan-Prime | TrackerWanga`); }
        const userShort = target.split('@')[0];
        const muted = await bot.db.getSetting('muted', {});
        if (muted[target]) {
            delete muted[target];
            await bot.db.setSetting('muted', muted);
            await react('🔊');
            return reply(`🔊 *USER UNMUTED*\n\n@${userShort}\n\n> Megan-Prime | TrackerWanga`);
        } else { await react('⚠️'); return reply(`⚠️ Not muted.\n\n> Megan-Prime | TrackerWanga`); }
    }
});

// LIST MUTED USERS
commands.push({
    name: 'listmuted',
    description: 'Show all muted users',
    aliases: ['mutedlist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📋');
        const muted = await bot.db.getSetting('muted', {});
        const now = Date.now();
        const mutedList = [];
        for (const [jid, until] of Object.entries(muted)) {
            if (until > now) {
                const remaining = Math.round((until - now) / 60000);
                mutedList.push({ jid, remaining });
            }
        }
        if (mutedList.length === 0) { return reply(`📋 *MUTED USERS*\n\nNone.\n\n> Megan-Prime | TrackerWanga`); }
        let listText = `🔇 *MUTED USERS*\n\nTotal: ${mutedList.length}\n\n`;
        mutedList.forEach((item, index) => { listText += `${index + 1}. @${item.jid.split('@')[0]} - ${item.remaining} min\n`; });
        listText += `\n> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: listText, mentions: mutedList.map(m => m.jid) }, { quoted: msg });
        await react('✅');
    }
});

// WARN USER
commands.push({
    name: 'warnuser',
    description: 'Warn a user (auto-kick after 3 warnings) - Owner Only',
    aliases: ['warn'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        let target = null;
        let reason = 'No reason provided';
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            if (args.length > 1) reason = args.slice(1).join(' ');
        }
        if (!target) { return reply(`⚠️ *WARN USER*\n\n*Usage:*\n${config.PREFIX}warnuser <@user> [reason]\n\n> Megan-Prime | TrackerWanga`); }
        const userShort = target.split('@')[0];
        const warns = await bot.db.getSetting('warns', {});
        if (!warns[target]) { warns[target] = { count: 1, reasons: [reason] }; }
        else { warns[target].count += 1; warns[target].reasons.push(reason); }
        await bot.db.setSetting('warns', warns);
        await react('⚠️');
        await reply(`⚠️ *USER WARNED*\n\n@${userShort} (${warns[target].count}/3)\nReason: ${reason}\n\n> Megan-Prime | TrackerWanga`);
        if (warns[target].count >= 3 && from.endsWith('@g.us')) {
            try {
                await sock.groupParticipantsUpdate(from, [target], 'remove');
                await reply(`👋 *USER KICKED*\n\n@${userShort} after 3 warnings.\n\n> Megan-Prime | TrackerWanga`);
                delete warns[target];
                await bot.db.setSetting('warns', warns);
            } catch (error) { console.error('Auto-kick error:', error); }
        }
    }
});

// RESET WARNS
commands.push({
    name: 'resetwarns',
    description: 'Reset warnings for a user - Owner Only',
    aliases: ['rw'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`); }
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            const phone = extractPhone(args[0]);
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!target) { return reply(`🔄 *RESET WARNINGS*\n\n*Usage:*\n${config.PREFIX}resetwarns <@user/phone>\n\n> Megan-Prime | TrackerWanga`); }
        const userShort = target.split('@')[0];
        const warns = await bot.db.getSetting('warns', {});
        if (warns[target]) {
            delete warns[target];
            await bot.db.setSetting('warns', warns);
            await react('✅');
            return reply(`✅ *WARNINGS RESET*\n\n@${userShort}\n\n> Megan-Prime | TrackerWanga`);
        } else { await react('⚠️'); return reply(`⚠️ No warnings.\n\n> Megan-Prime | TrackerWanga`); }
    }
});

// USER INFO
commands.push({
    name: 'userinfo',
    description: 'Get detailed user information',
    aliases: ['ui'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        let target = sender;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            const phone = extractPhone(args[0]);
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        await react('ℹ️');
        try {
            const userShort = target.split('@')[0];
            let about = 'Not available';
            let aboutTime = 'Unknown';
            try { const status = await sock.fetchStatus(target); about = status.status || 'Not set'; aboutTime = new Date(status.setAt).toLocaleString(); } catch (e) {}
            let ppUrl = 'No profile picture';
            try { ppUrl = await sock.profilePictureUrl(target, 'image'); } catch (e) {}
            const warns = await bot.db.getSetting('warns', {});
            const userWarns = warns[target]?.count || 0;
            const muted = await bot.db.getSetting('muted', {});
            const isMuted = muted[target] ? new Date(muted[target]) > new Date() : false;
            const muteRemaining = isMuted ? Math.round((muted[target] - Date.now()) / 60000) : 0;
            const blacklist = await bot.db.getSetting('blacklist', []);
            const whitelist = await bot.db.getSetting('whitelist', []);
            let infoText = `👤 *USER INFORMATION*\n\n` +
                `📱 *Phone:* ${userShort}\n` +
                `🆔 *JID:* ${target}\n` +
                `📝 *About:* ${about}\n` +
                `⚠️ *Warnings:* ${userWarns}/3\n` +
                `🔇 *Muted:* ${isMuted ? `Yes (${muteRemaining} min)` : 'No'}\n` +
                `🚫 *Blacklisted:* ${blacklist.includes(target) ? 'Yes' : 'No'}\n` +
                `✅ *Whitelisted:* ${whitelist.includes(target) ? 'Yes' : 'No'}\n\n` +
                `> Megan-Prime | TrackerWanga`;
            await sock.sendMessage(from, { text: infoText, mentions: [target] }, { quoted: msg });
            await react('✅');
        } catch (error) {
            console.error('User info error:', error);
            await react('❌');
            await reply(`❌ *ERROR*\n\n${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// USERMGMT HELP
commands.push({
    name: 'usermgmt',
    description: 'Show all user management commands',
    aliases: ['userhelp', 'um'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const helpText = `👥 *USER MANAGEMENT*\n\n` +
            `*👑 OWNER ONLY*\n` +
            `• ${config.PREFIX}blacklist add/remove <@user>\n` +
            `• ${config.PREFIX}whitelist add/remove <@user>\n` +
            `• ${config.PREFIX}muteuser <@user> [min]\n` +
            `• ${config.PREFIX}unmuteuser <@user>\n` +
            `• ${config.PREFIX}warnuser <@user> [reason]\n` +
            `• ${config.PREFIX}resetwarns <@user>\n\n` +
            `*👤 PUBLIC*\n` +
            `• ${config.PREFIX}listblacklist\n` +
            `• ${config.PREFIX}listwhitelist\n` +
            `• ${config.PREFIX}listmuted\n` +
            `• ${config.PREFIX}userinfo <@user>\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        await react('✅');
    }
});

module.exports = { commands };
