// Megan-Prime Group Commands - Complete Rewrite with Proper Tagging
const GroupHelper = require('../../megan/helpers/groupHelper');
const config = require('../../megan/config');
const { downloadMediaMessage } = require('gifted-baileys');
const { resolveRealJid } = require('../../megan/lib/lidResolver');

const MEGAN_LOGO = 'https://files.catbox.moe/0v8bkv.png';
const FOOTER = '> Megan-Prime | TrackerWanga';
const commands = [];

// ==================== HELPERS ====================
async function sendWithLogo(sock, to, text, quoted = null) {
    try {
        await sock.sendMessage(to, { image: { url: MEGAN_LOGO }, caption: text }, { quoted });
    } catch (e) {
        await sock.sendMessage(to, { text }, { quoted });
    }
}

function reply(sock, to, text, quoted = null) {
    return sock.sendMessage(to, { text }, { quoted });
}

function extractPhone(input) {
    if (!input) return null;
    return input.replace(/[^0-9]/g, '') || null;
}

function getJidFromMention(msg, input) {
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    const phone = extractPhone(input);
    if (phone && phone.length >= 10) return `${phone}@s.whatsapp.net`;
    return null;
}

// Get display name - shows FULL number, not truncated
async function getDisplayName(sock, jid) {
    if (!jid) return 'Unknown';
    // Resolve LIDs to real JIDs
    if (jid.endsWith('@lid')) {
        try {
            const realJid = await resolveRealJid(sock, jid);
            if (realJid && !realJid.endsWith('@lid')) jid = realJid;
        } catch(e) {}
    }
    // Try contact name
    try {
        if (sock && jid.endsWith('@s.whatsapp.net')) {
            const contact = await sock.getContact(jid);
            if (contact?.name) return contact.name;
            if (contact?.notify) return contact.notify;
        }
    } catch(e) {}
    // Fallback: show FULL phone number
    const num = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    return `+${num}`;
}

async function getDisplayNames(sock, jids) {
    const names = {};
    for (const jid of jids) {
        names[jid] = await getDisplayName(sock, jid);
    }
    return names;
}

// ==================== CREATION & INFO ====================

