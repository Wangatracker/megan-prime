// Megan-Prime Sports Commands - 23 Commands Using Megan APIs v3.6.4
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
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout + 30000, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
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

function formatResult(result, maxLen = 3000) {
    if (!result) return 'No data returned';
    if (typeof result === 'string') return result.substring(0, maxLen);
    return JSON.stringify(result, null, 2).substring(0, maxLen);
}

// ==================== LIVE SCORES ====================

// 1. LIVE SCORES
commands.push({
    name: 'livescores',
    description: 'Get live sports scores',
    aliases: ['live', 'scores', 'livematches'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const sport = args[0]?.toLowerCase() || 'soccer';
        await react('⚽');
        try {
            const data = await apiGet('/api/sports/live', { sport });
            if (!data.success) throw new Error('No live scores');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `⚽ *Live Scores (${sport})*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Refresh', id: `livescores ${sport}` }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No live scores available*\n\n${FOOTER}`); }
    }
});

// ==================== SEARCH ====================

// 2. TEAM SEARCH
commands.push({
    name: 'teamsearch',
    description: 'Search for sports teams',
    aliases: ['team', 'findteam'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const query = args.join(' ');
        if (!query) { await react('ℹ️'); return reply(`🔍 *TEAM SEARCH*\n\n*Usage:* ${config.PREFIX}teamsearch <team name>\n*Example:* ${config.PREFIX}teamsearch Manchester United\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/sports/search/team', { q: query });
            if (!data.success) throw new Error('No teams found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *Teams: "${query}"*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No teams found*\n\n${FOOTER}`); }
    }
});

// 3. PLAYER SEARCH
commands.push({
    name: 'playersearch',
    description: 'Search for sports players',
    aliases: ['player', 'findplayer'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const query = args.join(' ');
        if (!query) { await react('ℹ️'); return reply(`🔍 *PLAYER SEARCH*\n\n*Usage:* ${config.PREFIX}playersearch <player name>\n*Example:* ${config.PREFIX}playersearch Messi\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/sports/search/player', { q: query });
            if (!data.success) throw new Error('No players found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *Players: "${query}"*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No players found*\n\n${FOOTER}`); }
    }
});

// 4. LEAGUE SEARCH
commands.push({
    name: 'leaguesearch',
    description: 'Search for sports leagues',
    aliases: ['leaguefind', 'findleague'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const query = args.join(' ');
        if (!query) { await react('ℹ️'); return reply(`🔍 *LEAGUE SEARCH*\n\n*Usage:* ${config.PREFIX}leaguesearch <league name>\n*Example:* ${config.PREFIX}leaguesearch Premier League\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/sports/search/league', { q: query });
            if (!data.success) throw new Error('No leagues found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *Leagues: "${query}"*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No leagues found*\n\n${FOOTER}`); }
    }
});

// ==================== LEAGUES ====================

// 5. ALL LEAGUES
commands.push({
    name: 'leagues',
    description: 'Get all sports leagues',
    aliases: ['allleagues', 'leaguelist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🏆');
        try {
            const data = await apiGet('/api/sports/leagues');
            if (!data.success) throw new Error('No leagues');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🏆 *All Leagues*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed to load leagues*\n\n${FOOTER}`); }
    }
});

// 6. LEAGUE DETAILS
commands.push({
    name: 'leaguedetails',
    description: 'Get league details by ID',
    aliases: ['leagueinfo', 'league'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`🏆 *LEAGUE DETAILS*\n\n*Usage:* ${config.PREFIX}leaguedetails <league ID>\n*Find ID with:* ${config.PREFIX}leaguesearch\n\n${FOOTER}`); }
        await react('🏆');
        try {
            const data = await apiGet('/api/sports/league/details', { id });
            if (!data.success) throw new Error('League not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🏆 *League Details: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *League not found*\n\n${FOOTER}`); }
    }
});

