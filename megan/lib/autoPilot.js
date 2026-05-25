// Megan-Prime AutoPilot v2.0 - Smart AI with Full Context
const axios = require('axios');
const AIMessageStore = require('./aiMessageStore');

class AutoPilot {
    constructor(bot) {
        this.bot = bot;
        this.sock = bot.sock;
        this.db = bot.db;
        this.activeStores = new Map();
        this.nameCache = new Map();
        this.commandCache = null;
        this.commandCacheTime = 0;
        this.aiUrl = 'https://siputzx.pages.dev/api/ai/gemini';
        console.log('🟣 [AUTOPILOT] Smart Engine initialized');
    }

    getStore(chatId) {
        if (!this.activeStores.has(chatId)) {
            const store = new AIMessageStore(chatId);
            store.initialize().catch(err => console.error('Store init error:', err));
            this.activeStores.set(chatId, store);
        }
        return this.activeStores.get(chatId);
    }

    async getUserName(sender, msg) {
        if (this.nameCache.has(sender)) return this.nameCache.get(sender);
        let name = sender.split('@')[0];
        try {
            if (msg?.pushName) name = msg.pushName;
            if (this.sock && typeof this.sock.getContact === 'function') {
                const contact = await this.sock.getContact(sender);
                if (contact?.name) name = contact.name;
                else if (contact?.notify) name = contact.notify;
                else if (contact?.verifiedName) name = contact.verifiedName;
            }
        } catch(e) {}
        this.nameCache.set(sender, name);
        return name;
    }

    async isActive() {
        return await this.db.getSetting('awaymode', 'off') === 'on';
    }

    shouldRespond(from, isGroup) {
        if (isGroup) return false;
        const ownerPhone = this.bot.config.OWNER_NUMBER.replace(/\D/g, '');
        const fromPhone = from.split('@')[0].split(':')[0].replace(/\D/g, '');
        return fromPhone !== ownerPhone;
    }

    // Build full command list (cached for 10 minutes)
    getFullCommandsList() {
        if (this.commandCache && (Date.now() - this.commandCacheTime) < 600000) {
            return this.commandCache;
        }
        const categories = {
            '📥 Downloader': [],
            '🔍 Search': [],
            '🤖 AI': [],
            '🎨 Media': [],
            '✨ Effects': [],
            '👥 Group': [],
            '🎬 Movies': [],
            '🛠️ Tools': [],
            '🛡️ Security': [],
            '⚽ Sports': [],
            '🎮 Games': [],
            '💬 Chat': [],
            '⚙️ Settings': [],
            '📊 Status': []
        };

        for (const [name, cmd] of this.bot.commands) {
            if (!cmd.description) continue;
            const entry = `.${name} - ${cmd.description}`;
            if (name.startsWith('play') || name.startsWith('yt') || name.includes('spotify') || name.includes('soundcloud') || name.includes('tiktok') || name.includes('ig') || name.includes('fb') || name.includes('twitter') || name.includes('snapchat') || name.includes('shazam')) {
                categories['📥 Downloader'].push(entry);
            } else if (['google','bing','duckduckgo','youtube','spotifysearch','news','wiki','dictionary','github','crypto','forex','weather','country','stalk'].some(k => name.includes(k))) {
                categories['🔍 Search'].push(entry);
            } else if (['megan','gpt','gemini','claude','deepseek','mistral','llama','groq','qwen','codellama','bibleai','teacher'].some(k => name.includes(k))) {
                categories['🤖 AI'].push(entry);
            } else if (['sticker','toimage','gif','say','voice','toaudio','bass','nightcore','circle','filter','removebg','meme','catbox','qrcode','screenshot','waifu'].some(k => name.includes(k))) {
                categories['🎨 Media'].push(entry);
            } else if (['ephoto','textpro','photofunia'].some(k => name.includes(k))) {
                categories['✨ Effects'].push(entry);
            } else if (['group','creategroup','add','kick','promote','demote','invite','join','tag','poll','welcome','lock'].some(k => name.includes(k))) {
                categories['👥 Group'].push(entry);
            } else if (['movie','tv','anime','trending','cinema','kdrama'].some(k => name.includes(k))) {
                categories['🎬 Movies'].push(entry);
            } else if (['binary','base64','hash','morse','encrypt','decrypt','password','uuid','email','calc','fliptext','zodiak'].some(k => name.includes(k))) {
                categories['🛠️ Tools'].push(entry);
            } else if (['whois','dns','portscan','geoip','ssl','xss','sqli','waf'].some(k => name.includes(k))) {
                categories['🛡️ Security'].push(entry);
            } else if (['sport','livescore','team','league','player','venue'].some(k => name.includes(k))) {
                categories['⚽ Sports'].push(entry);
            } else if (['game','rps','flag','scramble','numberguess'].some(k => name.includes(k))) {
                categories['🎮 Games'].push(entry);
            } else if (['sendloc','sendcontact','pin','archive','clearchat','checkwa','business','privacy'].some(k => name.includes(k))) {
                categories['💬 Chat'].push(entry);
            } else if (['setprefix','setbotname','setmode','block','unblock','awaymode','chatbot','autoreact','features'].some(k => name.includes(k))) {
                categories['⚙️ Settings'].push(entry);
            } else {
                categories['📊 Status'].push(entry);
            }
        }

        let list = '';
        for (const [cat, cmds] of Object.entries(categories)) {
            if (cmds.length > 0) {
                list += `\n${cat} (${cmds.length} commands):\n${cmds.slice(0, 10).join('\n')}\n`;
            }
        }

        this.commandCache = list;
        this.commandCacheTime = Date.now();
        return list;
    }

