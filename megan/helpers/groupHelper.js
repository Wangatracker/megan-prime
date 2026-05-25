// Megan-Prime Group Helper - Complete with all utilities
const config = require('../config');

class GroupHelper {
    // Extract clean phone number from any format
    static extractPhone(input) {
        if (!input) return null;
        let phone = input.replace('@s.whatsapp.net', '');
        phone = phone.replace('@g.us', '');
        phone = phone.replace('@lid', '');
        phone = phone.replace('@', '');
        phone = phone.replace(/[^0-9]/g, '');
        return phone || null;
    }

    // Get JID from input (mention or phone number)
    static getJidFromInput(msg, input) {
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        const phone = this.extractPhone(input);
        if (phone && phone.length >= 10) {
            return `${phone}@s.whatsapp.net`;
        }
        return null;
    }

    // Format JID to readable name/number
    static formatJid(jid) {
        if (!jid) return 'Unknown';
        // For LIDs, show a shorter format
        if (jid.endsWith('@lid')) {
            const num = jid.split(':')[0].replace('@lid', '').replace(/[^0-9]/g, '');
            return `+${num.slice(0, 12)}`;
        }
        // For regular JIDs, extract phone number
        const number = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        return `+${number}`;
    }

    // Format participant list with display names
    static async formatParticipantList(participants, sock) {
        let list = '';
        
        // Try to get names for all participants
        for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            let display = this.formatJid(p.id);
            
            // Try to get push name or contact name
            try {
                if (sock) {
                    // Check if we have cached names
                    const jid = p.id;
                    if (jid && !jid.endsWith('@lid')) {
                        try {
                            const contact = await sock.getContact(jid);
                            if (contact?.name) display = contact.name;
                            else if (contact?.notify) display = contact.notify;
                            else if (contact?.verifiedName) display = contact.verifiedName;
                        } catch(e) {
                            // Use formatted JID
                        }
                    }
                }
            } catch(e) {}
            
            const role = p.admin === 'superadmin' ? '👑' : p.admin === 'admin' ? '👮' : '👤';
            list += `${i + 1}. ${role} ${display}\n`;
        }
        
