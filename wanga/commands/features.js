// Megan-Prime Complete Features Toggle - All Settings
const config = require('../../megan/config');

const commands = [];
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';

async function sendWithButtons(sock, from, text, quotedMsg, buttons) {
    try {
        // Use gifted-btns sendButtons directly
        const { sendButtons } = require('gifted-btns');
        const buttonOptions = {
            title: 'Megan-Prime',
            text: text,
            footer: '> Megan-Prime | TrackerWanga',
            buttons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Join Channel',
                        url: 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37'
                    })
                }
            ]
        };
        await sendButtons(sock, from, buttonOptions, { quoted: quotedMsg });
    } catch (e) {
        // Fallback to plain text
        console.log('Button send failed, using text fallback:', e.message);
        await sock.sendMessage(from, { text: text }, { quoted: quotedMsg });
    }
}

// ============================================
// FEATURES DASHBOARD - Shows ALL toggles
// ============================================
commands.push({
    name: 'features',
    description: 'Show all feature toggles and their status',
    aliases: ['featurehelp', 'toggles', 'allfeatures', 'dashboard'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        const prefix = config.PREFIX;
        
        // Fetch ALL settings
        const autoreact = await bot.db.getSetting('autoreact', 'off');
        const autoread = await bot.db.getSetting('autoread', 'off');
        const autobio = await bot.db.getSetting('auto_bio', 'off');
        const autoviewonce = await bot.db.getSetting('autoviewonce', 'on');
        const antidelete = await bot.db.getSetting('antidelete', 'on');
        const antiedit = await bot.db.getSetting('antiedit', 'on');
        const anticall = await bot.db.getSetting('anticall', 'off');
        const antideleteStatus = await bot.db.getSetting('status_anti_delete', 'off');
        const antilink = await bot.db.getSetting('antilink', 'off');
        const antilinkAction = await bot.db.getSetting('antilinkaction', 'delete');
        const statusAutoView = await bot.db.getSetting('status_auto_view', 'on');
        const statusAutoReact = await bot.db.getSetting('status_auto_react', 'off');
        const statusAutoDownload = await bot.db.getSetting('status_auto_download', 'off');
        const statusEmojis = await bot.db.getSetting('status_react_emojis', '💛,❤️,💜,💙,👍,🔥');
        const presencePM = await bot.db.getSetting('presence_pm', 'typing');
        const presenceGroup = await bot.db.getSetting('presence_group', 'typing');
        const autotyping = await bot.db.getSetting('autotyping', 'off');
        const autorecording = await bot.db.getSetting('autorecording', 'off');
        const chatbot = await bot.db.getSetting('chatbot', 'off');
        const aiMode = await bot.db.getSetting('ai_mode', 'normal');
        const awayMode = await bot.db.getSetting('awaymode', 'off');
        const botLanguage = await bot.db.getSetting('bot_language', 'en');
        const mode = await bot.db.getSetting('mode', 'public');
        const antitag = await bot.db.getSetting('antitag', 'off');
        
        const onOff = (v) => v === 'on' ? '✅ ON' : '❌ OFF';
        
        const dash = `⚙️ *FEATURE DASHBOARD*\n\n` +
            `*🤖 AUTO FEATURES*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `• Auto-Read: ${onOff(autoread)}\n` +
            `• Auto-React: ${onOff(autoreact)}\n` +
            `• Auto-Bio: ${onOff(autobio)}\n` +
            `• Auto-ViewOnce: ${onOff(autoviewonce)}\n` +
            `• Auto-Typing: ${autotyping}\n` +
            `• Auto-Recording: ${autorecording}\n\n` +
            
            `*🛡️ ANTI FEATURES*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `• Anti-Delete: ${onOff(antidelete)}\n` +
            `• Anti-Edit: ${onOff(antiedit)}\n` +
            `• Anti-Call: ${onOff(anticall)}\n` +
            `• Anti-Delete Status: ${onOff(antideleteStatus)}\n` +
            `• Anti-Link: ${onOff(antilink)} (${antilinkAction})\n` +
            `• Anti-Tag: ${onOff(antitag)}\n\n` +
            
            `*📱 STATUS FEATURES*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `• Status Auto-View: ${onOff(statusAutoView)}\n` +
            `• Status Auto-React: ${onOff(statusAutoReact)}\n` +
            `• Status Auto-Download: ${onOff(statusAutoDownload)}\n` +
            `• Status Emojis: ${statusEmojis}\n\n` +
            
            `*💬 CHAT FEATURES*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `• Chatbot: ${chatbot}\n` +
            `• AI Mode: ${aiMode}\n` +
            `• Away Mode: ${onOff(awayMode)}\n` +
            `• Language: ${botLanguage}\n` +
            `• Bot Mode: ${mode}\n\n` +
            
            `*👁️ PRESENCE*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `• PM Presence: ${presencePM}\n` +
            `• Group Presence: ${presenceGroup}\n\n` +
            
            `*Change any:* ${prefix}features <name> <value>\n` +
            `*Example:* ${prefix}autoreact on\n\n` +
            `> Megan-Prime | TrackerWanga`;

        await sendWithButtons(sock, from, dash, msg, buttons);
        await react('⚙️');
    }
});

// ============================================
// AUTO-REACT
// ============================================
commands.push({
    name: 'autoreact',
    description: 'Toggle auto-react on messages (on/off) - Owner Only',
    aliases: ['reactauto'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autoreact', 'off');
            return sendWithButtons(sock, from, `🎭 *AUTO-REACT*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.PREFIX}autoreact on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('autoreact', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Auto-React ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// AUTO-READ
// ============================================
commands.push({
    name: 'autoread',
    description: 'Toggle auto-read messages (on/off) - Owner Only',
    aliases: ['readauto'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autoread', 'off');
            return sendWithButtons(sock, from, `👁️ *AUTO-READ*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.PREFIX}autoread on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('autoread', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Auto-Read ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// AUTO-BIO
// ============================================
commands.push({
    name: 'autobio',
    description: 'Toggle auto-bio updates (on/off) - Owner Only',
    aliases: ['bioauto'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('auto_bio', 'off');
            return sendWithButtons(sock, from, `📝 *AUTO-BIO*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.PREFIX}autobio on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('auto_bio', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Auto-Bio ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// AUTO-VIEW-ONCE
// ============================================
commands.push({
    name: 'autoviewonce',
    description: 'Toggle auto-save view once media (on/off) - Owner Only',
    aliases: ['avo', 'viewonceauto'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autoviewonce', 'on');
            return sendWithButtons(sock, from, `🔐 *AUTO VIEW ONCE*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nWhen ON, reply to view-once with .vv to extract.\n\nUsage: ${config.PREFIX}autoviewonce on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('autoviewonce', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Auto View Once ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-DELETE
// ============================================
commands.push({
    name: 'antidelete',
    description: 'Toggle anti-delete messages (on/off) - Owner Only',
    aliases: ['ad', 'deleteanti'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('antidelete', 'on');
            return sendWithButtons(sock, from, `🗑️ *ANTI-DELETE*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nRecovers deleted messages and sends to your DM.\n\nUsage: ${config.PREFIX}antidelete on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('antidelete', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Anti-Delete ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-EDIT
// ============================================
commands.push({
    name: 'antiedit',
    description: 'Toggle anti-edit detection (on/off) - Owner Only',
    aliases: ['ae', 'editanti'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('antiedit', 'on');
            return sendWithButtons(sock, from, `✏️ *ANTI-EDIT*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nDetects edited messages and shows original.\n\nUsage: ${config.PREFIX}antiedit on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('antiedit', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Anti-Edit ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-CALL
// ============================================
commands.push({
    name: 'anticall',
    description: 'Toggle anti-call (on/off/block) - Owner Only',
    aliases: ['ac', 'callanti'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('anticall', 'off');
            return sendWithButtons(sock, from, `📞 *ANTI-CALL*\n\nCurrent: ${current}\n\n*Options:* on (reject), block (reject+block), off\n\nUsage: ${config.PREFIX}anticall on/block/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (!['on', 'off', 'block'].includes(setting)) return reply('❌ Use on, off, or block');
        await bot.db.setSetting('anticall', setting);
        await react(setting === 'off' ? '❌' : '✅');
        await sendWithButtons(sock, from, `✅ *Anti-Call set to: ${setting}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-DELETE STATUS
// ============================================
commands.push({
    name: 'antideletestatus',
    description: 'Toggle anti-delete for statuses (on/off) - Owner Only',
    aliases: ['ads', 'statusantidelete'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_anti_delete', 'off');
            return sendWithButtons(sock, from, `📱 *ANTI-DELETE STATUS*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nRecovers deleted statuses and sends to DM.\n\nUsage: ${config.PREFIX}antideletestatus on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('status_anti_delete', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Status Anti-Delete ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-LINK
// ============================================
commands.push({
    name: 'antilink',
    description: 'Toggle anti-link globally (on/off)',
    aliases: ['al', 'linkanti'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        if (args.length === 0) {
            const current = await bot.db.getSetting('antilink', 'off');
            return sendWithButtons(sock, from, `🔗 *ANTI-LINK (Global)*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nFor group-specific: ${config.PREFIX}antilinkgc\n\nUsage: ${config.PREFIX}antilink on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('antilink', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Anti-Link ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-LINK ACTION
// ============================================
commands.push({
    name: 'antilinkaction',
    description: 'Set anti-link action (delete/warn/kick)',
    aliases: ['ala'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        if (args.length === 0) {
            const current = await bot.db.getSetting('antilinkaction', 'delete');
            return sendWithButtons(sock, from, `⚙️ *ANTI-LINK ACTION*\n\nCurrent: ${current}\n\nOptions: delete, warn, kick\n\nUsage: ${config.PREFIX}antilinkaction <action>\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const action = args[0].toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(action)) return reply('❌ Use delete, warn, or kick');
        await bot.db.setSetting('antilinkaction', action);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *Anti-Link action: ${action}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// ANTI-TAG
// ============================================
commands.push({
    name: 'antitag',
    description: 'Block users from mentioning owner (on/off) - Owner Only',
    aliases: ['blocktag', 'nomention'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('antitag', 'off');
            return sendWithButtons(sock, from, `🚫 *ANTI-TAG*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nWhen ON, bot leaves groups where owner is tagged.\n\nUsage: ${config.PREFIX}antitag on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('antitag', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Anti-Tag ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// STATUS AUTO-VIEW
// ============================================
commands.push({
    name: 'autoviewstatus',
    description: 'Toggle auto-view statuses (on/off) - Owner Only',
    aliases: ['avs'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_view', 'on');
            return sendWithButtons(sock, from, `👁️ *STATUS AUTO-VIEW*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.PREFIX}autoviewstatus on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('status_auto_view', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Status Auto-View ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// STATUS AUTO-REACT
// ============================================
commands.push({
    name: 'autoreactstatus',
    description: 'Toggle auto-react on statuses (on/off) - Owner Only',
    aliases: ['ars'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_react', 'off');
            return sendWithButtons(sock, from, `❤️ *STATUS AUTO-REACT*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.PREFIX}autoreactstatus on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('status_auto_react', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Status Auto-React ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// STATUS AUTO-DOWNLOAD
// ============================================
commands.push({
    name: 'autodownloadstatus',
    description: 'Toggle auto-download status media (on/off) - Owner Only',
    aliases: ['ads2'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_auto_download', 'off');
            return sendWithButtons(sock, from, `📥 *STATUS AUTO-DOWNLOAD*\n\nCurrent: ${current === 'on' ? '✅ ON' : '❌ OFF'}\n\nDownloads status media and forwards to DM.\n\nUsage: ${config.PREFIX}autodownloadstatus on/off\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (setting !== 'on' && setting !== 'off') return reply('❌ Use on or off');
        await bot.db.setSetting('status_auto_download', setting);
        await react(setting === 'on' ? '✅' : '❌');
        await sendWithButtons(sock, from, `✅ *Status Auto-Download ${setting === 'on' ? 'ENABLED' : 'DISABLED'}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// PRESENCE PM
// ============================================
commands.push({
    name: 'presencepm',
    description: 'Set presence in private messages - Owner Only',
    aliases: ['ppm'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('presence_pm', 'typing');
            return sendWithButtons(sock, from, `💬 *PRESENCE (PM)*\n\nCurrent: ${current}\n\nOptions: online, typing, recording, offline\n\nUsage: ${config.PREFIX}presencepm <type>\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const presence = args[0].toLowerCase();
        if (!['online', 'typing', 'recording', 'offline'].includes(presence)) return reply('❌ Use online, typing, recording, or offline');
        await bot.db.setSetting('presence_pm', presence);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *PM Presence set to: ${presence}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// PRESENCE GROUP
// ============================================
commands.push({
    name: 'presencegroup',
    description: 'Set presence in groups - Owner Only',
    aliases: ['pg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('presence_group', 'typing');
            return sendWithButtons(sock, from, `👥 *PRESENCE (GROUP)*\n\nCurrent: ${current}\n\nOptions: online, typing, recording, offline\n\nUsage: ${config.PREFIX}presencegroup <type>\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const presence = args[0].toLowerCase();
        if (!['online', 'typing', 'recording', 'offline'].includes(presence)) return reply('❌ Use online, typing, recording, or offline');
        await bot.db.setSetting('presence_group', presence);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *Group Presence set to: ${presence}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// AUTO-TYPING
// ============================================
commands.push({
    name: 'autotyping',
    description: 'Show typing indicator (dm/group/both/off) - Owner Only',
    aliases: ['atyping'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autotyping', 'off');
            return sendWithButtons(sock, from, `⌨️ *AUTO TYPING*\n\nCurrent: ${current}\n\nOptions: dm, group, both, off\n\nUsage: ${config.PREFIX}autotyping <mode>\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (!['dm', 'group', 'both', 'off'].includes(setting)) return reply('❌ Use dm, group, both, or off');
        await bot.db.setSetting('autotyping', setting);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *Auto Typing set to: ${setting}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// AUTO-RECORDING
// ============================================
commands.push({
    name: 'autorecording',
    description: 'Show recording indicator (dm/group/both/off) - Owner Only',
    aliases: ['arec'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('autorecording', 'off');
            return sendWithButtons(sock, from, `🎤 *AUTO RECORDING*\n\nCurrent: ${current}\n\nOptions: dm, group, both, off\n\nUsage: ${config.PREFIX}autorecording <mode>\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const setting = args[0].toLowerCase();
        if (!['dm', 'group', 'both', 'off'].includes(setting)) return reply('❌ Use dm, group, both, or off');
        await bot.db.setSetting('autorecording', setting);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *Auto Recording set to: ${setting}*\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

// ============================================
// SET STATUS EMOJIS
// ============================================
commands.push({
    name: 'setstatusemoji',
    description: 'Set emojis for status reactions - Owner Only',
    aliases: ['ssemoji', 'statusemoji'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner, buttons }) {
        if (!isOwner) { await react('❌'); return reply('❌ *Owner Only*\n\n> Megan-Prime | TrackerWanga'); }
        if (args.length === 0) {
            const current = await bot.db.getSetting('status_react_emojis', '💛,❤️,💜,💙,👍,🔥');
            return sendWithButtons(sock, from, `🎯 *STATUS REACTION EMOJIS*\n\nCurrent: ${current}\n\nUsage: ${config.PREFIX}setstatusemoji ❤️,👍,🔥,✨\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
        }
        const emojis = args.join(' ');
        await bot.db.setSetting('status_react_emojis', emojis);
        await react('✅');
        await sendWithButtons(sock, from, `✅ *Status emojis updated to:* ${emojis}\n\n> Megan-Prime | TrackerWanga`, msg, buttons);
    }
});

module.exports = { commands };