// 1. CREATE GROUP
commands.push({
    name: 'creategroup', description: 'Create a new WhatsApp group',
    aliases: ['creategc', 'newgroup'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (args.length < 1) { await react('❌'); return reply(sock, from, `📝 *CREATE GROUP*\n\nUsage: ${config.PREFIX}creategroup <name> [phone numbers]\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const groupName = args[0];
            const participants = [`${config.OWNER_NUMBER}@s.whatsapp.net`];
            for (let i = 1; i < args.length; i++) {
                const phone = extractPhone(args[i]);
                if (phone && phone.length >= 10) participants.push(`${phone}@s.whatsapp.net`);
            }
            const group = await sock.groupCreate(groupName, participants);
            await sendWithLogo(sock, from, `✅ *GROUP CREATED*\n\n📛 *Name:* ${groupName}\n👥 *Members:* ${participants.length}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 2. CREATE GROUP WITH ADD
commands.push({
    name: 'creategcadd', description: 'Create group and add members immediately',
    aliases: ['newgroupadd'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (args.length < 2) { await react('❌'); return reply(sock, from, `📝 *CREATE GROUP WITH ADD*\n\nUsage: ${config.PREFIX}creategcadd <name> <phone1> <phone2>...\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const groupName = args[0];
            const participants = [`${config.OWNER_NUMBER}@s.whatsapp.net`];
            for (let i = 1; i < args.length; i++) {
                const phone = extractPhone(args[i]);
                if (phone && phone.length >= 10) participants.push(`${phone}@s.whatsapp.net`);
            }
            const group = await sock.groupCreate(groupName, participants);
            setTimeout(async () => {
                await sock.sendMessage(group.id, { text: `🎉 *Welcome to ${groupName}!*\n\nUse ${config.PREFIX}help for commands.\n\n${FOOTER}`, mentions: participants });
            }, 2000);
            await sendWithLogo(sock, from, `✅ *GROUP CREATED*\n\n📛 *Name:* ${groupName}\n👥 *Members Added:* ${participants.length}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 3. GROUP INFO
commands.push({
    name: 'groupinfo', description: 'Get detailed group information',
    aliases: ['ginfo', 'infogc'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        let targetGroup = from;
        if (args.length > 0) {
            const link = args[0];
            if (link.includes('chat.whatsapp.com')) {
                const code = GroupHelper.extractGroupCode(link);
                try { const data = await sock.groupGetInviteInfo(code); targetGroup = data.id; }
                catch (e) { await react('❌'); return reply(sock, from, `❌ *Invalid invite link!*\n\n${FOOTER}`, msg); }
            } else {
                targetGroup = link.endsWith('@g.us') ? link : `${link}@g.us`;
            }
        }
        if (!GroupHelper.isGroupJid(targetGroup)) { await react('❌'); return reply(sock, from, `❌ *Invalid group!*\n\n${FOOTER}`, msg); }
        await react('ℹ️');
        try {
            const metadata = await sock.groupMetadata(targetGroup);
            const info = GroupHelper.formatGroupInfo(metadata);
            await sendWithLogo(sock, from, info, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 4. LIST GROUPS
commands.push({
    name: 'groups', description: 'List all groups bot is in',
    aliases: ['grouplist', 'mygroups'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        await react('📋');
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            if (groupList.length === 0) return reply(sock, from, `❌ *Bot is not in any groups.*\n\n${FOOTER}`, msg);
            let list = `*📋 MY GROUPS (${groupList.length})*\n\n`;
            for (let i = 0; i < Math.min(groupList.length, 15); i++) {
                const g = groupList[i];
                list += `${i + 1}. *${g.subject}*\n   👥 ${g.participants.length} members\n   🆔 ${g.id.split('@')[0]}\n\n`;
            }
            if (groupList.length > 15) list += `... and ${groupList.length - 15} more\n`;
            list += `${FOOTER}`;
            await sendWithLogo(sock, from, list, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 5. METADATA (from link)
commands.push({
    name: 'metadata', description: 'Get group info from invite link',
    aliases: ['groupmeta', 'linkinfo'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 *METADATA*\n\nUsage: ${config.PREFIX}metadata <invite link>\n\n${FOOTER}`, msg); }
        await react('🔍');
        try {
            const link = args[0];
            if (!link.includes('chat.whatsapp.com')) return reply(sock, from, `❌ *Invalid WhatsApp link!*\n\n${FOOTER}`, msg);
            const code = GroupHelper.extractGroupCode(link);
            const data = await sock.groupGetInviteInfo(code);
            await sendWithLogo(sock, from, `📌 *GROUP PREVIEW*\n\n📛 *Name:* ${data.subject || 'Unknown'}\n👥 *Members:* ${data.size || '?'}\n👑 *Owner:* ${data.owner ? '+' + data.owner.split('@')[0] : 'Unknown'}\n📝 *Desc:* ${(data.desc || 'None').substring(0, 200)}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Invalid or expired link!*\n\n${FOOTER}`, msg); }
    }
});

// 6. PARTICIPANTS
commands.push({
    name: 'participants', description: 'List all group participants with names',
    aliases: ['members', 'memberlist'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('📋');
        try {
            const metadata = await sock.groupMetadata(from);
            const { superAdmins, admins, members } = GroupHelper.categorizeParticipants(metadata.participants);
            const allJids = [...superAdmins, ...admins, ...members].slice(0, 25).map(p => p.jid);
            const names = await getDisplayNames(sock, allJids);
            
            let result = `*📋 PARTICIPANTS (${metadata.participants.length})*\n\n`;
            if (superAdmins.length > 0) {
                result += `*👑 Super Admins (${superAdmins.length})*\n`;
                for (const sa of superAdmins) result += `• ${names[sa.jid] || sa.display}\n`;
                result += '\n';
            }
            if (admins.length > 0) {
                result += `*👮 Admins (${admins.length})*\n`;
                for (const a of admins) result += `• ${names[a.jid] || a.display}\n`;
                result += '\n';
            }
            result += `*👤 Members (${members.length})*\n`;
            const showMembers = members.slice(0, 15);
            for (const m of showMembers) result += `• ${names[m.jid] || m.display}\n`;
            if (members.length > 15) result += `... and ${members.length - 15} more\n`;
            result += `\n${FOOTER}`;
            await sendWithLogo(sock, from, result, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 7. ADMINS LIST
commands.push({
    name: 'admins', description: 'List all group admins',
    aliases: ['adminlist', 'gadmins'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('👑');
        try {
            const metadata = await sock.groupMetadata(from);
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            if (admins.length === 0) return reply(sock, from, `⚠️ *No admins found!*\n\n${FOOTER}`, msg);
            const jids = admins.map(a => a.id);
            const names = await getDisplayNames(sock, jids);
            let result = `*👑 GROUP ADMINS (${admins.length})*\n\n`;
            for (let i = 0; i < admins.length; i++) {
                const role = admins[i].admin === 'superadmin' ? '👑' : '👮';
                result += `${i + 1}. ${role} ${names[admins[i].id] || GroupHelper.formatJid(admins[i].id)}\n`;
            }
            result += `\n${FOOTER}`;
            await sendWithLogo(sock, from, result, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// ==================== MEMBER MANAGEMENT ====================

// 8. LEAVE GROUP
commands.push({
    name: 'leave', description: 'Leave a group',
    aliases: ['exit', 'leavegc'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        let targetGroup = from;
        if (!GroupHelper.isGroupJid(from) && args.length > 0) {
            const link = args[0];
            if (link.includes('chat.whatsapp.com')) {
                const code = GroupHelper.extractGroupCode(link);
                try { const data = await sock.groupGetInviteInfo(code); targetGroup = data.id; }
                catch (e) { await react('❌'); return reply(sock, from, `❌ *Invalid link!*\n\n${FOOTER}`, msg); }
            }
        }
        if (!GroupHelper.isGroupJid(targetGroup)) { await react('❌'); return reply(sock, from, `❌ *Use in a group or provide a valid link!*\n\n${FOOTER}`, msg); }
        await react('👋');
        try { await sock.groupLeave(targetGroup); await react('✅'); }
        catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 9. ADD MEMBERS
commands.push({
    name: 'add', description: 'Add members to group (Admin only)',
    aliases: ['addmember'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (args.length === 0 && !msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            await react('❌'); return reply(sock, from, `📝 *ADD MEMBERS*\n\nUsage: ${config.PREFIX}add @user or ${config.PREFIX}add 254700000000\n\n${FOOTER}`, msg);
        }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins can add members!*\n\n${FOOTER}`, msg);
            }
            const participants = [];
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            participants.push(...mentions);
            for (const arg of args) {
                const jid = GroupHelper.getJidFromInput(msg, arg);
                if (jid && !participants.includes(jid)) participants.push(jid);
            }
            if (participants.length === 0) return reply(sock, from, `❌ *No valid participants!*\n\n${FOOTER}`, msg);
            const results = await sock.groupParticipantsUpdate(from, participants, 'add');
            await sendWithLogo(sock, from, GroupHelper.formatActionResult('add', results), msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 10. KICK MEMBERS
commands.push({
    name: 'kick', description: 'Remove members from group (Admin only)',
    aliases: ['remove', 'rm'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            const participants = [];
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            participants.push(...mentions);
            for (const arg of args) {
                const jid = GroupHelper.getJidFromInput(msg, arg);
                if (jid && !participants.includes(jid)) participants.push(jid);
            }
            if (participants.length === 0) return reply(sock, from, `❌ *No participants specified!*\n\n${FOOTER}`, msg);
            const results = await sock.groupParticipantsUpdate(from, participants, 'remove');
            await sendWithLogo(sock, from, GroupHelper.formatActionResult('remove', results), msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 11. PROMOTE
commands.push({
    name: 'promote', description: 'Promote members to admin (Admin only)',
    aliases: ['makeadmin'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            const participants = [];
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            participants.push(...mentions);
            for (const arg of args) {
                const jid = GroupHelper.getJidFromInput(msg, arg);
                if (jid && !participants.includes(jid)) participants.push(jid);
            }
            if (participants.length === 0) return reply(sock, from, `❌ *No members specified!*\n\n${FOOTER}`, msg);
            const results = await sock.groupParticipantsUpdate(from, participants, 'promote');
            await sendWithLogo(sock, from, GroupHelper.formatActionResult('promote', results), msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 12. DEMOTE
commands.push({
    name: 'demote', description: 'Demote admins to members (Admin only)',
    aliases: ['removeadmin'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            const participants = [];
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            participants.push(...mentions);
            for (const arg of args) {
                const jid = GroupHelper.getJidFromInput(msg, arg);
                if (jid && !participants.includes(jid)) participants.push(jid);
            }
            if (participants.length === 0) return reply(sock, from, `❌ *No admins specified!*\n\n${FOOTER}`, msg);
            const results = await sock.groupParticipantsUpdate(from, participants, 'demote');
            await sendWithLogo(sock, from, GroupHelper.formatActionResult('demote', results), msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// ==================== INVITES ====================

// 13. INVITE LINK
commands.push({
    name: 'invite', description: 'Get group invite link',
    aliases: ['link', 'gclink'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔗');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            const code = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            await sendWithLogo(sock, from, `🔗 *INVITE LINK*\n\n📛 *Group:* ${metadata.subject}\n🔗 *Link:* ${link}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) {
            await react('❌');
            const errMsg = error.message?.includes('not-authorized') ? '❌ *Bot is not an admin!*' : `❌ *Error:* ${error.message}`;
            reply(sock, from, `${errMsg}\n\n${FOOTER}`, msg);
        }
    }
});

// 14. REVOKE LINK
commands.push({
    name: 'revoke', description: 'Revoke and generate new invite link',
    aliases: ['revokelink', 'newlink'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupRevokeInvite(from);
            const newCode = await sock.groupInviteCode(from);
            await sendWithLogo(sock, from, `✅ *LINK REVOKED*\n\n📛 *Group:* ${metadata.subject}\n🔗 *New Link:* https://chat.whatsapp.com/${newCode}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 15. JOIN GROUP
commands.push({
    name: 'join', description: 'Join a group using invite link',
    aliases: ['joingroup'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (args.length === 0 && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
            const linkMatch = quotedText.match(/(https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]+/);
            if (linkMatch) args = [linkMatch[0]];
        }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 *JOIN GROUP*\n\nUsage: ${config.PREFIX}join <invite link>\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const link = args[0];
            if (!link.includes('chat.whatsapp.com')) return reply(sock, from, `❌ *Invalid WhatsApp group link!*\n\n${FOOTER}`, msg);
            const code = GroupHelper.extractGroupCode(link);
            const result = await sock.groupAcceptInvite(code);
            await sendWithLogo(sock, from, `✅ *JOINED GROUP*\n\n🆔 *ID:* ${result.split('@')[0]}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 16. INVITE INFO
commands.push({
    name: 'inviteinfo', description: 'Preview group from invite link',
    aliases: ['linkinfo', 'groupreview'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 *INVITE INFO*\n\nUsage: ${config.PREFIX}inviteinfo <link>\n\n${FOOTER}`, msg); }
        await react('🔍');
        try {
            const link = args[0];
            if (!link.includes('chat.whatsapp.com')) return reply(sock, from, `❌ *Invalid link!*\n\n${FOOTER}`, msg);
            const code = GroupHelper.extractGroupCode(link);
            const data = await sock.groupGetInviteInfo(code);
            await sendWithLogo(sock, from, `🔍 *GROUP PREVIEW*\n\n📛 *Name:* ${data.subject || 'Unknown'}\n👥 *Members:* ${data.size || '?'}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Invalid or expired link!*\n\n${FOOTER}`, msg); }
    }
});

// ==================== TAGGING ====================

// 17. TAG ALL - Tag everyone with message or reply
commands.push({
    name: 'tag', description: 'Tag everyone with message or reply',
    aliases: ['tagall', 'everyone', 'all'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('📢');
        try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants;
            
            // Get valid JIDs for mentions (exclude LIDs)
            const mentionJids = [];
            const displayList = [];
            
            for (const p of participants) {
                // Resolve LIDs to real JIDs
                let jid = p.id;
                if (jid.endsWith('@lid')) {
                    try {
                        const resolved = await resolveRealJid(sock, jid);
                        if (resolved && resolved.endsWith('@s.whatsapp.net')) jid = resolved;
                    } catch(e) {}
                }
                if (jid.endsWith('@s.whatsapp.net') && !mentionJids.includes(jid)) {
                    mentionJids.push(jid);
                }
                
                // For display, get name
                const num = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                const role = p.admin === 'superadmin' ? '👑' : p.admin === 'admin' ? '👮' : '';
                displayList.push({ num, role });
            }
            
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const messageText = args.length > 0 ? args.join(' ') : (quoted ? '📢 Look at this!' : '📢 Attention everyone!');
            
            // Send the tag with mentions (max 2 messages)
            // First: the actual mention message
            await sock.sendMessage(from, { text: messageText, mentions: mentionJids }, { quoted: msg });
            
            // Second: summary
            let summary = `*📢 TAG SENT*\n\n👥 Tagged: ${mentionJids.length} members\n\n`;
            for (let i = 0; i < Math.min(displayList.length, 10); i++) {
                const d = displayList[i];
                summary += `${i + 1}. ${d.role} @${d.num}\n`;
            }
            if (displayList.length > 10) summary += `... and ${displayList.length - 10} more\n`;
            summary += `\n${FOOTER}`;
            
            await sock.sendMessage(from, { text: summary }, { quoted: msg });
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 18. HIDE TAG - Secretly tag everyone
commands.push({
    name: 'hidetag', description: 'Secretly tag everyone',
    aliases: ['htag', 'hidden'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 *HIDE TAG*\n\nUsage: ${config.PREFIX}hidetag <message>\n\n${FOOTER}`, msg); }
        await react('🕵️');
        try {
            const metadata = await sock.groupMetadata(from);
            const mentionJids = [];
            for (const p of metadata.participants) {
                let jid = p.id;
                if (jid.endsWith('@lid')) {
                    try { const resolved = await resolveRealJid(sock, jid); if (resolved && resolved.endsWith('@s.whatsapp.net')) jid = resolved; }
                    catch(e) {}
                }
                if (jid.endsWith('@s.whatsapp.net') && !mentionJids.includes(jid)) mentionJids.push(jid);
            }
            const messageText = args.join(' ');
            // Send a blank message with mentions (hidden tag)
            await sock.sendMessage(from, { text: '\u200E', mentions: mentionJids }, { quoted: msg });
            await sendWithLogo(sock, from, `🕵️ *HIDDEN TAG SENT*\n\n📝 "${messageText}"\n👥 Tagged: ${mentionJids.length} members\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 19. ANNOUNCE - Announcement tagging all
commands.push({
    name: 'announce', description: 'Make an announcement tagging all members',
    aliases: ['ann', 'broadcast'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📢 *ANNOUNCE*\n\nUsage: ${config.PREFIX}announce <message>\n\n${FOOTER}`, msg); }
        await react('📢');
        try {
            const metadata = await sock.groupMetadata(from);
            const mentionJids = [];
            for (const p of metadata.participants) {
                let jid = p.id;
                if (jid.endsWith('@lid')) {
                    try { const resolved = await resolveRealJid(sock, jid); if (resolved && resolved.endsWith('@s.whatsapp.net')) jid = resolved; }
                    catch(e) {}
                }
                if (jid.endsWith('@s.whatsapp.net') && !mentionJids.includes(jid)) mentionJids.push(jid);
            }
            const message = args.join(' ');
            const announceText = `📢 *ANNOUNCEMENT*\n\n${message}\n\n${FOOTER}`;
            await sock.sendMessage(from, { text: announceText, mentions: mentionJids }, { quoted: msg });
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 20. TAG ADMINS
commands.push({
    name: 'tagadmins', description: 'Tag all group admins',
    aliases: ['admintag'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('👑');
        try {
            const metadata = await sock.groupMetadata(from);
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            if (admins.length === 0) return reply(sock, from, `⚠️ *No admins found!*\n\n${FOOTER}`, msg);
            
            const adminJids = [];
            for (const a of admins) {
                let jid = a.id;
                if (jid.endsWith('@lid')) {
                    try { const resolved = await resolveRealJid(sock, jid); if (resolved && resolved.endsWith('@s.whatsapp.net')) jid = resolved; }
                    catch(e) {}
                }
                if (jid.endsWith('@s.whatsapp.net') && !adminJids.includes(jid)) adminJids.push(jid);
            }
            
            const messageText = args.length > 0 ? args.join(' ') : '📢 Attention admins!';
            await sock.sendMessage(from, { text: messageText, mentions: adminJids }, { quoted: msg });
            
            let adminList = '';
            for (const jid of adminJids) {
                const num = jid.split('@')[0].replace(/[^0-9]/g, '');
                adminList += `• @${num}\n`;
            }
            await sendWithLogo(sock, from, `*ADMIN TAG SENT*\n\n📝 "${messageText}"\n👑 Admins tagged:\n${adminList}\n${FOOTER}`, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 21. ANTI-TAG
commands.push({
    name: 'antitag', description: 'Block users from tagging owner (Owner Only)',
    aliases: ['blocktag', 'nomention'],
    async execute({ msg, from, sender, args, bot, sock, react, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(sock, from, `❌ *Owner Only*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const current = await bot.db.getSetting('antitag', 'off');
            await react('ℹ️');
            return reply(sock, from, `🚫 *ANTI-TAG*\n\nCurrent: *${current === 'on' ? 'ON' : 'OFF'}*\n\nUsage: ${config.PREFIX}antitag on/off\n\n${FOOTER}`, msg);
        }
        const option = args[0].toLowerCase();
        if (!['on', 'off'].includes(option)) { await react('❌'); return reply(sock, from, `❌ Use: on or off\n\n${FOOTER}`, msg); }
        await bot.db.setSetting('antitag', option);
        await react('✅');
        await reply(sock, from, `✅ *Anti-Tag ${option === 'on' ? 'enabled' : 'disabled'}*\n\n${FOOTER}`, msg);
    }
});

// ==================== SETTINGS ====================

// 22. SET NAME
commands.push({
    name: 'setname', description: 'Change group name (Admin only)',
    aliases: ['setgcname'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}setname <name>\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupUpdateSubject(from, args.join(' '));
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Name updated!*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 23. SET DESC
commands.push({
    name: 'setdesc', description: 'Change group description (Admin only)',
    aliases: ['setdescription'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}setdesc <desc>\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupUpdateDescription(from, args.join(' '));
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Description updated!*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 24. LOCK
commands.push({
    name: 'lock', description: 'Lock group (admins only can send)',
    aliases: ['lockgc'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔒');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupSettingUpdate(from, 'announcement');
            await react('✅');
            await sendWithLogo(sock, from, `🔒 *GROUP LOCKED*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 25. UNLOCK
commands.push({
    name: 'unlock', description: 'Unlock group',
    aliases: ['unlockgc'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔓');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupSettingUpdate(from, 'not_announcement');
            await react('✅');
            await sendWithLogo(sock, from, `🔓 *GROUP UNLOCKED*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 26. LOCK INFO
commands.push({
    name: 'lockinfo', description: 'Lock group info editing',
    aliases: ['lockedit'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔒');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupSettingUpdate(from, 'locked');
            await react('✅');
            await sendWithLogo(sock, from, `🔒 *INFO LOCKED*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 27. UNLOCK INFO
commands.push({
    name: 'unlockinfo', description: 'Unlock group info editing',
    aliases: ['unlockedit'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🔓');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupSettingUpdate(from, 'unlocked');
            await react('✅');
            await sendWithLogo(sock, from, `🔓 *INFO UNLOCKED*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 28. DISAPPEAR
commands.push({
    name: 'disappear', description: 'Set disappearing messages',
    aliases: ['ephemeral'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `⏱️ Usage: ${config.PREFIX}disappear 24h/7d/90d/off\n\n${FOOTER}`, msg); }
        await react('⏱️');
        try {
            const option = args[0].toLowerCase();
            let expiration = 0, text = 'off';
            if (option === '24h') { expiration = 86400; text = '24 hours'; }
            else if (option === '7d') { expiration = 604800; text = '7 days'; }
            else if (option === '90d') { expiration = 7776000; text = '90 days'; }
            await sock.groupToggleEphemeral(from, expiration);
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Disappearing: ${text}*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 29. ADD MODE
commands.push({
    name: 'addmode', description: 'Set who can add members',
    aliases: ['memberaddmode'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length || !['all', 'admins'].includes(args[0].toLowerCase())) {
            await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}addmode all/admins\n\n${FOOTER}`, msg);
        }
        await react('🔄');
        try {
            const mode = args[0].toLowerCase() === 'all' ? 'all_member_add' : 'admin_add';
            await sock.groupMemberAddMode(from, mode);
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Add mode: ${args[0]}*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// ==================== INTERACTIVE ====================

// 30. POLL
commands.push({
    name: 'poll', description: 'Create a poll',
    aliases: ['createpoll'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (args.length < 3) { await react('❌'); return reply(sock, from, `📊 Usage: ${config.PREFIX}poll "Q" "A" "B"...\n\n${FOOTER}`, msg); }
        await react('📊');
        try {
            const parsed = GroupHelper.parsePollArgs(args);
            if (parsed.length < 2) return reply(sock, from, `❌ *At least 2 options!*\n\n${FOOTER}`, msg);
            await sock.sendMessage(from, { poll: { name: parsed[0], values: parsed.slice(1), selectableCount: 1 } });
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 31. MULTI-POLL
commands.push({
    name: 'multipoll', description: 'Create multi-select poll',
    aliases: ['mpoll'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (args.length < 4) { await react('❌'); return reply(sock, from, `📊 Usage: ${config.PREFIX}multipoll "Q" "A" "B" [max]\n\n${FOOTER}`, msg); }
        await react('📊');
        try {
            const parsed = GroupHelper.parsePollArgs(args);
            let count = 1;
            const last = parsed[parsed.length - 1];
            if (!isNaN(last)) { count = parseInt(last); parsed.pop(); }
            if (parsed.length < 2) return reply(sock, from, `❌ *At least 2 options!*\n\n${FOOTER}`, msg);
            await sock.sendMessage(from, { poll: { name: parsed[0], values: parsed.slice(1), selectableCount: count } });
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 32. GROUP STATUS
commands.push({
    name: 'gstatus', description: 'Send group story/status',
    aliases: ['groupstatus'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const hasImage = msg.message?.imageMessage || quoted?.imageMessage;
        const hasVideo = msg.message?.videoMessage || quoted?.videoMessage;
        if (!args.length && !hasImage && !hasVideo) { await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}gstatus <text> or reply to media\n\n${FOOTER}`, msg); }
        await react('🔄');
        try {
            if (args.length > 0) {
                await sock.sendMessage(from, { groupStatusMessage: { text: args.join(' ') } });
            } else if (hasImage || hasVideo) {
                const targetMsg = msg.message?.imageMessage || msg.message?.videoMessage ? msg : { ...msg, message: quoted };
                const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console });
                const content = {};
                if (hasImage) content.image = buffer;
                if (hasVideo) content.video = buffer;
                await sock.sendMessage(from, { groupStatusMessage: content });
            }
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 33. REQUESTS
commands.push({
    name: 'requests', description: 'List pending join requests',
    aliases: ['joinrequests', 'pending'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('📋');
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests || requests.length === 0) return reply(sock, from, `📋 *No pending requests.*\n\n${FOOTER}`, msg);
            let list = `*📋 PENDING (${requests.length})*\n\n`;
            for (let i = 0; i < requests.length; i++) {
                list += `${i + 1}. ${GroupHelper.formatJid(requests[i].jid)}\n`;
            }
            list += `\n${config.PREFIX}approve <n> | ${config.PREFIX}reject <n>\n\n${FOOTER}`;
            await sendWithLogo(sock, from, list, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 34. APPROVE
commands.push({
    name: 'approve', description: 'Approve join request',
    aliases: ['accept'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}approve <number>\n\n${FOOTER}`, msg); }
        await react('✅');
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= requests.length) return reply(sock, from, `❌ *Invalid number!*\n\n${FOOTER}`, msg);
            await sock.groupRequestParticipantsUpdate(from, [requests[index].jid], 'approve');
            await react('✅');
            await sendWithLogo(sock, from, `✅ *Approved!*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 35. REJECT
commands.push({
    name: 'reject', description: 'Reject join request',
    aliases: ['deny'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `📝 Usage: ${config.PREFIX}reject <number>\n\n${FOOTER}`, msg); }
        await react('❌');
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            const index = parseInt(args[0]) - 1;
            if (isNaN(index) || index < 0 || index >= requests.length) return reply(sock, from, `❌ *Invalid number!*\n\n${FOOTER}`, msg);
            await sock.groupRequestParticipantsUpdate(from, [requests[index].jid], 'reject');
            await react('✅');
            await sendWithLogo(sock, from, `❌ *Rejected!*\n\n${FOOTER}`, msg);
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 36. WELCOME
commands.push({
    name: 'welcome', description: 'Toggle welcome messages',
    aliases: ['greet'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const current = await bot.db.getSetting(`welcome_${from}`, 'off');
            await react('ℹ️');
            return reply(sock, from, `👋 *WELCOME: ${current === 'on' ? 'ON' : 'OFF'}*\n\nUsage: ${config.PREFIX}welcome on/off\n\n${FOOTER}`, msg);
        }
        if (!['on', 'off'].includes(args[0].toLowerCase())) { await react('❌'); return reply(sock, from, `❌ on/off\n\n${FOOTER}`, msg); }
        await bot.db.setSetting(`welcome_${from}`, args[0].toLowerCase());
        await react('✅');
        await reply(sock, from, `✅ *Welcome ${args[0].toLowerCase()}*\n\n${FOOTER}`, msg);
    }
});

// 37. SET WELCOME
commands.push({
    name: 'setwelcome', description: 'Set welcome message',
    aliases: ['welcomemsg'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const current = await bot.db.getSetting(`welcomemsg_${from}`, 'Hey @user welcome! 👋');
            await react('ℹ️');
            return reply(sock, from, `👋 Current: "${current}"\n\nUsage: ${config.PREFIX}setwelcome <msg>\n@user = name\n\n${FOOTER}`, msg);
        }
        await bot.db.setSetting(`welcomemsg_${from}`, args.join(' '));
        await react('✅');
        await reply(sock, from, `✅ *Welcome message updated!*\n\n${FOOTER}`, msg);
    }
});

// 38. GOODBYE
commands.push({
    name: 'goodbye', description: 'Toggle goodbye messages',
    aliases: ['byemsg'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const current = await bot.db.getSetting(`goodbye_${from}`, 'off');
            await react('ℹ️');
            return reply(sock, from, `👋 *GOODBYE: ${current === 'on' ? 'ON' : 'OFF'}*\n\nUsage: ${config.PREFIX}goodbye on/off\n\n${FOOTER}`, msg);
        }
        if (!['on', 'off'].includes(args[0].toLowerCase())) { await react('❌'); return reply(sock, from, `❌ on/off\n\n${FOOTER}`, msg); }
        await bot.db.setSetting(`goodbye_${from}`, args[0].toLowerCase());
        await react('✅');
        await reply(sock, from, `✅ *Goodbye ${args[0].toLowerCase()}*\n\n${FOOTER}`, msg);
    }
});

// 39. SET GOODBYE
commands.push({
    name: 'setgoodbye', description: 'Set goodbye message',
    aliases: ['goodbyemsg'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const current = await bot.db.getSetting(`goodbyemsg_${from}`, 'Goodbye @user! 👋');
            await react('ℹ️');
            return reply(sock, from, `👋 Current: "${current}"\n\nUsage: ${config.PREFIX}setgoodbye <msg>\n@user = name\n\n${FOOTER}`, msg);
        }
        await bot.db.setSetting(`goodbyemsg_${from}`, args.join(' '));
        await react('✅');
        await reply(sock, from, `✅ *Goodbye message updated!*\n\n${FOOTER}`, msg);
    }
});

// 40. GROUP STATS
commands.push({
    name: 'groupstats', description: 'Show group statistics',
    aliases: ['gcstats'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('📊');
        try {
            const metadata = await sock.groupMetadata(from);
            const ageDays = Math.floor((Date.now() - metadata.creation * 1000) / 86400000);
            let stats = `📊 *GROUP STATS*\n\n📛 ${metadata.subject}\n👥 ${metadata.participants.length} members\n📅 ${ageDays} days old\n👑 ${metadata.participants.filter(p=>p.admin).length} admins\n🔒 ${metadata.announce === 'announcement' ? 'Locked' : 'Open'}\n\n${FOOTER}`;
            await sendWithLogo(sock, from, stats, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 41. GROUP RANK
commands.push({
    name: 'grouprank', description: 'Show member ranking',
    aliases: ['rank'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        await react('🏆');
        try {
            const metadata = await sock.groupMetadata(from);
            let rank = `🏆 *GROUP RANKING*\n\n👑 Owner/Admins:\n`;
            const admins = metadata.participants.filter(p => p.admin);
            const jids = admins.slice(0, 10).map(a => a.id);
            const names = await getDisplayNames(sock, jids);
            for (const a of admins.slice(0, 10)) {
                rank += `• ${names[a.id] || GroupHelper.formatJid(a.id)}\n`;
            }
            rank += `\n👥 Total: ${metadata.participants.length} members\n\n${FOOTER}`;
            await sendWithLogo(sock, from, rank, msg);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// 42. SILENT MODE
commands.push({
    name: 'groupsilent', description: 'Silent mode for X minutes',
    aliases: ['silent'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) { await react('❌'); return reply(sock, from, `🤫 Usage: ${config.PREFIX}groupsilent <minutes>\n\n${FOOTER}`, msg); }
        const minutes = parseInt(args[0]);
        if (isNaN(minutes) || minutes < 1 || minutes > 1440) { await react('❌'); return reply(sock, from, `❌ 1-1440 minutes\n\n${FOOTER}`, msg); }
        await react('🤫');
        try {
            const metadata = await sock.groupMetadata(from);
            if (!GroupHelper.canPerformAdminAction(metadata, sender, config.OWNER_NUMBER)) {
                await react('⚠️'); return reply(sock, from, `❌ *Only admins!*\n\n${FOOTER}`, msg);
            }
            await sock.groupSettingUpdate(from, 'announcement');
            await sendWithLogo(sock, from, `🤫 *SILENT MODE: ${minutes} min*\n\n🔒 Only admins can send\n\n${FOOTER}`, msg);
            setTimeout(async () => { try { await sock.groupSettingUpdate(from, 'not_announcement'); } catch(e) {} }, minutes * 60000);
            await react('✅');
        } catch (error) { await react('❌'); reply(sock, from, `❌ *Error:* ${error.message}\n\n${FOOTER}`, msg); }
    }
});

// ==================== ANTI-LINK ====================

// 43. ANTI-LINK GC
commands.push({
    name: 'antilinkgc', description: 'Toggle anti-link with actions',
    aliases: ['gcantilink', 'linkprotect'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const enabled = await bot.db.isGroupAntiLinkEnabled(from);
            const action = await bot.db.getSetting(`antilink_action_${from}`, 'delete');
            let status = `🔗 *ANTI-LINK*\n\nStatus: ${enabled ? '✅ ON' : '❌ OFF'}\nAction: ${action}\n\n*Options:* on/off/delete/warn/kick\n\n${FOOTER}`;
            await react('🔗');
            return sendWithLogo(sock, from, status, msg);
        }
        const action = args[0].toLowerCase();
        if (action === 'on') { await bot.db.enableGroupAntiLink(from); await react('✅'); return reply(sock, from, `✅ *Anti-Link ON*\n\n${FOOTER}`, msg); }
        if (action === 'off') { await bot.db.disableGroupAntiLink(from); await react('✅'); return reply(sock, from, `❌ *Anti-Link OFF*\n\n${FOOTER}`, msg); }
        const validActions = ['delete', 'warn', 'kick'];
        if (!validActions.includes(action)) { await react('❌'); return reply(sock, from, `❌ Invalid. Use: ${validActions.join(', ')}\n\n${FOOTER}`, msg); }
        await bot.db.enableGroupAntiLink(from);
        await bot.db.setSetting(`antilink_action_${from}`, action);
        await react('✅');
        await reply(sock, from, `✅ *Anti-Link: ${action}*\n\n${FOOTER}`, msg);
    }
});

// 44. ANTI-BOT
commands.push({
    name: 'antibot', description: 'Toggle anti-bot detection',
    aliases: ['botdetect', 'nobots'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        if (!GroupHelper.isGroupJid(from)) { await react('❌'); return reply(sock, from, `❌ *Group only!*\n\n${FOOTER}`, msg); }
        if (!args.length) {
            const enabled = await bot.db.getSetting(`antibot_${from}`, 'off');
            await react('🤖');
            return reply(sock, from, `🤖 *ANTI-BOT*\n\nStatus: ${enabled === 'off' ? '❌ OFF' : `✅ ${enabled}`}\n\nUsage: ${config.PREFIX}antibot off/warn/kick\n\n${FOOTER}`, msg);
        }
        const action = args[0].toLowerCase();
        if (!['off', 'warn', 'kick'].includes(action)) { await react('❌'); return reply(sock, from, `❌ Use: off, warn, kick\n\n${FOOTER}`, msg); }
        await bot.db.setSetting(`antibot_${from}`, action);
        await react('✅');
        await reply(sock, from, `✅ *Anti-Bot: ${action}*\n\n${FOOTER}`, msg);
    }
});

// ==================== HELP ====================

// 45. GROUP HELP
commands.push({
    name: 'grouphelp', description: 'Show all group commands',
    aliases: ['ghelp', 'group'],
    async execute({ msg, from, sender, args, bot, sock, react }) {
        const p = config.PREFIX;
        const help = `*👥 GROUP COMMANDS (44)*\n\n` +
            `*📋 CREATION & INFO*\n${p}creategroup | ${p}creategcadd | ${p}groupinfo\n${p}groups | ${p}metadata | ${p}participants\n${p}admins\n\n` +
            `*👤 MEMBER MANAGEMENT*\n${p}leave | ${p}add | ${p}kick\n${p}promote | ${p}demote\n\n` +
            `*🔗 INVITES*\n${p}invite | ${p}revoke | ${p}join\n${p}inviteinfo\n\n` +
            `*🏷️ TAGGING*\n${p}tag | ${p}hidetag | ${p}announce\n${p}tagadmins | ${p}antitag\n\n` +
            `*⚙️ SETTINGS*\n${p}setname | ${p}setdesc | ${p}lock\n${p}unlock | ${p}lockinfo | ${p}unlockinfo\n${p}disappear | ${p}addmode\n\n` +
            `*📊 INTERACTIVE*\n${p}poll | ${p}multipoll | ${p}gstatus\n\n` +
            `*👥 REQUESTS*\n${p}requests | ${p}approve | ${p}reject\n\n` +
            `*👋 WELCOME*\n${p}welcome | ${p}setwelcome\n${p}goodbye | ${p}setgoodbye\n\n` +
            `*🔗 MODERATION*\n${p}antilinkgc | ${p}antibot\n\n` +
            `*📊 STATS*\n${p}groupstats | ${p}grouprank\n${p}groupsilent\n\n${FOOTER}`;
        await sendWithLogo(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