    getSystemPrompt(senderName) {
        const botName = this.bot.config.BOT_NAME || 'Megan-Prime';
        const ownerName = this.bot.config.OWNER_NAME || 'TrackerWanga';
        const prefix = this.bot.config.PREFIX || '.';
        const totalCmds = this.bot.commands.size;

        return `You are ${botName}, a WhatsApp AI assistant created by ${ownerName}.

YOUR IDENTITY:
- Name: ${botName}
- Creator/Owner: ${ownerName} (Tracker Wanga)
- Platform: WhatsApp Bot
- Prefix: ${prefix} (all commands start with ${prefix})
- Total Commands Available: ${totalCmds}

THE PERSON YOU ARE TALKING TO:
- Their name is: "${senderName}"
- Use their name naturally and warmly
- Be friendly, helpful, and conversational

YOUR CAPABILITIES:
${this.getFullCommandsList()}

RESPONSE RULES:
- Keep responses under 400 characters
- Be friendly and conversational
- Use the sender's name naturally
- Mention relevant commands when appropriate (e.g., "try .play for music!")
- If someone wants music: suggest .play, .spotify, .soundcloud
- If someone wants videos: suggest .ytmp4, .tiktok, .movie
- If someone wants AI chat: suggest .megan, .gpt, .gemini
- If someone wants images: suggest .sticker, .ephoto, .textpro
- If someone wants news/info: suggest .news, .weather, .wiki
- Never say "I don't know" - instead offer alternatives
- ${ownerName} is currently away, you are handling messages
- Don't reveal that you're an AI unless asked directly
- Be concise but helpful`;
    }

    async processMessage(msg, from, sender, metadata) {
        if (!await this.isActive()) return null;
        if (!this.shouldRespond(from, metadata.isGroup)) return null;

        console.log('🟣 [AUTOPILOT] Processing...');

        const senderName = await this.getUserName(sender, msg);
        const senderPhone = sender.split('@')[0].split(':')[0];
        console.log(`👤 [AUTOPILOT] ${senderName} (${senderPhone})`);

        const store = this.getStore(from);
        await store.initialize();

        const userContent = metadata.textContent || 
            (metadata.messageType === 'image' ? '[Image received]' :
             metadata.messageType === 'video' ? '[Video received]' :
             metadata.messageType === 'sticker' ? '[Sticker received]' : '[Message received]');

        await store.addMessage({
            chatId: from, userId: sender, role: 'user',
            content: userContent, messageType: metadata.messageType,
            hasLink: metadata.hasLink, links: metadata.links,
            mediaCaption: metadata.mediaCaption, isViewOnce: metadata.isViewOnce,
            timestamp: Date.now()
        });

        let response;

        if (metadata.messageType === 'image' || metadata.messageType === 'video') {
            response = `Hey ${senderName}! 👋 I can see you sent media but I can't view it directly. ${this.bot.config.OWNER_NAME} will check it when he's back! In the meantime, you can try:\n• .sticker - convert images to stickers\n• .play <song> - download music\n• .menu - see all commands`;
        } else if (metadata.hasLink && metadata.links.length > 0) {
            response = await this.handleLinkMessage(metadata, senderName);
        } else if (userContent && userContent.trim() && userContent !== '[Message received]') {
            response = await this.handleTextMessage(from, userContent, senderName);
        } else {
            response = `Hey ${senderName}! 👋 ${this.bot.config.OWNER_NAME} is currently away. I'm ${this.bot.config.BOT_NAME}, his AI assistant. I can help with:\n• .play <song> - Download music\n• .megan <question> - AI chat\n• .menu - See all ${this.bot.commands.size} commands\n\nWhat can I help you with?`;
        }

        if (metadata.textContent?.toLowerCase().includes('remind') || 
            metadata.textContent?.toLowerCase().includes('notify')) {
            await this.handleTaskDetection(metadata, from, sender, senderName);
        }

        if (response) {
            response = response.replace(/🟣\s*\*AWAY MODE\*\s*\n*/gi, '');
            const finalResponse = `🟣 *AWAY MODE*\n\n${response}\n\n> ${this.bot.config.BOT_NAME} | ${this.bot.config.OWNER_NAME}`;

            await store.addMessage({
                chatId: from, userId: 'assistant', role: 'assistant',
                content: finalResponse, messageType: 'text', timestamp: Date.now(), processedByAI: 1
            });

            return finalResponse;
        }

        return null;
    }