// 7. LEAGUE SEASONS
commands.push({
    name: 'leagueseasons',
    description: 'Get league seasons',
    aliases: ['seasons', 'leagueseason'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📅 *LEAGUE SEASONS*\n\n*Usage:* ${config.PREFIX}leagueseasons <league ID>\n\n${FOOTER}`); }
        await react('📅');
        try {
            const data = await apiGet('/api/sports/league/seasons', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📅 *Seasons: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 8. LEAGUE TEAMS
commands.push({
    name: 'leagueteams',
    description: 'Get teams in a league',
    aliases: ['leagueteamlist', 'teamsinleague'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`👥 *LEAGUE TEAMS*\n\n*Usage:* ${config.PREFIX}leagueteams <league ID>\n\n${FOOTER}`); }
        await react('👥');
        try {
            const data = await apiGet('/api/sports/league/teams', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `👥 *Teams in League: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 9. LEAGUE TABLE
commands.push({
    name: 'leaguetable',
    description: 'Get league standings table',
    aliases: ['table', 'standings'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        const season = args[1];
        if (!id || !season) { await react('ℹ️'); return reply(`📊 *LEAGUE TABLE*\n\n*Usage:* ${config.PREFIX}leaguetable <league ID> <season>\n*Example:* ${config.PREFIX}leaguetable 4328 2024-2025\n\n${FOOTER}`); }
        await react('📊');
        try {
            const data = await apiGet('/api/sports/league/table', { id, season });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📊 *League Table: ${id} (${season})*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// ==================== TEAMS ====================

// 10. TEAM DETAILS
commands.push({
    name: 'teamdetails',
    description: 'Get team details by ID',
    aliases: ['teaminfo', 'club'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`👥 *TEAM DETAILS*\n\n*Usage:* ${config.PREFIX}teamdetails <team ID>\n*Find ID with:* ${config.PREFIX}teamsearch\n\n${FOOTER}`); }
        await react('👥');
        try {
            const data = await apiGet('/api/sports/team/details', { id });
            if (!data.success) throw new Error('Team not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `👥 *Team Details: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Team not found*\n\n${FOOTER}`); }
    }
});

// 11. TEAM PLAYERS
commands.push({
    name: 'teamplayers',
    description: 'Get team players/squad',
    aliases: ['squad', 'roster'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`👤 *TEAM PLAYERS*\n\n*Usage:* ${config.PREFIX}teamplayers <team ID>\n\n${FOOTER}`); }
        await react('👤');
        try {
            const data = await apiGet('/api/sports/team/players', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `👤 *Squad: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 12. TEAM NEXT MATCH
commands.push({
    name: 'teamnext',
    description: 'Get team upcoming matches',
    aliases: ['nextmatch', 'upcoming'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📅 *TEAM NEXT MATCHES*\n\n*Usage:* ${config.PREFIX}teamnext <team ID>\n\n${FOOTER}`); }
        await react('📅');
        try {
            const data = await apiGet('/api/sports/team/next', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📅 *Upcoming: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 13. TEAM LAST MATCHES
commands.push({
    name: 'teamlast',
    description: 'Get team recent results',
    aliases: ['lastmatches', 'recent'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📋 *TEAM LAST MATCHES*\n\n*Usage:* ${config.PREFIX}teamlast <team ID>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiGet('/api/sports/team/last', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📋 *Recent Results: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 14. TEAM EQUIPMENT
commands.push({
    name: 'teamequipment',
    description: 'Get team kit/equipment info',
    aliases: ['kit', 'jersey'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`👕 *TEAM EQUIPMENT*\n\n*Usage:* ${config.PREFIX}teamequipment <team ID>\n\n${FOOTER}`); }
        await react('👕');
        try {
            const data = await apiGet('/api/sports/team/equipment', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `👕 *Kit: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// ==================== PLAYERS ====================

// 15. PLAYER DETAILS
commands.push({
    name: 'playerdetails',
    description: 'Get player details by ID',
    aliases: ['playerinfo', 'athlete'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`👤 *PLAYER DETAILS*\n\n*Usage:* ${config.PREFIX}playerdetails <player ID>\n*Find ID with:* ${config.PREFIX}playersearch\n\n${FOOTER}`); }
        await react('👤');
        try {
            const data = await apiGet('/api/sports/player/details', { id });
            if (!data.success) throw new Error('Player not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `👤 *Player: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Player not found*\n\n${FOOTER}`); }
    }
});

// ==================== EVENTS ====================

// 16. EVENT DETAILS
commands.push({
    name: 'eventdetails',
    description: 'Get match event details',
    aliases: ['event', 'matchinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📋 *EVENT DETAILS*\n\n*Usage:* ${config.PREFIX}eventdetails <event ID>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiGet('/api/sports/event/details', { id });
            if (!data.success) throw new Error('Event not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📋 *Event: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Event not found*\n\n${FOOTER}`); }
    }
});

// 17. EVENT LINEUP
commands.push({
    name: 'eventlineup',
    description: 'Get match lineup',
    aliases: ['lineup', 'formation'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📋 *EVENT LINEUP*\n\n*Usage:* ${config.PREFIX}eventlineup <event ID>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiGet('/api/sports/event/lineup', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📋 *Lineup: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 18. EVENT STATS
commands.push({
    name: 'eventstats',
    description: 'Get match statistics',
    aliases: ['matchstats', 'gamestats'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`📊 *EVENT STATS*\n\n*Usage:* ${config.PREFIX}eventstats <event ID>\n\n${FOOTER}`); }
        await react('📊');
        try {
            const data = await apiGet('/api/sports/event/stats', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📊 *Stats: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 19. EVENT HIGHLIGHTS
commands.push({
    name: 'eventhighlights',
    description: 'Get match highlights',
    aliases: ['highlights', 'goals'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`🎬 *EVENT HIGHLIGHTS*\n\n*Usage:* ${config.PREFIX}eventhighlights <event ID>\n\n${FOOTER}`); }
        await react('🎬');
        try {
            const data = await apiGet('/api/sports/event/highlights', { id });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🎬 *Highlights: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 20. EVENTS BY DAY
commands.push({
    name: 'eventsbyday',
    description: 'Get matches for a specific date',
    aliases: ['matches', 'fixtures'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const date = args[0] || new Date().toISOString().split('T')[0];
        await react('📅');
        try {
            const data = await apiGet('/api/sports/events/day', { date });
            if (!data.success) throw new Error('No events');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📅 *Events: ${date}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *No events found*\n\n${FOOTER}`); }
    }
});

// ==================== OTHER ====================

// 21. TEAMS BY COUNTRY
commands.push({
    name: 'teamsbycountry',
    description: 'Get teams from a country',
    aliases: ['countryteams', 'nationteams'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const country = args.join(' ');
        if (!country) { await react('ℹ️'); return reply(`🌍 *TEAMS BY COUNTRY*\n\n*Usage:* ${config.PREFIX}teamsbycountry <country>\n*Example:* ${config.PREFIX}teamsbycountry Kenya\n\n${FOOTER}`); }
        await react('🌍');
        try {
            const data = await apiGet('/api/sports/teams/country', { country });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🌍 *Teams: ${country}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// 22. VENUE
commands.push({
    name: 'venue',
    description: 'Get sports venue information',
    aliases: ['stadium', 'arena'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const id = args[0];
        if (!id) { await react('ℹ️'); return reply(`🏟️ *VENUE INFO*\n\n*Usage:* ${config.PREFIX}venue <venue ID>\n\n${FOOTER}`); }
        await react('🏟️');
        try {
            const data = await apiGet('/api/sports/venue', { id });
            if (!data.success) throw new Error('Venue not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🏟️ *Venue: ${id}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Venue not found*\n\n${FOOTER}`); }
    }
});

// ==================== SPORTS HELP ====================

// 23. SPORTS HELP
commands.push({
    name: 'sportshelp',
    description: 'Show all sports commands',
    aliases: ['sports', 'sporth', 'football'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `⚽ *𝐒𝐏𝐎𝐑𝐓𝐒 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 (𝟐𝟐)*\n\n` +
            `*📊 𝐋𝐈𝐕𝐄*\n${p}livescores [sport]\n\n` +
            `*🔍 𝐒𝐄𝐀𝐑𝐂𝐇*\n${p}teamsearch | ${p}playersearch\n${p}leaguesearch\n\n` +
            `*🏆 𝐋𝐄𝐀𝐆𝐔𝐄𝐒*\n${p}leagues | ${p}leaguedetails <id>\n${p}leagueseasons <id> | ${p}leagueteams <id>\n${p}leaguetable <id> <season>\n\n` +
            `*👥 𝐓𝐄𝐀𝐌𝐒*\n${p}teamdetails <id> | ${p}teamplayers <id>\n${p}teamnext <id> | ${p}teamlast <id>\n${p}teamequipment <id>\n\n` +
            `*👤 𝐏𝐋𝐀𝐘𝐄𝐑𝐒*\n${p}playerdetails <id>\n\n` +
            `*📋 𝐄𝐕𝐄𝐍𝐓𝐒*\n${p}eventdetails <id> | ${p}eventlineup <id>\n${p}eventstats <id> | ${p}eventhighlights <id>\n${p}eventsbyday [date]\n\n` +
            `*🌍 𝐎𝐓𝐇𝐄𝐑*\n${p}teamsbycountry <country>\n${p}venue <id>\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});


// EVENTS BY ROUND (Megan API)
commands.push({
    name: 'eventsbyround',
    description: 'Get matches by round',
    aliases: ['roundmatches', 'roundfixtures'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 3) {
            await react('ℹ️');
            return reply(`📅 *EVENTS BY ROUND*\n\n*Usage:* ${config.PREFIX}eventsbyround <league ID> <round> <season>\n*Example:* ${config.PREFIX}eventsbyround 4328 38 2024-2025\n\n${FOOTER}`);
        }
        const id = args[0];
        const round = args[1];
        const season = args[2];
        await react('📅');
        try {
            const data = await apiGet('/api/sports/events/round', { id, round, season });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📅 *Round ${round}: ${id} (${season})*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});

// LEAGUES BY COUNTRY (Megan API)
commands.push({
    name: 'leaguesbycountry',
    description: 'Get leagues from a country',
    aliases: ['countryleagues', 'nationleagues'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const country = args.join(' ');
        if (!country) {
            await react('ℹ️');
            return reply(`🏆 *LEAGUES BY COUNTRY*\n\n*Usage:* ${config.PREFIX}leaguesbycountry <country>\n*Example:* ${config.PREFIX}leaguesbycountry Kenya\n\n${FOOTER}`);
        }
        await react('🏆');
        try {
            const data = await apiGet('/api/sports/leagues/country', { country });
            if (!data.success) throw new Error('Not found');
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🏆 *Leagues: ${country}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Not found*\n\n${FOOTER}`); }
    }
});


module.exports = { commands };
