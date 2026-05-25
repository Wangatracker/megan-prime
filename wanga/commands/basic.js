// ╔══════════════════════════════════════════════════╗
// ║     MEGAN-PRIME BASIC COMMANDS                   ║
// ║  Powered by Megan APIs v3.6.4 | Tracker Wanga    ║
// ╚══════════════════════════════════════════════════╝

const config = require('../../megan/config');
const moment = require('moment-timezone');
const os = require('os');
const { sendButtons } = require('gifted-btns');

const commands = [];
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const FOOTER = '> Megan-Prime | TrackerWanga';
const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const BOT_PIC = 'https://files.catbox.moe/0v8bkv.png';
const BOT_AUDIO = 'https://files.catbox.moe/jf2mjx.mp3';

async function sendBtn(sock, from, text, quoted, extra = []) {
    const btns = [...extra, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons: btns }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

// ═══════════════════════════════════════════
// 1. PING
// ═══════════════════════════════════════════
commands.push({
    name: 'ping', description: 'Check bot response time',
    aliases: ['p'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: '🏓 *Pinging...*' }, { quoted: msg });
        const ping = Date.now() - start;
        const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const mem = process.memoryUsage();
        const usedMB = Math.round(mem.heapUsed / 1024 / 1024);

        const text = `╔══════════════════════╗\n` +
            `║   🤖 MEGAN-PRIME    ║\n` +
            `╚══════════════════════╝\n\n` +
            `│ ⚡ Latency: *${ping}ms*\n` +
            `│ 🕐 Time: *${now.format('h:mm:ss A')}*\n` +
            `│ 📅 Date: *${now.format('DD/MM/YYYY')}*\n` +
            `│ ⏱️ Uptime: *${d}d ${h}h ${m}m*\n` +
            `│ 💾 RAM: *${usedMB}MB*\n` +
            `│ 📚 Commands: *${bot.commands.size}*\n` +
            `│ ⚡ Node: *${process.version}*\n` +
            `│ 💻 Platform: *${process.platform}*\n` +
            `╰──────────────────◇\n${FOOTER}`;

        await sock.sendMessage(from, { text, edit: sent.key });
        await sendBtn(sock, from, text, msg);
    }
});

