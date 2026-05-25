// ╔══════════════════════════════════════════════════╗
// ║   MEGAN-PRIME MOVIE COMMANDS - 26 Commands      ║
// ║  Powered by Megan Movie API | Tracker Wanga      ║
// ╚══════════════════════════════════════════════════╝

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../megan/config');
const { sendButtons, sendInteractiveMessage } = require('gifted-btns');

const commands = [];

const MOVIE_API = 'https://movieapi.megan.qzz.io/api';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const TEMP_DIR = path.join(__dirname, '../../temp');
const FOOTER = '> Megan-Prime | TrackerWanga';

fs.ensureDirSync(TEMP_DIR);

// Clean temp after each download
async function cleanTemp() {
    try {
        const files = await fs.readdir(TEMP_DIR);
        for (const f of files) {
            if (f.startsWith('movie_') || f.startsWith('series_')) {
                await fs.unlink(path.join(TEMP_DIR, f)).catch(() => {});
            }
        }
    } catch(e) {}
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

async function movieApi(endpoint, params = {}) {
    const url = `${MOVIE_API}${endpoint}`;
    // Warm-up + retry
    try { await axios.get(`${MOVIE_API}/`, { timeout: 10000 }).catch(()=>{}); } catch(e) {}
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await axios.get(url, { 
                params, 
                timeout: 30000 + (attempt * 15000),
                headers: { 'User-Agent': 'Megan-Prime/1.0' } 
            });
            return res.data;
        } catch (e) {
            if (attempt < 3 && (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.response?.status >= 500)) {
                await new Promise(r => setTimeout(r, attempt * 3000));
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
    const res = await axios({ method: 'GET', url, responseType: 'stream', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 600000 });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

function getPoster(item) {
    if (typeof item.poster === 'string') return item.poster;
    if (item.poster?.url) return item.poster.url;
    if (item.image?.url) return item.image.url;
    if (item.cover?.url) return item.cover.url;
    return '';
}

function getBackdrop(item) {
    if (typeof item.backdrop === 'string') return item.backdrop;
    if (item.backdrop?.url) return item.backdrop.url;
    return '';
}

function formatSize(mb) {
    if (!mb) return 'N/A';
    if (mb >= 1000) return (mb / 1000).toFixed(1) + ' GB';
    return mb + ' MB';
}

function cleanFileName(name) {
    return (name || 'download').replace(/[<>:"/\\|?*]/g, '').substring(0, 80);
}

// Store search results per chat
if (!global.movieSearches) global.movieSearches = {};

// ═══════════════════════════════════════════
// SEARCH COMMANDS
// ═══════════════════════════════════════════

// 1. MOVIE SEARCH
commands.push({
    name: 'moviesearch', description: 'Search for movies',
    aliases: ['searchmovie', 'findmovie'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎬 *MOVIE SEARCH*\n\nUsage: ${config.PREFIX}moviesearch <title>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await movieApi('/search/movies', { q: query, limit: 10 });
            const results = data.results || data.data?.results || [];
            if (!results.length) throw new Error('No movies found');

            global.movieSearches[from] = { results, timestamp: Date.now(), type: 'movie' };

            // Build single_select catalog
            const rows = results.slice(0, 5).map((m, i) => ({
                header: `⭐ ${m.rating || 'N/A'} | ${m.year || 'N/A'}`,
                title: `${i+1}. ${(m.title || m.name).substring(0, 50)}`,
                description: (m.genres || []).join(', ') || 'Movie',
                id: `moviepick_${m.subject_id || m.detail_path || i}`
            }));

            const text = `╭───[ 🎬 MOVIES: "${query}" ]───\n│ Pick a movie below to see details\n╰───◇\n${FOOTER}`;

            // Show first result poster
            const first = results[0];
            const poster = getPoster(first);
            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *No movies found*\n\n${FOOTER}`, msg); }
    }
});

// 2. TV SEARCH
commands.push({
    name: 'tvsearch', description: 'Search for TV series',
    aliases: ['searchtv', 'findtv', 'seriessearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📺 *TV SEARCH*\n\nUsage: ${config.PREFIX}tvsearch <title>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await movieApi('/search/tv', { q: query, limit: 10 });
            const results = data.results || data.data?.results || [];
            if (!results.length) throw new Error('No series found');

            global.movieSearches[from] = { results, timestamp: Date.now(), type: 'tv' };
            const tvBtns = results.slice(0, 5).map((m, i) => ({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: `${i+1}. ${(m.title || m.name).substring(0, 20)}`,
                    id: `movselect ${i+1}`
                })
            }));

            let text = `╭───[ 📺 TV: "${query}" ]───\n\n`;
            results.forEach((s, i) => {
                text += `├ *${i+1}.* ${s.title || s.name} (${s.year || 'N/A'})\n`;
                text += `├ ⭐ ${s.rating || 'N/A'} | 🎭 ${(s.genres || []).join(', ')}\n\n`;
            });
            text += `╰───◇\n*Reply 1-${results.length} for details*\n${FOOTER}`;

            const first = results[0];
            const poster = getPoster(first);
            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *No series found*\n\n${FOOTER}`, msg); }
    }
});

// 3. ANIME SEARCH
commands.push({
    name: 'animesearch', description: 'Search for anime',
    aliases: ['searchanime', 'findanime'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🌸 *ANIME SEARCH*\n\nUsage: ${config.PREFIX}animesearch <title>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await movieApi('/search/anime', { q: query, limit: 10 });
            const results = data.results || data.data?.results || [];
            if (!results.length) throw new Error('No anime found');

            global.movieSearches[from] = { results, timestamp: Date.now(), type: 'anime' };
            const animeBtns = results.slice(0, 5).map((m, i) => ({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: `${i+1}. ${(m.title || m.name).substring(0, 20)}`,
                    id: `movselect ${i+1}`
                })
            }));

            let text = `╭───[ 🌸 ANIME: "${query}" ]───\n\n`;
            results.forEach((a, i) => {
                text += `├ *${i+1}.* ${a.title || a.name} (${a.year || 'N/A'})\n`;
                text += `├ ⭐ ${a.rating || 'N/A'} | 🎭 ${(a.genres || []).join(', ')}\n\n`;
            });
            text += `╰───◇\n*Reply 1-${results.length} for details*\n${FOOTER}`;

            const first = results[0];
            const poster = getPoster(first);
            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *No anime found*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// DETAILS COMMANDS
// ═══════════════════════════════════════════

// 4. SELECT - Pick from search results
commands.push({
    name: 'movselect', description: 'Select from search results',
    aliases: ['mspick', 'moviepick'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const num = parseInt(args[0]);
        const search = global.movieSearches[from];
        if (isNaN(num) || !search || Date.now() - search.timestamp > 300000) {
            return reply(`❌ No recent search. Use ${config.PREFIX}moviesearch, ${config.PREFIX}tvsearch, or ${config.PREFIX}animesearch first.\n\n${FOOTER}`);
        }
        if (num < 1 || num > search.results.length) return reply(`❌ Choose 1-${search.results.length}\n\n${FOOTER}`);
        
        const item = search.results[num - 1];
        const detailPath = item.detail_path || item.slug || item.id || item.subject_id;
        await react('🔍');

        try {
            if (search.type === 'tv') {
                const data = await movieApi(`/tv/${detailPath}`);
                const d = data.data || data;
                const poster = getPoster(d);
                let text = `╭───[ 📺 TV DETAILS ]───\n`;
                text += `├ 📛 ${d.title}\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n`;
                text += `├ 🎭 ${(d.genres || []).join(', ')}\n`;
                text += `├ 📝 ${(d.description || '').substring(0, 200)}...\n`;
                text += `├ 📺 ${d.total_seasons || '?'} seasons | ${d.total_episodes || '?'} episodes\n`;
                text += `├ 📥 Download: ${config.PREFIX}tvdl ${detailPath}\n`;
                text += `├ 🔗 Stream: ${config.PREFIX}tvstream ${detailPath}\n`;
                text += `╰───◇\n${FOOTER}`;

                if (poster) {
                    await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
                } else {
                    await sendButtonsMsg(sock, from, text, msg);
                }
            } else {
                const data = await movieApi(`/movie/${detailPath}`);
                const d = data.data || data;
                const poster = getPoster(d);
                let text = `╭───[ 🎬 MOVIE DETAILS ]───\n`;
                text += `├ 📛 ${d.title}\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n`;
                text += `├ ⏱️ ${d.duration_minutes || 'N/A'} min | 🌍 ${d.country || 'N/A'}\n`;
                text += `├ 🎭 ${(d.genres || []).join(', ')}\n`;
                text += `├ 📝 ${(d.description || '').substring(0, 200)}...\n`;
                if (d.downloads?.length) {
                    text += `├ 📥 Qualities: ${d.downloads.map(dl => dl.quality).join(', ')}\n`;
                }
                text += `├ 📥 Download: ${config.PREFIX}moviedl ${detailPath}\n`;
                text += `├ 🔗 Stream: ${config.PREFIX}moviestream ${detailPath}\n`;
                text += `╰───◇\n${FOOTER}`;

                if (poster) {
                    await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
                } else {
                    await sendButtonsMsg(sock, from, text, msg);
                }
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed to get details*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// QUICK DOWNLOAD - Search, Pick First, Download
// ═══════════════════════════════════════════

// 5. MOVIEDL - Quick movie download (first result)
commands.push({
    name: 'moviedl', description: 'Search & download movie (first result)',
    aliases: ['mdl', 'moviedownload'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🎬 *MOVIE DOWNLOAD*\n\nUsage: ${config.PREFIX}moviedl <movie name>\nSearches and downloads first result\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        await sock.sendMessage(from, { text: `🔍 *Searching:* "${query}"...\n\n${FOOTER}` }, { quoted: msg });

        try {
            // Search
            const searchData = await movieApi('/search/movies', { q: query, limit: 3 });
            const results = searchData.results || searchData.data?.results || [];
            if (!results.length) throw new Error('No movies found');

            const movie = results[0];
            const detailPath = movie.detail_path || movie.slug || movie.id || movie.subject_id;
            const poster = getPoster(movie);

            // Show what we found
            let foundText = `╭───[ 🎬 FOUND ]───\n├ 📛 ${movie.title || movie.name}\n├ 📅 ${movie.year || 'N/A'} | ⭐ ${movie.rating || 'N/A'}\n├ ⬇️ Fetching download...\n╰───◇\n${FOOTER}`;
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: foundText }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: foundText }, { quoted: msg });
            }

            // Get details with download links
            const detailData = await movieApi(`/movie/${detailPath}`);
            const d = detailData.data || detailData;
            const downloads = d.downloads || [];
            
            if (!downloads.length) throw new Error('No download links available');

            // Pick highest quality
            const best = downloads[0];
            const dlUrl = best.url;

            await sock.sendMessage(from, { text: `⬇️ *Downloading:* ${d.title}\n📊 Quality: ${best.quality}\n💾 Size: ${formatSize(best.size_mb)}\n\n${FOOTER}` }, { quoted: msg });

            // Download
            let tempFile = null;
            try {
                const ext = dlUrl.includes('.mp4') ? 'mp4' : dlUrl.includes('.mkv') ? 'mkv' : 'mp4';
                const filename = `movie_${Date.now()}.${ext}`;
                tempFile = await downloadFile(dlUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);

                // Send as document
                await sock.sendMessage(from, {
                    document: buffer,
                    fileName: `${cleanFileName(d.title)}.${ext}`,
                    mimetype: 'video/mp4',
                    caption: `🎬 ${d.title}\n📊 ${best.quality} | 💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });

                // Success message with buttons
                let doneText = `╭───[ ✅ DOWNLOADED ]───\n├ 🎬 ${d.title}\n├ 📊 ${best.quality}\n├ 💾 ${sizeMB} MB\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n╰───◇\n${FOOTER}`;
                const btns = [];
                if (d.streams?.length) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Stream', url: d.streams[0].url }) });
                await sendButtonsMsg(sock, from, doneText, msg, btns);
                await react('✅');
            } finally {
                if (tempFile) await fs.unlink(tempFile).catch(() => {});
                await cleanTemp();
            }
        } catch (e) {
            console.error('MovieDL error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg);
        }
    }
});

// 6. TVDL - Quick TV episode download (first result, first season, first episode)
commands.push({
    name: 'tvdl', description: 'Search & download TV episode (first result)',
    aliases: ['tdl', 'tvdownload'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`📺 *TV DOWNLOAD*\n\nUsage: ${config.PREFIX}tvdl <series name>\nSearches and downloads first result S01E01\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        await sock.sendMessage(from, { text: `🔍 *Searching:* "${query}"...\n\n${FOOTER}` }, { quoted: msg });

        try {
            // Search
            const searchData = await movieApi('/search/tv', { q: query, limit: 3 });
            const results = searchData.results || searchData.data?.results || [];
            if (!results.length) throw new Error('No series found');

            const series = results[0];
            const detailPath = series.detail_path || series.slug || series.id || series.subject_id;
            const poster = getPoster(series);

            // Show what we found
            let foundText = `╭───[ 📺 FOUND ]───\n├ 📛 ${series.title || series.name}\n├ 📅 ${series.year || 'N/A'} | ⭐ ${series.rating || 'N/A'}\n├ ⬇️ Fetching S01E01...\n╰───◇\n${FOOTER}`;
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: foundText }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: foundText }, { quoted: msg });
            }

            // Get series details
            const detailData = await movieApi(`/tv/${detailPath}`);
            const d = detailData.data || detailData;
            const seasons = d.seasons || [];
            if (!seasons.length) throw new Error('No seasons available');

            const season1 = seasons.find(s => s.season === 1) || seasons[0];
            const episodes = season1.episodes || [];
            if (!episodes.length) throw new Error('No episodes available');

            const ep1 = episodes[0];
            const dlUrl = ep1.download_url || ep1.stream_url;
            if (!dlUrl) throw new Error('No download URL');

            await sock.sendMessage(from, { text: `⬇️ *Downloading:* ${d.title} S${season1.season}E${ep1.episode}\n💾 Size: ${formatSize(ep1.size_mb)}\n\n${FOOTER}` }, { quoted: msg });

            // Download
            let tempFile = null;
            try {
                const ext = dlUrl.includes('.mp4') ? 'mp4' : dlUrl.includes('.mkv') ? 'mkv' : 'mp4';
                const filename = `series_${Date.now()}.${ext}`;
                tempFile = await downloadFile(dlUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);

                await sock.sendMessage(from, {
                    document: buffer,
                    fileName: `${cleanFileName(d.title)}_S${season1.season}E${ep1.episode}.${ext}`,
                    mimetype: 'video/mp4',
                    caption: `📺 ${d.title} S${season1.season}E${ep1.episode}: ${ep1.name || ''}\n💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });

                let doneText = `╭───[ ✅ DOWNLOADED ]───\n├ 📺 ${d.title}\n├ 🎬 S${season1.season}E${ep1.episode}: ${ep1.name || 'Episode'}\n├ 💾 ${sizeMB} MB\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n╰───◇\n${FOOTER}`;
                const btns = [];
                if (ep1.stream_url) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Stream', url: ep1.stream_url }) });
                await sendButtonsMsg(sock, from, doneText, msg, btns);
                await react('✅');
            } finally {
                if (tempFile) await fs.unlink(tempFile).catch(() => {});
                await cleanTemp();
            }
        } catch (e) {
            console.error('TVDL error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg);
        }
    }
});

// 7. ANIMEDL - Quick anime download
commands.push({
    name: 'animedl', description: 'Search & download anime (first result)',
    aliases: ['adl', 'animedownload'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🌸 *ANIME DOWNLOAD*\n\nUsage: ${config.PREFIX}animedl <anime name>\nSearches and downloads first result\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        await sock.sendMessage(from, { text: `🔍 *Searching:* "${query}"...\n\n${FOOTER}` }, { quoted: msg });

        try {
            const searchData = await movieApi('/search/anime', { q: query, limit: 3 });
            const results = searchData.results || searchData.data?.results || [];
            if (!results.length) throw new Error('No anime found');

            const anime = results[0];
            const detailPath = anime.detail_path || anime.slug || anime.id || anime.subject_id;
            const poster = getPoster(anime);

            let foundText = `╭───[ 🌸 FOUND ]───\n├ 📛 ${anime.title || anime.name}\n├ 📅 ${anime.year || 'N/A'} | ⭐ ${anime.rating || 'N/A'}\n├ ⬇️ Fetching download...\n╰───◇\n${FOOTER}`;
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: foundText }, { quoted: msg });
            }

            const detailData = await movieApi(`/anime/${detailPath}`);
            const d = detailData.data || detailData;
            const downloads = d.downloads || [];
            if (!downloads.length) throw new Error('No download links');

            const best = downloads[0];
            const dlUrl = best.url;

            await sock.sendMessage(from, { text: `⬇️ *Downloading:* ${d.title}\n📊 ${best.quality} | 💾 ${formatSize(best.size_mb)}\n\n${FOOTER}` }, { quoted: msg });

            let tempFile = null;
            try {
                const ext = 'mp4';
                const filename = `movie_${Date.now()}.${ext}`;
                tempFile = await downloadFile(dlUrl, filename);
                const buffer = await fs.readFile(tempFile);
                const sizeMB = (buffer.length / 1048576).toFixed(1);

                await sock.sendMessage(from, {
                    document: buffer,
                    fileName: `${cleanFileName(d.title)}.${ext}`,
                    mimetype: 'video/mp4',
                    caption: `🌸 ${d.title}\n📊 ${best.quality} | 💾 ${sizeMB} MB\n\n${FOOTER}`
                }, { quoted: msg });

                await sendButtonsMsg(sock, from, `✅ Downloaded!\n🌸 ${d.title}\n💾 ${sizeMB} MB\n\n${FOOTER}`, msg);
                await react('✅');
            } finally {
                if (tempFile) await fs.unlink(tempFile).catch(() => {});
                await cleanTemp();
            }
        } catch (e) {
            console.error('AnimeDL error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed:* ${e.message}\n\n${FOOTER}`, msg);
        }
    }
});

// ═══════════════════════════════════════════
// STREAM LINKS
// ═══════════════════════════════════════════

// 8. MOVIESTREAM - Get movie stream link
commands.push({
    name: 'moviestream', description: 'Get movie stream link',
    aliases: ['mstream', 'watchmovie'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🔗 *MOVIE STREAM*\n\nUsage: ${config.PREFIX}moviestream <movie name>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const searchData = await movieApi('/search/movies', { q: query, limit: 3 });
            const results = searchData.results || searchData.data?.results || [];
            if (!results.length) throw new Error('No movies found');

            const movie = results[0];
            const detailPath = movie.detail_path || movie.slug || movie.id;
            const detailData = await movieApi(`/movie/${detailPath}`);
            const d = detailData.data || detailData;
            const streams = d.streams || [];
            const poster = getPoster(d);

            if (!streams.length) {
                return sendButtonsMsg(sock, from, `❌ *No stream available*\n\nUse ${config.PREFIX}moviedl instead\n\n${FOOTER}`, msg);
            }

            let text = `╭───[ 🔗 STREAM ]───\n├ 🎬 ${d.title}\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n\n`;
            streams.forEach(s => {
                text += `├ 📊 ${s.quality}: ${s.url}\n`;
            });
            text += `╰───◇\n${FOOTER}`;

            const btns = streams.slice(0, 3).map(s => ({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({ display_text: `▶️ ${s.quality}`, url: s.url })
            }));

            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 9. TVSTREAM - Get TV stream link
commands.push({
    name: 'tvstream', description: 'Get TV series stream link',
    aliases: ['tstream', 'watchtv'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🔗 *TV STREAM*\n\nUsage: ${config.PREFIX}tvstream <series name>\n\n${FOOTER}`); }
        const query = args.join(' ');
        await react('🔍');
        try {
            const searchData = await movieApi('/search/tv', { q: query, limit: 3 });
            const results = searchData.results || searchData.data?.results || [];
            if (!results.length) throw new Error('No series found');

            const series = results[0];
            const detailPath = series.detail_path || series.slug || series.id;
            const detailData = await movieApi(`/tv/${detailPath}`);
            const d = detailData.data || detailData;
            const seasons = d.seasons || [];
            const poster = getPoster(d);

            if (!seasons.length) throw new Error('No seasons');

            // Show first season episodes with stream links
            const s1 = seasons[0];
            const episodes = (s1.episodes || []).slice(0, 5);

            let text = `╭───[ 🔗 TV STREAM ]───\n├ 📺 ${d.title}\n├ 📅 ${d.year || 'N/A'} | ⭐ ${d.rating || 'N/A'}\n├ 📺 Season ${s1.season}\n\n`;
            episodes.forEach(ep => {
                text += `├ 🎬 E${ep.episode}: ${ep.name || 'Episode'}\n├ 🔗 ${ep.stream_url || 'No stream'}\n\n`;
            });
            text += `╰───◇\n${FOOTER}`;

            const btns = episodes.filter(e => e.stream_url).slice(0, 3).map(e => ({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({ display_text: `▶️ S${s1.season}E${e.episode}`, url: e.stream_url })
            }));

            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// HOMEPAGE / BROWSE
// ═══════════════════════════════════════════

// 10. TRENDING
commands.push({
    name: 'trending', description: 'Show trending movies & TV',
    aliases: ['trendingnow', 'whatshot'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔥');
        try {
            const data = await movieApi('/homepage/trending');
            const results = data.trending || data.results || data.data || [];
            if (!results.length) throw new Error('No trending');

            global.movieSearches[from] = { results, timestamp: Date.now(), type: 'movie' };

            let text = `╭───[ 🔥 TRENDING ]───\n\n`;
            results.slice(0, 10).forEach((m, i) => {
                text += `├ *${i+1}.* ${m.title || m.name} (${m.year || 'N/A'})\n├ ⭐ ${m.rating || 'N/A'} | 🎭 ${(m.genres || []).join(', ')}\n\n`;
            });
            text += `╰───◇\n*Reply 1-10 for details*\n${FOOTER}`;

            const first = results[0];
            const poster = getPoster(first);
            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg); }
    }
});

// 11-23: Category commands (action, horror, romance, etc.)
const CATEGORIES = [
    { name: 'action', emoji: '💥', desc: 'Action movies' },
    { name: 'horror', emoji: '👻', desc: 'Horror movies' },
    { name: 'romance', emoji: '💕', desc: 'Romance movies' },
    { name: 'adventure', emoji: '🗺️', desc: 'Adventure movies' },
    { name: 'cinema', emoji: '🎦', desc: 'Cinema releases' },
    { name: 'hot', emoji: '🔥', desc: 'Hot content' },
    { name: 'kdrama', emoji: '🇰🇷', desc: 'K-Dramas' },
    { name: 'cdrama', emoji: '🇨🇳', desc: 'C-Dramas' },
    { name: 'turkish', emoji: '🇹🇷', desc: 'Turkish dramas' },
    { name: 'upcoming', emoji: '📅', desc: 'Upcoming releases' },
    { name: 'blackshows', emoji: '✊', desc: 'Black shows' },
    { name: 'smartstart', emoji: '🧒', desc: 'Smart Start cartoons' },
];

CATEGORIES.forEach(({ name, emoji, desc }) => {
    commands.push({
        name, description: `Show ${desc}`,
        aliases: name === 'hot' ? ['hotmovies'] : name === 'cinema' ? ['cinemamovies'] : [],
        async execute({ msg, from, sender, args, bot, sock, react, reply }) {
            await react(emoji);
            try {
                const data = await movieApi(`/homepage/${name}`);
                let results = data[name] || data.movies || data.results || data.data || [];
                if (data[name]?.movies) results = data[name].movies;
                if (!results.length) throw new Error(`No ${desc}`);

                global.movieSearches[from] = { results, timestamp: Date.now(), type: 'movie' };

                let text = `╭───[ ${emoji} ${desc.toUpperCase()} ]───\n\n`;
                results.slice(0, 10).forEach((m, i) => {
                    text += `├ *${i+1}.* ${m.title || m.name} (${m.year || 'N/A'})\n├ ⭐ ${m.rating || 'N/A'} | 🎭 ${(m.genres || []).join(', ')}\n\n`;
                });
                text += `╰───◇\n*Reply 1-10 for details*\n${FOOTER}`;

                const first = results[0];
                const poster = getPoster(first);
                if (poster) {
                    await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
                } else {
                    await sendButtonsMsg(sock, from, text, msg);
                }
                await react('✅');
            } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *No ${desc}*\n\n${FOOTER}`, msg); }
        }
    });
});

// 24. ANIME HOME
commands.push({
    name: 'animehome', description: 'Show anime homepage',
    aliases: ['animebrowse', 'animelist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🌸');
        try {
            const data = await movieApi('/homepage/anime');
            const results = data.anime || data.movies || data.results || [];
            if (!results.length) throw new Error('No anime');

            global.movieSearches[from] = { results, timestamp: Date.now(), type: 'anime' };
            const animeBtns = results.slice(0, 5).map((m, i) => ({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: `${i+1}. ${(m.title || m.name).substring(0, 20)}`,
                    id: `movselect ${i+1}`
                })
            }));

            let text = `╭───[ 🌸 ANIME ]───\n\n`;
            results.slice(0, 10).forEach((a, i) => {
                text += `├ *${i+1}.* ${a.title || a.name} (${a.year || 'N/A'})\n├ ⭐ ${a.rating || 'N/A'} | 🎭 ${(a.genres || []).join(', ')}\n\n`;
            });
            text += `╰───◇\n*Reply 1-10 for details*\n${FOOTER}`;

            const first = results[0];
            const poster = getPoster(first);
            // Send poster with caption
            if (poster) {
                await sock.sendMessage(from, { image: { url: poster }, caption: text }, { quoted: msg });
            }
            // Send catalog picker
            try {
                await sendInteractiveMessage(sock, from, {
                    text: `🎬 *Results for "${query}"*\nPick a movie:`,
                    footer: 'Megan Movie API',
                    interactiveButtons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: 'Movies Found',
                            sections: [{ title: 'Results', rows }]
                        })
                    }]
                }, { quoted: msg });
            } catch(e) {
                // Fallback to text
                let fallback = `🎬 *Results for "${query}"*\n\n`;
                results.slice(0, 5).forEach((m, i) => {
                    fallback += `*${i+1}.* ${m.title} (${m.year})\n⭐ ${m.rating} | ${m.genres.join(', ')}\n\n`;
                });
                fallback += `Reply .moviedl <number> to download\n${FOOTER}`;
                await sendButtonsMsg(sock, from, fallback, msg);
            }
            await react('✅');
        } catch (e) { await react('❌'); await sendButtonsMsg(sock, from, `❌ *No anime*\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// HELP
// ═══════════════════════════════════════════

// 25. MOVIE HELP
commands.push({
    name: 'moviehelp', description: 'Show all movie commands',
    aliases: ['movies', 'movie', 'cinemahelp'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `╭───[ 🎬 MOVIE COMMANDS ]───\n\n` +
            `├ 🔍 *SEARCH*\n├ ${p}moviesearch | ${p}tvsearch\n├ ${p}animesearch | ${p}movselect\n\n` +
            `├ 📥 *DOWNLOAD*\n├ ${p}moviedl - Quick movie download\n├ ${p}tvdl - Quick TV episode\n├ ${p}animedl - Quick anime download\n\n` +
            `├ 🔗 *STREAM*\n├ ${p}moviestream | ${p}tvstream\n\n` +
            `├ 🔥 *BROWSE*\n├ ${p}trending | ${p}hot | ${p}cinema\n├ ${p}action | ${p}horror | ${p}romance\n├ ${p}adventure | ${p}kdrama | ${p}cdrama\n├ ${p}turkish | ${p}upcoming | ${p}animehome\n├ ${p}blackshows | ${p}smartstart\n\n` +
            `╰───◇\n📡 Megan Movie API\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
