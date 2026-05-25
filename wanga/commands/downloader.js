// ╔══════════════════════════════════════════════════╗
// ║     MEGAN-PRIME DOWNLOADER - 46 Commands         ║
// ║  Powered by Megan APIs v3.6.4 | Tracker Wanga     ║
// ╚══════════════════════════════════════════════════╝

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');

const commands = [];

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const TEMP_DIR = path.join(__dirname, '../../temp');
const FOOTER = '> Megan-Prime | TrackerWanga';

fs.ensureDirSync(TEMP_DIR);

// Clean temp every 30 mins
setInterval(async () => {
    try { const files = await fs.readdir(TEMP_DIR); for (const f of files) await fs.unlink(path.join(TEMP_DIR, f)).catch(() => {}); }
    catch(e) {}
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
async function apiGet(endpoint, params = {}, timeout = 90000) {
    const url = `${API_BASE}${endpoint}`;
    const fullParams = { ...params, apikey: API_KEY };
    const headers = { 'User-Agent': 'Megan-Prime/1.0' };
    
    // Warm-up ping for sleeping Render server
    try {
        await axios.get(`${API_BASE}/api/status`, { params: { apikey: API_KEY }, timeout: 15000, headers });
        console.log('✅ API warm-up successful');
    } catch(e) {
        console.log('⏳ API warming up...');
    }
    
    // Now try the actual request with retries
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const res = await axios.get(url, { 
                params: fullParams, 
                timeout: timeout + (attempt * 30000),
                headers 
            });
            if (res.data?.success === false && res.data?.error?.includes('No results')) {
                throw new Error(res.data.error);
            }
            return res.data;
        } catch (e) {
            const isRetryable = e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || 
                               e.code === 'ECONNREFUSED' || e.code === 'ERR_BAD_RESPONSE' ||
                               (e.response?.status >= 500 && e.response?.status < 600);
            if (attempt < 4 && isRetryable) {
                const wait = attempt * 5000;
                console.log(`⚠️ Retry ${attempt}/4 in ${wait/1000}s...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            throw e;
        }
    }
}

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

async function downloadFile(url, filename) {
    const filePath = path.join(TEMP_DIR, filename);
    console.log(`⬇️ Downloading: ${url.substring(0, 80)}...`);
    const res = await axios({ 
        method: 'GET', 
        url, 
        responseType: 'stream', 
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com'
        }, 
        timeout: 300000,
        maxRedirects: 10,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        let size = 0;
        res.data.on('data', chunk => { size += chunk.length; });
        res.data.pipe(writer);
        writer.on('finish', () => { console.log(`✅ Downloaded ${(size/1048576).toFixed(1)}MB`); resolve(filePath); });
        writer.on('error', (e) => { console.log(`❌ Write error: ${e.message}`); reject(e); });
        res.data.on('error', (e) => { console.log(`❌ Stream error: ${e.message}`); reject(e); });
    });
}

function cleanFilename(name) {
    return (name || 'download').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().substring(0, 60) || 'download';
}

function formatSize(bytes) {
    if (!bytes) return 'N/A';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function isUrl(str) {
    return /^https?:\/\//i.test(str);
}

function isYouTubeUrl(str) {
    return /(?:youtube\.com|youtu\.be|m\.youtube\.com)/i.test(str) || /^[a-zA-Z0-9_-]{11}$/.test(str);
}

function extractSpotifyId(input) {
    if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;
    const m = input.match(/track\/([a-zA-Z0-9]{22})/);
    return m ? m[1] : null;
}

// ═══════════════════════════════════════════
// CORE DOWNLOAD FLOW
// ═══════════════════════════════════════════

async function downloadAndSendAudio(sock, from, data, extraCaption, msg) {
    let tempFile = null;
    try {
        const dlUrl = data.downloadUrl || data.proxyUrl;
        if (!dlUrl) throw new Error('No download URL');

        const filename = `${Date.now()}_${cleanFilename(data.title || 'audio')}.mp3`;
        tempFile = await downloadFile(dlUrl, filename);
        const buffer = await fs.readFile(tempFile);
        const sizeMB = (buffer.length / 1048576).toFixed(1);

        // Send audio WITHOUT buttons
        await sock.sendMessage(from, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: cleanFilename(data.title || 'audio') + '.mp3'
        }, { quoted: msg });

        // Send caption WITH buttons
        let caption = '';
        if (extraCaption) caption += extraCaption + '\n\n';
        caption += `╭───[ 🎵 DOWNLOADED ]───\n`;
        caption += `├ 🎧 ${data.title || 'Unknown'}\n`;
        caption += `├ 👤 ${data.artist || data.channelTitle || data.searchResult?.channelTitle || 'Unknown'}\n`;
        if (data.quality) caption += `├ 📊 ${data.quality}\n`;
        caption += `├ 💾 ${sizeMB} MB\n`;
        caption += `├ 📡 ${data.provider || 'Megan APIs'}\n`;
        caption += `╰───◇\n${FOOTER}`;

        const btns = [];
        if (data.youtubeUrl) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '▶️ YouTube', url: data.youtubeUrl }) });
        if (dlUrl) btns.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy URL', copy_code: dlUrl }) });

        await sendButtonsMsg(sock, from, caption, msg, btns);
        return true;
    } catch (e) {
        console.error('Download error:', e.message);
        throw e;
    } finally {
        if (tempFile) await fs.unlink(tempFile).catch(() => {});
    }
}

async function downloadAndSendVideo(sock, from, data, extraCaption, msg) {
    let tempFile = null;
    try {
        const dlUrl = data.downloadUrl || data.proxyUrl;
        if (!dlUrl) throw new Error('No download URL');

        const filename = `${Date.now()}_${cleanFilename(data.title || 'video')}.mp4`;
        tempFile = await downloadFile(dlUrl, filename);
        const buffer = await fs.readFile(tempFile);
        const sizeMB = (buffer.length / 1048576).toFixed(1);

        // Send video WITHOUT buttons
        await sock.sendMessage(from, {
            video: buffer,
            caption: `🎬 ${data.title || 'Video'}\n\n${FOOTER}`
        }, { quoted: msg });

        // Send info WITH buttons
        let caption = '';
        if (extraCaption) caption += extraCaption + '\n\n';
        caption += `╭───[ 🎬 DOWNLOADED ]───\n`;
        caption += `├ 🎬 ${data.title || 'Unknown'}\n`;
        caption += `├ 👤 ${data.channelTitle || data.searchResult?.channelTitle || 'Unknown'}\n`;
        if (data.quality) caption += `├ 📊 ${data.quality}\n`;
        caption += `├ 💾 ${sizeMB} MB\n`;
        caption += `├ 📡 ${data.provider || 'Megan APIs'}\n`;
        caption += `╰───◇\n${FOOTER}`;

        const btns = [];
        if (data.youtubeUrl) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '▶️ YouTube', url: data.youtubeUrl }) });
        await sendButtonsMsg(sock, from, caption, msg, btns);
        return true;
    } catch (e) {
        console.error('Download error:', e.message);
        throw e;
    } finally {
        if (tempFile) await fs.unlink(tempFile).catch(() => {});
    }
}

// Show thumbnail + searching status
async function showThumbnailAndSearch(sock, from, data, msg) {
    const thumb = data.thumbnail || data.thumbnailMq || data.albumArt ||
                  (data.videoId ? `https://img.youtube.com/vi/${data.videoId}/hqdefault.jpg` : null);
    const title = data.title || data.searchResult?.title || 'Processing...';
    const artist = data.artist || data.channelTitle || data.searchResult?.channelTitle || '';
    const duration = data.duration || data.searchResult?.duration || '';

    let caption = `╭───[ 🔍 FOUND ]───\n`;
    caption += `├ 🎵 ${title}\n`;
    if (artist) caption += `├ 👤 ${artist}\n`;
    if (duration) caption += `├ ⏱️ ${duration}\n`;
    if (data.quality) caption += `├ 📊 ${data.quality}\n`;
    caption += `├ ⬇️ Downloading...\n`;
    caption += `╰───◇\n${FOOTER}`;

    if (thumb) {
        try {
            await sock.sendMessage(from, { image: { url: thumb }, caption }, { quoted: msg });
            return;
        } catch(e) {}
    }
    await sendButtonsMsg(sock, from, caption, msg);
}

// ═══════════════════════════════════════════
// YOUTUBE AUDIO
// ═══════════════════════════════════════════

// 1. PLAY - Search & Download (Primary)
commands.push({
    name: 'play', description: 'Search & download audio from YouTube',
    aliases: ['song', 'audio'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎵 *PLAY*\n\nUsage: ${config.PREFIX}play <song name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/audio', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error(data.error || `No URL. Provider: ${data.provider || 'unknown'}`);
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendAudio(sock, from, data, `🎵 YouTube Audio`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\nTry: ${config.PREFIX}play2 ${query}\n\n${FOOTER}`, msg); }
    }
});

// 2. PLAY2 - Fallback 1
commands.push({
    name: 'play2', description: 'Download audio (Fallback 1)',
    aliases: ['song2', 'audio2'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎵 *PLAY2*\n\nUsage: ${config.PREFIX}play2 <song or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/mp3', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error(data.error || `No URL. Provider: ${data.provider || 'unknown'}`);
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendAudio(sock, from, data, `🎵 YouTube Audio (MP3)`, msg);
            await react('✅');
        } catch (e) {
            try {
                const data = await apiGet('/api/download/youtube/mp3', { q: query });
                if (!data.success || !data.downloadUrl) throw new Error('All failed');
                await showThumbnailAndSearch(sock, from, data, msg);
                await downloadAndSendAudio(sock, from, data, `🎵 YouTube Audio (YTA)`, msg);
                await react('✅');
            } catch (e2) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e2.message}\n\nTry: ${config.PREFIX}play3 ${query}\n\n${FOOTER}`, msg); }
        }
    }
});

// 3. PLAY3 - Search, Select, Download
commands.push({
    name: 'play3', description: 'Search YouTube, select & download',
    aliases: ['select', 'song3'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎵 *PLAY3 (Select)*\n\nUsage: ${config.PREFIX}play3 <song>\nThen reply 1-10\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/api/download/youtube/search', { q: query });
            if (!data.success || !data.items?.length) throw new Error('No results');
            const videos = data.items.slice(0, 10);
            let list = `╭───[ 🎵 RESULTS: "${query}" ]───\n\n`;
            videos.forEach((v, i) => {
                list += `├ *${i+1}.* ${v.title}\n├ ⏱️ ${v.duration || 'N/A'} | 👤 ${v.channelTitle || 'N/A'}\n├ 🔗 ${v.url || `https://youtu.be/${v.id}`}\n\n`;
            });
            list += `╰───◇\n*Reply 1-${videos.length} to download*\n${FOOTER}`;

            if (!global.play3Searches) global.play3Searches = {};
            global.play3Searches[from] = { videos, timestamp: Date.now() };
            await sendButtonsMsg(sock, from, list, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg); }
    }
});

// 4. SELECT - Choose from play3 results
commands.push({
    name: 'select', description: 'Select a result from play3',
    aliases: ['sel'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const num = parseInt(args[0]);
        if (isNaN(num)) return reply(`📌 *Select*\nUsage: ${config.PREFIX}select <number>\n\n${FOOTER}`);
        const search = global.play3Searches?.[from];
        if (!search || Date.now() - search.timestamp > 300000) { delete global.play3Searches?.[from]; return reply(`❌ Search expired. Use ${config.PREFIX}play3\n\n${FOOTER}`); }
        if (num < 1 || num > search.videos.length) return reply(`❌ Choose 1-${search.videos.length}\n\n${FOOTER}`);
        const video = search.videos[num - 1];
        await react('🎵');
        try {
            const ytUrl = video.url || `https://www.youtube.com/watch?v=${video.id}`;
            const data = await apiGet('/download/audio', { url: ytUrl });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendAudio(sock, from, data, `🎵 ${video.title}`, msg);
            delete global.play3Searches[from];
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 5. PLAYDOC - Download as document
commands.push({
    name: 'playdoc', description: 'Download audio as document',
    aliases: ['songdoc', 'audiodoc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📁 *PLAYDOC*\n\nUsage: ${config.PREFIX}playdoc <song>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/audio', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);

            let tempFile = null;
            try {
                const filename = `${Date.now()}_${cleanFilename(data.title || 'audio')}.mp3`;
                tempFile = await downloadFile(data.downloadUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);

                await sock.sendMessage(from, {
                    document: buffer,
                    fileName: cleanFilename(data.title || 'audio') + '.mp3',
                    mimetype: 'audio/mpeg',
                    caption: `📁 ${data.title || 'Audio'}\n💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 6. YTMP3 - Direct URL to MP3
commands.push({
    name: 'ytmp3', description: 'Download YouTube MP3 from URL',
    aliases: ['mp3', 'ytaudio'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`🎵 *YTMP3*\n\nUsage: ${config.PREFIX}ytmp3 <YouTube URL>\n\n${FOOTER}`); }
        const url = args[0];
        await react('🎵');
        try {
            const data = await apiGet('/download/mp3', { url });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendAudio(sock, from, data, `🎵 YouTube MP3`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 7. YTA - YouTube Audio fallback
commands.push({
    name: 'yta', description: 'YouTube audio (fallback endpoint)',
    aliases: ['ytaudio2'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`🎵 *YTA*\n\nUsage: ${config.PREFIX}yta <YouTube URL>\n\n${FOOTER}`); }
        const url = args[0];
        await react('🎵');
        try {
            const data = await apiGet('/api/download/youtube/mp3', { url });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendAudio(sock, from, data, `🎵 YouTube Audio`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// YOUTUBE VIDEO
// ═══════════════════════════════════════════

// 8. YTMP4
commands.push({
    name: 'ytmp4', description: 'Download YouTube video',
    aliases: ['ytvideo', 'mp4'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎬 *YTMP4*\n\nUsage: ${config.PREFIX}ytmp4 <video name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/mp4', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendVideo(sock, from, data, `🎬 YouTube Video`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\nTry: ${config.PREFIX}video ${query}\n\n${FOOTER}`, msg); }
    }
});

// 9. VIDEO
commands.push({
    name: 'video', description: 'Download YouTube video (alias)',
    aliases: ['ytv', 'vid'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎬 *VIDEO*\n\nUsage: ${config.PREFIX}video <name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/video', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendVideo(sock, from, data, `🎬 Video`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 10. HD
commands.push({
    name: 'hd', description: 'Download HD video',
    aliases: ['hdvideo', 'ytmp4hd'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎬 *HD VIDEO*\n\nUsage: ${config.PREFIX}hd <name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/hd', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendVideo(sock, from, data, `🎬 HD Video`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 11. YTMP5 - Audio + Video Combo
commands.push({
    name: 'ytmp5', description: 'Get MP3 + MP4 links',
    aliases: ['combo', 'both'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎵🎬 *YTMP5*\n\nUsage: ${config.PREFIX}ytmp5 <name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/ytmp5', { q: query });
            if (!data.success) throw new Error('Failed');

            const thumb = data.thumbnail || `https://img.youtube.com/vi/${data.videoId}/hqdefault.jpg`;
            let caption = `╭───[ 🎵🎬 COMBO ]───\n`;
            caption += `├ 🎬 ${data.title || 'Video'}\n`;
            if (data.mp3?.success) caption += `├ 🎵 MP3: ✅ ${data.mp3.quality || ''}\n`;
            if (data.mp4?.success) caption += `├ 🎬 MP4: ✅ ${data.mp4.quality || ''}\n`;
            caption += `╰───◇\n${FOOTER}`;

            const btns = [];
            if (data.mp3?.downloadUrl) btns.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy MP3', copy_code: data.mp3.downloadUrl }) });
            if (data.mp4?.downloadUrl) btns.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy MP4', copy_code: data.mp4.downloadUrl }) });

            if (thumb) {
                await sock.sendMessage(from, { image: { url: thumb }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg, btns);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 12. YTDOC - Video as Document
commands.push({
    name: 'ytdoc', description: 'Download video as document',
    aliases: ['videodoc', 'mp4doc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📁 *YTDOC*\n\nUsage: ${config.PREFIX}ytdoc <name or URL>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/download/mp4', { q: query });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);

            let tempFile = null;
            try {
                const filename = `${Date.now()}_${cleanFilename(data.title || 'video')}.mp4`;
                tempFile = await downloadFile(data.downloadUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);
                await sock.sendMessage(from, {
                    document: buffer,
                    fileName: cleanFilename(data.title || 'video') + '.mp4',
                    mimetype: 'video/mp4',
                    caption: `📁 ${data.title || 'Video'}\n💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 13. YTV - YouTube Video URL
commands.push({
    name: 'ytv', description: 'Download YouTube video from URL',
    aliases: ['ytmp4url'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`🎬 *YTV*\n\nUsage: ${config.PREFIX}ytv <YouTube URL>\n\n${FOOTER}`); }
        await react('🎬');
        try {
            const data = await apiGet('/api/download/youtube/mp4', { url: args[0] });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await showThumbnailAndSearch(sock, from, data, msg);
            await downloadAndSendVideo(sock, from, data, `🎬 YouTube Video`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// YOUTUBE INFO
// ═══════════════════════════════════════════

// 14. YTINFO
commands.push({
    name: 'ytinfo', description: 'YouTube video info',
    aliases: ['videoinfo', 'yti'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`ℹ️ *YTINFO*\n\nUsage: ${config.PREFIX}ytinfo <YouTube URL>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/download/youtube/info', { url: args[0] });
            if (!data.success) throw new Error('Failed');
            const thumb = data.thumbnailHD || data.thumbnail;
            let caption = `╭───[ ℹ️ YT INFO ]───\n`;
            caption += `├ 🆔 ${data.videoId}\n`;
            caption += `├ 🔗 ${data.url}\n`;
            caption += `╰───◇\n${FOOTER}`;
            if (thumb) {
                await sock.sendMessage(from, { image: { url: thumb }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg, [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '▶️ Watch', url: data.url }) }]);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 15. YTSEARCH
commands.push({
    name: 'ytsearch', description: 'Search YouTube',
    aliases: ['yts', 'ytfind'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🔍 *YTSEARCH*\n\nUsage: ${config.PREFIX}ytsearch <query>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/download/youtube/search', { q: args.join(' ') });
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `╭───[ 🔍 YT: "${args.join(' ')}" ]───\n\n`;
            data.items.slice(0, 5).forEach((v, i) => {
                text += `├ *${i+1}.* ${v.title}\n├ ⏱️ ${v.duration || 'N/A'} | 👤 ${v.channelTitle || 'N/A'}\n├ 🔗 ${v.url || `https://youtu.be/${v.id}`}\n\n`;
            });
            text += `╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg); }
    }
});

// 16. LYRICS
commands.push({
    name: 'lyrics', description: 'Get song lyrics',
    aliases: ['lyric', 'lirik'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎤 *LYRICS*\n\nUsage: ${config.PREFIX}lyrics <song name>\n\n${FOOTER}`); }
        await react('🎤');
        try {
            const data = await apiGet('/download/lyrics', { q: args.join(' ') });
            if (!data.success) throw new Error('No lyrics found');
            let text = `╭───[ 🎤 LYRICS ]───\n`;
            text += `├ 🎵 ${data.title}\n`;
            text += `├ 👤 ${data.author}\n`;
            text += `├ 💿 ${data.album || 'N/A'}\n`;
            text += `╰───◇\n\n${(data.lyrics || 'No lyrics').substring(0, 2500)}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No lyrics found*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// SPOTIFY
// ═══════════════════════════════════════════

// 17. SPOTIFY - Search & Download
commands.push({
    name: 'spotify', description: 'Search & download from Spotify',
    aliases: ['sp', 'spot'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟢 *SPOTIFY*\n\nUsage: ${config.PREFIX}spotify <song name>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/spotify/download', { q: args.join(' ') });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            if (data.albumArt) {
                let caption = `╭───[ 🟢 SPOTIFY ]───\n`;
                caption += `├ 🎵 ${data.title}\n`;
                caption += `├ 👤 ${data.artist}\n`;
                caption += `├ 💿 ${data.album || 'Single'}\n`;
                caption += `├ ⬇️ Downloading...\n`;
                caption += `╰───◇\n${FOOTER}`;
                await sock.sendMessage(from, { image: { url: data.albumArt }, caption }, { quoted: msg });
            }
            await downloadAndSendAudio(sock, from, data, `🟢 Spotify`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\nTry: ${config.PREFIX}spotifyurl <URL>\n\n${FOOTER}`, msg); }
    }
});

// 18. SPOTIFYURL
commands.push({
    name: 'spotifyurl', description: 'Download from Spotify URL',
    aliases: ['spurl', 'spoturl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟢 *SPOTIFY URL*\n\nUsage: ${config.PREFIX}spotifyurl <Spotify URL>\n\n${FOOTER}`); }
        await react('🟢');
        try {
            const data = await apiGet('/api/spotify/download', { url: args[0] });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            if (data.albumArt) {
                await sock.sendMessage(from, { image: { url: data.albumArt }, caption: `🟢 ${data.title} - ${data.artist}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }
            await downloadAndSendAudio(sock, from, data, `🟢 Spotify URL`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 19. SPOTIFYDL - Track ID
commands.push({
    name: 'spotifydl', description: 'Download Spotify by track ID',
    aliases: ['spdl', 'spid'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟢 *SPOTIFYDL*\n\nUsage: ${config.PREFIX}spotifydl <track ID or URL>\n\n${FOOTER}`); }
        const input = args[0];
        const trackId = extractSpotifyId(input);
        if (!trackId) return reply(`❌ Invalid Spotify ID\n\n${FOOTER}`);
        await react('🟢');
        try {
            const data = await apiGet('/api/spotify/download', { url: `https://open.spotify.com/track/${trackId}` });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            if (data.albumArt) {
                await sock.sendMessage(from, { image: { url: data.albumArt }, caption: `🟢 ${data.title} - ${data.artist}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }
            await downloadAndSendAudio(sock, from, data, `🟢 Spotify Track`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 20. SPOTIFYDOC - As document
commands.push({
    name: 'spotifydldoc', description: 'Download Spotify as document',
    aliases: ['spdoc', 'spotifydoc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📁 *SPOTIFY DOC*\n\nUsage: ${config.PREFIX}spotifydldoc <song name or URL>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/spotify/download', { q: args.join(' ') });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            if (data.albumArt) {
                await sock.sendMessage(from, { image: { url: data.albumArt }, caption: `📁 ${data.title} - ${data.artist}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }
            let tempFile = null;
            try {
                const filename = `${Date.now()}_${cleanFilename(data.title || 'spotify')}.mp3`;
                tempFile = await downloadFile(data.downloadUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);
                await sock.sendMessage(from, {
                    document: buffer, fileName: cleanFilename(data.title || 'spotify') + '.mp3',
                    mimetype: 'audio/mpeg',
                    caption: `📁 ${data.title}\n👤 ${data.artist}\n💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 21. SPOTIFYTRACK - Track Info
commands.push({
    name: 'spotifytrack', description: 'Get Spotify track info',
    aliases: ['sptrack', 'trackinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟢 *SPOTIFY TRACK*\n\nUsage: ${config.PREFIX}spotifytrack <track ID or URL>\n\n${FOOTER}`); }
        const trackId = extractSpotifyId(args[0]);
        if (!trackId) return reply(`❌ Invalid track ID\n\n${FOOTER}`);
        await react('🔍');
        try {
            const data = await apiGet(`/api/spotify/track/${trackId}`);
            if (!data.success) throw new Error('Not found');
            const t = data.track;
            let caption = `╭───[ 🟢 TRACK ]───\n`;
            caption += `├ 🎵 ${t.title}\n├ 👤 ${t.artist}\n├ ⏱️ ${t.duration || 'N/A'}\n├ 📅 ${t.release_date || 'N/A'}\n├ 🔗 ${t.url || ''}\n╰───◇\n${FOOTER}`;
            if (t.thumbnail) {
                await sock.sendMessage(from, { image: { url: t.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 22. SPOTIFYALBUM
commands.push({
    name: 'spotifyalbum', description: 'Get Spotify album info',
    aliases: ['spalbum', 'albuminfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`💿 *SPOTIFY ALBUM*\n\nUsage: ${config.PREFIX}spotifyalbum <album ID>\n\n${FOOTER}`); }
        const albumId = args[0].match(/album\/([a-zA-Z0-9]{22})/)?.[1] || args[0];
        await react('🔍');
        try {
            const data = await apiGet(`/api/spotify/album/${albumId}`);
            if (!data.success) throw new Error('Not found');
            const a = data.album;
            let caption = `╭───[ 💿 ALBUM ]───\n├ 📀 ${a.name}\n├ 👤 ${a.artist}\n├ 📅 ${a.release_date || 'N/A'}\n├ 🎵 ${a.total_tracks || a.tracks?.length || 'N/A'} tracks\n╰───◇\n${FOOTER}`;
            if (a.thumbnail) {
                await sock.sendMessage(from, { image: { url: a.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 23. SPOTIFYARTIST
commands.push({
    name: 'spotifyartist', description: 'Get Spotify artist info',
    aliases: ['spartist', 'artistinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎤 *SPOTIFY ARTIST*\n\nUsage: ${config.PREFIX}spotifyartist <artist ID>\n\n${FOOTER}`); }
        const artistId = args[0].match(/artist\/([a-zA-Z0-9]{22})/)?.[1] || args[0];
        await react('🔍');
        try {
            const data = await apiGet(`/api/spotify/artist/${artistId}`);
            if (!data.success) throw new Error('Not found');
            const a = data.artist;
            let caption = `╭───[ 🎤 ARTIST ]───\n├ 👤 ${a.name}\n├ 👥 ${a.followers ? (a.followers/1000).toFixed(1)+'K' : 'N/A'} followers\n├ ✅ ${a.verified ? 'Yes' : 'No'}\n├ 🎵 ${(a.genres||[]).join(', ') || 'N/A'}\n╰───◇\n${FOOTER}`;
            if (a.thumbnail) {
                await sock.sendMessage(from, { image: { url: a.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 24. SPOTIFYRANDOM
commands.push({
    name: 'spotifyrandom', description: 'Get random/trending Spotify track',
    aliases: ['sprandom', 'sptrending'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🎲');
        try {
            const data = await apiGet('/api/spotify/info/search', { q: 'top hits', type: 'track', limit: 10, offset: Math.floor(Math.random() * 5) });
            if (!data.success || !data.results?.length) throw new Error('No tracks');
            const t = data.results[Math.floor(Math.random() * data.results.length)];
            let caption = `╭───[ 🎲 RANDOM ]───\n├ 🎵 ${t.title}\n├ 👤 ${t.artist}\n├ 💿 ${t.album || 'N/A'}\n├ ⏱️ ${t.duration || 'N/A'}\n╰───◇\n${FOOTER}`;
            if (t.thumbnail) {
                await sock.sendMessage(from, { image: { url: t.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎲 Another', id: 'spotifyrandom' }) }]);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 25. SPOTIFYPLAYLIST
commands.push({
    name: 'spotifyplaylist', description: 'Get Spotify playlist info',
    aliases: ['spplaylist', 'playlistinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📋 *SPOTIFY PLAYLIST*\n\nUsage: ${config.PREFIX}spotifyplaylist <playlist ID>\n\n${FOOTER}`); }
        const plId = args[0].match(/playlist\/([a-zA-Z0-9]{22})/)?.[1] || args[0];
        await react('📋');
        try {
            const data = await apiGet(`/api/spotify/playlist/${plId}`);
            if (!data.success) throw new Error('Not found');
            const p = data.playlist;
            let caption = `╭───[ 📋 PLAYLIST ]───\n├ 📀 ${p.name}\n├ 👤 ${p.owner || 'N/A'}\n├ 🎵 ${p.total_tracks || p.tracks?.length || 'N/A'} tracks\n├ 👥 ${p.followers || 'N/A'} followers\n╰───◇\n${FOOTER}`;
            if (p.thumbnail) {
                await sock.sendMessage(from, { image: { url: p.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 26. ARTIST TOP TRACKS
commands.push({
    name: 'artisttoptracks', description: 'Get top tracks for artist',
    aliases: ['toptracks', 'artisthits'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎤 *TOP TRACKS*\n\nUsage: ${config.PREFIX}artisttoptracks <artist ID>\n\n${FOOTER}`); }
        const artistId = args[0].match(/artist\/([a-zA-Z0-9]{22})/)?.[1] || args[0];
        await react('🎤');
        try {
            const data = await apiGet(`/api/spotify/artist/${artistId}/top-tracks`);
            if (!data.success) throw new Error('Not found');
            const tracks = data.top_tracks || [];
            let text = `╭───[ 🎤 TOP TRACKS ]───\n├ 👤 ${data.artist?.name || 'Artist'}\n\n`;
            tracks.slice(0, 10).forEach((t, i) => {
                text += `├ *${i+1}.* ${t.title}\n├ 💿 ${t.album || 'N/A'} | ⏱️ ${t.duration || 'N/A'}\n\n`;
            });
            text += `╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// SOUNDCLOUD
// ═══════════════════════════════════════════

// 27. SOUNDCLOUD - Search & Download
commands.push({
    name: 'soundcloud', description: 'Search & download from SoundCloud',
    aliases: ['sc', 'sound'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟠 *SOUNDCLOUD*\n\nUsage: ${config.PREFIX}soundcloud <song name>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const search = await apiGet('/api/soundcloud/search', { q: query, limit: 3 });
            if (!search.success || !search.results?.length) throw new Error('No results');
            const track = search.results[0];
            const dl = await apiGet('/api/soundcloud/download', { url: track.permalink || track.url });
            if (!dl.success || !dl.result?.downloadUrl) throw new Error('No download URL');

            if (track.artwork || dl.result?.artwork) {
                const imgUrl = track.artwork || dl.result.artwork;
                await sock.sendMessage(from, { image: { url: imgUrl }, caption: `🟠 ${dl.result?.title || track.title}\n👤 ${dl.result?.artist || 'Unknown'}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }

            let tempFile = null;
            try {
                const filename = `${Date.now()}_${cleanFilename(dl.result?.title || 'soundcloud')}.mp3`;
                tempFile = await downloadFile(dl.result.downloadUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);
                await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });

                let caption = `╭───[ 🟠 SOUNDCLOUD ]───\n`;
                caption += `├ 🎧 ${dl.result?.title || 'SoundCloud'}\n`;
                caption += `├ 👤 ${dl.result?.artist || 'Unknown'}\n`;
                caption += `├ 💾 ${sizeMB} MB\n`;
                caption += `╰───◇\n${FOOTER}`;
                await sendButtonsMsg(sock, from, caption, msg);
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\nTry: ${config.PREFIX}scurl <URL>\n\n${FOOTER}`, msg); }
    }
});

// 28. SCURL - SoundCloud URL
commands.push({
    name: 'scurl', description: 'Download from SoundCloud URL',
    aliases: ['soundcloudurl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟠 *SC URL*\n\nUsage: ${config.PREFIX}scurl <SoundCloud URL>\n\n${FOOTER}`); }
        await react('🟠');
        try {
            const data = await apiGet('/api/soundcloud/download', { url: args[0] });
            if (!data.success || !data.result?.downloadUrl) throw new Error('No URL');
            if (data.result?.artwork) {
                await sock.sendMessage(from, { image: { url: data.result.artwork }, caption: `🟠 ${data.result.title}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }
            await downloadAndSendAudio(sock, from, { ...data.result, downloadUrl: data.result.downloadUrl }, `🟠 SoundCloud`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 29. SCDOC - SoundCloud Document
commands.push({
    name: 'scdoc', description: 'Download SoundCloud as document',
    aliases: ['soundclouddoc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📁 *SC DOC*\n\nUsage: ${config.PREFIX}scdoc <name or URL>\n\n${FOOTER}`); }
        const input = args.join(' ');
        await react('🔍');
        try {
            let dl;
            if (input.includes('soundcloud.com')) {
                dl = await apiGet('/api/soundcloud/download', { url: input });
            } else {
                const search = await apiGet('/api/soundcloud/search', { q: input, limit: 3 });
                if (!search.success || !search.results?.length) throw new Error('No results');
                dl = await apiGet('/api/soundcloud/download', { url: search.results[0].permalink });
            }
            if (!dl.success || !dl.result?.downloadUrl) throw new Error('No URL');

            let tempFile = null;
            try {
                const filename = `${Date.now()}_${cleanFilename(dl.result?.title || 'soundcloud')}.mp3`;
                tempFile = await downloadFile(dl.result.downloadUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);
                await sock.sendMessage(from, {
                    document: buffer, fileName: cleanFilename(dl.result?.title || 'soundcloud') + '.mp3',
                    mimetype: 'audio/mpeg',
                    caption: `📁 ${dl.result?.title || 'SoundCloud'}\n👤 ${dl.result?.artist || 'Unknown'}\n💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 30. SCDL - SoundCloud alias
commands.push({
    name: 'scdl', description: 'Download SoundCloud (alias)',
    aliases: ['scdown'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🟠 *SCDL*\n\nUsage: ${config.PREFIX}scdl <URL>\n\n${FOOTER}`); }
        await react('🟠');
        try {
            const data = await apiGet('/api/soundcloud/download', { url: args[0] });
            if (!data.success || !data.result?.downloadUrl) throw new Error('No URL');
            await downloadAndSendAudio(sock, from, { ...data.result, downloadUrl: data.result.downloadUrl }, `🟠 SoundCloud`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// TIKTOK
// ═══════════════════════════════════════════

// 31. TIKTOK
commands.push({
    name: 'tiktok', description: 'Download TikTok video',
    aliases: ['tt', 'ttdl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📱 *TIKTOK*\n\nUsage: ${config.PREFIX}tiktok <TikTok URL>\n\n${FOOTER}`); }
        await react('📱');
        try {
            const data = await apiGet('/api/download/tiktok', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Download failed');
            const videoUrl = data.videoUrl || data.videoProxyUrl;
            if (!videoUrl) throw new Error('No video URL');

            if (data.thumbnail || data.thumbnailUrl) {
                await sock.sendMessage(from, { image: { url: data.thumbnail || data.thumbnailUrl }, caption: `📱 ${data.title || 'TikTok'}\n👤 ${data.author || 'Unknown'}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }

            let tempFile = null;
            try {
                const filename = `${Date.now()}_tiktok.mp4`;
                tempFile = await downloadFile(videoUrl, filename);
                const buffer = await fs.readFile(tempFile);
                await sock.sendMessage(from, { video: buffer, caption: `📱 ${data.title || 'TikTok'}\n\n${FOOTER}` }, { quoted: msg });
                await sendButtonsMsg(sock, from, `📱 Downloaded!\n🎬 ${data.title || 'TikTok'}\n👤 ${data.author || 'Unknown'}\n\n${FOOTER}`, msg);
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 32. TIKTOKMP3
commands.push({
    name: 'tiktokmp3', description: 'Extract audio from TikTok',
    aliases: ['ttmp3', 'tiktokaudio'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`🎵 *TIKTOK MP3*\n\nUsage: ${config.PREFIX}tiktokmp3 <TikTok URL>\n\n${FOOTER}`); }
        await react('🎵');
        try {
            const data = await apiGet('/api/download/tiktok/audio', { url: args[0] });
            if (!data.success || !data.audioUrl) throw new Error('No audio');
            await downloadAndSendAudio(sock, from, { ...data, downloadUrl: data.audioUrl }, `🎵 TikTok Audio`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 33. TIKTOKINFO
commands.push({
    name: 'tiktokinfo', description: 'TikTok video info',
    aliases: ['ttinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`ℹ️ *TIKTOK INFO*\n\nUsage: ${config.PREFIX}tiktokinfo <TikTok URL>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/download/tiktok/info', { url: args[0] });
            if (!data.success) throw new Error('Failed');
            let caption = `╭───[ 📱 TIKTOK ]───\n├ 📝 ${data.title || 'N/A'}\n├ 👤 ${data.author || 'N/A'}\n├ 🎬 ${data.hasVideo ? '✅' : '❌'} | 🎵 ${data.hasAudio ? '✅' : '❌'}\n╰───◇\n${FOOTER}`;
            if (data.thumbnail) {
                await sock.sendMessage(from, { image: { url: data.thumbnail }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// INSTAGRAM
// ═══════════════════════════════════════════

// 34. IG
commands.push({
    name: 'ig', description: 'Download Instagram post/reel',
    aliases: ['igdl', 'insta', 'instagram'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📸 *INSTAGRAM*\n\nUsage: ${config.PREFIX}ig <Instagram URL>\n\n${FOOTER}`); }
        await react('📸');
        try {
            const data = await apiGet('/api/download/instagram', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            const mediaUrl = data.videoUrl || data.videoProxyUrl || data.imageUrl || data.mediaUrls?.[0];
            if (!mediaUrl) throw new Error('No media URL');
            const isVideo = !!data.videoUrl;

            if (data.thumbnailUrl || data.thumbnail) {
                await sock.sendMessage(from, { image: { url: data.thumbnailUrl || data.thumbnail }, caption: `📸 ${isVideo ? 'Reel' : 'Post'}\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }

            let tempFile = null;
            try {
                const ext = isVideo ? 'mp4' : 'jpg';
                const filename = `${Date.now()}_ig.${ext}`;
                tempFile = await downloadFile(mediaUrl, filename);
                const buffer = await fs.readFile(tempFile);
                if (isVideo) {
                    await sock.sendMessage(from, { video: buffer, caption: `📸 Instagram\n\n${FOOTER}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { image: buffer, caption: `📸 Instagram\n\n${FOOTER}` }, { quoted: msg });
                }
                await sendButtonsMsg(sock, from, `📸 Downloaded!\n${data.title ? `📝 ${data.title}\n` : ''}\n${FOOTER}`, msg);
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 35. IGSTORY
commands.push({
    name: 'igstory', description: 'Download Instagram story',
    aliases: ['igstories', 'story'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📸 *IG STORY*\n\nUsage: ${config.PREFIX}igstory <Instagram story URL>\n\n${FOOTER}`); }
        await react('📸');
        try {
            const data = await apiGet('/api/download/instagram/story', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            const mediaUrl = data.videoUrl || data.videoProxyUrl || data.imageUrl || data.mediaUrls?.[0];
            if (!mediaUrl) throw new Error('No media URL');

            let tempFile = null;
            try {
                const ext = data.videoUrl ? 'mp4' : 'jpg';
                const filename = `${Date.now()}_igstory.${ext}`;
                tempFile = await downloadFile(mediaUrl, filename);
                const buffer = await fs.readFile(tempFile);
                if (data.videoUrl) {
                    await sock.sendMessage(from, { video: buffer, caption: `📸 IG Story\n\n${FOOTER}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { image: buffer, caption: `📸 IG Story\n\n${FOOTER}` }, { quoted: msg });
                }
                await react('✅');
            } finally { if (tempFile) await fs.unlink(tempFile).catch(() => {}); }
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// FACEBOOK
// ═══════════════════════════════════════════

// 36. FB
commands.push({
    name: 'fb', description: 'Download Facebook video',
    aliases: ['fbdl', 'facebook'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📘 *FACEBOOK*\n\nUsage: ${config.PREFIX}fb <Facebook URL>\n\n${FOOTER}`); }
        await react('📘');
        try {
            const data = await apiGet('/api/download/facebook', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            const mediaUrl = data.hdUrl || data.sdUrl || data.videoUrl || data.videoProxyUrl;
            if (!mediaUrl) throw new Error('No video URL');
            if (data.thumbnailUrl) {
                await sock.sendMessage(from, { image: { url: data.thumbnailUrl }, caption: `📘 Facebook Video\n⬇️ Downloading...\n\n${FOOTER}` }, { quoted: msg });
            }
            await downloadAndSendVideo(sock, from, { ...data, downloadUrl: mediaUrl }, `📘 Facebook`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 37. FBREEL
commands.push({
    name: 'fbreel', description: 'Download Facebook reel',
    aliases: ['fbreels'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📘 *FB REEL*\n\nUsage: ${config.PREFIX}fbreel <Facebook reel URL>\n\n${FOOTER}`); }
        await react('📘');
        try {
            const data = await apiGet('/api/download/facebook/reel', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            const mediaUrl = data.hdUrl || data.sdUrl || data.videoUrl || data.videoProxyUrl;
            if (!mediaUrl) throw new Error('No video URL');
            await downloadAndSendVideo(sock, from, { ...data, downloadUrl: mediaUrl }, `📘 FB Reel`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 38. FBSNAP
commands.push({
    name: 'fbsnap', description: 'Download Facebook snap/story',
    aliases: ['fbstory'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`📘 *FB SNAP*\n\nUsage: ${config.PREFIX}fbsnap <Facebook snap URL>\n\n${FOOTER}`); }
        await react('📘');
        try {
            const data = await apiGet('/api/download/facebook/snap', { url: args[0] });
            if (!data.success || !data.downloadUrl) throw new Error('No URL');
            await downloadAndSendVideo(sock, from, data, `📘 FB Snap`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 39. FBINFO
commands.push({
    name: 'fbinfo', description: 'Facebook video info',
    aliases: ['facebookinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`ℹ️ *FB INFO*\n\nUsage: ${config.PREFIX}fbinfo <Facebook URL>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/download/facebook/info', { url: args[0] });
            if (!data.success) throw new Error('Failed');
            let caption = `╭───[ 📘 FB INFO ]───\n├ 📹 ${data.title || 'N/A'}\n├ 🎬 HD: ${data.hasHD ? '✅' : '❌'} | SD: ${data.hasSD ? '✅' : '❌'}\n├ 📊 Quality: ${data.qualityCount || 'N/A'}\n╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, caption, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// TWITTER/X
// ═══════════════════════════════════════════

// 40. TWITTER
commands.push({
    name: 'twitter', description: 'Download Twitter/X video',
    aliases: ['tw', 'twdl', 'xvideo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`🐦 *TWITTER/X*\n\nUsage: ${config.PREFIX}twitter <Twitter URL>\n\n${FOOTER}`); }
        await react('🐦');
        try {
            const data = await apiGet('/api/download/twitter', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            const mediaUrl = data.media?.[0]?.url || data.videoUrl || data.downloadUrl;
            if (!mediaUrl) throw new Error('No media URL');
            await downloadAndSendVideo(sock, from, { ...data, downloadUrl: mediaUrl }, `🐦 Twitter`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 41. TWITTERINFO
commands.push({
    name: 'twitterinfo', description: 'Twitter video info',
    aliases: ['twinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !isUrl(args[0])) { await react('ℹ️'); return reply(`ℹ️ *TWITTER INFO*\n\nUsage: ${config.PREFIX}twitterinfo <Twitter URL>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/download/twitter/info', { url: args[0] });
            if (!data.success) throw new Error('Failed');
            let caption = `╭───[ 🐦 TW INFO ]───\n├ 📝 ${data.title || 'N/A'}\n├ 👤 ${data.author || 'N/A'}\n├ 📊 Media: ${data.mediaCount || 0}\n├ 📎 ${(data.mediaTypes||[]).join(', ') || 'N/A'}\n╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, caption, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// SNAPCHAT
// ═══════════════════════════════════════════

// 42. SNAPCHAT
commands.push({
    name: 'snapchat', description: 'Download Snapchat content',
    aliases: ['snap', 'snapdl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`👻 *SNAPCHAT*\n\nUsage: ${config.PREFIX}snapchat <URL or username>\n\n${FOOTER}`); }
        await react('👻');
        try {
            const data = await apiGet('/api/download/snapchat', { url: args[0] });
            if (!data.success) throw new Error(data.error || 'Failed');
            if (data.downloadUrl) {
                await downloadAndSendVideo(sock, from, data, `👻 Snapchat`, msg);
            } else if (data.thumbnailUrl) {
                await sock.sendMessage(from, { image: { url: data.thumbnailUrl }, caption: `👻 Snapchat: ${data.username || 'Profile'}\n\n${FOOTER}` }, { quoted: msg });
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// SHAZAM
// ═══════════════════════════════════════════

// 43. SHAZAM - Recognize (reply to audio)
commands.push({
    name: 'shazam', description: 'Recognize song (reply to audio)',
    aliases: ['recognize', 'whatsong'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        const hasAudio = quoted?.message?.audioMessage || quoted?.message?.videoMessage || msg.message?.audioMessage || msg.message?.videoMessage;
        if (!hasAudio && !(args.length && isUrl(args[0]))) {
            await react('ℹ️'); return reply(`🎵 *SHAZAM*\n\nUsage: Reply to audio with ${config.PREFIX}shazam\nOr: ${config.PREFIX}shazam <audio URL>\n\n${FOOTER}`);
        }
        await react('🎵');
        try {
            let audioUrl;
            if (args.length && isUrl(args[0])) {
                audioUrl = args[0];
            } else if (hasAudio) {
                const targetMsg = quoted?.message?.audioMessage || quoted?.message?.videoMessage ? { key: quoted.key, message: quoted.message } : msg;
                const buffer = await require('gifted-baileys').downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console });
                const { uploadAuto } = require('../../megan/lib/upload');
                const { url } = await uploadAuto(buffer, `shazam_${Date.now()}.mp3`);
                audioUrl = url;
            }
            if (!audioUrl) throw new Error('No audio source');
            const data = await axios.post(`${API_BASE}/api/shazam/recognize`, { url: audioUrl }, { params: { apikey: API_KEY }, timeout: 30000 }).then(r => r.data);
            if (!data.success || !data.result) throw new Error('Recognition failed');
            const t = data.result;
            let caption = `╭───[ 🎵 SHAZAM ]───\n├ 🎶 ${t.title || 'Unknown'}\n├ 👤 ${t.artist || 'Unknown'}\n├ 💿 ${t.album || 'N/A'}\n├ 🎼 ${t.genre || 'N/A'}\n├ 📅 ${t.releaseDate || 'N/A'}\n╰───◇\n${FOOTER}`;
            if (t.coverUrl || t.artwork) {
                await sock.sendMessage(from, { image: { url: t.coverUrl || t.artwork }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg); }
    }
});

// 44. SHAZAMSEARCH
commands.push({
    name: 'shazamsearch', description: 'Search Shazam',
    aliases: ['shsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🔍 *SHAZAM SEARCH*\n\nUsage: ${config.PREFIX}shazamsearch <song>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/shazam/search', { q: args.join(' ') });
            if (!data.success || !data.result?.length) throw new Error('No results');
            let text = `╭───[ 🎵 SHAZAM: "${args.join(' ')}" ]───\n\n`;
            data.result.slice(0, 5).forEach((t, i) => {
                text += `├ *${i+1}.* ${t.title || t.name}\n├ 👤 ${t.artist || 'Unknown'}\n├ 💿 ${t.album || 'N/A'}\n\n`;
            });
            text += `╰───◇\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg); }
    }
});

// 45. SHAZAMINFO
commands.push({
    name: 'shazaminfo', description: 'Shazam track details',
    aliases: ['shtrack'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`ℹ️ *SHAZAM INFO*\n\nUsage: ${config.PREFIX}shazaminfo <track ID>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet(`/api/shazam/track/${args[0]}`);
            if (!data.success) throw new Error('Not found');
            const t = data.result;
            let caption = `╭───[ 🎵 SHAZAM ]───\n├ 🎶 ${t.title || 'N/A'}\n├ 👤 ${t.artist || 'N/A'}\n├ 💿 ${t.album || 'N/A'}\n├ 🎼 ${t.genre || 'N/A'}\n├ 📅 ${t.releaseDate || 'N/A'}\n╰───◇\n${FOOTER}`;
            if (t.coverUrl) {
                await sock.sendMessage(from, { image: { url: t.coverUrl }, caption }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, caption, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// DOWNLOADER HELP
// ═══════════════════════════════════════════

// 46. DOWNLOADER HELP
commands.push({
    name: 'downloaderhelp', description: 'Show all downloader commands',
    aliases: ['dlhelp', 'downloads', 'dlmenu'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `╭───[ 📥 DOWNLOADER ]───\n\n` +
            `├ 🎵 *YOUTUBE AUDIO*\n├ ${p}play | ${p}play2 | ${p}play3\n├ ${p}select | ${p}playdoc | ${p}ytmp3\n├ ${p}yta\n\n` +
            `├ 🎬 *YOUTUBE VIDEO*\n├ ${p}ytmp4 | ${p}video | ${p}hd\n├ ${p}ytmp5 | ${p}ytdoc | ${p}ytv\n\n` +
            `├ ℹ️ *YOUTUBE INFO*\n├ ${p}ytinfo | ${p}ytsearch | ${p}lyrics\n\n` +
            `├ 🟢 *SPOTIFY*\n├ ${p}spotify | ${p}spotifyurl | ${p}spotifydl\n├ ${p}spotifydldoc | ${p}spotifytrack\n├ ${p}spotifyalbum | ${p}spotifyartist\n├ ${p}spotifyrandom | ${p}spotifyplaylist\n├ ${p}artisttoptracks\n\n` +
            `├ 🟠 *SOUNDCLOUD*\n├ ${p}soundcloud | ${p}scurl | ${p}scdoc | ${p}scdl\n\n` +
            `├ 📱 *TIKTOK*\n├ ${p}tiktok | ${p}tiktokmp3 | ${p}tiktokinfo\n\n` +
            `├ 📸 *INSTAGRAM*\n├ ${p}ig | ${p}igstory\n\n` +
            `├ 📘 *FACEBOOK*\n├ ${p}fb | ${p}fbreel | ${p}fbsnap | ${p}fbinfo\n\n` +
            `├ 🐦 *TWITTER*\n├ ${p}twitter | ${p}twitterinfo\n\n` +
            `├ 👻 *SNAPCHAT*\n├ ${p}snapchat\n\n` +
            `├ 🎵 *SHAZAM*\n├ ${p}shazam | ${p}shazamsearch | ${p}shazaminfo\n\n` +
            `╰───◇\n📡 Powered by Megan APIs v3.6.4\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
