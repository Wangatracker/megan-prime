// Megan-Prime TextPro Effects - 64 Commands (63 Effects + Menu)
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

// ==================== ALL 63 TEXTPRO EFFECTS ====================
const TEXTPRO_EFFECTS = {
    'alien-glow': { name: 'Alien Glow', emoji: '👽', aliases: ['alien'] },
    'neon-blue': { name: 'Neon Blue', emoji: '💙', aliases: ['nblue'] },
    'neon-pink': { name: 'Neon Pink', emoji: '💗', aliases: ['npink'] },
    'neon-purple': { name: 'Neon Purple', emoji: '💜', aliases: ['npurple'] },
    'neon-red': { name: 'Neon Red', emoji: '❤️', aliases: ['nred'] },
    'neon-gold': { name: 'Neon Gold', emoji: '💛', aliases: ['ngold'] },
    'neon-cyan': { name: 'Neon Cyan', emoji: '🩵', aliases: ['ncyan'] },
    'neon-orange': { name: 'Neon Orange', emoji: '🧡', aliases: ['norange'] },
    'neon-white': { name: 'Neon White', emoji: '🤍', aliases: ['nwhite'] },
    '3d-outline': { name: '3D Outline', emoji: '📐', aliases: ['3doutline', 'outline'] },
    'chrome': { name: 'Chrome', emoji: '🔩', aliases: ['chrometext'] },
    'gold-chrome': { name: 'Gold Chrome', emoji: '🪙', aliases: ['goldchrome'] },
    'fire': { name: 'Fire', emoji: '🔥', aliases: ['firetext'] },
    'inferno': { name: 'Inferno', emoji: '🌋', aliases: ['infernotext'] },
    'lava': { name: 'Lava', emoji: '🪨', aliases: ['lavatext'] },
    'embossed': { name: 'Embossed', emoji: '📏', aliases: ['emboss'] },
    'gold-embossed': { name: 'Gold Embossed', emoji: '🏆', aliases: ['gemboss'] },
    'classic-gold': { name: 'Classic Gold', emoji: '👑', aliases: ['cgold'] },
    'retro': { name: 'Retro', emoji: '📻', aliases: ['retrotext'] },
    'groovy': { name: 'Groovy', emoji: '🕺', aliases: ['groovytext'] },
    'steel': { name: 'Steel', emoji: '⚙️', aliases: ['steeltext'] },
    'dark-steel': { name: 'Dark Steel', emoji: '🖤', aliases: ['dsteel'] },
    'comic-pop': { name: 'Comic Pop', emoji: '💥', aliases: ['comic', 'pop'] },
    'comic-red': { name: 'Comic Red', emoji: '🔴', aliases: ['comicr'] },
    'graffiti': { name: 'Graffiti', emoji: '🎨', aliases: ['graf'] },
    'graffiti-green': { name: 'Graffiti Green', emoji: '💚', aliases: ['ggreen'] },
    'old-stone': { name: 'Old Stone', emoji: '🪦', aliases: ['stone'] },
    'carved': { name: 'Carved', emoji: '🪵', aliases: ['carvedtext'] },
    'glitter-gold': { name: 'Glitter Gold', emoji: '✨', aliases: ['ggold'] },
    'glitter-silver': { name: 'Glitter Silver', emoji: '🤍', aliases: ['gsilver'] },
    'glitter-pink': { name: 'Glitter Pink', emoji: '💖', aliases: ['gpink'] },
    'glitter-blue': { name: 'Glitter Blue', emoji: '💙', aliases: ['gblue'] },
    'glitter-green': { name: 'Glitter Green', emoji: '💚', aliases: ['ggreen2'] },
    'gradient': { name: 'Gradient', emoji: '🌈', aliases: ['gradtext'] },
    'gradient-blue': { name: 'Gradient Blue', emoji: '🔵', aliases: ['gblue2'] },
    'curvy': { name: 'Curvy', emoji: '〰️', aliases: ['curvytext'] },
    'basic-bold': { name: 'Basic Bold', emoji: '💪', aliases: ['bold', 'bbold'] },
    'scratch': { name: 'Scratch', emoji: '✍️', aliases: ['scratchtext'] },
    'elegant': { name: 'Elegant', emoji: '💎', aliases: ['eleganttext'] },
    'tribal': { name: 'Tribal', emoji: '🪶', aliases: ['tribaltext'] },
    'sketch': { name: 'Sketch', emoji: '✏️', aliases: ['sketchtext'] },
    'racing': { name: 'Racing', emoji: '🏎️', aliases: ['racingtext'] },
    'medieval': { name: 'Medieval', emoji: '🏰', aliases: ['medievaltext'] },
    'chalk': { name: 'Chalk', emoji: '🖍️', aliases: ['chalktext'] },
    'sparkle': { name: 'Sparkle', emoji: '🌟', aliases: ['sparkletext'] },
    'sharp': { name: 'Sharp', emoji: '🔪', aliases: ['sharptext'] },
    'fantasy': { name: 'Fantasy', emoji: '🧙', aliases: ['fantasytext'] },
    'watercolor': { name: 'Watercolor', emoji: '🎨', aliases: ['watertext'] },
    'blocky': { name: 'Blocky', emoji: '🧱', aliases: ['blockytext'] },
    'glass': { name: 'Glass', emoji: '🪟', aliases: ['glasstext'] },
    'stencil': { name: 'Stencil', emoji: '📋', aliases: ['stenciltext'] },
    'matrix': { name: 'Matrix', emoji: '💻', aliases: ['matrixtext'] },
    'nifty': { name: 'Nifty', emoji: '👍', aliases: ['niftytext'] },
    'futuristic': { name: 'Futuristic', emoji: '🚀', aliases: ['future', 'futuristictext'] },
    'vintage': { name: 'Vintage', emoji: '📜', aliases: ['vintagetext'] },
    'candy': { name: 'Candy', emoji: '🍬', aliases: ['candytext'] },
    'pastel': { name: 'Pastel', emoji: '🎀', aliases: ['pasteltext'] },
    'metallic': { name: 'Metallic', emoji: '🔗', aliases: ['metaltext'] },
    'pixel': { name: 'Pixel', emoji: '👾', aliases: ['pixeltext'] },
    'western': { name: 'Western', emoji: '🤠', aliases: ['westerntext'] },
    'horror': { name: 'Horror', emoji: '👻', aliases: ['horrortext'] },
    'sci-fi': { name: 'Sci-Fi', emoji: '🛸', aliases: ['scifi', 'scifitext'] },
    'frost': { name: 'Frost', emoji: '❄️', aliases: ['frosttext'] }
};