    async handleLinkMessage(metadata, senderName) {
        const link = metadata.links[0];
        return `Hey ${senderName}! I see you sent a link (${link.substring(0, 50)}...). ${this.bot.config.OWNER_NAME} will check it when he's back. You can also try:\n• .browse <url> - fetch web content\n• .tiktok <url> - download TikTok\n• .ig <url> - download Instagram`;
    }

    async handleTextMessage(from, userContent, senderName) {
        const systemPrompt = this.getSystemPrompt(senderName);
        const prompt = `${senderName} says: "${userContent}"\n\nRespond naturally as ${this.bot.config.BOT_NAME}. Be helpful, mention relevant commands.`;

        let aiResponse = await this.callAI(prompt, systemPrompt);
        if (!aiResponse) {
            aiResponse = await this.callAIFallback(prompt, systemPrompt);
        }

        if (aiResponse && aiResponse.length > 5) {
            console.log(`✅ [AUTOPILOT] AI: ${aiResponse.substring(0, 80)}`);
            return aiResponse;
        }

        return this.getContextualDefault(userContent, senderName);
    }

    getContextualDefault(userText, senderName) {
        if (!userText) return `Hey ${senderName}! How can I help?`;
        const text = userText.toLowerCase();
        if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
            return `Hello ${senderName}! 👋 ${this.bot.config.OWNER_NAME} is away right now. I'm ${this.bot.config.BOT_NAME}. Try:\n• .menu - view all commands\n• .play <song> - download music\n• .megan <text> - chat with AI\n\nWhat would you like to do?`;
        }
        if (text.includes('music') || text.includes('song') || text.includes('audio')) {
            return `Hey ${senderName}! 🎵 For music try:\n• .play <song name> - download audio\n• .spotify <song> - Spotify download\n• .soundcloud <song> - SoundCloud\n• .ytsearch <query> - search YouTube`;
        }
        if (text.includes('video') || text.includes('movie') || text.includes('download')) {
            return `Hey ${senderName}! 🎬 For videos try:\n• .ytmp4 <name> - YouTube video\n• .tiktok <url> - TikTok\n• .movie <name> - search movies\n• .moviedl <name> - download movie`;
        }
        if (text.includes('?')) {
            return `${senderName}, try asking differently or check:\n• .menu - all commands\n• .megan <question> - AI assistant\n• .help - command list`;
        }
        return `Hey ${senderName}! Got your message. ${this.bot.config.OWNER_NAME} will see it later. Type *.menu* to see all ${this.bot.commands.size} commands I can help with!`;
    }

    async handleTaskDetection(metadata, from, sender, senderName) {
        try {
            if (!this.bot.sock) return;
            const task = await this.bot.taskScheduler?.extractTaskFromMessage(metadata.textContent, from, sender);
            if (task) {
                task.userName = senderName;
                task.userPhone = sender.split('@')[0].split(':')[0];
                const scheduled = await this.bot.taskScheduler.scheduleTask(task);
                if (scheduled.success) {
                    await this.bot.sock.sendMessage(from, {
                        text: `📅 *Reminder Set!*\n\nHey ${senderName}, I'll remind you about: "${task.message}"\n\n⏰ Time: ${new Date(task.scheduledTime).toLocaleString()}\n\n> ${this.bot.config.BOT_NAME} | ${this.bot.config.OWNER_NAME}`
                    });
                    const ownerJid = this.bot.config.getOwnerJid();
                    await this.bot.sock.sendMessage(ownerJid, {
                        text: `📅 *Reminder Set (Away Mode)*\n\n👤 *From:* ${senderName}\n📞 *Phone:* ${sender.split('@')[0].split(':')[0]}\n📝 *Task:* "${task.message}"\n⏰ *Time:* ${new Date(task.scheduledTime).toLocaleString()}\n⏰ *Set at:* ${new Date().toLocaleString()}\n\n> ${this.bot.config.BOT_NAME} | ${this.bot.config.OWNER_NAME}`
                    });
                }
            }
        } catch (error) {
            console.error('❌ [AUTOPILOT] Task error:', error.message);
        }
    }

    // Primary AI: siputzx.pages.dev with systemPrompt support
    async callAI(prompt, systemPrompt) {
        try {
            const response = await axios.get(this.aiUrl, {
                params: {
                    text: prompt,
                    promptSystem: systemPrompt,
                    cookie: 'Megan-Prime'
                },
                timeout: 25000
            });
            if (response.data?.data?.response) return response.data.data.response;
            if (response.data?.result) return response.data.result;
            return null;
        } catch (error) { return null; }
    }

    // Fallback AI: Megan API
    async callAIFallback(prompt, systemPrompt) {
        try {
            const response = await axios.get('https://apis.megan.qzz.io/api/ai/gemini', {
                params: { q: prompt, apikey: 'megan_admin_master' },
                timeout: 25000
            });
            if (response.data?.result) return response.data.result;
            return null;
        } catch (error) { return null; }
    }

    async cleanup() {
        for (const [chatId, store] of this.activeStores) store.close();
        this.activeStores.clear();
    }
}

module.exports = AutoPilot;
