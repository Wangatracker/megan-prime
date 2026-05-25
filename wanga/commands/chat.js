// ╔══════════════════════════════════════════════════╗
// ║   MEGAN-PRIME CHAT COMMANDS - 22 Commands       ║
// ║  WhatsApp-Native Features | Gifted-Baileys       ║
// ╚══════════════════════════════════════════════════╝

const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');
const { downloadMediaMessage } = require('gifted-baileys');

const commands = [];

const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const FOOTER = '> Megan-Prime | TrackerWanga';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

function extractPhone(input) {
    if (!input) return null;
    return input.replace(/[^0-9]/g, '') || null;
}

// ═══════════════════════════════════════════
// LOCATION
// ═══════════════════════════════════════════

// 1. SEND LOCATION
commands.push({
    name: 'sendloc', description: 'Send a location',
    aliases: ['location', 'loc', 'shareloc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 2) {
            await react('ℹ️');
            return reply(`📍 *SEND LOCATION*\n\n*Usage:*\n${config.PREFIX}sendloc <latitude> <longitude> [name] [address]\n${config.PREFIX}sendloc nairobi (for preset)\n\n*Presets:* nairobi, mombasa, kisumu, nakuru\n\n${FOOTER}`);
        }

        const presets = {
            nairobi: { lat: -1.2921, lng: 36.8219, name: 'Nairobi, Kenya', address: 'Nairobi City' },
            mombasa: { lat: -4.0435, lng: 39.6682, name: 'Mombasa, Kenya', address: 'Mombasa City' },
            kisumu: { lat: -0.0917, lng: 34.7680, name: 'Kisumu, Kenya', address: 'Kisumu City' },
            nakuru: { lat: -0.3031, lng: 36.0800, name: 'Nakuru, Kenya', address: 'Nakuru City' }
        };

        await react('📍');

        try {
            let lat, lng, name, address;

            if (presets[args[0]?.toLowerCase()]) {
                const p = presets[args[0].toLowerCase()];
                lat = p.lat; lng = p.lng; name = p.name; address = p.address;
            } else {
                lat = parseFloat(args[0]);
                lng = parseFloat(args[1]);
                name = args.slice(2).join(' ') || 'Shared Location';
                address = args.slice(3).join(' ') || name;
                if (isNaN(lat) || isNaN(lng)) {
                    return reply(`❌ *Invalid coordinates*\n\nUse numbers for lat/lng or a preset city\n\n${FOOTER}`);
                }
            }

            await sock.sendMessage(from, {
                location: {
                    degreesLatitude: lat,
                    degreesLongitude: lng,
                    name: name,
                    address: address
                }
            }, { quoted: msg });

            await sendButtonsMsg(sock, from, `📍 *Location Sent*\n\n📌 ${name}\n📍 ${lat}, ${lng}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 2. SEND CONTACT (vCard)
commands.push({
    name: 'sendcontact', description: 'Send a contact card',
    aliases: ['contact', 'vcard', 'sharecontact'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 1) {
            await react('ℹ️');
            return reply(`👤 *SEND CONTACT*\n\n*Usage:*\n${config.PREFIX}sendcontact <name> <phone> [org]\n*Example:* ${config.PREFIX}sendcontact "John Doe" 254700000000\n\n${FOOTER}`);
        }

        await react('👤');

        try {
            const parsed = args.join(' ').match(/"([^"]+)"|'([^']+)'/g) || [];
            const cleanArgs = parsed.length >= 2 ? parsed.map(a => a.replace(/["']/g, '')) : args;

            const name = cleanArgs[0] || 'Contact';
            const phone = extractPhone(cleanArgs[1] || cleanArgs[0]);
            const org = cleanArgs[2] || '';

            if (!phone || phone.length < 10) {
                return reply(`❌ *Invalid phone number*\n\nProvide a valid phone number with country code\n\n${FOOTER}`);
            }

            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${name}\n` +
                (org ? `ORG:${org}\n` : '') +
                `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\n` +
                'END:VCARD';

            await sock.sendMessage(from, {
                contacts: {
                    displayName: name,
                    contacts: [{ vcard }]
                }
            }, { quoted: msg });

            await sendButtonsMsg(sock, from, `👤 *Contact Sent*\n\n📛 ${name}\n📞 +${phone}${org ? `\n🏢 ${org}` : ''}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// CHAT MANAGEMENT
// ═══════════════════════════════════════════

// 3. PIN CHAT
commands.push({
    name: 'pin', description: 'Pin this chat',
    aliases: ['pinchat', 'pinned'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📌');
        try {
            await sock.chatModify({ pin: true }, from);
            await sendButtonsMsg(sock, from, `📌 *Chat Pinned*\n\nThis chat has been pinned.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 4. UNPIN CHAT
commands.push({
    name: 'unpin', description: 'Unpin this chat',
    aliases: ['unpinchat', 'unpinned'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📌');
        try {
            await sock.chatModify({ pin: false }, from);
            await sendButtonsMsg(sock, from, `📌 *Chat Unpinned*\n\nThis chat has been unpinned.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 5. ARCHIVE CHAT
commands.push({
    name: 'archive', description: 'Archive this chat',
    aliases: ['archivechat', 'hide'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📦');
        try {
            await sock.chatModify({ archive: true }, from);
            await sendButtonsMsg(sock, from, `📦 *Chat Archived*\n\nUse ${config.PREFIX}unarchive to restore.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 6. UNARCHIVE CHAT
commands.push({
    name: 'unarchive', description: 'Unarchive this chat',
    aliases: ['unarchivechat', 'unhide'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📦');
        try {
            await sock.chatModify({ archive: false }, from);
            await sendButtonsMsg(sock, from, `📦 *Chat Unarchived*\n\nChat restored to inbox.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 7. CLEAR CHAT
commands.push({
    name: 'clearchat', description: 'Clear chat messages (Owner Only)',
    aliases: ['clearmessages', 'deletechat'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only*\n\n${FOOTER}`);
        }
        await react('🗑️');
        try {
            // Get recent messages to clear
            await sock.chatModify({
                clear: {
                    messages: [{ id: msg.key.id, fromMe: true }]
                }
            }, from);
            await sendButtonsMsg(sock, from, `🗑️ *Chat Cleared*\n\nMessages have been cleared.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 8. MARK UNREAD
commands.push({
    name: 'markunread', description: 'Mark chat as unread',
    aliases: ['unread', 'markasunread'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔵');
        try {
            await sock.chatModify({ markRead: false }, from);
            await sendButtonsMsg(sock, from, `🔵 *Marked as Unread*\n\nChat marked as unread.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 9. MUTE CHAT (WhatsApp mute)
commands.push({
    name: 'mutechat', description: 'Mute WhatsApp notifications for this chat',
    aliases: ['mutewa', 'silentchat'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const hours = parseInt(args[0]) || 8;
        if (hours < 1 || hours > 8760) return reply(`❌ *1-8760 hours (1 year)*\n\n${FOOTER}`);
        await react('🔇');
        try {
            await sock.chatModify({ mute: hours * 60 * 60 * 1000 }, from);
            await sendButtonsMsg(sock, from, `🔇 *Chat Muted*\n\n⏰ Duration: ${hours} hour(s)\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 10. UNMUTE CHAT
commands.push({
    name: 'unmutechat', description: 'Unmute WhatsApp notifications',
    aliases: ['unmutewa', 'unsilent'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔊');
        try {
            await sock.chatModify({ mute: null }, from);
            await sendButtonsMsg(sock, from, `🔊 *Chat Unmuted*\n\nNotifications restored.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// PRIVACY SETTINGS
// ═══════════════════════════════════════════

// 11. LAST SEEN PRIVACY
commands.push({
    name: 'lastseen', description: 'Update last seen privacy (Owner Only)',
    aliases: ['lastseenprivacy', 'whocanseeme'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        const setting = args[0]?.toLowerCase();
        const valid = ['all', 'contacts', 'none'];
        if (!setting || !valid.includes(setting)) {
            await react('ℹ️');
            return reply(`👁️ *LAST SEEN PRIVACY*\n\n*Options:* all, contacts, none\n*Usage:* ${config.PREFIX}lastseen <option>\n\n${FOOTER}`);
        }
        await react('👁️');
        try {
            await sock.updateLastSeenPrivacy(setting);
            await sendButtonsMsg(sock, from, `👁️ *Last Seen Privacy Updated*\n\n📊 Now: *${setting}*\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 12. ONLINE PRIVACY
commands.push({
    name: 'onlineprivacy', description: 'Update online privacy (Owner Only)',
    aliases: ['online', 'whocanseemeonline'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        const setting = args[0]?.toLowerCase();
        const valid = ['all', 'match_last_seen'];
        if (!setting || !valid.includes(setting)) {
            await react('ℹ️');
            return reply(`🟢 *ONLINE PRIVACY*\n\n*Options:* all, match_last_seen\n*Usage:* ${config.PREFIX}onlineprivacy <option>\n\n${FOOTER}`);
        }
        await react('🟢');
        try {
            await sock.updateOnlinePrivacy(setting);
            await sendButtonsMsg(sock, from, `🟢 *Online Privacy Updated*\n\n📊 Now: *${setting}*\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 13. PROFILE PICTURE PRIVACY
commands.push({
    name: 'ppprivacy', description: 'Update profile picture privacy (Owner Only)',
    aliases: ['profilepicprivacy', 'whocanseemydp'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        const setting = args[0]?.toLowerCase();
        const valid = ['all', 'contacts', 'none'];
        if (!setting || !valid.includes(setting)) {
            await react('ℹ️');
            return reply(`🖼️ *PROFILE PIC PRIVACY*\n\n*Options:* all, contacts, none\n*Usage:* ${config.PREFIX}ppprivacy <option>\n\n${FOOTER}`);
        }
        await react('🖼️');
        try {
            await sock.updateProfilePicturePrivacy(setting);
            await sendButtonsMsg(sock, from, `🖼️ *Profile Pic Privacy Updated*\n\n📊 Now: *${setting}*\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 14. STATUS PRIVACY
commands.push({
    name: 'statusprivacy', description: 'Update status privacy (Owner Only)',
    aliases: ['storyprivacy', 'whocanseemystatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        const setting = args[0]?.toLowerCase();
        const valid = ['all', 'contacts', 'none'];
        if (!setting || !valid.includes(setting)) {
            await react('ℹ️');
            return reply(`📱 *STATUS PRIVACY*\n\n*Options:* all, contacts, none\n*Usage:* ${config.PREFIX}statusprivacy <option>\n\n${FOOTER}`);
        }
        await react('📱');
        try {
            await sock.updateStatusPrivacy(setting);
            await sendButtonsMsg(sock, from, `📱 *Status Privacy Updated*\n\n📊 Now: *${setting}*\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 15. READ RECEIPTS
commands.push({
    name: 'readreceipts', description: 'Toggle read receipts (Owner Only)',
    aliases: ['receipts', 'blueticks'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        const setting = args[0]?.toLowerCase();
        const valid = ['all', 'none'];
        if (!setting || !valid.includes(setting)) {
            await react('ℹ️');
            return reply(`✅ *READ RECEIPTS*\n\n*Options:* all, none\n*Usage:* ${config.PREFIX}readreceipts <option>\n\n${FOOTER}`);
        }
        await react('✅');
        try {
            await sock.updateReadReceiptsPrivacy(setting);
            await sendButtonsMsg(sock, from, `✅ *Read Receipts Updated*\n\n📊 Now: *${setting}*\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 16. GET PRIVACY SETTINGS
commands.push({
    name: 'getprivacy', description: 'View current privacy settings',
    aliases: ['privacystatus', 'myprivacy'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔍');
        try {
            const settings = await sock.fetchPrivacySettings();
            let text = `╭───[ 🔐 PRIVACY ]───\n`;
            text += `├ 👁️ Last Seen: ${settings.lastSeen || 'N/A'}\n`;
            text += `├ 🟢 Online: ${settings.online || 'N/A'}\n`;
            text += `├ 🖼️ Profile Pic: ${settings.profilePicture || 'N/A'}\n`;
            text += `├ 📱 Status: ${settings.status || 'N/A'}\n`;
            text += `├ ✅ Read Receipts: ${settings.readReceipts || 'N/A'}\n`;
            text += `╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// MESSAGING
// ═══════════════════════════════════════════

// 17. EDIT MESSAGE
commands.push({
    name: 'edit', description: 'Edit bot\'s last message',
    aliases: ['editmsg', 'editmessage'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`✏️ *EDIT MESSAGE*\n\n*Usage:* ${config.PREFIX}edit <new text>\n\nEdits the bot's last sent message.\n\n${FOOTER}`);
        }
        await react('✏️');
        try {
            const sentMsg = await sock.sendMessage(from, { text: args.join(' ') }, { quoted: msg });
            // The edit happens by sending with edit key... 
            // For now, we send a new message as WhatsApp edit requires original message key
            await sendButtonsMsg(sock, from, `✏️ *Message Sent*\n\n${args.join(' ')}\n\nNote: WhatsApp edit requires the original message key. This sends a new message.\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 18. FORWARD MESSAGE
commands.push({
    name: 'forward', description: 'Forward replied message to a number',
    aliases: ['fw', 'forwardmsg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        if (!args.length || !quoted) {
            await react('ℹ️');
            return reply(`↗️ *FORWARD*\n\n*Usage:* Reply to a message with ${config.PREFIX}forward <phone number>\n*Example:* ${config.PREFIX}forward 254700000000\n\n${FOOTER}`);
        }
        await react('↗️');
        try {
            const phone = extractPhone(args[0]);
            if (!phone || phone.length < 10) return reply(`❌ *Invalid phone number*\n\n${FOOTER}`);

            const targetJid = `${phone}@s.whatsapp.net`;
            const { generateForwardMessageContent } = require('gifted-baileys');
            const forwardContent = generateForwardMessageContent(quoted, false);
            await sock.sendMessage(targetJid, forwardContent);

            await sendButtonsMsg(sock, from, `↗️ *Message Forwarded*\n\n📞 To: +${phone}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 19. PIN MESSAGE (in chat)
commands.push({
    name: 'pinmsg', description: 'Pin a replied message in chat',
    aliases: ['pinmessage', 'star'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        if (!quoted) {
            await react('ℹ️');
            return reply(`📌 *PIN MESSAGE*\n\n*Usage:* Reply to a message with ${config.PREFIX}pinmsg [duration in hours]\n*Example:* ${config.PREFIX}pinmsg 24\n\n${FOOTER}`);
        }
        const duration = parseInt(args[0]) || 24;
        await react('📌');
        try {
            const pinKey = quoted.key || quoted;
            await sock.sendMessage(from, {
                pin: {
                    type: 1,
                    time: duration * 3600
                }
            });
            await sendButtonsMsg(sock, from, `📌 *Message Pinned*\n\n⏰ Duration: ${duration} hour(s)\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// USER QUERIES
// ═══════════════════════════════════════════

// 20. CHECK WHATSAPP
commands.push({
    name: 'checkwa', description: 'Check if a number exists on WhatsApp',
    aliases: ['onwhatsapp', 'checknumber', 'waexists'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🔍 *CHECK WHATSAPP*\n\n*Usage:* ${config.PREFIX}checkwa <phone number>\n*Example:* ${config.PREFIX}checkwa 254700000000\n\n${FOOTER}`);
        }
        await react('🔍');
        try {
            const phone = extractPhone(args[0]);
            if (!phone || phone.length < 10) return reply(`❌ *Invalid phone number*\n\n${FOOTER}`);

            const [result] = await sock.onWhatsApp(phone);
            if (result?.exists) {
                await sendButtonsMsg(sock, from, `✅ *WhatsApp User Found*\n\n📞 +${phone}\n🆔 ${result.jid}\n\nUser exists on WhatsApp!\n\n${FOOTER}`, msg);
            } else {
                await sendButtonsMsg(sock, from, `❌ *Not on WhatsApp*\n\n📞 +${phone}\n\nThis number is not registered on WhatsApp.\n\n${FOOTER}`, msg);
            }
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// 21. BUSINESS PROFILE
commands.push({
    name: 'business', description: 'Get WhatsApp business profile',
    aliases: ['businessprofile', 'bizprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const target = args.length ? `${extractPhone(args[0])}@s.whatsapp.net` : sender;
        if (!target || !target.includes('@')) {
            await react('ℹ️');
            return reply(`🏢 *BUSINESS PROFILE*\n\n*Usage:* ${config.PREFIX}business <phone>\nOr just ${config.PREFIX}business for your own\n\n${FOOTER}`);
        }
        await react('🏢');
        try {
            const profile = await sock.getBusinessProfile(target);
            let text = `╭───[ 🏢 BUSINESS ]───\n`;
            text += `├ 📛 ${profile.description || 'N/A'}\n`;
            if (profile.website) text += `├ 🌐 ${profile.website}\n`;
            if (profile.email) text += `├ 📧 ${profile.email}\n`;
            if (profile.category) text += `├ 📂 ${profile.category}\n`;
            if (profile.address) text += `├ 📍 ${profile.address}\n`;
            text += `╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Not a business profile*\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// HELP
// ═══════════════════════════════════════════

// 22. CHAT HELP
commands.push({
    name: 'chathelp', description: 'Show all chat & privacy commands',
    aliases: ['chat', 'chats', 'chatmenu'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `╭───[ 💬 CHAT COMMANDS ]───\n\n` +
            `├ *📍 LOCATION & CONTACT*\n├ ${p}sendloc | ${p}sendcontact\n\n` +
            `├ *📌 CHAT MANAGEMENT*\n├ ${p}pin | ${p}unpin | ${p}archive\n├ ${p}unarchive | ${p}clearchat\n├ ${p}markunread | ${p}mutechat\n├ ${p}unmutechat\n\n` +
            `├ *🔐 PRIVACY*\n├ ${p}lastseen | ${p}onlineprivacy\n├ ${p}ppprivacy | ${p}statusprivacy\n├ ${p}readreceipts | ${p}getprivacy\n\n` +
            `├ *✉️ MESSAGING*\n├ ${p}edit | ${p}forward | ${p}pinmsg\n\n` +
            `├ *🔍 USER QUERIES*\n├ ${p}checkwa | ${p}business\n\n` +
            `╰───◇\n📡 Gifted-Baileys\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