// ═══════════════════════════════════════════
// 2. MENU
// ═══════════════════════════════════════════
commands.push({
    name: 'menu', description: 'Show all commands',
    aliases: ['help', 'cmds', 'commands'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const mem = process.memoryUsage();
        const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const awayMode = await bot.db?.getSetting('awaymode', 'off') || 'off';
        const mode = await bot.db?.getSetting('mode', 'public') || 'public';

        const menu = `╔══════════════════════╗\n` +
            `║   🤖 MEGAN-PRIME    ║\n` +
            `╚══════════════════════╝\n\n` +
            `👤 *${config.OWNER_NAME}* | 📞 ${config.OWNER_NUMBER}\n` +
            `🔧 Prefix: *${p}* | ⚙️ Mode: *${mode}*\n` +
            `🟣 Away: *${awayMode === 'on' ? '✅ ON' : '❌ OFF'}*\n` +
            `📚 Commands: *${bot.commands.size}*\n` +
            `⏱️ Uptime: *${d}d ${h}h ${m}m*\n` +
            `🕐 ${now.format('h:mm A - DD/MM/YYYY')}\n` +
            `💾 RAM: *${usedMB}MB*\n\n` +

            `┌─ *📥 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥*\n` +
            `│\n` +
            `│ 🎵 ${p}play\n` +
            `│ 🎵 ${p}play2\n` +
            `│ 🎵 ${p}play3\n` +
            `│ 🎵 ${p}playdoc\n` +
            `│ 🎵 ${p}select\n` +
            `│ 🎵 ${p}ytmp3\n` +
            `│ 🎵 ${p}yta\n` +
            `│\n` +
            `│ 🎬 ${p}ytmp4\n` +
            `│ 🎬 ${p}video\n` +
            `│ 🎬 ${p}hd\n` +
            `│ 🎬 ${p}ytmp5\n` +
            `│ 🎬 ${p}ytdoc\n` +
            `│ 🎬 ${p}ytv\n` +
            `│\n` +
            `│ ℹ️ ${p}ytinfo\n` +
            `│ ℹ️ ${p}ytsearch\n` +
            `│ ℹ️ ${p}lyrics\n` +
            `│\n` +
            `│ 🟢 ${p}spotify\n` +
            `│ 🟢 ${p}spotifyurl\n` +
            `│ 🟢 ${p}spotifydl\n` +
            `│ 🟢 ${p}spotifydldoc\n` +
            `│ 🟢 ${p}spotifytrack\n` +
            `│ 🟢 ${p}spotifyalbum\n` +
            `│ 🟢 ${p}spotifyartist\n` +
            `│ 🟢 ${p}spotifyrandom\n` +
            `│ 🟢 ${p}spotifyplaylist\n` +
            `│\n` +
            `│ 🟠 ${p}soundcloud\n` +
            `│ 🟠 ${p}scurl\n` +
            `│ 🟠 ${p}scdoc\n` +
            `│ 🟠 ${p}scdl\n` +
            `│\n` +
            `│ 📱 ${p}tiktok\n` +
            `│ 📱 ${p}tiktokmp3\n` +
            `│ 📱 ${p}tiktokinfo\n` +
            `│\n` +
            `│ 📸 ${p}ig\n` +
            `│ 📸 ${p}igstory\n` +
            `│\n` +
            `│ 📘 ${p}fb\n` +
            `│ 📘 ${p}fbreel\n` +
            `│ 📘 ${p}fbsnap\n` +
            `│ 📘 ${p}fbinfo\n` +
            `│\n` +
            `│ 🐦 ${p}twitter\n` +
            `│ 🐦 ${p}twitterinfo\n` +
            `│\n` +
            `│ 👻 ${p}snapchat\n` +
            `│\n` +
            `│ 🎵 ${p}shazam\n` +
            `│ 🎵 ${p}shazamsearch\n` +
            `│ 🎵 ${p}shazaminfo\n` +
            `│\n` +
            `│ 📥 ${p}dlhelp\n` +
            `└──────────────────\n\n` +

            `┌─ *🔍 𝗦𝗘𝗔𝗥𝗖𝗛*\n` +
            `│\n` +
            `│ 🌐 ${p}google\n` +
            `│ 🌐 ${p}bing\n` +
            `│ 🌐 ${p}duckduckgo\n` +
            `│ 🌐 ${p}searchall\n` +
            `│\n` +
            `│ 🎬 ${p}youtube\n` +
            `│ 🎬 ${p}yttrending\n` +
            `│ 🎬 ${p}ytrecommend\n` +
            `│\n` +
            `│ 🟢 ${p}spotifysearch\n` +
            `│ 🟢 ${p}spsearch\n` +
            `│\n` +
            `│ 🟠 ${p}soundcloudsearch\n` +
            `│\n` +
            `│ 🎵 ${p}shazamsearch\n` +
            `│ 🎵 ${p}musicsearch\n` +
            `│ 🎵 ${p}musictrending\n` +
            `│ 🎵 ${p}artist\n` +
            `│\n` +
            `│ 📰 ${p}news\n` +
            `│ 📰 ${p}globalnews\n` +
            `│ 📰 ${p}kenyanews\n` +
            `│ 📰 ${p}tukonews\n` +
            `│ 📰 ${p}nationnews\n` +
            `│ 📰 ${p}standardnews\n` +
            `│ 📰 ${p}kenyansnews\n` +
            `│\n` +
            `│ 📚 ${p}wiki\n` +
            `│ 📚 ${p}dictionary\n` +
            `│ 📚 ${p}urban\n` +
            `│ 📚 ${p}emoji\n` +
            `│\n` +
            `│ 💻 ${p}github\n` +
            `│ 💻 ${p}npm\n` +
            `│ 💻 ${p}pypi\n` +
            `│ 💻 ${p}stackoverflow\n` +
            `│ 💻 ${p}reddit\n` +
            `│\n` +
            `│ 🪙 ${p}crypto\n` +
            `│ 🪙 ${p}cryptolist\n` +
            `│ 💱 ${p}forex\n` +
            `│ 💱 ${p}forexconvert\n` +
            `│\n` +
            `│ 🔍 ${p}ghstalk\n` +
            `│ 🔍 ${p}ipstalk\n` +
            `│ 🔍 ${p}npmstalk\n` +
            `│ 🔍 ${p}ttstalk\n` +
            `│ 🔍 ${p}igstalk\n` +
            `│ 🔍 ${p}twstalk\n` +
            `│ 🔍 ${p}tgstalk\n` +
            `│\n` +
            `│ 🌤️ ${p}weather\n` +
            `│ 🌤️ ${p}country\n` +
            `│\n` +
            `│ 🖼️ ${p}images\n` +
            `│ 🖼️ ${p}videos\n` +
            `│\n` +
            `│ 🎉 ${p}dadjoke\n` +
            `│ 🎉 ${p}proverb\n` +
            `│ 🎉 ${p}affirmation\n` +
            `│ 🎉 ${p}swahili\n` +
            `│ 🎉 ${p}techjoke\n` +
            `│ 🎉 ${p}fortune\n` +
            `│ 🎉 ${p}neverhave\n` +
            `│\n` +
            `│ 📖 ${p}bible\n` +
            `│ 📖 ${p}papers\n` +
            `│ 📖 ${p}books\n` +
            `│ 📖 ${p}bookinfo\n` +
            `│\n` +
            `│ 🌸 ${p}anime\n` +
            `│\n` +
            `│ 💼 ${p}jobs\n` +
            `│\n` +
            `│ 🛒 ${p}jiji\n` +
            `│ 🛒 ${p}pigiame\n` +
            `│\n` +
            `│ 📞 ${p}phone\n` +
            `│ 📞 ${p}dns\n` +
            `│\n` +
            `│ 🔍 ${p}searchhelp\n` +
            `└──────────────────\n\n` +

            `┌─ *🤖 𝗔𝗜*\n` +
            `│\n` +
            `│ 💬 ${p}megan\n` +
            `│ 💬 ${p}gpt\n` +
            `│ 💬 ${p}gemini\n` +
            `│ 💬 ${p}claude\n` +
            `│ 💬 ${p}deepseek\n` +
            `│ 💬 ${p}mistral\n` +
            `│ 💬 ${p}llama\n` +
            `│ 💬 ${p}groq\n` +
            `│ 💬 ${p}cohere\n` +
            `│ 💬 ${p}qwen\n` +
            `│ 💬 ${p}phi\n` +
            `│ 💬 ${p}codellama\n` +
            `│ 💬 ${p}dolphin\n` +
            `│ 💬 ${p}zephyr\n` +
            `│ 💬 ${p}falcon\n` +
            `│ 💬 ${p}vicuna\n` +
            `│ 💬 ${p}wizard\n` +
            `│ 💬 ${p}yi\n` +
            `│ 💬 ${p}solar\n` +
            `│ 💬 ${p}chatglm\n` +
            `│ 💬 ${p}openchat\n` +
            `│ 💬 ${p}mixtral\n` +
            `│ 💬 ${p}starcoder\n` +
            `│ 💬 ${p}neural\n` +
            `│ 💬 ${p}openhermes\n` +
            `│ 💬 ${p}orca\n` +
            `│ 💬 ${p}command\n` +
            `│ 💬 ${p}nemotron\n` +
            `│ 💬 ${p}internlm\n` +
            `│ 💬 ${p}wormgpt\n` +
            `│ 💬 ${p}replit\n` +
            `│\n` +
            `│ 🛠️ ${p}aisummarize\n` +
            `│ 🛠️ ${p}aicode\n` +
            `│ 🛠️ ${p}aihumanize\n` +
            `│ 🛠️ ${p}aiscanner\n` +
            `│\n` +
            `│ 🎨 ${p}aigenimage\n` +
            `│\n` +
            `│ 📖 ${p}bibleai\n` +
            `│ 📖 ${p}teacher\n` +
            `│ 📖 ${p}gita\n` +
            `│\n` +
            `│ 🤖 ${p}aimenu\n` +
            `└──────────────────\n\n` +

            `┌─ *🎨 𝗠𝗘𝗗𝗜𝗔*\n` +
            `│\n` +
            `│ 🎨 ${p}sticker\n` +
            `│ 🎨 ${p}toimage\n` +
            `│ 🎨 ${p}videosticker\n` +
            `│ 🎨 ${p}stickervideo\n` +
            `│ 🎨 ${p}gif\n` +
            `│ 🎨 ${p}ungif\n` +
            `│\n` +
            `│ 🗣️ ${p}say\n` +
            `│ 🗣️ ${p}voice\n` +
            `│ 🗣️ ${p}toaudio\n` +
            `│\n` +
            `│ 🎵 ${p}bass\n` +
            `│ 🎵 ${p}nightcore\n` +
            `│ 🎵 ${p}slowreverb\n` +
            `│ 🎵 ${p}chipmunk\n` +
            `│ 🎵 ${p}vibrato\n` +
            `│ 🎵 ${p}echo\n` +
            `│ 🎵 ${p}distortion\n` +
            `│ 🎵 ${p}8d\n` +
            `│ 🎵 ${p}reverse\n` +
            `│ 🎵 ${p}treble\n` +
            `│ 🎵 ${p}surround\n` +
            `│ 🎵 ${p}speed\n` +
            `│ 🎵 ${p}volume\n` +
            `│\n` +
            `│ 🖼️ ${p}circle\n` +
            `│ 🖼️ ${p}filter\n` +
            `│ 🖼️ ${p}removebg\n` +
            `│ 🖼️ ${p}meme\n` +
            `│\n` +
            `│ 📤 ${p}catbox\n` +
            `│ 📤 ${p}imgbb\n` +
            `│\n` +
            `│ 📱 ${p}qrcode\n` +
            `│ 📱 ${p}screenshot\n` +
            `│ 📱 ${p}shorturl\n` +
            `│\n` +
            `│ 🌸 ${p}waifu\n` +
            `│ 🌸 ${p}neko\n` +
            `│\n` +
            `│ 🧹 ${p}cleantemp\n` +
            `│\n` +
            `│ 🎨 ${p}mediahelp\n` +
            `└──────────────────\n\n` +

            `┌─ *✨ 𝗘𝗙𝗙𝗘𝗖𝗧𝗦*\n` +
            `│\n` +
            `│ 🎭 32 Ephoto Effects\n` +
            `│ 🎨 63 TextPro Effects\n` +
            `│ 📸 342 PhotoFunia Effects\n` +
            `│\n` +
            `│ ✨ ${p}ephotomenu\n` +
            `│ ✨ ${p}textpromenu\n` +
            `│ ✨ ${p}photofunialist\n` +
            `└──────────────────\n\n` +

            `┌─ *👥 𝗚𝗥𝗢𝗨𝗣*\n` +
            `│\n` +
            `│ 📋 ${p}creategroup\n` +
            `│ 📋 ${p}creategcadd\n` +
            `│ 📋 ${p}groupinfo\n` +
            `│ 📋 ${p}groups\n` +
            `│ 📋 ${p}metadata\n` +
            `│ 📋 ${p}participants\n` +
            `│ 📋 ${p}admins\n` +
            `│\n` +
            `│ 👤 ${p}leave\n` +
            `│ 👤 ${p}add\n` +
            `│ 👤 ${p}kick\n` +
            `│ 👤 ${p}promote\n` +
            `│ 👤 ${p}demote\n` +
            `│\n` +
            `│ 🔗 ${p}invite\n` +
            `│ 🔗 ${p}revoke\n` +
            `│ 🔗 ${p}join\n` +
            `│ 🔗 ${p}inviteinfo\n` +
            `│\n` +
            `│ 🏷️ ${p}tag\n` +
            `│ 🏷️ ${p}hidetag\n` +
            `│ 🏷️ ${p}announce\n` +
            `│ 🏷️ ${p}tagadmins\n` +
            `│ 🏷️ ${p}antitag\n` +
            `│\n` +
            `│ ⚙️ ${p}setname\n` +
            `│ ⚙️ ${p}setdesc\n` +
            `│ ⚙️ ${p}lock\n` +
            `│ ⚙️ ${p}unlock\n` +
            `│ ⚙️ ${p}lockinfo\n` +
            `│ ⚙️ ${p}unlockinfo\n` +
            `│ ⚙️ ${p}disappear\n` +
            `│ ⚙️ ${p}addmode\n` +
            `│\n` +
            `│ 📊 ${p}poll\n` +
            `│ 📊 ${p}multipoll\n` +
            `│ 📊 ${p}gstatus\n` +
            `│\n` +
            `│ 👥 ${p}requests\n` +
            `│ 👥 ${p}approve\n` +
            `│ 👥 ${p}reject\n` +
            `│\n` +
            `│ 👋 ${p}welcome\n` +
            `│ 👋 ${p}setwelcome\n` +
            `│ 👋 ${p}goodbye\n` +
            `│ 👋 ${p}setgoodbye\n` +
            `│\n` +
            `│ 📊 ${p}groupstats\n` +
            `│ 📊 ${p}grouprank\n` +
            `│ 📊 ${p}groupsilent\n` +
            `│\n` +
            `│ 🔗 ${p}antilinkgc\n` +
            `│ 🔗 ${p}antibot\n` +
            `│\n` +
            `│ 👥 ${p}grouphelp\n` +
            `└──────────────────\n\n` +

            `┌─ *🎬 𝗠𝗢𝗩𝗜𝗘𝗦*\n` +
            `│\n` +
            `│ 🔍 ${p}moviesearch\n` +
            `│ 🔍 ${p}tvsearch\n` +
            `│ 🔍 ${p}animesearch\n` +
            `│ 🔍 ${p}movselect\n` +
            `│\n` +
            `│ 📥 ${p}moviedl\n` +
            `│ 📥 ${p}tvdl\n` +
            `│ 📥 ${p}animedl\n` +
            `│\n` +
            `│ 🔗 ${p}moviestream\n` +
            `│ 🔗 ${p}tvstream\n` +
            `│\n` +
            `│ 🔥 ${p}trending\n` +
            `│ 🔥 ${p}hot\n` +
            `│ 🔥 ${p}cinema\n` +
            `│ 🔥 ${p}action\n` +
            `│ 🔥 ${p}horror\n` +
            `│ 🔥 ${p}romance\n` +
            `│ 🔥 ${p}adventure\n` +
            `│\n` +
            `│ 🇰🇷 ${p}kdrama\n` +
            `│ 🇨🇳 ${p}cdrama\n` +
            `│ 🇹🇷 ${p}turkish\n` +
            `│\n` +
            `│ 🌸 ${p}animehome\n` +
            `│\n` +
            `│ 📅 ${p}upcoming\n` +
            `│ ✊ ${p}blackshows\n` +
            `│ 🧒 ${p}smartstart\n` +
            `│\n` +
            `│ 🎬 ${p}moviehelp\n` +
            `└──────────────────\n\n` +

            `┌─ *🛠️ 𝗧𝗢𝗢𝗟𝗦*\n` +
            `│\n` +
            `│ 🔢 ${p}binary\n` +
            `│ 🔢 ${p}debinary\n` +
            `│ 🔢 ${p}base64\n` +
            `│ 🔢 ${p}base64encode\n` +
            `│ 🔢 ${p}base64decode\n` +
            `│ 🔢 ${p}hash\n` +
            `│ 🔢 ${p}hashidentify\n` +
            `│ 🔢 ${p}morse\n` +
            `│ 🔢 ${p}urlencode\n` +
            `│ 🔢 ${p}urldecode\n` +
            `│\n` +
            `│ 🔐 ${p}encrypt\n` +
            `│ 🔐 ${p}decrypt\n` +
            `│\n` +
            `│ 🎲 ${p}password\n` +
            `│ 🎲 ${p}vcc\n` +
            `│ 🎲 ${p}email\n` +
            `│ 🎲 ${p}uuid\n` +
            `│ 🎲 ${p}lorem\n` +
            `│ 🎲 ${p}color\n` +
            `│ 🎲 ${p}timestamp\n` +
            `│\n` +
            `│ ✅ ${p}emailvalidate\n` +
            `│ ✅ ${p}ipvalidate\n` +
            `│ ✅ ${p}passwordstrength\n` +
            `│ ✅ ${p}passwordaudit\n` +
            `│ ✅ ${p}textstats\n` +
            `│ ✅ ${p}jsonformat\n` +
            `│\n` +
            `│ 🌐 ${p}browse\n` +
            `│ 🌐 ${p}tinyurl\n` +
            `│ 🌐 ${p}screenshot\n` +
            `│ 🌐 ${p}subdomains\n` +
            `│\n` +
            `│ 🕷️ ${p}scrape\n` +
            `│ 🕷️ ${p}links\n` +
            `│ 🕷️ ${p}inspect\n` +
            `│ 🕷️ ${p}scripts\n` +
            `│ 🕷️ ${p}cookies\n` +
            `│\n` +
            `│ 💻 ${p}deobfuscate\n` +
            `│ 💻 ${p}deminify\n` +
            `│ 💻 ${p}runjs\n` +
            `│ 💻 ${p}headless\n` +
            `│ 💻 ${p}decode\n` +
            `│\n` +
            `│ 🌍 ${p}countryinfo\n` +
            `│ 📞 ${p}phone\n` +
            `│ 🌐 ${p}dns\n` +
            `│ 📡 ${p}wifi\n` +
            `│\n` +
            `│ 🐙 ${p}githubstalk\n` +
            `│ 📺 ${p}youtubestalk\n` +
            `│\n` +
            `│ 🧮 ${p}calc\n` +
            `│ 🔄 ${p}fliptext\n` +
            `│ 😊 ${p}emojimix\n` +
            `│ ⭐ ${p}zodiak\n` +
            `│ ⭐ ${p}zodiakall\n` +
            `│ 🔮 ${p}zodiakelement\n` +
            `│ 💕 ${p}zodiakmatch\n` +
            `│\n` +
            `│ 🛠️ ${p}tools\n` +
            `└──────────────────\n\n` +

            `┌─ *🛡️ 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬*\n` +
            `│\n` +
            `│ 🌐 ${p}whois\n` +
            `│ 🌐 ${p}dnslookup\n` +
            `│ 🌐 ${p}subdomainscan\n` +
            `│ 🌐 ${p}reverseip\n` +
            `│\n` +
            `│ 📍 ${p}geoip\n` +
            `│ 📍 ${p}portscan\n` +
            `│ 📍 ${p}openports\n` +
            `│ 📍 ${p}pinghost\n` +
            `│ 📍 ${p}latency\n` +
            `│ 📍 ${p}traceroute\n` +
            `│ 📍 ${p}asn\n` +
            `│ 📍 ${p}maclookup\n` +
            `│ 📍 ${p}ipinfo\n` +
            `│\n` +
            `│ 🔒 ${p}ssl\n` +
            `│ 🔒 ${p}tls\n` +
            `│\n` +
            `│ 📋 ${p}httpheaders\n` +
            `│ 📋 ${p}securityheaders\n` +
            `│\n` +
            `│ 🛡️ ${p}wafdetect\n` +
            `│ 🛡️ ${p}firewall\n` +
            `│\n` +
            `│ ⚠️ ${p}xss\n` +
            `│ ⚠️ ${p}sqli\n` +
            `│ ⚠️ ${p}csrf\n` +
            `│ ⚠️ ${p}clickjack\n` +
            `│ ⚠️ ${p}directoryscan\n` +
            `│ ⚠️ ${p}exposedfiles\n` +
            `│ ⚠️ ${p}misconfig\n` +
            `│\n` +
            `│ 🔍 ${p}robots\n` +
            `│ 🔍 ${p}sitemap\n` +
            `│ 🔍 ${p}cmsdetect\n` +
            `│ 🔍 ${p}techstack\n` +
            `│ 🔍 ${p}cookiescan\n` +
            `│ 🔍 ${p}redirects\n` +
            `│ 🔍 ${p}urlscan\n` +
            `│ 🔍 ${p}phishcheck\n` +
            `│ 🔍 ${p}metadata\n` +
            `│ 🔍 ${p}hashgenerate\n` +
            `│\n` +
            `│ 🛡️ ${p}securityhelp\n` +
            `└──────────────────\n\n` +

            `┌─ *⚽ 𝗦𝗣𝗢𝗥𝗧𝗦*\n` +
            `│\n` +
            `│ ⚽ ${p}livescores\n` +
            `│\n` +
            `│ 🔍 ${p}teamsearch\n` +
            `│ 🔍 ${p}playersearch\n` +
            `│ 🔍 ${p}leaguesearch\n` +
            `│\n` +
            `│ 🏆 ${p}leagues\n` +
            `│ 🏆 ${p}leaguedetails\n` +
            `│ 🏆 ${p}leagueseasons\n` +
            `│ 🏆 ${p}leagueteams\n` +
            `│ 🏆 ${p}leaguetable\n` +
            `│\n` +
            `│ 👥 ${p}teamdetails\n` +
            `│ 👥 ${p}teamplayers\n` +
            `│ 👥 ${p}teamnext\n` +
            `│ 👥 ${p}teamlast\n` +
            `│ 👥 ${p}teamequipment\n` +
            `│\n` +
            `│ 👤 ${p}playerdetails\n` +
            `│\n` +
            `│ 📋 ${p}eventdetails\n` +
            `│ 📋 ${p}eventlineup\n` +
            `│ 📋 ${p}eventstats\n` +
            `│ 📋 ${p}eventhighlights\n` +
            `│ 📋 ${p}eventsbyday\n` +
            `│ 📋 ${p}eventsbyround\n` +
            `│\n` +
            `│ 🌍 ${p}teamsbycountry\n` +
            `│ 🌍 ${p}leaguesbycountry\n` +
            `│\n` +
            `│ 🏟️ ${p}venue\n` +
            `│\n` +
            `│ ⚽ ${p}sportshelp\n` +
            `└──────────────────\n\n` +

            `┌─ *🎮 𝗚𝗔𝗠𝗘𝗦*\n` +
            `│\n` +
            `│ ✊ ${p}rps\n` +
            `│ 🎌 ${p}flagguess\n` +
            `│ 🔤 ${p}wordscramble\n` +
            `│ 🔢 ${p}numberguess\n` +
            `│\n` +
            `│ 🎮 ${p}gameshelp\n` +
            `└──────────────────\n\n` +

            `┌─ *💬 𝗖𝗛𝗔𝗧*\n` +
            `│\n` +
            `│ 📍 ${p}sendloc\n` +
            `│ 📍 ${p}sendcontact\n` +
            `│\n` +
            `│ 📌 ${p}pin\n` +
            `│ 📌 ${p}unpin\n` +
            `│ 📌 ${p}archive\n` +
            `│ 📌 ${p}unarchive\n` +
            `│\n` +
            `│ 🗑️ ${p}clearchat\n` +
            `│ 🔵 ${p}markunread\n` +
            `│\n` +
            `│ 🔇 ${p}mutechat\n` +
            `│ 🔊 ${p}unmutechat\n` +
            `│\n` +
            `│ ✉️ ${p}edit\n` +
            `│ ✉️ ${p}forward\n` +
            `│ ✉️ ${p}pinmsg\n` +
            `│\n` +
            `│ 🔐 ${p}lastseen\n` +
            `│ 🔐 ${p}onlineprivacy\n` +
            `│ 🔐 ${p}ppprivacy\n` +
            `│ 🔐 ${p}statusprivacy\n` +
            `│ 🔐 ${p}readreceipts\n` +
            `│ 🔐 ${p}getprivacy\n` +
            `│\n` +
            `│ 🔍 ${p}checkwa\n` +
            `│ 🔍 ${p}business\n` +
            `│\n` +
            `│ 💬 ${p}chathelp\n` +
            `└──────────────────\n\n` +

            `┌─ *⚙️ 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦*\n` +
            `│\n` +
            `│ 👑 ${p}setprefix\n` +
            `│ 👑 ${p}setbotname\n` +
            `│ 👑 ${p}setmode\n` +
            `│ 👑 ${p}setownername\n` +
            `│ 👑 ${p}setownerphone\n` +
            `│ 👑 ${p}setbio\n` +
            `│ 👑 ${p}autobio\n` +
            `│ 👑 ${p}setbotpic\n` +
            `│ 👑 ${p}removepp\n` +
            `│\n` +
            `│ 👑 ${p}block\n` +
            `│ 👑 ${p}unblock\n` +
            `│ 👑 ${p}listblocked\n` +
            `│\n` +
            `│ 👑 ${p}blacklist\n` +
            `│ 👑 ${p}whitelist\n` +
            `│ 👑 ${p}muteuser\n` +
            `│ 👑 ${p}unmuteuser\n` +
            `│ 👑 ${p}warnuser\n` +
            `│ 👑 ${p}resetwarns\n` +
            `│\n` +
            `│ 👑 ${p}autoreact\n` +
            `│ 👑 ${p}autoread\n` +
            `│ 👑 ${p}autoviewonce\n` +
            `│ 👑 ${p}antidelete\n` +
            `│ 👑 ${p}antiedit\n` +
            `│ 👑 ${p}anticall\n` +
            `│ 👑 ${p}antideletestatus\n` +
            `│ 👑 ${p}antilink\n` +
            `│ 👑 ${p}antilinkaction\n` +
            `│ 👑 ${p}antitag\n` +
            `│\n` +
            `│ 👑 ${p}autoviewstatus\n` +
            `│ 👑 ${p}autoreactstatus\n` +
            `│ 👑 ${p}autodownloadstatus\n` +
            `│ 👑 ${p}setstatusemoji\n` +
            `│\n` +
            `│ 👑 ${p}presencepm\n` +
            `│ 👑 ${p}presencegroup\n` +
            `│ 👑 ${p}autotyping\n` +
            `│ 👑 ${p}autorecording\n` +
            `│\n` +
            `│ 👑 ${p}setdefaultdisappear\n` +
            `│ 👑 ${p}resetsettings\n` +
            `│ 👑 ${p}setlanguage\n` +
            `│ 👑 ${p}theme\n` +
            `│ 👑 ${p}buttons\n` +
            `│\n` +
            `│ 👑 ${p}awaymode\n` +
            `│ 👑 ${p}setawaymessage\n` +
            `│ 👑 ${p}awaystatus\n` +
            `│\n` +
            `│ 👑 ${p}chatbot\n` +
            `│ 👑 ${p}aimode\n` +
            `│ 👑 ${p}features\n` +
            `│\n` +
            `│ 👤 ${p}mypic\n` +
            `│ 👤 ${p}myabout\n` +
            `│ 👤 ${p}userinfo\n` +
            `│ 👤 ${p}listmuted\n` +
            `│ 👤 ${p}listblacklist\n` +
            `│ 👤 ${p}listwhitelist\n` +
            `│\n` +
            `│ 📱 ${p}statuscheck\n` +
            `│ 📱 ${p}statushelp\n` +
            `│ 📱 ${p}settings\n` +
            `│ 📱 ${p}privacysettings\n` +
            `│ 📱 ${p}newsletter\n` +
            `│\n` +
            `│ ⚙️ ${p}settingshelp\n` +
            `└──────────────────\n\n` +

            `┌─ *📊 𝗦𝗧𝗔𝗧𝗨𝗦*\n` +
            `│\n` +
            `│ 📊 ${p}ping\n` +
            `│ 📊 ${p}uptime\n` +
            `│ 📊 ${p}info\n` +
            `│ 📊 ${p}status\n` +
            `│ 📊 ${p}debug\n` +
            `│ 📊 ${p}tracker\n` +
            `│ 📊 ${p}apistatus\n` +
            `│ 📊 ${p}mediastatus\n` +
            `│\n` +
            `│ 👤 ${p}owner\n` +
            `│ 👁️ ${p}vv\n` +
            `└──────────────────\n\n` +

            `📡 Powered by Megan APIs v3.6.4\n${FOOTER}`;

        await sendBtn(sock, from, menu, msg);
        await react('✅');
    }
});