        return list;
    }

    // Categorize participants by role
    static categorizeParticipants(participants) {
        const superAdmins = [];
        const admins = [];
        const members = [];

        for (const p of participants) {
            const display = this.formatJid(p.id);
            if (p.admin === 'superadmin') {
                superAdmins.push({ jid: p.id, display, role: 'superadmin' });
            } else if (p.admin === 'admin') {
                admins.push({ jid: p.id, display, role: 'admin' });
            } else {
                members.push({ jid: p.id, display, role: 'member' });
            }
        }

        return { superAdmins, admins, members };
    }

    // Check if participant is admin
    static isAdmin(participants, jid) {
        const participant = participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    }

    // Check if participant is superadmin
    static isSuperAdmin(participants, jid) {
        const participant = participants.find(p => p.id === jid);
        return participant && participant.admin === 'superadmin';
    }

    // Check if user is group owner
    static isGroupOwner(metadata, jid) {
        return metadata.owner === jid;
    }

    // Check if user is bot owner
    static isBotOwner(userJid, ownerNumber) {
        const cleanUser = userJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        const cleanOwner = String(ownerNumber).replace(/[^0-9]/g, '');
        return cleanUser === cleanOwner;
    }

    // Check if user can perform admin action
    static canPerformAdminAction(metadata, userJid, ownerNumber) {
        return this.isAdmin(metadata.participants, userJid) || 
               this.isBotOwner(userJid, ownerNumber) ||
               this.isGroupOwner(metadata, userJid);
    }

    // Get all participant JIDs for mentions (resolve LIDs if possible)
    static getAllMentions(participants) {
        const jids = [];
        for (const p of participants) {
            if (p.id.endsWith('@lid')) {
                // Try to get real JID from pn or phoneNumber fields
                if (p.pn && p.pn.endsWith('@s.whatsapp.net')) {
                    jids.push(p.pn);
                } else if (p.phoneNumber && p.phoneNumber.endsWith('@s.whatsapp.net')) {
                    jids.push(p.phoneNumber);
                } else if (p.jid && p.jid.endsWith('@s.whatsapp.net')) {
                    jids.push(p.jid);
                }
                // Skip LIDs that can't be resolved - they can't receive mentions anyway
            } else if (p.id.endsWith('@s.whatsapp.net')) {
                jids.push(p.id);
            }
        }
        return jids;
    }

    // Get admin JIDs for mentions (resolve LIDs if possible)
    static getAdminMentions(participants) {
        const jids = [];
        for (const p of participants) {
            if (p.admin !== 'admin' && p.admin !== 'superadmin') continue;
            if (p.id.endsWith('@lid')) {
                if (p.pn && p.pn.endsWith('@s.whatsapp.net')) {
                    jids.push(p.pn);
                } else if (p.phoneNumber && p.phoneNumber.endsWith('@s.whatsapp.net')) {
                    jids.push(p.phoneNumber);
                } else if (p.jid && p.jid.endsWith('@s.whatsapp.net')) {
                    jids.push(p.jid);
                }
            } else if (p.id.endsWith('@s.whatsapp.net')) {
                jids.push(p.id);
            }
        }
        return jids;
    }

    // Format group info for display
    static formatGroupInfo(metadata) {
        const { subject, desc, size, creation, owner, participants, id, restrict, announce } = metadata;
        const created = new Date(creation * 1000).toLocaleString('en-KE', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const ownerJid = owner ? this.formatJid(owner) : 'Not available';
        const superAdmins = participants.filter(p => p.admin === 'superadmin').length;
        const admins = participants.filter(p => p.admin === 'admin').length;
        const members = participants.length - superAdmins - admins;
        const messageSetting = announce === 'announcement' ? '🔒 Admins only' : '🔓 Everyone';
        const infoSetting = restrict === 'locked' ? '🔒 Admins only' : '🔓 Everyone';

        let info = `*📌 GROUP INFORMATION*\n\n`;
        info += `📛 *Name:* ${subject}\n`;
        info += `🆔 *ID:* ${id.split('@')[0]}\n`;
        info += `👥 *Total Members:* ${size}\n`;
        info += `👑 *Owner:* ${ownerJid}\n`;
        info += `📅 *Created:* ${created}\n\n`;
        info += `*👥 BREAKDOWN*\n`;
        info += `👑 Super Admins: ${superAdmins}\n`;
        info += `👮 Admins: ${admins}\n`;
        info += `👤 Members: ${members}\n\n`;
        info += `*⚙️ SETTINGS*\n`;
        info += `• Messages: ${messageSetting}\n`;
        info += `• Edit Info: ${infoSetting}\n`;
        
        if (desc) {
            info += `\n📝 *Description:*\n${desc}\n`;
        }
        
        info += `\n> Megan-Prime | TrackerWanga`;
        return info;
    }

    // Format action results
    static formatActionResult(action, results) {
        const success = results.filter(r => r.status === '200').length;
        const failed = results.filter(r => r.status !== '200').length;
        const emoji = {
            'add': '➕', 'remove': '➖', 'promote': '👑', 'demote': '👤',
            'approve': '✅', 'reject': '❌'
        }[action] || '✅';
        
        let result = `${emoji} *${action.toUpperCase()} RESULT*\n\n`;
        result += `✅ Success: ${success}\n`;
        if (failed > 0) result += `❌ Failed: ${failed}\n`;
        result += `\n> Megan-Prime | TrackerWanga`;
        return result;
    }

    // Parse poll arguments (handles quoted strings)
    static parsePollArgs(args) {
        const parsed = [];
        let current = '';
        let inQuotes = false;
        const text = args.join(' ');
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"' && (i === 0 || text[i-1] !== '\\')) {
                inQuotes = !inQuotes;
                if (!inQuotes && current) {
                    parsed.push(current);
                    current = '';
                }
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parsed.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        if (current) parsed.push(current);
        return parsed;
    }

    // Extract group invite code from link
    static extractGroupCode(link) {
        if (!link || !link.includes('chat.whatsapp.com')) return null;
        const parts = link.split('/');
        return parts[parts.length - 1].split('?')[0];
    }

    // JID type checks
    static isGroupJid(jid) { return jid && jid.endsWith('@g.us'); }
    static isUserJid(jid) { return jid && jid.endsWith('@s.whatsapp.net'); }
    static isLidJid(jid) { return jid && jid.endsWith('@lid'); }

    // Get group stats
    static getGroupStats(messageStore, groupJid) {
        if (!messageStore) return { totalMessages: 0, activeMembers: 0, mediaShared: 0 };
        const stats = messageStore.getStats();
        return {
            totalMessages: stats.memoryCache?.messages || 0,
            activeMembers: stats.memoryCache?.chats || 0,
            mediaShared: 0
        };
    }

    // Anti-bot detection patterns
    static isSuspiciousBot(message, participant) {
        if (!message) return false;
        
        // Check for bot-like patterns
        const text = message.conversation || message.extendedTextMessage?.text || '';
        const botPatterns = [
            /bot/i,
            /auto.?reply/i,
            /automated/i,
            /this is (an )?automatic/i,
            /(powered|made|created) by.*bot/i
        ];
        
        let botScore = 0;
        for (const pattern of botPatterns) {
            if (pattern.test(text)) botScore += 1;
        }
        
        // Check for rapid messages (handled by rate tracking externally)
        // Check for same message to multiple groups
        
        return botScore >= 2;
    }
}

module.exports = GroupHelper;
