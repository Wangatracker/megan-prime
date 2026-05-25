// Megan-Prime Complete Media - 36 Commands Using Megan APIs + Local Processors
// Powered by Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');
const { downloadMediaMessage } = require('gifted-baileys');
const MediaProcessor = require('../../megan/lib/mediaProcessor');
const { uploadAuto } = require('../../megan/lib/upload');

const commands = [];

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const TEMP_DIR = path.join(__dirname, '../../temp');
const FOOTER = '> Megan-Prime | TrackerWanga';
const CREATOR = 'Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech';

const mediaProcessor = new MediaProcessor();
fs.ensureDirSync(TEMP_DIR);

// ==================== MEME IMAGES ====================
const MEME_IMAGES = [
    'https://files.catbox.moe/xnqfhk.jpg', 'https://files.catbox.moe/99jcbd.jpg',
    'https://files.catbox.moe/a8yflv.jpg', 'https://files.catbox.moe/xn7fef.jpg',
    'https://files.catbox.moe/fzo3sg.jpg', 'https://files.catbox.moe/ypi5fw.jpg',
    'https://files.catbox.moe/f9eqxi.jpg', 'https://files.catbox.moe/eswum9.jpg',
    'https://files.catbox.moe/1w2z1i.jpg', 'https://files.catbox.moe/5qkf90.jpg',
    'https://files.catbox.moe/hp4nki.jpg', 'https://files.catbox.moe/hq6hhu.jpg',
    'https://files.catbox.moe/ggwzc9.jpg', 'https://files.catbox.moe/evpzeb.jpg',
    'https://files.catbox.moe/xdtch8.jpg', 'https://files.catbox.moe/u8itde.jpg',
    'https://files.catbox.moe/qzmfuo.jpg', 'https://files.catbox.moe/lgqabr.jpg',
    'https://files.catbox.moe/rxoajf.jpg', 'https://files.catbox.moe/k1qck3.jpg',
    'https://files.catbox.moe/al7u80.jpg'
];

// ==================== AUDIO EFFECTS LIST ====================
const AUDIO_EFFECTS = {
    bass: '🔊 Bass Boost',
    nightcore: '🌙 Nightcore',
    slowreverb: '🌊 Slow + Reverb',
    chipmunk: '🐿️ Chipmunk',
    vibrato: '🎵 Vibrato',
    echo: '📢 Echo',
    distortion: '🎸 Distortion',
    '8d': '🎧 8D Audio',
    reverse: '🔄 Reverse',
    treble: '🎼 Treble Boost',
    surround: '🔉 Surround Sound'
};

// ==================== IMAGE FILTERS ====================
const IMAGE_FILTERS = ['greyscale', 'invert', 'sepia', 'brighten', 'darken', 'contrast', 'blur', 'sharpen'];

// ==================== HELPER FUNCTIONS ====================

async function apiGet(endpoint, params = {}, timeout = 60000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout + 30000, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
    return res.data;
}

async function apiPost(endpoint, data = {}, timeout = 60000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.post(url, data, { params: { apikey: API_KEY }, timeout + 30000, headers: { 'User-Agent': 'Megan-Prime/1.0', 'Content-Type': 'application/json' } });
    return res.data;
}

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Join Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

async function getQuotedMedia(msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;
    const targetMsg = { message: quoted, key: { remoteJid: msg.key.remoteJid, id: msg.message.extendedTextMessage.contextInfo.stanzaId } };
    try {
        return await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console });
    } catch (e) { return null; }
}

async function getMsgMedia(msg) {
    try {
        return await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
    } catch (e) { return null; }
}

async function getMediaBuffer(msg) {
    const quoted = await getQuotedMedia(msg);
    if (quoted) return quoted;
    return await getMsgMedia(msg);
}

async function uploadBuffer(buffer) {
    const { url, success } = await uploadAuto(buffer, `media_${Date.now()}.jpg`);
    if (!success) throw new Error('Upload failed');
    return url;
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
}

// ==================== CONVERTERS ====================

