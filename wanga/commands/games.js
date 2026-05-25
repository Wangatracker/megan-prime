// Megan-Prime Games - 5 Commands Using Megan APIs v3.6.4
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

async function apiGet(endpoint, params = {}, timeout = 30000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
    return res.data;
}

async function apiPost(endpoint, data = {}, timeout = 30000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.post(url, data, { params: { apikey: API_KEY }, timeout, headers: { 'User-Agent': 'Megan-Prime/1.0', 'Content-Type': 'application/json' } });
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

// Store active games
if (!global.activeGames) global.activeGames = {};

// ==================== ROCK PAPER SCISSORS ====================

// 1. RPS
commands.push({
    name: 'rps',
    description: 'Play Rock Paper Scissors',
    aliases: ['rockpaperscissors'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const move = args[0]?.toLowerCase();
        const validMoves = ['rock', 'paper', 'scissors'];
        if (!move || !validMoves.includes(move)) {
            await react('ℹ️');
            return reply(`✊✋✌️ *ROCK PAPER SCISSORS*\n\n*Usage:* ${config.PREFIX}rps <rock/paper/scissors>\n*Example:* ${config.PREFIX}rps rock\n\n${FOOTER}`);
        }
        await react('🎮');
        try {
            const data = await apiGet('/api/game/rps', { move });
            if (!data.success || !data.result) throw new Error('Game failed');
            const r = data.result;
            const emojis = { rock: '✊', paper: '✋', scissors: '✌️' };
            const resultEmoji = r.result === 'win' ? '🎉' : r.result === 'lose' ? '😢' : '🤝';
            let text = `✊✋✌️ *Rock Paper Scissors*\n\n`;
            text += `🧑 *You:* ${emojis[r.player] || r.player}\n`;
            text += `🤖 *Bot:* ${emojis[r.bot] || r.bot}\n\n`;
            text += `${resultEmoji} *${r.result?.toUpperCase()}!*\n\n`;
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✊ Rock', id: 'rps rock' }) },
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✋ Paper', id: 'rps paper' }) },
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✌️ Scissors', id: 'rps scissors' }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Game failed*\n\n${FOOTER}`); }
    }
});

// ==================== FLAG GUESS ====================

// 2. FLAG GUESS
commands.push({
    name: 'flagguess',
    description: 'Guess the country from its flag',
    aliases: ['flag', 'guesstheflag'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🎌');
        try {
            const data = await apiGet('/api/game/flag-guess');
            if (!data.success || !data.result) throw new Error('Game failed');
            const game = data.result;
            // Store game for this chat
            global.activeGames[from] = { type: 'flag', id: game.id || game.gameId, answer: game.answer || game.country, timestamp: Date.now() };
            let text = `🎌 *GUESS THE FLAG!*\n\n`;
            if (game.flag) {
                await sock.sendMessage(from, { image: { url: game.flag }, caption: `🎌 *Which country's flag is this?*\n\nReply with your answer!\n\n${FOOTER}` }, { quoted: msg });
                return;
            }
            text += `🌍 *Flag:* ${game.flag || game.emoji || '🏳️'}\n\n`;
            text += `Reply with your guess!\n\n`;
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed to start game*\n\n${FOOTER}`); }
    }
});

// ==================== WORD SCRAMBLE ====================

// 3. WORD SCRAMBLE
commands.push({
    name: 'wordscramble',
    description: 'Unscramble the word',
    aliases: ['scramble', 'unscramble'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🔤');
        try {
            const data = await apiGet('/api/game/word-scramble');
            if (!data.success || !data.result) throw new Error('Game failed');
            const game = data.result;
            global.activeGames[from] = { type: 'scramble', answer: game.answer || game.word, timestamp: Date.now() };
            let text = `🔤 *WORD SCRAMBLE!*\n\n`;
            text += `🔀 *Scrambled:* ${game.scrambled || game.word}\n\n`;
            text += `Reply with the correct word!\n\n`;
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔤 New Word', id: 'wordscramble' }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed to start game*\n\n${FOOTER}`); }
    }
});

// ==================== NUMBER GUESS ====================

// 4. NUMBER GUESS
commands.push({
    name: 'numberguess',
    description: 'Guess the secret number',
    aliases: ['guess', 'guessthenumber'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const guess = parseInt(args[0]);
        // Check if there's an active game
        const activeGame = global.activeGames[from];
        if (activeGame?.type === 'number') {
            if (isNaN(guess)) {
                return reply(`🔢 *Number Guessing Game Active!*\n\nReply with your guess (1-100)\n\n${FOOTER}`);
            }
            await react('🔢');
            try {
                const data = await apiPost(`/api/game/number-guess/${activeGame.id}`, { guess });
                if (!data.success || !data.result) throw new Error('Game failed');
                const r = data.result;
                let text = `🔢 *Number Guess*\n\n`;
                text += `🎯 *Your guess:* ${guess}\n`;
                text += `${r.hint || ''}\n`;
                if (r.correct || r.won) {
                    text += `🎉 *CORRECT! You won!*\n`;
                    delete global.activeGames[from];
                } else if (r.tries) {
                    text += `📊 *Tries:* ${r.tries}\n`;
                }
                text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
                await sendButtonsMsg(sock, from, text, msg);
                await react('✅');
                return;
            } catch (e) { await react('❌'); await reply(`❌ *Game error*\n\n${FOOTER}`); return; }
        }
        // Start new game
        await react('🔢');
        try {
            const data = await apiGet('/api/game/number-guess');
            if (!data.success || !data.result) throw new Error('Game failed');
            const game = data.result;
            global.activeGames[from] = { type: 'number', id: game.id || game.gameId, timestamp: Date.now() };
            let text = `🔢 *NUMBER GUESSING GAME!*\n\n`;
            text += `🎯 I'm thinking of a number between *1 and 100*\n\n`;
            text += `Reply with your guess!\n\n`;
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg, [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔢 New Game', id: 'numberguess' }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed to start game*\n\n${FOOTER}`); }
    }
});

// ==================== GAMES HELP ====================

// 5. GAMES HELP
commands.push({
    name: 'gameshelp',
    description: 'Show all game commands',
    aliases: ['games', 'game', 'play'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `🎮 *𝐆𝐀𝐌𝐄𝐒 (𝟒)*\n\n` +
            `✊✋✌️ *${p}rps* <rock/paper/scissors>\nPlay Rock Paper Scissors against the bot\n\n` +
            `🎌 *${p}flagguess*\nGuess the country from its flag\n\n` +
            `🔤 *${p}wordscramble*\nUnscramble the jumbled word\n\n` +
            `🔢 *${p}numberguess*\nGuess the secret number (1-100)\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