// ═══════════════════════════════════════════
// 3. INFO (with bot pic + audio)
// ═══════════════════════════════════════════
commands.push({
    name: 'info', description: 'Show bot information',
    aliases: ['bot', 'about'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const totalMem = (os.totalmem() / 1073741824).toFixed(2);
        const freeMem = (os.freemem() / 1073741824).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const awayMode = await bot.db?.getSetting('awaymode', 'off') || 'off';
        const chatbot = await bot.db?.getSetting('chatbot', 'off') || 'off';
        const mode = await bot.db?.getSetting('mode', 'public') || 'public';

        const text = `╔══════════════════════╗\n` +
            `║   🤖 MEGAN-PRIME    ║\n` +
            `╚══════════════════════╝\n\n` +
            `│ 👤 Owner: *${config.OWNER_NAME}*\n` +
            `│ 📞 Phone: *${config.OWNER_NUMBER}*\n` +
            `│ 🤖 Bot: *${config.BOT_NAME}*\n` +
            `│ 🔧 Prefix: *${config.PREFIX}*\n` +
            `│ ⚙️ Mode: *${mode}*\n` +
            `│ 🟣 Away: *${awayMode === 'on' ? '✅ ON' : '❌ OFF'}*\n` +
            `│ 💬 Chatbot: *${chatbot}*\n` +
            `│\n` +
            `│ 📚 Commands: *${bot.commands.size}*\n` +
            `│ ⏱️ Uptime: *${d}d ${h}h*\n` +
            `│ 🕐 Time: *${now.format('h:mm A')}*\n` +
            `│ 📅 Date: *${now.format('DD/MM/YYYY')}*\n` +
            `│ 💾 RAM: *${usedMem}GB / ${totalMem}GB*\n` +
            `│ 💻 Platform: *${process.platform}*\n` +
            `│ ⚡ Node: *${process.version}*\n` +
            `│ 📡 API: *Megan v3.6.4*\n` +
            `╰──────────────────◇\n${FOOTER}`;

        // Send bot pic with info
        try {
            await sock.sendMessage(from, { image: { url: BOT_PIC }, caption: text }, { quoted: msg });
        } catch(e) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
        // Also send the audio
        try {
            await sock.sendMessage(from, { audio: { url: BOT_AUDIO }, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
        } catch(e) {}
        await react('✅');
    }
});

// ═══════════════════════════════════════════
// 4. UPTIME
// ═══════════════════════════════════════════
commands.push({
    name: 'uptime', description: 'Show bot uptime',
    aliases: ['runtime'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const text = `╭───[ ⏱️ UPTIME ]───\n│\n` +
            `│ 📅 Days: *${d}*\n` +
            `│ ⏰ Hours: *${h}*\n` +
            `│ ⏱️ Minutes: *${m}*\n` +
            `│ ⏲️ Seconds: *${s}*\n` +
            `│\n╰──◇\n${FOOTER}`;
        await sendBtn(sock, from, text, msg);
    }
});

// ═══════════════════════════════════════════
// 5. OWNER
// ═══════════════════════════════════════════
commands.push({
    name: 'owner', description: 'Show owner information',
    aliases: ['creator', 'dev'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = `╔══════════════════════╗\n` +
            `║   👑 OWNER INFO     ║\n` +
            `╚══════════════════════╝\n\n` +
            `│ 📛 Name: *${config.OWNER_NAME}*\n` +
            `│ 📞 Phone: *${config.OWNER_NUMBER}*\n` +
            `│ 🌍 Country: *Kenya 🇰🇪*\n` +
            `│ 🤖 Bot: *${config.BOT_NAME}*\n` +
            `│ 📡 APIs: *Megan v3.6.4*\n` +
            `│ 💻 *Falcon Tech*\n` +
            `╰──────────────────◇\n${FOOTER}`;
        try {
            await sock.sendMessage(from, { image: { url: BOT_PIC }, caption: text }, { quoted: msg });
        } catch(e) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
        await react('✅');
    }
});

// ═══════════════════════════════════════════
// 6. STATUS
// ═══════════════════════════════════════════
commands.push({
    name: 'status', description: 'Show bot status',
    aliases: ['stats', 'botstatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const mem = process.memoryUsage();
        const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const awayMode = await bot.db?.getSetting('awaymode', 'off') || 'off';
        const chatbot = await bot.db?.getSetting('chatbot', 'off') || 'off';
        const text = `╔══════════════════════╗\n` +
            `║   📊 BOT STATUS     ║\n` +
            `╚══════════════════════╝\n\n` +
            `│ ⏱️ Uptime: *${d}d ${h}h ${m}m ${s}s*\n` +
            `│ 💾 Memory: *${usedMB}MB*\n` +
            `│ 📚 Commands: *${bot.commands.size}*\n` +
            `│ 🟣 Away: *${awayMode === 'on' ? '✅ ON' : '❌ OFF'}*\n` +
            `│ 💬 Chatbot: *${chatbot}*\n` +
            `│ ⚡ Node: *${process.version}*\n` +
            `│ 💻 Platform: *${process.platform}*\n` +
            `│ 📡 API: *Megan v3.6.4*\n` +
            `╰──────────────────◇\n${FOOTER}`;
        try {
            await sock.sendMessage(from, { image: { url: BOT_PIC }, caption: text }, { quoted: msg });
        } catch(e) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
        await react('✅');
    }
});

// ═══════════════════════════════════════════
// 7. API STATUS
// ═══════════════════════════════════════════
commands.push({
    name: 'apistatus', description: 'Check Megan API server status',
    aliases: ['serverstatus', 'apistats'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🖥️');
        try {
            const axios = require('axios');
            const res = await axios.get(`${API_BASE}/api/status`, { params: { apikey: API_KEY }, timeout: 15000 });
            const s = res.data?.result || res.data || {};
            let text = `╭───[ 🖥️ API STATUS ]───\n│\n`;
            if (s.uptime_formatted) text += `│ ⏱️ ${s.uptime_formatted}\n`;
            if (s.status) text += `│ ✅ ${s.status}\n`;
            if (s.memory?.heap_used_mb) text += `│ 💾 ${s.memory.heap_used_mb}MB\n`;
            if (s.cpu?.model) text += `│ 🔧 ${s.cpu.model.split(' ').slice(0, 3).join(' ')}\n`;
            if (s.platform) text += `│ 💻 ${s.platform}\n`;
            text += `│\n╰──◇\n${FOOTER}`;
            await sendBtn(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *API may be waking up*\n\n${FOOTER}`); }
    }
});

// ═══════════════════════════════════════════
// 8. TRACKER
// ═══════════════════════════════════════════
commands.push({
    name: 'tracker', description: 'Show database statistics',
    aliases: ['dbstats', 'statsdb'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        try {
            const stats = bot.db?.getStats ? bot.db.getStats() : { totalCommands: 0, totalUsers: 0, totalGroups: 0 };
            const text = `╭───[ 📊 DB STATS ]───\n│\n` +
                `│ 📨 Commands: *${stats.totalCommands}*\n` +
                `│ 👥 Users: *${stats.totalUsers}*\n` +
                `│ 👥 Groups: *${stats.totalGroups}*\n` +
                `│\n╰──◇\n${FOOTER}`;
            await sendBtn(sock, from, text, msg);
        } catch (e) { await sendBtn(sock, from, `❌ Error\n\n${FOOTER}`, msg); }
    }
});

// ═══════════════════════════════════════════
// 9. DEBUG
// ═══════════════════════════════════════════
commands.push({
    name: 'debug', description: 'Show debug information',
    aliases: ['diagnose'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const text = `╭───[ 🔧 DEBUG ]───\n│\n` +
            `│ 🤖 *${config.BOT_NAME}*\n` +
            `│ 👤 *${config.OWNER_NAME}*\n` +
            `│ 🔧 Prefix: *${config.PREFIX}*\n` +
            `│ ⏱️ Uptime: *${d}d ${h}h ${m}m ${s}s*\n` +
            `│ ⚡ Node: *${process.version}*\n` +
            `│ 💻 Platform: *${process.platform}*\n` +
            `│ 📚 Commands: *${bot.commands.size}*\n` +
            `│ 🆔 PID: *${process.pid}*\n` +
            `│\n╰──◇\n${FOOTER}`;
        await sendBtn(sock, from, text, msg);
    }
});

module.exports = { commands };
// Test update Mon May 25 06:39:49 UTC 2026