// 1. STICKER
commands.push({
    name: 'sticker',
    description: 'Convert image/video to sticker',
    aliases: ['s', 'stick'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎨 *STICKER MAKER*\n\n*Usage:* Reply to image/video with ${config.PREFIX}sticker\nOr send image with caption ${config.PREFIX}sticker\n\n${FOOTER}`);
        }
        await react('🎨');
        try {
            const stickerBuffer = await mediaProcessor.createSticker(buffer);
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Sticker error:', e.message);
            await react('❌');
            await reply(`❌ *Failed to create sticker*\n\n${FOOTER}`);
        }
    }
});

// 2. TOIMAGE
commands.push({
    name: 'toimage',
    description: 'Convert sticker to image',
    aliases: ['toimg', 'stickerimg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🖼️ *STICKER TO IMAGE*\n\n*Usage:* Reply to sticker with ${config.PREFIX}toimage\n\n${FOOTER}`);
        }
        await react('🔄');
        try {
            const imageBuffer = await mediaProcessor.stickerToImage(buffer);
            await sock.sendMessage(from, { image: imageBuffer, caption: `✅ *Converted to image*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('ToImage error:', e.message);
            await react('❌');
            await reply(`❌ *Failed to convert*\n\n${FOOTER}`);
        }
    }
});

// 3. VIDEOSTICKER
commands.push({
    name: 'videosticker',
    description: 'Convert video to animated sticker',
    aliases: ['vsticker', 'animsticker'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎬 *VIDEO TO STICKER*\n\n*Usage:* Reply to video with ${config.PREFIX}videosticker\n\n${FOOTER}`);
        }
        await react('🎬');
        try {
            const url = await uploadBuffer(buffer);
            const data = await apiGet('/api/converter/video-to-sticker', { url });
            if (!data.success || !data.result?.url) throw new Error('Conversion failed');
            const stickerUrl = data.result.url;
            const response = await axios.get(stickerUrl, { responseType: 'arraybuffer', timeout: 60000 });
            const stickerBuffer = Buffer.from(response.data);
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('VideoSticker error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 4. STICKERVIDEO
commands.push({
    name: 'stickervideo',
    description: 'Convert animated sticker to video',
    aliases: ['svideo', 'stikervid'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎬 *STICKER TO VIDEO*\n\n*Usage:* Reply to animated sticker with ${config.PREFIX}stickervideo\n\n${FOOTER}`);
        }
        await react('🎬');
        try {
            const url = await uploadBuffer(buffer);
            const data = await apiGet('/api/converter/sticker-to-video', { url });
            if (!data.success || !data.result?.url) throw new Error('Conversion failed');
            const videoUrl = data.result.url;
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
            const videoBuffer = Buffer.from(response.data);
            await sock.sendMessage(from, { video: videoBuffer, caption: `✅ *Sticker converted to video*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('StickerVideo error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 5. GIF
commands.push({
    name: 'gif',
    description: 'Convert video to GIF',
    aliases: ['togif', 'videogif'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎞️ *VIDEO TO GIF*\n\n*Usage:* Reply to video with ${config.PREFIX}gif\n\n${FOOTER}`);
        }
        await react('🎞️');
        try {
            const url = await uploadBuffer(buffer);
            const data = await apiGet('/api/converter/video-to-gif', { url });
            if (!data.success || !data.result?.url) throw new Error('Conversion failed');
            const gifUrl = data.result.url;
            const response = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 120000 });
            const gifBuffer = Buffer.from(response.data);
            await sock.sendMessage(from, { video: gifBuffer, caption: `✅ *Converted to GIF*\n\n${FOOTER}`, gifPlayback: true }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('GIF error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 6. UNGIF
commands.push({
    name: 'ungif',
    description: 'Convert GIF to video',
    aliases: ['gifvideo', 'giftovideo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎬 *GIF TO VIDEO*\n\n*Usage:* Reply to GIF with ${config.PREFIX}ungif\n\n${FOOTER}`);
        }
        await react('🎬');
        try {
            const url = await uploadBuffer(buffer);
            const data = await apiGet('/api/converter/gif-to-video', { url });
            if (!data.success || !data.result?.url) throw new Error('Conversion failed');
            const videoUrl = data.result.url;
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
            const videoBuffer = Buffer.from(response.data);
            await sock.sendMessage(from, { video: videoBuffer, caption: `✅ *GIF converted to video*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('UnGIF error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== AUDIO TTS ====================

// 7. SAY (Text to Speech)
commands.push({
    name: 'say',
    description: 'Convert text to speech (MP3)',
    aliases: ['tts', 'speak'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🗣️ *TEXT TO SPEECH*\n\n*Usage:* ${config.PREFIX}say <text>\n*Example:* ${config.PREFIX}say Hello world\n\n${FOOTER}`);
        }
        const text = args.join(' ').substring(0, 300);
        await react('🗣️');
        try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            const response = await axios.get(ttsUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const audioBuffer = Buffer.from(response.data);
            const formattedAudio = await mediaProcessor.toAudio(audioBuffer);
            await sock.sendMessage(from, { audio: formattedAudio, mimetype: 'audio/mpeg', ptt: false, fileName: 'tts.mp3' }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Say error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 8. VOICE (Text to Voice Note)
commands.push({
    name: 'voice',
    description: 'Convert text to voice note (PTT)',
    aliases: ['vn', 'voicenote', 'ptt'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎤 *VOICE NOTE*\n\n*Usage:* ${config.PREFIX}voice <text>\n*Example:* ${config.PREFIX}voice Hello\n\n${FOOTER}`);
        }
        const text = args.join(' ').substring(0, 300);
        await react('🎤');
        try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            const response = await axios.get(ttsUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const audioBuffer = Buffer.from(response.data);
            const pttBuffer = await mediaProcessor.toPTT(audioBuffer);
            await sock.sendMessage(from, { audio: pttBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Voice error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 9. TOAUDIO (Extract audio from video)
commands.push({
    name: 'toaudio',
    description: 'Extract audio from video',
    aliases: ['extractaudio', 'mp3', 'tomp3'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`🎵 *EXTRACT AUDIO*\n\n*Usage:* Reply to video with ${config.PREFIX}toaudio\n\n${FOOTER}`);
        }
        await react('🎵');
        try {
            const audioBuffer = await mediaProcessor.extractAudio(buffer);
            await sock.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false, fileName: 'extracted.mp3' }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('ToAudio error:', e.message);
            await react('❌');
            await reply(`❌ *Failed to extract audio*\n\n${FOOTER}`);
        }
    }
});

// ==================== AUDIO EFFECTS (11 Commands) ====================

Object.entries(AUDIO_EFFECTS).forEach(([effectId, effectName]) => {
    commands.push({
        name: effectId,
        description: `Apply ${effectName} effect to audio`,
        aliases: effectId === '8d' ? ['8daudio', 'eightd'] : [],
        async execute({ msg, from, sender, args, bot, sock, react, reply }) {
            const buffer = await getMediaBuffer(msg);
            if (!buffer && !args.length) {
                await react('ℹ️');
                return reply(`${effectName}\n\n*Usage:* Reply to audio/video with ${config.PREFIX}${effectId}\nOr: ${config.PREFIX}${effectId} <audio URL>\n\n${FOOTER}`);
            }
            await react('🎵');
            try {
                let audioUrl;
                if (args.length && args[0].startsWith('http')) {
                    audioUrl = args[0];
                } else if (buffer) {
                    audioUrl = await uploadBuffer(buffer);
                } else {
                    throw new Error('No audio source');
                }
                const data = await apiGet(`/api/audio/${effectId}`, { url: audioUrl });
                if (!data.success || !data.result?.url) throw new Error('Effect failed');
                const response = await axios.get(data.result.url, { responseType: 'arraybuffer', timeout: 120000 });
                const effectBuffer = Buffer.from(response.data);
                await sock.sendMessage(from, { audio: effectBuffer, mimetype: 'audio/mpeg', ptt: false, fileName: `${effectId}.mp3` }, { quoted: msg });
                await sendButtonsMsg(sock, from, `${effectName} applied! ✅\n\n${FOOTER}`, msg);
                await react('✅');
            } catch (e) {
                console.error(`${effectId} error:`, e.message);
                await react('❌');
                await reply(`❌ *Effect failed*\n\n${FOOTER}`);
            }
        }
    });
});

// 22. SPEED (Local)
commands.push({
    name: 'speed',
    description: 'Change audio speed (0.5x - 2x)',
    aliases: ['audiospeed', 'pitch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const speed = parseFloat(args[0]) || 1.5;
        if (speed < 0.5 || speed > 2) return reply(`❌ *Speed must be between 0.5 and 2*\n\n${FOOTER}`);
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('ℹ️');
            return reply(`⏩ *AUDIO SPEED*\n\n*Usage:* ${config.PREFIX}speed <0.5-2> (reply to audio)\n*Example:* ${config.PREFIX}speed 1.5\n\n${FOOTER}`);
        }
        await react('⏩');
        try {
            const result = await mediaProcessor.changeSpeed(buffer, speed);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/mpeg', ptt: false, fileName: `speed_${speed}x.mp3` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Speed error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 23. VOLUME (Local)
commands.push({
    name: 'volume',
    description: 'Change audio volume (1-10)',
    aliases: ['vol', 'audiovol'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const vol = parseFloat(args[0]) || 2;
        if (vol < 0.5 || vol > 10) return reply(`❌ *Volume must be between 0.5 and 10*\n\n${FOOTER}`);
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('ℹ️');
            return reply(`🔊 *AUDIO VOLUME*\n\n*Usage:* ${config.PREFIX}volume <1-10> (reply to audio)\n*Example:* ${config.PREFIX}volume 2\n\n${FOOTER}`);
        }
        await react('🔊');
        try {
            const result = await mediaProcessor.changeVolume(buffer, vol);
            await sock.sendMessage(from, { audio: result, mimetype: 'audio/mpeg', ptt: false, fileName: `volume_${vol}x.mp3` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Volume error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== IMAGE TOOLS ====================

// 24. CIRCLE
commands.push({
    name: 'circle',
    description: 'Make image circular',
    aliases: ['round', 'circular'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`⭕ *CIRCLE IMAGE*\n\n*Usage:* Reply to image with ${config.PREFIX}circle\n\n${FOOTER}`);
        }
        await react('⭕');
        try {
            const circleBuffer = await mediaProcessor.createCircle(buffer);
            await sock.sendMessage(from, { image: circleBuffer, caption: `✅ *Circular image*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Circle error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 25. FILTER
commands.push({
    name: 'filter',
    description: 'Apply image filter',
    aliases: ['imgfilter', 'effect'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const filterName = args[0]?.toLowerCase();
        if (!filterName || !IMAGE_FILTERS.includes(filterName)) {
            await react('ℹ️');
            return reply(`🎨 *IMAGE FILTER*\n\n*Filters:* ${IMAGE_FILTERS.join(', ')}\n\n*Usage:* ${config.PREFIX}filter <filter> (reply to image)\n*Example:* ${config.PREFIX}filter invert\n\n${FOOTER}`);
        }
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`❌ *Reply to an image*\n\n${FOOTER}`);
        }
        await react('🎨');
        try {
            const result = await mediaProcessor.applyFilter(buffer, filterName);
            await sock.sendMessage(from, { image: result, caption: `✅ *Filter: ${filterName}*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Filter error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 26. REMOVEBG
commands.push({
    name: 'removebg',
    description: 'Remove image background',
    aliases: ['nobg', 'rmbg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer) {
            await react('❌');
            return reply(`✨ *REMOVE BACKGROUND*\n\n*Usage:* Reply to image with ${config.PREFIX}removebg\n\n${FOOTER}`);
        }
        await react('✨');
        try {
            const result = await mediaProcessor.removeBackground(buffer);
            await sock.sendMessage(from, { image: result, caption: `✅ *Background removed*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('RemoveBG error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 27. MEME (Create)
commands.push({
    name: 'meme',
    description: 'Create meme with top/bottom text',
    aliases: ['mememaker', 'makememe'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 2) {
            await react('ℹ️');
            return reply(`😂 *MEME MAKER*\n\n*Usage:* ${config.PREFIX}meme "top text" "bottom text" (reply to image)\nOr: ${config.PREFIX}meme "text" (uses random meme template)\n\n${FOOTER}`);
        }
        const parsedArgs = args.join(' ').match(/"([^"]+)"|'([^']+)'/g) || [];
        const texts = parsedArgs.map(t => t.replace(/["']/g, ''));
        const topText = texts[0] || '';
        const bottomText = texts[1] || '';
        await react('😂');
        try {
            let baseImage;
            const quotedBuffer = await getQuotedMedia(msg);
            if (quotedBuffer) {
                baseImage = quotedBuffer;
            } else {
                const randomUrl = MEME_IMAGES[Math.floor(Math.random() * MEME_IMAGES.length)];
                const response = await axios.get(randomUrl, { responseType: 'arraybuffer', timeout: 30000 });
                baseImage = Buffer.from(response.data);
            }
            const result = await mediaProcessor.createMeme(topText, bottomText, baseImage);
            await sock.sendMessage(from, { image: result, caption: `😂 *Meme created!*\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Meme error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== UPLOAD ====================

// 28. CATBOX
commands.push({
    name: 'catbox',
    description: 'Upload media to Catbox.moe',
    aliases: ['cat', 'upload'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer && !args.length) {
            await react('ℹ️');
            return reply(`📤 *CATBOX UPLOAD*\n\n*Usage:* Reply to media with ${config.PREFIX}catbox\nOr: ${config.PREFIX}catbox <image URL>\n\n${FOOTER}`);
        }
        await react('📤');
        try {
            let uploadBuffer;
            if (args.length && args[0].startsWith('http')) {
                const response = await axios.get(args[0], { responseType: 'arraybuffer', timeout: 60000 });
                uploadBuffer = Buffer.from(response.data);
            } else if (buffer) {
                uploadBuffer = buffer;
            } else {
                throw new Error('No media');
            }
            const url = await uploadBufferToCatbox(uploadBuffer);
            const size = formatFileSize(uploadBuffer.length);
            await sendButtonsMsg(sock, from, `✅ *Uploaded!*\n\n📁 *Size:* ${size}\n🔗 *URL:* ${url}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy URL', copy_code: url }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Open', url }) }
            ]);
            await react('✅');
        } catch (e) {
            console.error('Catbox error:', e.message);
            await react('❌');
            await reply(`❌ *Upload failed*\n\n${FOOTER}`);
        }
    }
});

async function uploadBufferToCatbox(buffer) {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', buffer, { filename: `upload_${Date.now()}.jpg` });
    const response = await axios.post('https://catbox.moe/user/api.php', formData, { headers: formData.getHeaders(), timeout: 120000 });
    return response.data.trim();
}

// 29. IMGBB
commands.push({
    name: 'imgbb',
    description: 'Upload media to ImgBB',
    aliases: ['imgupload', 'imgbbupload'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const buffer = await getMediaBuffer(msg);
        if (!buffer && !args.length) {
            await react('ℹ️');
            return reply(`📤 *IMGBB UPLOAD*\n\n*Usage:* Reply to media with ${config.PREFIX}imgbb\nOr: ${config.PREFIX}imgbb <image URL>\n\n${FOOTER}`);
        }
        await react('📤');
        try {
            let uploadBuffer;
            if (args.length && args[0].startsWith('http')) {
                const response = await axios.get(args[0], { responseType: 'arraybuffer', timeout: 60000 });
                uploadBuffer = Buffer.from(response.data);
            } else if (buffer) {
                uploadBuffer = buffer;
            } else {
                throw new Error('No media');
            }
            const base64 = uploadBuffer.toString('base64');
            const data = await apiPost('/api/url/imgbb', { image: base64 });
            if (!data.success) throw new Error('Upload failed');
            const url = data.result?.url || data.result?.display_url;
            await sendButtonsMsg(sock, from, `✅ *Uploaded to ImgBB!*\n\n🔗 *URL:* ${url}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy URL', copy_code: url }) }
            ]);
            await react('✅');
        } catch (e) {
            console.error('ImgBB error:', e.message);
            await react('❌');
            await reply(`❌ *Upload failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== TOOLS ====================

// 30. QRCODE
commands.push({
    name: 'qrcode',
    description: 'Generate QR code',
    aliases: ['qr', 'qrcodegen'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📱 *QR CODE GENERATOR*\n\n*Usage:* ${config.PREFIX}qrcode <text or URL>\n\n${FOOTER}`);
        }
        const text = args.join(' ');
        await react('📱');
        try {
            const data = await apiGet('/api/tools/qrcode', { text, size: 300 });
            if (!data.success) throw new Error('Failed');
            const qrUrl = data.result;
            await sock.sendMessage(from, { image: { url: qrUrl }, caption: `📱 *QR Code:* ${text}\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('QR error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 31. SCREENSHOT
commands.push({
    name: 'screenshot',
    description: 'Take website screenshot',
    aliases: ['ss', 'ssweb', 'webshot'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📸 *WEBSITE SCREENSHOT*\n\n*Usage:* ${config.PREFIX}screenshot <URL>\n*Example:* ${config.PREFIX}screenshot https://google.com\n\n${FOOTER}`);
        }
        let url = args[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        await react('📸');
        try {
            const data = await apiGet('/api/tools/screenshot', { url });
            if (!data.success || !data.result) throw new Error('Failed');
            const ssUrl = typeof data.result === 'string' ? data.result : data.result.url;
            await sock.sendMessage(from, { image: { url: ssUrl }, caption: `📸 *Screenshot*\n🌐 ${url}\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) {
            console.error('Screenshot error:', e.message);
            await react('❌');
            await reply(`❌ *Failed to take screenshot*\n\n${FOOTER}`);
        }
    }
});

// 32. SHORTURL
commands.push({
    name: 'shorturl',
    description: 'Shorten a URL',
    aliases: ['shorten', 'shortlink', 'tinyurl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🔗 *URL SHORTENER*\n\n*Usage:* ${config.PREFIX}shorturl <URL> [service]\n*Services:* tinyurl, bitly\n*Example:* ${config.PREFIX}shorturl https://example.com\n\n${FOOTER}`);
        }
        const url = args[0];
        const service = ['tinyurl', 'bitly'].includes(args[1]?.toLowerCase()) ? args[1].toLowerCase() : 'tinyurl';
        await react('🔗');
        try {
            const data = await apiGet(`/api/short/${service}`, { url });
            if (!data.success || !data.result) throw new Error('Failed');
            const shortUrl = typeof data.result === 'string' ? data.result : data.result.url;
            await sendButtonsMsg(sock, from, `✅ *URL Shortened*\n\n🔗 *Original:* ${url}\n🔗 *Short:* ${shortUrl}\n📡 Service: ${service}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Short URL', copy_code: shortUrl }) }
            ]);
            await react('✅');
        } catch (e) {
            console.error('ShortURL error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== FUN ====================

// 33. WAIFU
commands.push({
    name: 'waifu',
    description: 'Get random waifu image',
    aliases: ['waifuimg', 'animegirl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🌸');
        try {
            const data = await apiGet('/api/anime/waifu');
            const url = data.result?.url || data.result;
            await sock.sendMessage(from, { image: { url }, caption: `🌸 *Random Waifu*\n\n${FOOTER}` }, { quoted: msg });
            await sendButtonsMsg(sock, from, `🌸 *Waifu sent!*\n\n${FOOTER}`, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'waifu' }) }
            ]);
            await react('✅');
        } catch (e) {
            console.error('Waifu error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// 34. NEKO
commands.push({
    name: 'neko',
    description: 'Get random neko image',
    aliases: ['nekogirl', 'catgirl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🐱');
        try {
            const data = await apiGet('/api/anime/neko');
            const url = data.result?.url || data.result;
            await sock.sendMessage(from, { image: { url }, caption: `🐱 *Random Neko*\n\n${FOOTER}` }, { quoted: msg });
            await sendButtonsMsg(sock, from, `🐱 *Neko sent!*\n\n${FOOTER}`, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'neko' }) }
            ]);
            await react('✅');
        } catch (e) {
            console.error('Neko error:', e.message);
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== CLEANUP ====================

// 35. CLEANTEMP
commands.push({
    name: 'cleantemp',
    description: 'Clean temporary files',
    aliases: ['cleanup', 'clearcache'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🧹');
        try {
            const result = await mediaProcessor.cleanup();
            await sendButtonsMsg(sock, from, `🧹 *Cleanup Complete*\n\n🗑️ *Deleted:* ${result.deleted} files\n💾 *Freed:* ${formatFileSize(result.freed)}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Failed*\n\n${FOOTER}`);
        }
    }
});

// ==================== MEDIA HELP ====================

// 36. MEDIAHELP
commands.push({
    name: 'mediahelp',
    description: 'Show all media commands',
    aliases: ['media', 'mediah', 'medialist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `🛠️ *𝐌𝐄𝐃𝐈𝐀 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 (𝟑𝟓)*\n\n` +
            `*🎨 𝐂𝐎𝐍𝐕𝐄𝐑𝐓𝐄𝐑𝐒*\n${p}sticker | ${p}toimage | ${p}videosticker\n${p}stickervideo | ${p}gif | ${p}ungif\n\n` +
            `*🗣️ 𝐓𝐄𝐗𝐓 𝐓𝐎 𝐒𝐏𝐄𝐄𝐂𝐇*\n${p}say | ${p}voice | ${p}toaudio\n\n` +
            `*🎵 𝐀𝐔𝐃𝐈𝐎 𝐄𝐅𝐅𝐄𝐂𝐓𝐒*\n${p}bass | ${p}nightcore | ${p}slowreverb\n${p}chipmunk | ${p}vibrato | ${p}echo\n${p}distortion | ${p}8d | ${p}reverse\n${p}treble | ${p}surround | ${p}speed\n${p}volume\n\n` +
            `*🖼️ 𝐈𝐌𝐀𝐆𝐄*\n${p}circle | ${p}filter | ${p}removebg\n${p}meme\n\n` +
            `*📤 𝐔𝐏𝐋𝐎𝐀𝐃*\n${p}catbox | ${p}imgbb\n\n` +
            `*🛠️ 𝐓𝐎𝐎𝐋𝐒*\n${p}qrcode | ${p}screenshot | ${p}shorturl\n\n` +
            `*🌸 𝐅𝐔𝐍*\n${p}waifu | ${p}neko\n\n` +
            `*🧹 ${p}cleantemp*\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});


// MEDIA STATUS (Megan API)
commands.push({
    name: 'mediastatus',
    description: 'Check media provider status',
    aliases: ['mediastats', 'providerstatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📊');
        try {
            const data = await apiGet('/api/media/status');
            if (!data.success) throw new Error('Failed');
            const c = data.categories || {};
            let text = `📊 *Media Provider Status*\n\n`;
            text += `🕐 *Checked:* ${data.checkedAt ? new Date(data.checkedAt).toLocaleString() : 'N/A'}\n\n`;
            if (c.music?.providers) {
                text += `*🎵 Music:*\n`;
                Object.entries(c.music.providers).forEach(([name, p]) => {
                    text += `${p.active ? '✅' : '❌'} ${p.label || name}\n`;
                });
            }
            if (c['social-media']?.providers) {
                text += `\n*📱 Social Media:*\n`;
                Object.entries(c['social-media'].providers).forEach(([name, p]) => {
                    text += `${p.active ? '✅' : '❌'} ${p.label || name}\n`;
                });
            }
            if (c.spotify?.providers) {
                text += `\n*🟢 Spotify:*\n`;
                Object.entries(c.spotify.providers).forEach(([name, p]) => {
                    text += `${p.active ? '✅' : '❌'} ${p.label || name}\n`;
                });
            }
            if (c.shazam?.providers) {
                text += `\n*🎵 Shazam:*\n`;
                Object.entries(c.shazam.providers).forEach(([name, p]) => {
                    text += `${p.active ? '✅' : '❌'} ${p.label || name}\n`;
                });
            }
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});


module.exports = { commands };
