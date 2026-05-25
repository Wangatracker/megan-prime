// Megan-Prime PhotoFunia Effects - Dynamic Commands + Menu
// Powered by Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech

const axios = require('axios');
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');

const commands = [];

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const FOOTER = '> Megan-Prime | TrackerWanga';
const CREATOR = 'Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech';

// ==================== HELPER FUNCTIONS ====================

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Join Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

async function getPhotoFuniaEffects() {
    try {
        const res = await axios.get(`${API_BASE}/api/photofunia/list`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data.effects || [];
    } catch (e) {
        return [];
    }
}

// ==================== PHOTOFUNIA - Dynamic Single Effect Generator ====================

// Main photofunia command - one command handles all effects by name/ID
commands.push({
    name: 'photofunia',
    description: 'Generate any PhotoFunia effect by name or ID',
    aliases: ['pf', 'photofx', 'photofun'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return sendButtonsMsg(sock, from, `📸 *PHOTOFUNIA*\n\n*Usage:* ${config.PREFIX}photofunia <effect name/ID> <text/image URL>\n*Example:* ${config.PREFIX}photofunia smokeflare MEGAN\n\nUse ${config.PREFIX}photofunialist to see all 342 effects\n\n${FOOTER}`, msg);
        }
        
        const searchTerm = args[0].toLowerCase();
        const params = args.slice(1).join(' ');
        
        await react('🔍');
        
        const effects = await getPhotoFuniaEffects();
        if (!effects.length) {
            await react('❌');
            return reply(`❌ *Failed to load effects*\n\nPlease try again later.\n\n${FOOTER}`);
        }
        
        // Find effect by ID or name
        const effect = effects.find(e => e.id === searchTerm || e.slug === searchTerm || e.name.toLowerCase().includes(searchTerm));
        if (!effect) {
            await react('❌');
            return sendButtonsMsg(sock, from, `❌ *Effect not found: "${searchTerm}"*\n\nUse ${config.PREFIX}photofunialist to see all effects\n\n${FOOTER}`, msg);
        }
        
        await react('📸');
        await sock.sendMessage(from, { text: `📸 *Generating ${effect.name}...*\n\n⏳ Please wait...\n\n${FOOTER}` }, { quoted: msg });
        
        try {
            let result;
            if (effect.inputType === 'img' || effect.inputType === 'both') {
                // Image-based effect
                const imageUrl = params.startsWith('http') ? params : null;
                const textParam = !params.startsWith('http') ? params : args.slice(2).join(' ');
                const queryParams = { apikey: API_KEY };
                if (imageUrl) queryParams.imageUrl = imageUrl;
                if (textParam) queryParams.text = textParam;
                
                const response = await axios.get(`${API_BASE}/api/photofunia/${effect.id}`, {
                    params: queryParams,
                    responseType: 'arraybuffer',
                    timeout: 60000
                });
                const imageBuffer = Buffer.from(response.data);
                await sock.sendMessage(from, { image: imageBuffer, caption: `📸 *${effect.name}*\n✨ PhotoFunia Effect\n\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
            } else {
                // Text-based effect
                const textParam = params || 'Megan-Prime';
                const response = await axios.get(`${API_BASE}/api/photofunia/${effect.id}`, {
                    params: { text: textParam, apikey: API_KEY },
                    responseType: 'arraybuffer',
                    timeout: 60000
                });
                const imageBuffer = Buffer.from(response.data);
                await sock.sendMessage(from, { image: imageBuffer, caption: `📸 *${effect.name}*\n✨ PhotoFunia Effect\n\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
            }
            await react('✅');
        } catch (e) {
            console.error('PhotoFunia error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Effect failed*\n\nPlease try again later.\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== PHOTOFUNIA LIST ====================

commands.push({
    name: 'photofunialist',
    description: 'Show all PhotoFunia effects (paginated)',
    aliases: ['pfxlist', 'photofuniall', 'photofxlist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📋');
        const page = Math.max(1, parseInt(args[0]) || 1);
        const effects = await getPhotoFuniaEffects();
        
        if (!effects.length) {
            await react('❌');
            return reply(`❌ *Failed to load effects*\n\n${FOOTER}`);
        }
        
        const perPage = 20;
        const totalPages = Math.ceil(effects.length / perPage);
        const start = (page - 1) * perPage;
        const pageEffects = effects.slice(start, start + perPage);
        
        let text = `📸 *PHOTOFUNIA EFFECTS (${effects.length})* - Page ${page}/${totalPages}\n\n`;
        pageEffects.forEach(e => {
            text += `• *${e.name}* — \`${config.PREFIX}photofunia ${e.id}\`\n`;
        });
        
        const btns = [];
        if (page > 1) btns.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '◀️ Previous', id: `photofunialist ${page - 1}` }) });
        if (page < totalPages) btns.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Next ▶️', id: `photofunialist ${page + 1}` }) });
        
        text += `\n📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, text, msg, btns);
        await react('✅');
    }
});

// ==================== PHOTOFUNIA MENU ====================

commands.push({
    name: 'photofuniamenu',
    description: 'PhotoFunia help and categories',
    aliases: ['pfmenu', 'photofunhelp', 'pfxmenu'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `📸 *PHOTOFUNIA EFFECTS (342)*\n\n` +
            `*Commands:*\n` +
            `• ${p}photofunia <effect> <text/URL> — Generate effect\n` +
            `• ${p}photofunialist [page] — Browse effects\n` +
            `• ${p}photofuniamenu — This menu\n\n` +
            `*Example:*\n${p}photofunia smokeflare MEGAN\n${p}photofunia nightmarewriting Hello\n\n` +
            `*Tip:* Reply to an image with ${p}photofunia <effect> for image-based effects\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
