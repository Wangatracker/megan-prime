// Megan-Prime Complete Search - 61 Commands Using Megan APIs v3.6.4
// Powered by Megan APIs | Tracker Wanga | Falcon Tech

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

async function apiGet(endpoint, params = {}, timeout = 90000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
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

function formatNumber(n) {
    if (!n) return 'N/A';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function cleanHtml(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ==================== WEB SEARCH ====================

// 1. GOOGLE
commands.push({
    name: 'google',
    description: 'Search the web via Google',
    aliases: ['g', 'search'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🔍 *GOOGLE SEARCH*\n\n*Usage:* ${config.PREFIX}google <query>\n*Example:* ${config.PREFIX}google Megan MD bot\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🔍');
        try {
            const axios2 = require('axios');
            const cheerio = require('cheerio');
            const res = await axios2.get('https://html.duckduckgo.com/html', { params: { q: query }, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const $ = cheerio.load(res.data);
            const results = [];
            $('.result').each((i, el) => {
                if (i < 8) {
                    const title = $(el).find('.result__title').text().trim();
                    const url = $(el).find('.result__url').text().trim();
                    const snippet = $(el).find('.result__snippet').text().trim();
                    if (title && url) results.push({ title, url: url.startsWith('http') ? url : 'https://' + url, snippet });
                }
            });
            if (!results.length) throw new Error('No results');
            let text = `🔍 *Google: "${query}"*\n\n`;
            results.forEach((r, i) => { text += `*${i + 1}. ${r.title}*\n📎 ${r.url}\n${r.snippet ? '📝 ' + r.snippet + '\n' : ''}\n`; });
            text += `${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Google error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 2. BING
commands.push({
    name: 'bing',
    description: 'Search the web via Bing',
    aliases: ['bingsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🔍 *BING SEARCH*\n\n*Usage:* ${config.PREFIX}bing <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🔍');
        try {
            const axios2 = require('axios');
            const cheerio = require('cheerio');
            const res = await axios2.get('https://www.bing.com/search', { params: { q: query }, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const $ = cheerio.load(res.data);
            const results = [];
            $('#b_results .b_algo').each((i, el) => {
                if (i < 8) {
                    const title = $(el).find('h2').text().trim();
                    const link = $(el).find('h2 a').attr('href');
                    const desc = $(el).find('.b_caption p').text().trim();
                    if (title && link) results.push({ title, url: link, description: desc });
                }
            });
            if (!results.length) throw new Error('No results');
            let text = `🔍 *Bing: "${query}"*\n\n`;
            results.forEach((r, i) => { text += `*${i + 1}. ${r.title}*\n📎 ${r.url}\n${r.description ? '📝 ' + r.description + '\n' : ''}\n`; });
            text += `${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Bing error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 3. DUCKDUCKGO
commands.push({
    name: 'duckduckgo',
    description: 'Search DuckDuckGo',
    aliases: ['ddg', 'duck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🦆 *DUCKDUCKGO*\n\n*Usage:* ${config.PREFIX}duckduckgo <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🦆');
        try {
            const data = await apiGet('/api/s/duckduckgo', { query, kl: 'us-en', df: 'w' });
            if (!data?.data?.results?.length) throw new Error('No results');
            const results = data.data.results.slice(0, 8);
            let text = `🦆 *DuckDuckGo: "${query}"*\n\n`;
            results.forEach((r, i) => { text += `*${i + 1}. ${r.title}*\n📎 ${r.url}\n${r.snippet ? '📝 ' + r.snippet + '\n' : ''}\n`; });
            text += `${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('DDG error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== YOUTUBE SEARCH ====================

// 4. YOUTUBE
commands.push({
    name: 'youtube',
    description: 'Search YouTube videos',
    aliases: ['yt', 'ytsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎬 *YOUTUBE SEARCH*\n\n*Usage:* ${config.PREFIX}youtube <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🎬');
        try {
            const data = await apiGet('/api/search/youtube', { q: query });
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `🎬 *YouTube: "${query}"*\n\n`;
            data.items.slice(0, 8).forEach((v, i) => {
                text += `*${i + 1}. ${v.title}*\n⏱️ ${v.timestamp || 'N/A'} | 👁️ ${formatNumber(v.views)}\n👤 ${v.channelTitle || v.author?.name || 'Unknown'}\n🔗 ${v.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('YouTube error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 5. YTTRENDING
commands.push({
    name: 'yttrending',
    description: 'Get trending YouTube videos',
    aliases: ['trending', 'ytrending'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔥');
        try {
            const data = await apiGet('/api/youtube/trending');
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `🔥 *YouTube Trending*\n\n`;
            data.items.slice(0, 10).forEach((v, i) => {
                text += `*${i + 1}. ${v.title}*\n👁️ ${formatNumber(v.views)} | 👤 ${v.channelTitle || 'Unknown'}\n🔗 ${v.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('YTTrending error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 6. YTRECOMMEND
commands.push({
    name: 'ytrecommend',
    description: 'Get YouTube video recommendations',
    aliases: ['ytrelated', 'related'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎬 *YOUTUBE RECOMMENDATIONS*\n\n*Usage:* ${config.PREFIX}ytrecommend <video ID or URL>\n\n${FOOTER}`);
        }
        const input = args[0];
        const vidMatch = input.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
        const vid = vidMatch ? vidMatch[1] : (input.length === 11 ? input : null);
        if (!vid) return reply(`❌ *Invalid video ID*\n\n${FOOTER}`);
        await react('🎬');
        try {
            const data = await apiGet('/api/youtube/recommend', { id: vid });
            if (!data.success || !data.items?.length) throw new Error('No recommendations');
            let text = `🎬 *Related Videos*\n\n`;
            data.items.slice(0, 8).forEach((v, i) => {
                text += `*${i + 1}. ${v.title}*\n⏱️ ${v.timestamp || 'N/A'} | 👁️ ${formatNumber(v.views)}\n🔗 ${v.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('YTRecommend error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== SPOTIFY SEARCH ====================

// 7. SPOTIFYSEARCH
commands.push({
    name: 'spotifysearch',
    description: 'Search Spotify for tracks',
    aliases: ['spsearch', 'spotsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🟢 *SPOTIFY SEARCH*\n\n*Usage:* ${config.PREFIX}spotifysearch <song name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/api/spotify/search', { q: query });
            if (!data.success || !data.tracks?.length) throw new Error('No results');
            let text = `🟢 *Spotify: "${query}"*\n\n`;
            data.tracks.slice(0, 10).forEach((t, i) => {
                text += `*${i + 1}. ${t.title}*\n👤 ${t.artist}\n💿 ${t.album || 'Single'}\n🔗 ${t.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('SpotifySearch error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 8. SPSEARCH - Deep Spotify Search
commands.push({
    name: 'spsearch',
    description: 'Deep Spotify search (tracks/albums/artists)',
    aliases: ['spotifydeep', 'spfind'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🟢 *SPOTIFY DEEP SEARCH*\n\n*Usage:* ${config.PREFIX}spsearch <query> [track/album/artist]\n\n${FOOTER}`);
        }
        const type = ['track', 'album', 'artist'].includes(args[args.length - 1]?.toLowerCase()) ? args.pop().toLowerCase() : 'track';
        const query = args.join(' ');
        if (!query) return reply(`❌ *Provide a query*\n\n${FOOTER}`);
        await react('🔍');
        try {
            const data = await apiGet('/api/spotify/info/search', { q: query, type, limit: 10 });
            if (!data.success || !data.results?.length) throw new Error('No results');
            let text = `🟢 *Spotify ${type}s: "${query}"*\n\n`;
            data.results.forEach((r, i) => {
                if (type === 'track') text += `*${i + 1}. ${r.title}*\n👤 ${r.artist}\n💿 ${r.album || ''}\n🔗 ${r.url}\n\n`;
                else if (type === 'album') text += `*${i + 1}. ${r.name}*\n👤 ${r.artist}\n📅 ${r.release_date || ''}\n🔗 ${r.url}\n\n`;
                else text += `*${i + 1}. ${r.name}*\n👥 ${formatNumber(r.followers)} followers\n🎵 ${(r.genres || []).join(', ')}\n🔗 ${r.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('SpSearch error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== SOUNDCLOUD SEARCH ====================

// 9. SOUNDCLOUDSEARCH
commands.push({
    name: 'soundcloudsearch',
    description: 'Search SoundCloud for tracks',
    aliases: ['scsearch', 'soundsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🟠 *SOUNDCLOUD SEARCH*\n\n*Usage:* ${config.PREFIX}soundcloudsearch <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/api/soundcloud/search', { q: query, limit: 10 });
            if (!data.success || !data.results?.length) throw new Error('No results');
            let text = `🟠 *SoundCloud: "${query}"*\n\n`;
            data.results.slice(0, 10).forEach((t, i) => {
                text += `*${i + 1}. ${t.title || t.name || 'Unknown'}*\n👤 ${t.artist || t.user || 'Unknown'}\n⏱️ ${t.duration ? new Date(t.duration).toISOString().substr(11, 8) : 'N/A'}\n🔗 ${t.url || t.permalink_url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('SCSearch error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== SHAZAM SEARCH ====================

// 10. SHAZAMSEARCH
commands.push({
    name: 'shazamsearch',
    description: 'Search Shazam for tracks',
    aliases: ['shsearch', 'shazam'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎵 *SHAZAM SEARCH*\n\n*Usage:* ${config.PREFIX}shazamsearch <song name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🔍');
        try {
            const data = await apiGet('/api/shazam/search', { q: query });
            if (!data.success || !data.result?.length) throw new Error('No results');
            let text = `🎵 *Shazam: "${query}"*\n\n`;
            data.result.slice(0, 10).forEach((t, i) => {
                text += `*${i + 1}. ${t.title || t.name}*\n👤 ${t.artist || 'Unknown'}\n💿 ${t.album || 'N/A'}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('ShazamSearch error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== NEWS ====================

// 11. NEWS
commands.push({
    name: 'news',
    description: 'Search global news',
    aliases: ['newsearch', 'globalnews'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📰 *NEWS SEARCH*\n\n*Usage:* ${config.PREFIX}news <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📰');
        try {
            const data = await apiGet('/api/search/news', { q: query });
            if (!data.success || !data.articles?.length) throw new Error('No news found');
            let text = `📰 *News: "${query}"*\n\n`;
            data.articles.slice(0, 8).forEach((a, i) => {
                text += `*${i + 1}. ${a.title}*\n📝 ${(a.description || '').substring(0, 100)}...\n📰 ${a.source || 'Unknown'}\n🔗 ${a.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('News error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 12. GLOBALNEWS
commands.push({
    name: 'globalnews',
    description: 'Get global top headlines',
    aliases: ['worldnews', 'topnews'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🌍');
        try {
            const data = await apiGet('/api/news/global');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `🌍 *Global Headlines*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => {
                text += `*${i + 1}. ${a.title}*\n📰 ${a.source?.name || 'Unknown'}\n🕒 ${new Date(a.publishedAt).toLocaleString()}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('GlobalNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 13. KENYANEWS
commands.push({
    name: 'kenyanews',
    description: 'Get Kenya news headlines',
    aliases: ['knews', 'kenya'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🇰🇪');
        try {
            const data = await apiGet('/api/news/kenya');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `🇰🇪 *Kenya News*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => {
                text += `*${i + 1}. ${a.title}*\n📰 ${a.source?.name || 'Unknown'}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('KenyaNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 14. TUKONEWS
commands.push({
    name: 'tukonews',
    description: 'Get Tuko.co.ke news',
    aliases: ['tuko'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📰');
        try {
            const data = await apiGet('/api/news/tuko');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `📰 *Tuko News*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => { text += `*${i + 1}. ${a.title}*\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('TukoNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 15. NATIONNEWS
commands.push({
    name: 'nationnews',
    description: 'Get Nation Africa news',
    aliases: ['nation', 'dailynews'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📰');
        try {
            const data = await apiGet('/api/news/nation');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `📰 *Nation Africa*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => { text += `*${i + 1}. ${a.title}*\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('NationNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 16. STANDARDNEWS
commands.push({
    name: 'standardnews',
    description: 'Get Standard Digital news',
    aliases: ['standard'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📰');
        try {
            const data = await apiGet('/api/news/standard');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `📰 *Standard Digital*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => { text += `*${i + 1}. ${a.title}*\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('StandardNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 17. KENYANSNEWS
commands.push({
    name: 'kenyansnews',
    description: 'Get Kenyans.co.ke news',
    aliases: ['kenyans'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📰');
        try {
            const data = await apiGet('/api/news/kenyans');
            if (!data.success || !data.articles?.length) throw new Error('No news');
            let text = `📰 *Kenyans.co.ke*\n\n`;
            data.articles.slice(0, 10).forEach((a, i) => { text += `*${i + 1}. ${a.title}*\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('KenyansNews error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== WIKIPEDIA ====================

// 18. WIKI
commands.push({
    name: 'wiki',
    description: 'Search Wikipedia',
    aliases: ['wikipedia', 'encyclopedia'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📚 *WIKIPEDIA*\n\n*Usage:* ${config.PREFIX}wiki <topic>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📚');
        try {
            const data = await apiGet('/api/search/wiki', { q: query });
            if (!data.success) throw new Error('Not found');
            if (data.result) {
                let text = `📚 *${data.result.title}*\n\n${(data.result.extract || '').substring(0, 2000)}...\n\n🔗 ${data.result.url || ''}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
                if (data.result.thumbnail) {
                    await sock.sendMessage(from, { image: { url: data.result.thumbnail }, caption: text }, { quoted: msg });
                } else {
                    await sendButtonsMsg(sock, from, text, msg);
                }
            } else if (data.results?.length) {
                let text = `📚 *Wikipedia: "${query}"*\n\n`;
                data.results.slice(0, 8).forEach((r, i) => { text += `*${i + 1}. ${r.title}*\n📝 ${(r.snippet || '').substring(0, 120)}...\n\n`; });
                text += `📡 ${CREATOR}\n\n${FOOTER}`;
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('Wiki error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== DEV SEARCH ====================

// 19. GITHUB
commands.push({
    name: 'github',
    description: 'Search GitHub repositories',
    aliases: ['gh', 'ghsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🐙 *GITHUB SEARCH*\n\n*Usage:* ${config.PREFIX}github <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🐙');
        try {
            const data = await apiGet('/api/search/github', { q: query });
            if (!data.success || !data.repos?.length) throw new Error('No repos found');
            let text = `🐙 *GitHub: "${query}"*\n\n`;
            data.repos.slice(0, 8).forEach((r, i) => {
                text += `*${i + 1}. ${r.name}*\n⭐ ${formatNumber(r.stars)} | 🍴 ${formatNumber(r.forks)}\n📝 ${(r.description || '').substring(0, 100)}\n🔗 ${r.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('GitHub error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 20. NPM
commands.push({
    name: 'npm',
    description: 'Search NPM packages',
    aliases: ['npmsearch', 'npmpkg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📦 *NPM SEARCH*\n\n*Usage:* ${config.PREFIX}npm <package name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📦');
        try {
            const data = await apiGet('/api/search/npm', { q: query });
            if (!data.success || !data.packages?.length) throw new Error('No packages found');
            let text = `📦 *NPM: "${query}"*\n\n`;
            data.packages.slice(0, 8).forEach((p, i) => {
                text += `*${i + 1}. ${p.name}* v${p.version}\n📝 ${(p.description || '').substring(0, 100)}\n📥 ${formatNumber(p.downloads)}\n🔗 ${p.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('NPM error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 21. PYPI
commands.push({
    name: 'pypi',
    description: 'Search PyPI Python packages',
    aliases: ['pypisearch', 'pip'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🐍 *PYPI SEARCH*\n\n*Usage:* ${config.PREFIX}pypi <package name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🐍');
        try {
            const data = await apiGet('/api/search/pypi', { q: query });
            if (!data.success) throw new Error('Not found');
            const p = data.result;
            let text = `🐍 *PyPI: ${p.name}*\n\n📌 *Version:* ${p.version}\n📝 *Summary:* ${p.summary || 'N/A'}\n👤 *Author:* ${p.author || 'N/A'}\n📜 *License:* ${p.license || 'N/A'}\n🔗 ${p.url || p.homepage || ''}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('PyPI error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 22. STACKOVERFLOW
commands.push({
    name: 'stackoverflow',
    description: 'Search StackOverflow',
    aliases: ['so', 'stack'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`💡 *STACKOVERFLOW*\n\n*Usage:* ${config.PREFIX}stackoverflow <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('💡');
        try {
            const data = await apiGet('/api/search/stackoverflow', { q: query });
            if (!data.success || !data.questions?.length) throw new Error('No results');
            let text = `💡 *StackOverflow: "${query}"*\n\n`;
            data.questions.slice(0, 8).forEach((q, i) => {
                text += `*${i + 1}. ${cleanHtml(q.title)}*\n👍 ${q.score} | 💬 ${q.answers} answers | 👁️ ${formatNumber(q.views)}\n🏷️ ${(q.tags || []).join(', ')}\n${q.isAnswered ? '✅ Answered' : '❌ Unanswered'}\n🔗 ${q.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('SO error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 23. REDDIT
commands.push({
    name: 'reddit',
    description: 'Search Reddit',
    aliases: ['r/', 'subreddit'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🤖 *REDDIT SEARCH*\n\n*Usage:* ${config.PREFIX}reddit <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🤖');
        try {
            const data = await apiGet('/api/search/reddit', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No results');
            let text = `🤖 *Reddit: "${query}"*\n\n`;
            data.results.slice(0, 8).forEach((r, i) => {
                text += `*${i + 1}. ${r.title}*\n📂 r/${r.subreddit} | 👤 ${r.author}\n👍 ${formatNumber(r.score)} | 💬 ${r.comments}\n🔗 ${r.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Reddit error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== FUN SEARCH ====================

// 24. URBAN
commands.push({
    name: 'urban',
    description: 'Search Urban Dictionary',
    aliases: ['urbandict', 'ud'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📖 *URBAN DICTIONARY*\n\n*Usage:* ${config.PREFIX}urban <word>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📖');
        try {
            const data = await apiGet('/api/search/urbandictionary', { q: query });
            if (!data.success || !data.definitions?.length) throw new Error('Not found');
            let text = `📖 *Urban Dictionary: "${query}"*\n\n`;
            data.definitions.slice(0, 3).forEach((d, i) => {
                text += `*${i + 1}.* ${(d.definition || '').substring(0, 300)}\n`;
                if (d.example) text += `📝 *Example:* ${d.example.substring(0, 150)}\n`;
                text += `👍 ${d.thumbsUp} | 👎 ${d.thumbsDown}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Urban error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 25. EMOJI
commands.push({
    name: 'emoji',
    description: 'Search emojis',
    aliases: ['emojisearch', 'findemoji'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`😊 *EMOJI SEARCH*\n\n*Usage:* ${config.PREFIX}emoji <word>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('😊');
        try {
            const data = await apiGet('/api/search/emoji', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No emojis found');
            let text = `😊 *Emoji: "${query}"*\n\n`;
            data.results.slice(0, 15).forEach(e => { text += `${e.character} - ${e.name || e.unicodeName}\n`; });
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Emoji error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 26. COUNTRY
commands.push({
    name: 'country',
    description: 'Get country information',
    aliases: ['countryinfo', 'nation'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🌍 *COUNTRY INFO*\n\n*Usage:* ${config.PREFIX}country <country name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🌍');
        try {
            const data = await apiGet('/api/search/country', { q: query });
            if (!data.success || !data.results?.length) throw new Error('Not found');
            const c = data.results[0];
            let text = `🌍 *${c.name}*\n\n🏛️ *Capital:* ${c.capital || 'N/A'}\n👥 *Population:* ${formatNumber(c.population)}\n🗺️ *Region:* ${c.region || 'N/A'}\n📍 *Subregion:* ${c.subregion || 'N/A'}\n🗣️ *Languages:* ${(c.languages || []).join(', ')}\n💰 *Currencies:* ${(c.currencies || []).join(', ')}\n⏰ *Timezones:* ${(c.timezones || []).join(', ')}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (c.flag) {
                await sock.sendMessage(from, { image: { url: c.flag }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('Country error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== MEDIA SEARCH ====================

// 27. IMAGES
commands.push({
    name: 'images',
    description: 'Search images via Yandex',
    aliases: ['img', 'pics', 'imagesearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🖼️ *IMAGE SEARCH*\n\n*Usage:* ${config.PREFIX}images <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🖼️');
        try {
            const data = await apiGet('/api/search/images', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No images');
            const img = data.results[0];
            if (img?.url) {
                await sock.sendMessage(from, { image: { url: img.url }, caption: `🖼️ *Image: "${query}"*\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
            }
            let text = `🖼️ *Images: "${query}"*\n\nFound: ${data.results.length} images\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Images error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *No images found*\n\n${FOOTER}`, msg);
        }
    }
});

// 28. VIDEOS
commands.push({
    name: 'videos',
    description: 'Search videos via Yandex',
    aliases: ['videosearch', 'vidsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎬 *VIDEO SEARCH*\n\n*Usage:* ${config.PREFIX}videos <query>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🎬');
        try {
            const data = await apiGet('/api/search/videos', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No videos');
            let text = `🎬 *Videos: "${query}"*\n\n`;
            data.results.slice(0, 8).forEach((v, i) => {
                text += `*${i + 1}. ${v.title || 'Video'}*\n⏱️ ${v.duration || 'N/A'} | 👁️ ${formatNumber(v.views)}\n🔗 ${v.url}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Videos error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *No videos found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== MUSIC SEARCH ====================

// 29. MUSICSEARCH
commands.push({
    name: 'musicsearch',
    description: 'Search for music',
    aliases: ['music', 'songsearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎵 *MUSIC SEARCH*\n\n*Usage:* ${config.PREFIX}musicsearch <song name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🎵');
        try {
            const data = await apiGet('/api/music/search', { q: query });
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `🎵 *Music: "${query}"*\n\n`;
            data.items.slice(0, 8).forEach((t, i) => {
                text += `*${i + 1}. ${t.title}*\n👤 ${t.artist || t.channelTitle || 'Unknown'}\n⏱️ ${t.timestamp || 'N/A'}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('MusicSearch error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 30. MUSICTRENDING
commands.push({
    name: 'musictrending',
    description: 'Get trending music',
    aliases: ['trendingmusic', 'hitsongs'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔥');
        try {
            const data = await apiGet('/api/music/trending');
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `🔥 *Trending Music*\n\n`;
            data.items.slice(0, 10).forEach((t, i) => {
                text += `*${i + 1}. ${t.title}*\n👤 ${t.artist || t.channelTitle || 'Unknown'}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('MusicTrending error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 31. ARTIST
commands.push({
    name: 'artist',
    description: 'Search for music artist',
    aliases: ['artistsearch', 'artistinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎤 *ARTIST SEARCH*\n\n*Usage:* ${config.PREFIX}artist <artist name>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('🎤');
        try {
            const data = await apiGet('/api/music/artist', { q: query });
            if (!data.success || !data.items?.length) throw new Error('No results');
            let text = `🎤 *Artist: "${query}"*\n\n`;
            data.items.slice(0, 8).forEach((a, i) => {
                text += `*${i + 1}. ${a.name || a.title}*\n👥 ${formatNumber(a.followers || a.subscribers)} followers\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Artist error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Search failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== CRYPTO / FOREX ====================

// 32. CRYPTO
commands.push({
    name: 'crypto',
    description: 'Get cryptocurrency price',
    aliases: ['cryptoprice', 'coin'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const coin = args[0]?.toLowerCase() || 'bitcoin';
        await react('🪙');
        try {
            const data = await apiGet('/api/crypto/price', { coin });
            if (!data.success) throw new Error('Failed');
            const c = data.result;
            let text = `🪙 *${c.name || coin.toUpperCase()}*\n\n💵 *Price:* $${c.price || 'N/A'}\n📊 *24h Change:* ${c.change24h || 'N/A'}%\n📈 *Market Cap:* $${formatNumber(c.marketCap)}\n🔗 ${c.url || ''}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Crypto error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 33. CRYPTOLIST
commands.push({
    name: 'cryptolist',
    description: 'Get all cryptocurrency prices',
    aliases: ['cryptos', 'coins'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🪙');
        try {
            const data = await apiGet('/api/crypto/all');
            if (!data.success || !data.coins?.length) throw new Error('Failed');
            let text = `🪙 *Top Cryptocurrencies*\n\n`;
            data.coins.slice(0, 15).forEach((c, i) => {
                text += `*${i + 1}. ${c.name} (${c.symbol})*\n💵 $${c.price || 'N/A'} | 📊 ${c.change24h || '0'}%\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('CryptoList error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 34. FOREX
commands.push({
    name: 'forex',
    description: 'Get forex exchange rates',
    aliases: ['forexrates', 'exchange'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('💱');
        try {
            const data = await apiGet('/api/forex/rates');
            if (!data.success) throw new Error('Failed');
            let text = `💱 *Forex Rates*\n\nBase: ${data.result?.base || 'USD'}\n\n`;
            const rates = data.result?.rates || data.result || {};
            Object.entries(rates).slice(0, 12).forEach(([currency, rate]) => {
                text += `*${currency}:* ${rate}\n`;
            });
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Forex error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 35. FOREXCONVERT
commands.push({
    name: 'forexconvert',
    description: 'Convert currency',
    aliases: ['convert', 'currency'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 2) {
            await react('ℹ️');
            return reply(`💱 *CURRENCY CONVERT*\n\n*Usage:* ${config.PREFIX}forexconvert <amount> <from> <to>\n*Example:* ${config.PREFIX}forexconvert 100 USD KES\n\n${FOOTER}`);
        }
        const amount = parseFloat(args[0]) || 1;
        const fromCurrency = (args[1] || 'USD').toUpperCase();
        const toCurrency = (args[2] || 'KES').toUpperCase();
        await react('💱');
        try {
            const data = await apiGet('/api/forex/convert', { amount, fromCurrency, toCurrency });
            if (!data.success) throw new Error('Failed');
            let text = `💱 *Currency Convert*\n\n${amount} ${from} = *${data.result?.converted || data.result}* ${to}\n📅 Rate: ${data.result?.rate || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('ForexConvert error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== STALKER ====================

// 36. GHSTALK
commands.push({
    name: 'ghstalk',
    description: 'Stalk GitHub profile',
    aliases: ['githubstalk', 'ghprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🐙 *GITHUB STALK*\n\n*Usage:* ${config.PREFIX}ghstalk <username>\n\n${FOOTER}`);
        }
        const username = args[0];
        await react('🐙');
        try {
            const data = await apiGet('/api/stalk/github', { username });
            if (!data.success) throw new Error('Not found');
            const u = data.result;
            let text = `🐙 *${u.login || username}*\n\n📛 *Name:* ${u.name || 'N/A'}\n📝 *Bio:* ${(u.bio || '').substring(0, 150)}\n📦 *Repos:* ${u.public_repos || 0}\n👥 *Followers:* ${formatNumber(u.followers)}\n👤 *Following:* ${u.following}\n📍 *Location:* ${u.location || 'N/A'}\n🔗 ${u.html_url || `https://github.com/${username}`}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (u.avatar_url) {
                await sock.sendMessage(from, { image: { url: u.avatar_url }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('GHStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 37. IPSTALK
commands.push({
    name: 'ipstalk',
    description: 'Lookup IP address',
    aliases: ['ip', 'iplookup'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🌐 *IP LOOKUP*\n\n*Usage:* ${config.PREFIX}ipstalk <IP address>\n\n${FOOTER}`);
        }
        const ip = args[0];
        await react('🌐');
        try {
            const data = await apiGet('/api/stalk/ip', { ip });
            if (!data.success) throw new Error('Failed');
            const r = data.result;
            let text = `🌐 *IP Lookup: ${ip}*\n\n🏙️ *City:* ${r.city || 'N/A'}\n🗺️ *Region:* ${r.region || 'N/A'}\n🌍 *Country:* ${r.country || 'N/A'}\n📍 *Location:* ${r.loc || 'N/A'}\n🏢 *ISP:* ${r.org || r.isp || 'N/A'}\n⏰ *Timezone:* ${r.timezone || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('IPStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 38. NPMSTALK
commands.push({
    name: 'npmstalk',
    description: 'Get NPM package details',
    aliases: ['npminfo', 'pkg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📦 *NPM PACKAGE*\n\n*Usage:* ${config.PREFIX}npmstalk <package name>\n\n${FOOTER}`);
        }
        const pkg = args[0];
        await react('📦');
        try {
            const data = await apiGet('/api/stalk/npm', { package: pkg });
            if (!data.success) throw new Error('Not found');
            const p = data.result;
            let text = `📦 *${p.name || pkg}* v${p.version}\n\n📝 ${(p.description || '').substring(0, 200)}\n🔗 ${p.url || ''}\n📅 *Updated:* ${p.lastUpdate || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('NPMStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 39. TTSTALK
commands.push({
    name: 'ttstalk',
    description: 'Stalk TikTok profile',
    aliases: ['tiktokstalk', 'ttprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📱 *TIKTOK STALK*\n\n*Usage:* ${config.PREFIX}ttstalk <username>\n\n${FOOTER}`);
        }
        const username = args[0].replace('@', '');
        await react('📱');
        try {
            const data = await apiGet('/api/stalk/tiktok', { username });
            if (!data.success) throw new Error('Not found');
            const u = data.result;
            let text = `📱 *TikTok: @${username}*\n\n👤 *Name:* ${u.name || username}\n👥 *Followers:* ${formatNumber(u.followers)}\n👤 *Following:* ${formatNumber(u.following)}\n❤️ *Likes:* ${formatNumber(u.likes)}\n🎬 *Videos:* ${u.videos || 'N/A'}\n✅ *Verified:* ${u.verified ? 'Yes' : 'No'}\n📝 *Bio:* ${(u.bio || '').substring(0, 150)}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (u.avatar) {
                await sock.sendMessage(from, { image: { url: u.avatar }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('TTStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 40. IGSTALK
commands.push({
    name: 'igstalk',
    description: 'Stalk Instagram profile',
    aliases: ['instagramstalk', 'igprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📸 *INSTAGRAM STALK*\n\n*Usage:* ${config.PREFIX}igstalk <username>\n\n${FOOTER}`);
        }
        const username = args[0].replace('@', '');
        await react('📸');
        try {
            const data = await apiGet('/api/stalk/instagram', { username });
            if (!data.success) throw new Error('Not found');
            const u = data.result;
            let text = `📸 *Instagram: @${username}*\n\n👤 *Name:* ${u.name || username}\n👥 *Followers:* ${formatNumber(u.followers)}\n👤 *Following:* ${formatNumber(u.following)}\n📷 *Posts:* ${u.posts || 'N/A'}\n✅ *Verified:* ${u.verified ? 'Yes' : 'No'}\n📝 *Bio:* ${(u.bio || '').substring(0, 150)}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (u.profilePic) {
                await sock.sendMessage(from, { image: { url: u.profilePic }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('IGStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 41. TWSTALK
commands.push({
    name: 'twstalk',
    description: 'Stalk Twitter/X profile',
    aliases: ['twitterstalk', 'xprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🐦 *TWITTER STALK*\n\n*Usage:* ${config.PREFIX}twstalk <username>\n\n${FOOTER}`);
        }
        const username = args[0].replace('@', '');
        await react('🐦');
        try {
            const data = await apiGet('/api/stalk/twitter', { username });
            if (!data.success) throw new Error('Not found');
            const u = data.result;
            let text = `🐦 *Twitter/X: @${username}*\n\n👤 *Name:* ${u.name || username}\n👥 *Followers:* ${formatNumber(u.followers)}\n👤 *Following:* ${formatNumber(u.following)}\n🐦 *Tweets:* ${u.tweets || 'N/A'}\n✅ *Verified:* ${u.verified ? 'Yes' : 'No'}\n📝 *Bio:* ${(u.bio || '').substring(0, 150)}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (u.profilePic) {
                await sock.sendMessage(from, { image: { url: u.profilePic }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('TWStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 42. TGSTALK
commands.push({
    name: 'tgstalk',
    description: 'Stalk Telegram profile',
    aliases: ['telegramstalk', 'tgprofile'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`✈️ *TELEGRAM STALK*\n\n*Usage:* ${config.PREFIX}tgstalk <username>\n\n${FOOTER}`);
        }
        const username = args[0].replace('@', '');
        await react('✈️');
        try {
            const data = await apiGet('/api/stalk/telegram', { username });
            if (!data.success) throw new Error('Not found');
            const u = data.result;
            let text = `✈️ *Telegram: @${username}*\n\n👤 *Name:* ${u.name || username}\n👥 *Members:* ${formatNumber(u.members || u.subscribers)}\n📝 *Description:* ${(u.description || '').substring(0, 150)}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (u.photo) {
                await sock.sendMessage(from, { image: { url: u.photo }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('TGStalk error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== FUN / DATA ====================

// 43. PROVERB
commands.push({
    name: 'proverb',
    description: 'Get random Kenyan proverb',
    aliases: ['kenyanproverb'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🦁');
        try {
            const data = await apiGet('/api/fun-data/kenyan-proverb');
            const text = `🦁 *Kenyan Proverb*\n\n"${data.result || data}"\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'proverb' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 44. DADJOKE
commands.push({
    name: 'dadjoke',
    description: 'Get a random dad joke',
    aliases: ['joke'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('😂');
        try {
            const data = await apiGet('/api/fun-data/dad-joke');
            const text = `😂 *Dad Joke*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'dadjoke' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 45. AFFIRMATION
commands.push({
    name: 'affirmation',
    description: 'Get daily affirmation',
    aliases: ['affirm', 'motivation'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('✨');
        try {
            const data = await apiGet('/api/fun-data/affirmation');
            const text = `✨ *Affirmation*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'affirmation' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 46. SWAHILI
commands.push({
    name: 'swahili',
    description: 'Get random Swahili phrase',
    aliases: ['swahiliphrase', 'kiswahili'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🇰🇪');
        try {
            const data = await apiGet('/api/fun-data/swahili-phrase');
            const text = `🇰🇪 *Swahili Phrase*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'swahili' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 47. TECHJOKE
commands.push({
    name: 'techjoke',
    description: 'Get a tech joke',
    aliases: ['devjoke', 'coderjoke'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('💻');
        try {
            const data = await apiGet('/api/fun/tech-joke');
            const text = `💻 *Tech Joke*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'techjoke' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 48. NEVERHAVE
commands.push({
    name: 'neverhave',
    description: 'Never Have I Ever game',
    aliases: ['nhie'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🎮');
        try {
            const data = await apiGet('/api/fun/never-have-i-ever');
            const text = `🎮 *Never Have I Ever...*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'neverhave' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 49. FORTUNE
commands.push({
    name: 'fortune',
    description: 'Get fortune cookie message',
    aliases: ['fortunecookie', 'luck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🥠');
        try {
            const data = await apiGet('/api/fun/fortune-cookie');
            const text = `🥠 *Fortune Cookie*\n\n${data.result || data}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🥠 Another', id: 'fortune' }) }]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== EDUCATION ====================

// 50. PAPERS
commands.push({
    name: 'papers',
    description: 'Search academic papers',
    aliases: ['academic', 'research'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📄 *ACADEMIC PAPERS*\n\n*Usage:* ${config.PREFIX}papers <topic>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📄');
        try {
            const data = await apiGet('/api/education/papers', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No papers');
            let text = `📄 *Papers: "${query}"*\n\n`;
            data.results.slice(0, 8).forEach((p, i) => {
                text += `*${i + 1}. ${p.title}*\n👤 ${p.author || 'Unknown'}\n📅 ${p.year || 'N/A'}\n🔗 ${p.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Papers error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 51. BOOKS
commands.push({
    name: 'books',
    description: 'Search for books',
    aliases: ['booksearch', 'library'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📚 *BOOK SEARCH*\n\n*Usage:* ${config.PREFIX}books <title>\n\n${FOOTER}`);
        }
        const query = args.join(' ');
        await react('📚');
        try {
            const data = await apiGet('/api/education/books', { q: query });
            if (!data.success || !data.results?.length) throw new Error('No books');
            let text = `📚 *Books: "${query}"*\n\n`;
            data.results.slice(0, 8).forEach((b, i) => {
                text += `*${i + 1}. ${b.title}*\n👤 ${b.author || 'Unknown'}\n📅 ${b.year || 'N/A'}\n🔗 ${b.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Books error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 52. BOOKINFO
commands.push({
    name: 'bookinfo',
    description: 'Get book details by key',
    aliases: ['book', 'bookdetails'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📖 *BOOK INFO*\n\n*Usage:* ${config.PREFIX}bookinfo <book key>\n*Example:* ${config.PREFIX}bookinfo /works/OL8112804W\n\n${FOOTER}`);
        }
        const key = args[0];
        await react('📖');
        try {
            const data = await apiGet('/api/education/book-details', { key });
            if (!data.success) throw new Error('Not found');
            const b = data.result;
            let text = `📖 *${b.title || 'Book'}*\n\n👤 *Author:* ${b.author || 'Unknown'}\n📅 *Published:* ${b.publishDate || 'N/A'}\n📝 *Description:* ${(b.description || '').substring(0, 500)}\n🔗 ${b.url || ''}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            if (b.cover) {
                await sock.sendMessage(from, { image: { url: b.cover }, caption: text }, { quoted: msg });
            } else {
                await sendButtonsMsg(sock, from, text, msg);
            }
            await react('✅');
        } catch (e) {
            console.error('BookInfo error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== TOOLS / INFO ====================

// 53. WEATHER
commands.push({
    name: 'weather',
    description: 'Get weather for a city',
    aliases: ['wt', 'forecast'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🌤️ *WEATHER*\n\n*Usage:* ${config.PREFIX}weather <city>\n\n${FOOTER}`);
        }
        const city = args.join(' ');
        await react('🌤️');
        try {
            const data = await apiGet('/api/tools/weather', { city });
            if (!data.success) throw new Error('Not found');
            const w = data.result;
            let text = `🌤️ *Weather: ${city}*\n\n🌡️ *Temperature:* ${w.temp || w.temperature || 'N/A'}°C\n💧 *Humidity:* ${w.humidity || 'N/A'}%\n🌬️ *Wind:* ${w.wind || 'N/A'}\n☁️ *Condition:* ${w.condition || w.description || 'N/A'}\n📍 *Location:* ${w.location || city}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Weather error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 54. DICTIONARY
commands.push({
    name: 'dictionary',
    description: 'Look up word definitions',
    aliases: ['dict', 'define'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📖 *DICTIONARY*\n\n*Usage:* ${config.PREFIX}dictionary <word>\n\n${FOOTER}`);
        }
        const word = args[0].toLowerCase();
        await react('📖');
        try {
            const data = await apiGet('/api/tools/dictionary', { word });
            if (!data.success) throw new Error('Not found');
            const d = data.result;
            let text = `📖 *${d.word || word}*\n\n`;
            if (d.phonetic) text += `🔊 *Phonetic:* ${d.phonetic}\n\n`;
            if (d.meanings) {
                d.meanings.slice(0, 3).forEach(m => {
                    text += `*${m.partOfSpeech}*\n`;
                    m.definitions.slice(0, 3).forEach((def, i) => {
                        text += `${i + 1}. ${def.definition}\n`;
                        if (def.example) text += `📝 "${def.example}"\n`;
                    });
                    text += '\n';
                });
            }
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Dictionary error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 55. BIBLE
commands.push({
    name: 'bible',
    description: 'Get a Bible verse',
    aliases: ['verse', 'scripture'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📖 *BIBLE VERSE*\n\n*Usage:* ${config.PREFIX}bible <reference>\n*Example:* ${config.PREFIX}bible John 3:16\n\n${FOOTER}`);
        }
        const ref = args.join(' ');
        await react('📖');
        try {
            const data = await apiGet('/api/tools/bible', { ref });
            if (!data.success) throw new Error('Not found');
            let text = `📖 *${ref}*\n\n${data.result}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Bible error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Verse not found*\n\n${FOOTER}`, msg);
        }
    }
});

// 56. PHONE
commands.push({
    name: 'phone',
    description: 'Lookup phone number info',
    aliases: ['phonelookup', 'numberinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`📞 *PHONE LOOKUP*\n\n*Usage:* ${config.PREFIX}phone <number>\n\n${FOOTER}`);
        }
        const phone = args[0];
        await react('📞');
        try {
            const data = await apiGet('/api/tools/phone-lookup', { phone });
            if (!data.success) throw new Error('Failed');
            const r = data.result;
            let text = `📞 *Phone: ${phone}*\n\n🌍 *Country:* ${r.country || 'N/A'}\n📍 *Location:* ${r.location || 'N/A'}\n📡 *Carrier:* ${r.carrier || 'N/A'}\n📱 *Type:* ${r.type || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Phone error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// 57. DNS
commands.push({
    name: 'dns',
    description: 'DNS lookup for a domain',
    aliases: ['dnslookup', 'domaininfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🌐 *DNS LOOKUP*\n\n*Usage:* ${config.PREFIX}dns <domain>\n\n${FOOTER}`);
        }
        const domain = args[0];
        await react('🌐');
        try {
            const data = await apiGet('/api/tools/dns-inspector', { domain });
            if (!data.success) throw new Error('Failed');
            const r = data.result;
            let text = `🌐 *DNS: ${domain}*\n\n`;
            if (r.A) text += `📌 *A:* ${Array.isArray(r.A) ? r.A.join(', ') : r.A}\n`;
            if (r.AAAA) text += `📌 *AAAA:* ${Array.isArray(r.AAAA) ? r.AAAA.join(', ') : r.AAAA}\n`;
            if (r.MX) text += `📧 *MX:* ${Array.isArray(r.MX) ? r.MX.join(', ') : r.MX}\n`;
            if (r.NS) text += `🌐 *NS:* ${Array.isArray(r.NS) ? r.NS.join(', ') : r.NS}\n`;
            if (r.CNAME) text += `🔗 *CNAME:* ${r.CNAME}\n`;
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('DNS error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== ANIME ====================

// 58. ANIME
commands.push({
    name: 'anime',
    description: 'Get random anime image',
    aliases: ['animepic', 'animeimg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const type = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'].includes(args[0]?.toLowerCase()) ? args[0].toLowerCase() : 'waifu';
        await react('🌸');
        try {
            const data = await apiGet(`/api/anime/${type}`);
            if (!data.success || !data.result) throw new Error('Failed');
            const url = data.result.url || data.result;
            await sock.sendMessage(from, { image: { url }, caption: `🌸 *Anime: ${type}*\n\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
            await sendButtonsMsg(sock, from, `🌸 *${type}* image sent!\n\n${FOOTER}`, msg, [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another', id: 'anime' }) }]);
            await react('✅');
        } catch (e) {
            console.error('Anime error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *Failed*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== JOBS ====================

// 59. JOBS
commands.push({
    name: 'jobs',
    description: 'Get Kenya job listings',
    aliases: ['jobsearch', 'vacancies'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const page = parseInt(args[0]) || 1;
        await react('💼');
        try {
            const data = await apiGet('/api/jobs/kenya', { page });
            if (!data.success || !data.results?.length) throw new Error('No jobs');
            let text = `💼 *Kenya Jobs (Page ${page})*\n\n`;
            data.results.slice(0, 10).forEach((j, i) => {
                text += `*${i + 1}. ${j.title}*\n🏢 ${j.company || 'N/A'}\n📍 ${j.location || 'N/A'}\n🔗 ${j.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            console.error('Jobs error:', e.message);
            await react('❌');
            await sendButtonsMsg(sock, from, `❌ *No jobs found*\n\n${FOOTER}`, msg);
        }
    }
});

// ==================== SEARCH HELP ====================

// 60. SEARCHHELP
commands.push({
    name: 'searchhelp',
    description: 'Show all search commands',
    aliases: ['helpsearch', 'searches', 'searchmenu'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `🔍 *𝐒𝐄𝐀𝐑𝐂𝐇 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 (𝟓𝟗)*\n\n` +
            `*🌐 𝐖𝐄𝐁*\n${p}google | ${p}bing | ${p}duckduckgo\n\n` +
            `*🎬 𝐘𝐎𝐔𝐓𝐔𝐁𝐄*\n${p}youtube | ${p}yttrending | ${p}ytrecommend\n\n` +
            `*🟢 𝐒𝐏𝐎𝐓𝐈𝐅𝐘*\n${p}spotifysearch | ${p}spsearch\n\n` +
            `*🟠 𝐒𝐎𝐔𝐍𝐃𝐂𝐋𝐎𝐔𝐃*\n${p}soundcloudsearch\n\n` +
            `*🎵 𝐒𝐇𝐀𝐙𝐀𝐌*\n${p}shazamsearch\n\n` +
            `*📰 𝐍𝐄𝐖𝐒*\n${p}news | ${p}globalnews | ${p}kenyanews\n${p}tukonews | ${p}nationnews | ${p}standardnews | ${p}kenyansnews\n\n` +
            `*📚 𝐊𝐍𝐎𝐖𝐋𝐄𝐃𝐆𝐄*\n${p}wiki | ${p}dictionary | ${p}bible\n\n` +
            `*💻 𝐃𝐄𝐕*\n${p}github | ${p}npm | ${p}pypi\n${p}stackoverflow | ${p}reddit\n\n` +
            `*🎵 𝐌𝐔𝐒𝐈𝐂*\n${p}musicsearch | ${p}musictrending | ${p}artist\n\n` +
            `*🪙 𝐅𝐈𝐍𝐀𝐍𝐂𝐄*\n${p}crypto | ${p}cryptolist | ${p}forex | ${p}forexconvert\n\n` +
            `*🔍 𝐒𝐓𝐀𝐋𝐊*\n${p}ghstalk | ${p}ipstalk | ${p}npmstalk\n${p}ttstalk | ${p}igstalk | ${p}twstalk | ${p}tgstalk\n\n` +
            `*🎉 𝐅𝐔𝐍*\n${p}urban | ${p}emoji | ${p}country\n${p}proverb | ${p}dadjoke | ${p}affirmation\n${p}swahili | ${p}techjoke | ${p}neverhave | ${p}fortune\n\n` +
            `*📄 𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍*\n${p}papers | ${p}books | ${p}bookinfo\n\n` +
            `*🖼️ 𝐌𝐄𝐃𝐈𝐀*\n${p}images | ${p}videos\n\n` +
            `*🌸 𝐀𝐍𝐈𝐌𝐄*\n${p}anime [type]\n\n` +
            `*💼 𝐉𝐎𝐁𝐒*\n${p}jobs [page]\n\n` +
            `*📞 𝐈𝐍𝐅𝐎*\n${p}weather | ${p}phone | ${p}dns\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});


// JIJI CLASSIFIEDS (Megan API)
commands.push({
    name: 'jiji',
    description: 'Browse Jiji classifieds',
    aliases: ['jijiclassifieds', 'jijisearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🛒');
        try {
            const data = await apiGet('/api/classifieds/jiji');
            if (!data.success || !data.results?.length) throw new Error('No listings');
            let text = `🛒 *Jiji Classifieds*\n\n`;
            data.results.slice(0, 10).forEach((item, i) => {
                text += `*${i+1}. ${item.title || 'Item'}*\n💰 ${item.price || 'N/A'}\n📍 ${item.location || 'N/A'}\n🔗 ${item.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// PIGIAME CLASSIFIEDS (Megan API)
commands.push({
    name: 'pigiame',
    description: 'Browse PigiaMe classifieds',
    aliases: ['pigiameclassifieds', 'pigiamesearch'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🛍️');
        try {
            const data = await apiGet('/api/classifieds/pigiame');
            if (!data.success || !data.results?.length) throw new Error('No listings');
            let text = `🛍️ *PigiaMe Classifieds*\n\n`;
            data.results.slice(0, 10).forEach((item, i) => {
                text += `*${i+1}. ${item.title || 'Item'}*\n💰 ${item.price || 'N/A'}\n📍 ${item.location || 'N/A'}\n🔗 ${item.url || ''}\n\n`;
            });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});


module.exports = { commands };