// ==================== HELPER FUNCTIONS ====================

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Join Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

async function generateTextpro(sock, from, effectId, text, msg, react) {
    await react('🎨');
    const effect = TEXTPRO_EFFECTS[effectId];
    await sock.sendMessage(from, { text: `🎨 *Generating ${effect.name}...*\n\n✨ Text: "${text}"\n⏳ Please wait...\n\n${FOOTER}` }, { quoted: msg });
    try {
        const response = await axios.get(`${API_BASE}/api/textpro/${effectId}`, {
            params: { text, apikey: API_KEY },
            responseType: 'arraybuffer',
            timeout: 60000
        });
        const imageBuffer = Buffer.from(response.data);
        await sock.sendMessage(from, { image: imageBuffer, caption: `🎨 *${effect.name}*\n✨ Text: ${text}\n\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
        await react('✅');
    } catch (e) {
        console.error(`TextPro ${effectId} error:`, e.message);
        await react('❌');
        await sendButtonsMsg(sock, from, `❌ *Effect failed*\n\nThe service may be temporarily unavailable. Please try again later.\n\n${FOOTER}`, msg);
    }
}

// ==================== GENERATE ALL 63 EFFECT COMMANDS ====================
Object.entries(TEXTPRO_EFFECTS).forEach(([effectId, effect]) => {
    commands.push({
        name: effectId,
        description: `Create ${effect.name} text effect`,
        aliases: effect.aliases,
        async execute({ msg, from, sender, args, bot, sock, react, reply }) {
            if (!args.length) {
                await react('ℹ️');
                return sendButtonsMsg(sock, from, `${effect.emoji} *${effect.name}*\n\n*Usage:* ${config.PREFIX}${effectId} <text>\n*Example:* ${config.PREFIX}${effectId} MEGAN\n\nCreates ${effect.name.toLowerCase()} text effect.\n\n${FOOTER}`, msg);
            }
            const text = args.join(' ');
            await generateTextpro(sock, from, effectId, text, msg, react);
        }
    });
});

// ==================== TEXTPRO MENU ====================

// 64. TEXTPROMENU
commands.push({
    name: 'textpromenu',
    description: 'Show all TextPro effects',
    aliases: ['textpro', 'textprolist', 'texteffects'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        let menu = `🎨 *𝐓𝐄𝐗𝐓𝐏𝐑𝐎 𝐄𝐅𝐅𝐄𝐂𝐓𝐒 (𝟔𝟑)*\n\n`;
        const effects = Object.entries(TEXTPRO_EFFECTS);
        effects.forEach(([id, e]) => {
            menu += `${e.emoji} ${p}${id} - ${e.name}\n`;
        });
        menu += `\n*Usage:* ${p}<effect> <text>\n*Example:* ${p}neon-blue MEGAN\n\n📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, menu, msg);
        await react('✅');
    }
});

module.exports = { commands };
