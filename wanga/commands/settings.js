// Megan-Prime Settings Commands - Clean version
const config = require('../../megan/config');
const timeUtils = require('../../megan/lib/timeUtils');
const { downloadMediaMessage } = require('gifted-baileys');

const MEGAN_LOGO = 'https://files.catbox.moe/0v8bkv.png';
const commands = [];

async function sendWithLogo(sock, to, text, quoted = null) {
    try {
        await sock.sendMessage(to, { image: { url: MEGAN_LOGO }, caption: text }, { quoted });
    } catch (e) {
        await sock.sendMessage(to, { text }, { quoted });
    }
}

// SET PREFIX
commands.push({
    name: 'setprefix',
    description: 'Change bot command prefix (Owner Only)',
    aliases: ['prefix'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('prefix', config.PREFIX);
            await react('ℹ️');
            return reply(`🔧 *Current Prefix:* \`${current}\`\n\n*Usage:* ${config.PREFIX}setprefix <symbol>\n\n> Megan-Prime | TrackerWanga`);
        }
        const newPrefix = args[0];
        if (newPrefix.length !== 1) {
            await react('❌');
            return reply(`❌ *Prefix must be a single character!*\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('prefix', newPrefix);
        config.PREFIX = newPrefix;
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Prefix Updated*\n\n🔧 New prefix: \`${newPrefix}\`\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET BOT NAME
commands.push({
    name: 'setbotname',
    description: 'Change bot display name (Owner Only)',
    aliases: ['botname'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('bot_name', config.BOT_NAME);
            await react('ℹ️');
            return reply(`📛 *Current Bot Name:* ${current}\n\n*Usage:* ${config.PREFIX}setbotname <new name>\n\n> Megan-Prime | TrackerWanga`);
        }
        const newName = args.join(' ');
        await react('🔄');
        await bot.db.setSetting('bot_name', newName);
        config.BOT_NAME = newName;
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Bot Name Updated*\n\n📛 New name: *${newName}*\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET MODE
commands.push({
    name: 'setmode',
    description: 'Set bot mode (public/private) - Owner Only',
    aliases: ['mode'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('mode', 'public');
            await react('ℹ️');
            return reply(`⚙️ *Current Mode:* ${current === 'public' ? '🌍 PUBLIC' : '🔒 PRIVATE'}\n\n*Options:*\n• public - Anyone can use commands\n• private - Only owner\n\n*Usage:* ${config.PREFIX}setmode public/private\n\n> Megan-Prime | TrackerWanga`);
        }
        const mode = args[0].toLowerCase();
        if (mode !== 'public' && mode !== 'private') {
            await react('❌');
            return reply(`❌ *Invalid mode!* Use: public or private\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('mode', mode);
        config.MODE = mode;
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Mode Updated*\n\n⚙️ New mode: *${mode === 'public' ? '🌍 PUBLIC' : '🔒 PRIVATE'}*\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET DEFAULT DISAPPEARING MESSAGES
commands.push({
    name: 'setdefaultdisappear',
    description: 'Set default disappearing messages (24h/7d/90d/off) - Owner Only',
    aliases: ['defaultdisappear', 'setdisappear'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('default_disappear', 0);
            let display = 'off';
            if (current === 86400) display = '24 hours';
            else if (current === 604800) display = '7 days';
            else if (current === 7776000) display = '90 days';
            await react('ℹ️');
            return reply(`⏳ *Default Disappearing Messages*\n\nCurrent: *${display}*\n\n*Options:*\n• 24h - 24 hours\n• 7d - 7 days\n• 90d - 90 days\n• off - Disabled\n\n*Usage:* ${config.PREFIX}setdefaultdisappear <24h/7d/90d/off>\n\n> Megan-Prime | TrackerWanga`);
        }
        const option = args[0].toLowerCase();
        let expiration = 0;
        let display = 'off';
        if (option === '24h') { expiration = 86400; display = '24 hours'; }
        else if (option === '7d') { expiration = 604800; display = '7 days'; }
        else if (option === '90d') { expiration = 7776000; display = '90 days'; }
        else if (option !== 'off') {
            await react('❌');
            return reply(`❌ *Invalid option!* Use: 24h, 7d, 90d, or off\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('default_disappear', expiration);
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Default Disappearing Messages Updated*\n\n⏳ New setting: *${display}*\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// RESET CORE SETTINGS
commands.push({
    name: 'resetsettings',
    description: 'Reset core settings to default (Owner Only)',
    aliases: ['resetcore'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args[0]?.toLowerCase() !== '--force') {
            await react('⚠️');
            return reply(`⚠️ *Warning:* This will reset CORE settings to default!\n\nTo confirm: ${config.PREFIX}resetsettings --force\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('prefix', '.');
        await bot.db.setSetting('bot_name', config.BOT_NAME);
        await bot.db.setSetting('mode', 'public');
        await bot.db.setSetting('default_disappear', 0);
        config.PREFIX = '.';
        config.MODE = 'public';
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Core Settings Reset*\n\n*Defaults restored:*\n• Prefix: .\n• Bot Name: ${config.BOT_NAME}\n• Mode: public\n• Disappear: off\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET OWNER NAME
commands.push({
    name: 'setownername',
    description: 'Set bot owner name (Owner Only)',
    aliases: ['setowner', 'ownername'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('owner_name', config.OWNER_NAME);
            await react('ℹ️');
            return reply(`👤 *Current Owner Name:* ${current}\n\n*Usage:* ${config.PREFIX}setownername <new name>\n\n> Megan-Prime | TrackerWanga`);
        }
        const newName = args.join(' ');
        await react('🔄');
        await bot.db.setSetting('owner_name', newName);
        config.OWNER_NAME = newName;
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Owner Name Updated*\n\n👤 New name: *${newName}*\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET OWNER PHONE
commands.push({
    name: 'setownerphone',
    description: 'Change owner phone number (Owner Only)',
    aliases: ['ownerphone'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            const current = await bot.db.getSetting('owner_number', config.OWNER_NUMBER);
            await react('ℹ️');
            return reply(`📞 *Current Owner Phone:* ${current}\n\n*Usage:* ${config.PREFIX}setownerphone <number>\n\n> Megan-Prime | TrackerWanga`);
        }
        const newPhone = args[0].replace(/\D/g, '');
        if (newPhone.length < 10) {
            await react('❌');
            return reply(`❌ *Invalid phone number!* Include country code (e.g., 254...)\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔄');
        await bot.db.setSetting('owner_number', newPhone);
        config.OWNER_NUMBER = newPhone;
        await react('✅');
        await sendWithLogo(sock, from, `✅ *Owner Phone Updated*\n\n📞 New number: ${newPhone}\n\n> Megan-Prime | TrackerWanga`, msg);
    }
});

// SET BIO
commands.push({
    name: 'setbio',
    description: 'Set bot about/bio (Owner Only)',
    aliases: ['setabout', 'setstatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (args.length === 0) {
            await react('ℹ️');
            return reply(`📝 *Set Bio*\n\n*Usage:* ${config.PREFIX}setbio <your bio>\n\n> Megan-Prime | TrackerWanga`);
        }
        const bio = args.join(' ');
        await react('📝');
        try {
            await sock.updateProfileStatus(bio);
            await bot.db.setSetting('bio', bio);
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Bio Updated*\n\n📝 New bio:\n${bio}\n\n> Megan-Prime | TrackerWanga`, msg);
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed to update bio:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// AUTO BIO
let autoBioInterval = null;
const AUTO_BIO_MESSAGES = {
    earlyMorning: ["🌅 Rise and shine!", "☕ Good morning!", "✨ Early bird gets the worm!"],
    morning: ["☀️ Good morning!", "📚 Time to learn!", "🎯 Stay focused!"],
    afternoon: ["🌤️ Good afternoon!", "⚡ Keep pushing!", "💡 Stay productive!"],
    evening: ["🌆 Good evening!", "🌟 Great job today!", "🌙 Time to unwind!"],
    night: ["🌙 Good night!", "⭐ Sweet dreams!", "💤 Rest well!"],
    midnight: ["🕛 Midnight thoughts!", "🌌 Dream big!", "✨ You're amazing!"]
};

commands.push({
    name: 'autobio',
    description: 'Auto-update bio based on time (Owner Only)',
    aliases: ['autobio'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        const action = args[0]?.toLowerCase();
        if (action === 'stop' || action === 'off') {
            if (autoBioInterval) {
                clearInterval(autoBioInterval);
                autoBioInterval = null;
                await bot.db.setSetting('autobio', 'off');
                await react('⏹️');
                return reply(`⏹️ *Auto-bio stopped*\n\n> Megan-Prime | TrackerWanga`);
            }
            return reply(`⚠️ *Auto-bio is not running*\n\n> Megan-Prime | TrackerWanga`);
        }
        if (action === 'start' || action === 'on' || !action) {
            const isRunning = await bot.db.getSetting('autobio', 'off');
            if (autoBioInterval || isRunning === 'on') {
                return reply(`⚠️ *Auto-bio is already running*\n\n> Megan-Prime | TrackerWanga`);
            }
            await react('🔄');
            const updateBio = async () => {
                try {
                    const hour = new Date().getHours();
                    let messages = AUTO_BIO_MESSAGES.midnight;
                    if (hour >= 4 && hour < 6) messages = AUTO_BIO_MESSAGES.earlyMorning;
                    else if (hour >= 6 && hour < 12) messages = AUTO_BIO_MESSAGES.morning;
                    else if (hour >= 12 && hour < 17) messages = AUTO_BIO_MESSAGES.afternoon;
                    else if (hour >= 17 && hour < 20) messages = AUTO_BIO_MESSAGES.evening;
                    else if (hour >= 20 || hour < 4) messages = AUTO_BIO_MESSAGES.night;
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    await sock.updateProfileStatus(randomMessage);
                } catch (error) { console.error('Auto-bio update error:', error); }
            };
            await updateBio();
            autoBioInterval = setInterval(updateBio, 60 * 60 * 1000);
            await bot.db.setSetting('autobio', 'on');
            await react('✅');
            await sendWithLogo(sock, from, `🔄 *Auto-Bio Started*\n\n⏰ Updates every hour\n\nTo stop: ${config.PREFIX}autobio stop\n\n> Megan-Prime | TrackerWanga`, msg);
        }
    }
});

// SET BOT PROFILE PICTURE
commands.push({
    name: 'setbotpic',
    description: 'Set bot profile picture (Owner Only)',
    aliases: ['setpp', 'setprofilepic'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🖼️');
        try {
            let imageBuffer = null;
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ key: msg.key, message: quoted }, 'buffer', {}, { logger: console });
            } else if (args.length > 0 && args[0].startsWith('http')) {
                const axios = require('axios');
                const response = await axios.get(args[0], { responseType: 'arraybuffer', timeout: 30000 });
                imageBuffer = Buffer.from(response.data);
            } else if (msg.message?.imageMessage) {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
            }
            if (!imageBuffer) {
                await react('❌');
                return reply(`🖼️ *Set Profile Picture*\n\n*Usage:*\n• Reply to an image with ${config.PREFIX}setbotpic\n• ${config.PREFIX}setbotpic <image url>\n\n> Megan-Prime | TrackerWanga`);
            }
            await sock.updateProfilePicture(sock.user.id, imageBuffer);
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Profile Picture Updated*\n\n> Megan-Prime | TrackerWanga`, msg);
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed to update:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// REMOVE PROFILE PICTURE
commands.push({
    name: 'removepp',
    description: 'Remove bot profile picture (Owner Only)',
    aliases: ['removepic', 'delpp'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🗑️');
        try {
            await sock.removeProfilePicture(sock.user.id);
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Profile Picture Removed*\n\n> Megan-Prime | TrackerWanga`, msg);
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// MY PROFILE PICTURE (Public)
commands.push({
    name: 'mypic',
    description: 'Get your own profile picture',
    aliases: ['mypp', 'getmypp'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🖼️');
        try {
            const ppUrl = await sock.profilePictureUrl(sender, 'image');
            await sock.sendMessage(from, {
                image: { url: ppUrl },
                caption: `🖼️ *Your Profile Picture*\n\n👤 @${sender.split('@')[0]}\n\n> Megan-Prime | TrackerWanga`,
                mentions: [sender]
            }, { quoted: msg });
            await react('✅');
        } catch (error) {
            await sendWithLogo(sock, from, `⚠️ *No profile picture found* for @${sender.split('@')[0]}\n\n> Megan-Prime | TrackerWanga`, msg);
            await react('✅');
        }
    }
});

// MY ABOUT (Public)
commands.push({
    name: 'myabout',
    description: 'Get your own about/bio',
    aliases: ['mybio', 'getmyabout'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📝');
        try {
            const { status, setAt } = await sock.fetchStatus(sender);
            const date = new Date(setAt).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });
            await sendWithLogo(sock, from, `📝 *Your About Info*\n\n👤 User: @${sender.split('@')[0]}\n💬 About: ${status}\n🕒 Set at: ${date}\n\n> Megan-Prime | TrackerWanga`, msg);
            await react('✅');
        } catch (error) {
            await react('❌');
            await reply(`❌ *Could not fetch about info.* You may have privacy settings enabled.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// BLOCK USER
commands.push({
    name: 'block',
    description: 'Block a user (Owner Only)',
    aliases: ['blockuser'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args.length > 0) {
            const phone = args[0].replace(/\D/g, '');
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!target) {
            await react('❌');
            return reply(`🔨 *Block User*\n\n*Usage:* ${config.PREFIX}block <@user/phone>\nOr reply to their message with ${config.PREFIX}block\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔨');
        try {
            await sock.updateBlockStatus(target, 'block');
            await react('✅');
            await sendWithLogo(sock, from, `🔨 *User Blocked*\n\n👤 User: @${target.split('@')[0]}\n🚫 Status: Blocked\n\n> Megan-Prime | TrackerWanga`, msg);
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed to block user:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// UNBLOCK USER
commands.push({
    name: 'unblock',
    description: 'Unblock a user (Owner Only)',
    aliases: ['unblockuser'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\n> Megan-Prime | TrackerWanga`);
        }
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args.length > 0) {
            const phone = args[0].replace(/\D/g, '');
            if (phone && phone.length >= 10) target = `${phone}@s.whatsapp.net`;
        }
        if (!target) {
            await react('❌');
            return reply(`🔓 *Unblock User*\n\n*Usage:* ${config.PREFIX}unblock <@user/phone>\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('🔓');
        try {
            await sock.updateBlockStatus(target, 'unblock');
            await react('✅');
            await sendWithLogo(sock, from, `🔓 *User Unblocked*\n\n👤 User: @${target.split('@')[0]}\n✅ Status: Unblocked\n\n> Megan-Prime | TrackerWanga`, msg);
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed to unblock user:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// LIST BLOCKED USERS (Public)
commands.push({
    name: 'listblocked',
    description: 'List all blocked users',
    aliases: ['blocklist', 'blocked'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📋');
        try {
            const blocklist = await sock.fetchBlocklist();
            if (!blocklist || blocklist.length === 0) {
                return reply(`📋 *No blocked users found.*\n\n> Megan-Prime | TrackerWanga`);
            }
            let listText = `📋 *Blocked Users (${blocklist.length})*\n\n`;
            blocklist.forEach((jid, index) => { listText += `${index + 1}. @${jid.split('@')[0]}\n`; });
            listText += `\n> Megan-Prime | TrackerWanga`;
            await sendWithLogo(sock, from, listText, msg);
            await react('✅');
        } catch (error) {
            await react('❌');
            await reply(`❌ *Failed to fetch blocklist:* ${error.message}\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// VIEW ALL CORE SETTINGS (Public)
commands.push({
    name: 'settings',
    description: 'View all core bot settings',
    aliases: ['coresettings'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('⚙️');
        const prefix = await bot.db.getSetting('prefix', config.PREFIX);
        const botname = await bot.db.getSetting('bot_name', config.BOT_NAME);
        const mode = await bot.db.getSetting('mode', config.MODE);
        const disappear = await bot.db.getSetting('default_disappear', 0);
        let disappearText = 'off';
        if (disappear === 86400) disappearText = '24 hours';
        else if (disappear === 604800) disappearText = '7 days';
        else if (disappear === 7776000) disappearText = '90 days';
        const currentTime = await timeUtils.getCurrentTimeString(bot.db);
        const settingsText = `⚙️ *Core Bot Settings*\n\n` +
            `🕐 *Time:* ${currentTime}\n` +
            `🔧 *Prefix:* \`${prefix}\`\n` +
            `📛 *Bot Name:* ${botname}\n` +
            `⚡ *Mode:* ${mode === 'public' ? '🌍 PUBLIC' : '🔒 PRIVATE'}\n` +
            `⏳ *Default Disappear:* ${disappearText}\n\n` +
            `*For more:*\n` +
            `• ${prefix}features - Feature toggles\n` +
            `• ${prefix}statuscheck - Status settings\n` +
            `• ${prefix}privacysettings - Privacy settings\n` +
            `• ${prefix}settingshelp - All settings commands\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sendWithLogo(sock, from, settingsText, msg);
        await react('✅');
    }
});

// PRIVACY SETTINGS (Public)
commands.push({
    name: 'privacysettings',
    description: 'View privacy settings',
    aliases: ['privacy', 'privacystatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔍');
        const lastseen = await bot.db.getSetting('lastseen', 'all');
        const profilepic = await bot.db.getSetting('profilepic', 'all');
        const statusprivacy = await bot.db.getSetting('statusprivacy', 'all');
        const readreceipts = await bot.db.getSetting('readreceipts', 'all');
        const onlineprivacy = await bot.db.getSetting('onlineprivacy', 'all');
        const privacyText = `🔐 *Privacy Settings*\n\n` +
            `👁️ *Last Seen:* ${lastseen}\n` +
            `🖼️ *Profile Picture:* ${profilepic}\n` +
            `📱 *Status:* ${statusprivacy}\n` +
            `✅ *Read Receipts:* ${readreceipts}\n` +
            `🟢 *Online Status:* ${onlineprivacy}\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sendWithLogo(sock, from, privacyText, msg);
        await react('✅');
    }
});

// SETTINGS HELP (Public)
commands.push({
    name: 'settingshelp',
    description: 'Show available core settings commands',
    aliases: ['helpsettings'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const helpText = `⚙️ *Settings Commands*\n\n` +
            `*CORE (Owner)*\n` +
            `• ${config.PREFIX}setprefix <symbol>\n` +
            `• ${config.PREFIX}setbotname <name>\n` +
            `• ${config.PREFIX}setmode <public/private>\n` +
            `• ${config.PREFIX}setdefaultdisappear <24h/7d/90d/off>\n` +
            `• ${config.PREFIX}resetsettings --force\n\n` +
            `*PROFILE (Owner)*\n` +
            `• ${config.PREFIX}setownername <name>\n` +
            `• ${config.PREFIX}setownerphone <number>\n` +
            `• ${config.PREFIX}setbio <text>\n` +
            `• ${config.PREFIX}autobio start/stop\n` +
            `• ${config.PREFIX}setbotpic [image/url]\n` +
            `• ${config.PREFIX}removepp\n\n` +
            `*BLOCKING (Owner)*\n` +
            `• ${config.PREFIX}block <@user>\n` +
            `• ${config.PREFIX}unblock <@user>\n` +
            `• ${config.PREFIX}listblocked\n\n` +
            `*PUBLIC*\n` +
            `• ${config.PREFIX}settings - View core\n` +
            `• ${config.PREFIX}privacysettings - View privacy\n` +
            `• ${config.PREFIX}mypic - Your profile pic\n` +
            `• ${config.PREFIX}myabout - Your bio\n` +
            `• ${config.PREFIX}settingshelp - This menu\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await sendWithLogo(sock, from, helpText, msg);
        await react('✅');
    }
});

module.exports = { commands };
