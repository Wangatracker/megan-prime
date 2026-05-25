// Megan-Prime AI Commands - Clean with typing effect
const config = require('../../megan/config');
const AIHandler = require('../../megan/lib/aiHandler');
const { downloadMediaMessage } = require('gifted-baileys');
const uploader = require('../../megan/lib/upload');

const commands = [];
let aiHandler = null;

const initializeAI = (bot) => {
    if (!aiHandler) {
        aiHandler = new AIHandler(bot);
        console.log('✅ AI Handler initialized');
    }
    return aiHandler;
};

const getQuotedImage = async (msg, sock) => {
    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return null;
        if (quoted.imageMessage) {
            const buffer = await downloadMediaMessage(
                { key: { id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted },
                'buffer', {}, { logger: console }
            );
            const filename = `gemini_img_${Date.now()}.jpg`;
            const { url } = await uploader.uploadAuto(buffer, filename);
            return url;
        }
        return null;
    } catch (error) {
        console.error('Error extracting quoted image:', error);
        return null;
    }
};

const showTyping = async (sock, jid) => {
    try { await sock.sendPresenceUpdate('composing', jid); }
    catch (error) {}
};

// MEGAN AI
commands.push({
    name: 'megan',
    description: 'Chat with Megan AI',
    aliases: ['meganai'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('ℹ️');
            return reply(`*🤖 MEGAN AI*\n\n*Usage:*\n${config.PREFIX}megan <message>\n\n*Example:*\n${config.PREFIX}megan Hello, how are you?\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('🤔');
        await showTyping(sock, from);
        try {
            const response = await ai.meganAI(message);
            await reply(`*🤖 Megan:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Megan error:', error);
            await react('❌');
            await reply(`*🤖 Megan AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// DUCKAI
commands.push({
    name: 'duckai',
    description: 'Chat with DuckAI (multiple models available)',
    aliases: ['duck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('🦆');
            return reply(`*🦆 DUCKAI*\n\n*Usage:*\n${config.PREFIX}duckai <message>\n\n*Example:*\n${config.PREFIX}duckai Tell me a joke\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('🦆');
        await showTyping(sock, from);
        try {
            const response = await ai.duckAI(message);
            await reply(`*🦆 DuckAI:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('DuckAI error:', error);
            await react('❌');
            await reply(`*🦆 DuckAI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// GEMINI
commands.push({
    name: 'gemini',
    description: 'Chat with Google Gemini AI (supports image analysis)',
    aliases: ['gem'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        const imageUrl = await getQuotedImage(msg, sock);
        if (!args.length && !imageUrl) {
            await react('ℹ️');
            return reply(`*✨ GOOGLE GEMINI*\n\n*Usage:*\n• ${config.PREFIX}gemini <message>\n• Reply to an image with ${config.PREFIX}gemini <question>\n\n*Examples:*\n• ${config.PREFIX}gemini Explain quantum physics\n• Reply to image: ${config.PREFIX}gemini What's in this image?\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.length ? args.join(' ') : 'What\'s in this image?';
        await react('✨');
        await showTyping(sock, from);
        try {
            let response;
            if (imageUrl) {
                response = await ai.geminiAI(message, 'You are a helpful assistant.', imageUrl);
            } else {
                response = await ai.geminiAI(message);
            }
            await reply(`*✨ Gemini:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Gemini error:', error);
            await react('❌');
            await reply(`*✨ Google Gemini*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// GEMINI LITE
commands.push({
    name: 'gemini-lite',
    description: 'Fast Google Gemini responses',
    aliases: ['gemlite', 'gfast'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        const imageUrl = await getQuotedImage(msg, sock);
        if (!args.length && !imageUrl) {
            await react('⚡');
            return reply(`*⚡ GEMINI LITE*\n\n*Usage:*\n• ${config.PREFIX}gemini-lite <message>\n• Reply to an image with ${config.PREFIX}gemini-lite <question>\n\n*Examples:*\n• ${config.PREFIX}gemini-lite Hello\n• Reply to image: ${config.PREFIX}gemini-lite What's in this photo?\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.length ? args.join(' ') : 'What\'s in this image?';
        await react('⚡');
        await showTyping(sock, from);
        try {
            let response;
            if (imageUrl) {
                response = await ai.geminiLiteAI(`${message} (Image: ${imageUrl})`);
            } else {
                response = await ai.geminiLiteAI(message);
            }
            await reply(`*⚡ Gemini Lite:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Gemini Lite error:', error);
            await react('❌');
            await reply(`*⚡ Gemini Lite*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// GPT
commands.push({
    name: 'gpt',
    description: 'Chat with GPT OSS 120B',
    aliases: ['gptai'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('💬');
            return reply(`*💬 GPT AI*\n\n*Usage:*\n${config.PREFIX}gpt <message>\n\n*Example:*\n${config.PREFIX}gpt Tell me a fact\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('💬');
        await showTyping(sock, from);
        try {
            const response = await ai.gptAI(message);
            await reply(`*💬 GPT:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('GPT error:', error);
            await react('❌');
            await reply(`*💬 GPT AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// DEEPSEEK
commands.push({
    name: 'deepseek',
    description: 'Chat with DeepSeek R1 AI',
    aliases: ['deep'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('🔍');
            return reply(`*🔍 DEEPSEEK AI*\n\n*Usage:*\n${config.PREFIX}deepseek <message>\n\n*Example:*\n${config.PREFIX}deepseek Explain reasoning\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('🔍');
        await showTyping(sock, from);
        try {
            const response = await ai.deepseekAI(message);
            await reply(`*🔍 DeepSeek:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('DeepSeek error:', error);
            await react('❌');
            await reply(`*🔍 DeepSeek AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// MISTRAL
commands.push({
    name: 'mistral',
    description: 'Chat with Mistral AI',
    aliases: ['mistralai'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('🌪️');
            return reply(`*🌪️ MISTRAL AI*\n\n*Usage:*\n${config.PREFIX}mistral <message>\n\n*Example:*\n${config.PREFIX}mistral Hello\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('🌪️');
        await showTyping(sock, from);
        try {
            const response = await ai.mistralAI(message);
            await reply(`*🌪️ Mistral:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Mistral error:', error);
            await react('❌');
            await reply(`*🌪️ Mistral AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// CODLLAMA
commands.push({
    name: 'codellama',
    description: 'Get coding help from CodeLlama',
    aliases: ['code', 'coding'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('💻');
            return reply(`*💻 CODELlAMA*\n\n*Usage:*\n${config.PREFIX}codellama <your coding question>\n\n*Examples:*\n• ${config.PREFIX}codellama Write a function to reverse a string in Python\n• ${config.PREFIX}codellama Explain async/await in JavaScript\n\n> Megan-Prime | TrackerWanga`);
        }
        const message = args.join(' ');
        await react('💻');
        await showTyping(sock, from);
        try {
            const response = await ai.codeLlamaAI(message);
            await reply(`*💻 CodeLlama:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('CodeLlama error:', error);
            try {
                const fallback = await ai.mistralAI(message, "You are a coding expert.");
                await reply(`*💻 Coding Assistant (Fallback):*\n${fallback}\n\n> Megan-Prime | TrackerWanga`);
                await react('⚠️');
            } catch {
                await react('❌');
                await reply(`❌ *CodeLlama Error*\n\nPlease try again later.\n\n> Megan-Prime | TrackerWanga`);
            }
        }
    }
});

// BIBLE AI
commands.push({
    name: 'bibleai',
    description: 'Ask questions about the Bible',
    aliases: ['bible', 'bibleq'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('📖');
            const versions = ai.getBibleVersions();
            return reply(`*📖 BIBLE AI*\n\n*Usage:*\n${config.PREFIX}bibleai <question>\n\n*Available translations:*\n${versions.join(', ')}\n\n*Set default:*\n${config.PREFIX}setbibleversion <code>\n\n*Examples:*\n• ${config.PREFIX}bibleai What is faith?\n• ${config.PREFIX}bibleai Who was Moses?\n\n> Megan-Prime | TrackerWanga`);
        }
        const question = args.join(' ');
        await react('📖');
        await showTyping(sock, from);
        try {
            const result = await ai.bibleAI(question);
            const answer = result?.answer || result || "I couldn't find an answer to that question.";
            const version = result?.version || 'ESV';
            await reply(`*📖 BIBLE (${version})*\n\n${answer}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Bible AI error:', error);
            await react('❌');
            await reply(`*📖 Bible AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// SET BIBLE VERSION
commands.push({
    name: 'setbibleversion',
    description: 'Set default Bible translation',
    aliases: ['bibleversion'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        const ai = initializeAI(bot);
        if (!isOwner) {
            await react('❌');
            return reply(`❌ *Owner Only Command*\n\nThis command can only be used by the bot owner.\n\n> Megan-Prime | TrackerWanga`);
        }
        if (!args.length) {
            const versions = ai.getBibleVersions();
            const current = ai.defaultBibleVersion || 'ESV';
            return reply(`*📖 BIBLE VERSIONS*\n\n*Current default:* ${current}\n\n*Available:*\n${versions.join(', ')}\n\n*Usage:*\n${config.PREFIX}setbibleversion <code>\n\n> Megan-Prime | TrackerWanga`);
        }
        const version = args[0].toUpperCase();
        const success = ai.setBibleVersion(version);
        if (!success) {
            await react('❌');
            const versions = ai.getBibleVersions();
            return reply(`❌ *Invalid Version*\n\nAvailable: ${versions.join(', ')}\n\n> Megan-Prime | TrackerWanga`);
        }
        await react('✅');
        await reply(`✅ *BIBLE VERSION UPDATED*\n\nDefault Bible version set to: *${version}*\n\n> Megan-Prime | TrackerWanga`);
    }
});

// TEACHER AI
commands.push({
    name: 'teacher',
    description: 'Ask the AI teacher for help',
    aliases: ['teach', 'learn'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('👨‍🏫');
            return reply(`*👨‍🏫 TEACHER AI*\n\n*Usage:*\n${config.PREFIX}teacher <your question>\n\n*Examples:*\n• ${config.PREFIX}teacher Explain photosynthesis\n• ${config.PREFIX}teacher math What is calculus?\n\n> Megan-Prime | TrackerWanga`);
        }
        let subject = null;
        let question = args.join(' ');
        const subjects = ['math', 'science', 'history', 'english', 'physics', 'chemistry', 'biology'];
        const firstWord = args[0].toLowerCase();
        if (subjects.includes(firstWord)) {
            subject = firstWord;
            question = args.slice(1).join(' ');
        }
        await react('👨‍🏫');
        await showTyping(sock, from);
        try {
            const response = await ai.teacherAI(question, subject);
            await reply(`*👨‍🏫 Teacher:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Teacher AI error:', error);
            await react('❌');
            await reply(`*👨‍🏫 Teacher AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// GITA AI
commands.push({
    name: 'gita',
    description: 'Ask questions about Bhagavad Gita',
    aliases: ['gitaai'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) {
            await react('🕉️');
            return reply(`*🕉️ GITA AI*\n\n*Usage:*\n${config.PREFIX}gita <question>\n\n*Example:*\n${config.PREFIX}gita What is karma?\n\n> Megan-Prime | TrackerWanga`);
        }
        const question = args.join(' ');
        await react('🕉️');
        await showTyping(sock, from);
        try {
            const response = await ai.gitaAI(question);
            await reply(`*🕉️ Gita:*\n\n${response}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (error) {
            console.error('Gita AI error:', error);
            await react('❌');
            await reply(`*🕉️ Gita AI*\n\nI'm having trouble connecting right now. Please try again in a moment.\n\n> Megan-Prime | TrackerWanga`);
        }
    }
});

// AI MENU
commands.push({
    name: 'aimenu',
    description: 'Show all AI commands',
    aliases: ['aihelp', 'ais'],
    async execute({ msg, from, sender, bot, sock, react, reply }) {
        const menu = `*🤖 AI COMMANDS*\n\n` +
            `*MEGAN AI*\n` +
            `• ${config.PREFIX}megan - Cloudflare AI\n\n` +
            `*GOOGLE AI*\n` +
            `• ${config.PREFIX}gemini - Full Gemini + images\n` +
            `• ${config.PREFIX}gemini-lite - Fast version\n\n` +
            `*POPULAR MODELS*\n` +
            `• ${config.PREFIX}gpt - GPT OSS 120B\n` +
            `• ${config.PREFIX}deepseek - DeepSeek R1\n` +
            `• ${config.PREFIX}mistral - Mistral AI\n` +
            `• ${config.PREFIX}duckai - Multi-model AI\n\n` +
            `*SPECIALIZED AI*\n` +
            `• ${config.PREFIX}codellama - Coding help\n` +
            `• ${config.PREFIX}teacher - Educational AI\n\n` +
            `*RELIGIOUS AI*\n` +
            `• ${config.PREFIX}bibleai - Bible Q&A\n` +
            `• ${config.PREFIX}setbibleversion - Change translation\n` +
            `• ${config.PREFIX}gita - Bhagavad Gita\n\n` +
            `*EXAMPLES*\n` +
            `• ${config.PREFIX}megan Hello\n` +
            `• ${config.PREFIX}teacher Explain gravity\n` +
            `• ${config.PREFIX}codellama Write Python function\n` +
            `• Reply to image: ${config.PREFIX}gemini What's this?\n` +
            `• ${config.PREFIX}bibleai What is love?\n\n` +
            `> Megan-Prime | TrackerWanga`;
        await reply(menu);
        await react('✅');
    }
});


// NEW MEGAN API AI MODELS
const MEGAN_AI_MODELS = [
    { name: 'claude', desc: 'Chat with Claude AI', emoji: '🧠', aliases: ['claudeai'] },
    { name: 'venice', desc: 'Chat with Venice AI', emoji: '🛡️', aliases: ['veniceai'] },
    { name: 'groq', desc: 'Chat with Groq AI', emoji: '⚡', aliases: ['groqai'] },
    { name: 'cohere', desc: 'Chat with Cohere AI', emoji: '🎯', aliases: ['cohereai'] },
    { name: 'llama', desc: 'Chat with LLaMA AI', emoji: '🦙', aliases: ['llamaai'] },
    { name: 'mixtral', desc: 'Chat with Mixtral AI', emoji: '🔀', aliases: ['mixtralai'] },
    { name: 'falcon', desc: 'Chat with Falcon AI', emoji: '🦅', aliases: ['falconai'] },
    { name: 'vicuna', desc: 'Chat with Vicuna AI', emoji: '🦙', aliases: ['vicunaai'] },
    { name: 'openchat', desc: 'Chat with OpenChat AI', emoji: '💬', aliases: ['openchatai'] },
    { name: 'wizard', desc: 'Chat with WizardLM AI', emoji: '🧙', aliases: ['wizardai', 'wizardlm'] },
    { name: 'starcoder', desc: 'Chat with StarCoder AI', emoji: '⭐', aliases: ['starcoderai'] },
    { name: 'neural', desc: 'Chat with NeuralChat AI', emoji: '🧬', aliases: ['neuralai'] },
    { name: 'solar', desc: 'Chat with Solar AI', emoji: '☀️', aliases: ['solarai'] },
    { name: 'internlm', desc: 'Chat with InternLM AI', emoji: '🌏', aliases: ['internlmai'] },
];

MEGAN_AI_MODELS.forEach(({ name, desc, emoji, aliases }) => {
    commands.push({
        name, description: desc, aliases,
        async execute({ msg, from, sender, args, bot, sock, react, reply }) {
            const ai = initializeAI(bot);
            if (!args.length) {
                await react(emoji);
                return reply(`${emoji} *${desc.toUpperCase()}*\n\n*Usage:* ${config.PREFIX}${name} <message>\n\n> Megan-Prime | TrackerWanga`);
            }
            const message = args.join(' ');
            await react(emoji);
            await sock.sendMessage(from, { text: `${emoji} *Thinking...*` }, { quoted: msg });
            try {
                const method = name === 'wizard' ? 'wizardAI' : name === 'starcoder' ? 'starcoderAI' : name === 'neural' ? 'neuralAI' : name === 'solar' ? 'solarAI' : name === 'internlm' ? 'internlmAI' : `${name}AI`;
                const response = await ai[method](message);
                await reply(`${emoji} *${name.charAt(0).toUpperCase() + name.slice(1)}:*\n${response}\n\n> Megan-Prime | TrackerWanga`);
                await react('✅');
            } catch (error) {
                await react('❌');
                await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`);
            }
        }
    });
});

// AI TOOLS
commands.push({
    name: 'aisummarize', description: 'Summarize text using AI',
    aliases: ['summarize', 'summary'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        const ai = initializeAI(bot);
        let text = args.join(' ');
        if (!text && quoted?.message?.conversation) text = quoted.message.conversation;
        if (!text && quoted?.message?.extendedTextMessage?.text) text = quoted.message.extendedTextMessage.text;
        if (!text) { await react('ℹ️'); return reply(`📝 *AI SUMMARIZE*\n\n*Usage:* ${config.PREFIX}aisummarize <text> or reply to a message\n\n> Megan-Prime | TrackerWanga`); }
        await react('📝');
        try {
            const result = await ai.summarize(text);
            await reply(`📝 *Summary:*\n${result}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`); }
    }
});

commands.push({
    name: 'aicode', description: 'Generate code using AI',
    aliases: ['codeai', 'aicoder'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) { await react('ℹ️'); return reply(`💻 *AI CODE*\n\n*Usage:* ${config.PREFIX}aicode <description>\n\n> Megan-Prime | TrackerWanga`); }
        const message = args.join(' ');
        await react('💻');
        await sock.sendMessage(from, { text: '💻 *Generating code...*' }, { quoted: msg });
        try {
            const result = await ai.code(message);
            await reply(`💻 *Generated Code:*\n${result.substring(0, 3500)}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`); }
    }
});

commands.push({
    name: 'aihumanize', description: 'Humanize AI-generated text',
    aliases: ['humanize', 'humanizer'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        const ai = initializeAI(bot);
        let text = args.join(' ');
        if (!text && quoted?.message?.conversation) text = quoted.message.conversation;
        if (!text && quoted?.message?.extendedTextMessage?.text) text = quoted.message.extendedTextMessage.text;
        if (!text) { await react('ℹ️'); return reply(`✍️ *AI HUMANIZER*\n\n*Usage:* ${config.PREFIX}aihumanize <text> or reply\n\n> Megan-Prime | TrackerWanga`); }
        await react('✍️');
        try {
            const result = await ai.humanizer(text);
            await reply(`✍️ *Humanized:*\n${result}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`); }
    }
});

commands.push({
    name: 'aiscanner', description: 'Detect if text is AI-generated',
    aliases: ['aicheck', 'aidetect'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, quoted }) {
        const ai = initializeAI(bot);
        let text = args.join(' ');
        if (!text && quoted?.message?.conversation) text = quoted.message.conversation;
        if (!text && quoted?.message?.extendedTextMessage?.text) text = quoted.message.extendedTextMessage.text;
        if (!text) { await react('ℹ️'); return reply(`🔍 *AI SCANNER*\n\n*Usage:* ${config.PREFIX}aiscanner <text> or reply\n\n> Megan-Prime | TrackerWanga`); }
        await react('🔍');
        try {
            const result = await ai.scanner(text);
            await reply(`🔍 *AI Scanner Result:*\n${result}\n\n> Megan-Prime | TrackerWanga`);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`); }
    }
});

// IMAGE COMMANDS
commands.push({
    name: 'aigenimage', description: 'Generate AI image',
    aliases: ['genimage', 'createimage'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        if (!args.length) { await react('ℹ️'); return reply(`🎨 *AI IMAGE GEN*\n\n*Usage:* ${config.PREFIX}aigenimage <description>\n\n> Megan-Prime | TrackerWanga`); }
        const prompt = args.join(' ');
        await react('🎨');
        await sock.sendMessage(from, { text: '🎨 *Generating image...*' }, { quoted: msg });
        try {
            const imageUrl = await ai.generateImage(prompt);
            if (imageUrl) {
                await sock.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *${prompt}*\n\n> Megan-Prime | TrackerWanga` }, { quoted: msg });
            } else {
                await reply(`❌ *Failed to generate image*\n\n> Megan-Prime | TrackerWanga`);
            }
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n> Megan-Prime | TrackerWanga`); }
    }
});

commands.push({
    name: 'dog', description: 'Get random dog image',
    aliases: ['dogpic', 'woof'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        await react('🐕');
        try {
            const url = await ai.dogImage();
            if (url) {
                await sock.sendMessage(from, { image: { url }, caption: `🐕 *Random Dog*\n\n> Megan-Prime | TrackerWanga` }, { quoted: msg });
            }
            await react('✅');
        } catch (e) { await react('❌'); }
    }
});

commands.push({
    name: 'cat', description: 'Get random cat image',
    aliases: ['catpic', 'meow'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ai = initializeAI(bot);
        await react('🐈');
        try {
            const url = await ai.catImage();
            if (url) {
                await sock.sendMessage(from, { image: { url }, caption: `🐈 *Random Cat*\n\n> Megan-Prime | TrackerWanga` }, { quoted: msg });
            }
            await react('✅');
        } catch (e) { await react('❌'); }
    }
});

module.exports = { commands };
