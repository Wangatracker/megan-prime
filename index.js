// Megan-Prime - With AutoPilot Away Mode System
// Created by TrackerWanga

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    isJidGroup,
    DisconnectReason,
    downloadMediaMessage
} = require('gifted-baileys');

const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const dotenv = require('dotenv');
const { Boom } = require('@hapi/boom');
const axios = require('axios');

dotenv.config();

// Import modules
const config = require('./megan/config');
const { createLogger } = require('./megan/logger');
const DatabaseManager = require('./megan/lib/database');
const SimpleMemory = require('./megan/lib/simpleMemory');
const CacheManager = require('./megan/lib/cache');
const MessageStore = require('./megan/lib/messageStore');
const EventHandler = require('./megan/events/handler');
const MessageHelper = require('./megan/lib/message');
const MediaProcessor = require('./megan/lib/mediaProcessor');
const StatusHandler = require('./megan/lib/statusHandler');
const AutoReactHandler = require('./megan/lib/autoReact');
const LidResolver = require('./megan/lib/lidResolver').LidResolver;
const Buttons = require('./megan/lib/buttons');
const timeUtils = require('./megan/lib/timeUtils');
const { handleViewOnce } = require('./megan/lib/viewOnceHandler');
const { handleAntiLink } = require('./megan/lib/antiLink');
const AutoPilot = require('./megan/lib/autoPilot');
const TaskScheduler = require('./megan/lib/taskScheduler');

class MeganPrime {
    constructor() {
        this.config = config;
        this.logger = createLogger(config.BOT_NAME);
        this.cache = new CacheManager(this.logger);
        this.messageStore = null;
        this.db = null;
        this.memory = new SimpleMemory();
        this.media = new MediaProcessor();
        this.autoReact = null;
        this.lidResolver = null;
        this.sock = null;
        this.commands = new Map();
        this.aliases = new Map();
        this.ownerJid = null;
        this.ownerLid = null;
        this.autoPilot = null;
        this.taskScheduler = null;
        this.createRequiredFolders();
    }

    createRequiredFolders() {
        const folders = ['./sessions', './temp', './database', './logs', './megan/temp', './ai_memories'];
        folders.forEach(folder => {
            try { fs.ensureDirSync(folder); } catch (error) {}
        });
    }

    async initialize() {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║        Megan-Prime BOT INITIALIZATION                      ║');
        console.log('║        AutoPilot Away Mode System                          ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        try {
            console.log('🔐 [1/8] Loading WhatsApp session...');
            await this.setupSession();
            console.log('✅ [1/8] Session loaded successfully\n');

            console.log('🗄️  [2/8] Initializing database...');
            this.db = new DatabaseManager();
            await this.db.initialize();
            console.log('✅ [2/8] Database ready\n');

            console.log('💾 [3/8] Initializing message store...');
            this.messageStore = new MessageStore();
            this.messageStore.setDatabase(this.db);
            console.log('✅ [3/8] Message store ready\n');

            console.log('📚 [4/8] Loading commands...');
            await this.loadCommands();
            console.log(`✅ [4/8] Loaded ${this.commands.size} commands\n`);

            console.log('🎮 [5/8] Initializing handlers...');
            this.autoReact = new AutoReactHandler(this);
            this.lidResolver = new LidResolver(this);
            console.log('✅ [5/8] Handlers ready\n');

            console.log('📅 [6/8] Initializing Task Scheduler...');
            this.taskScheduler = new TaskScheduler(this);
            await this.taskScheduler.initialize();
            console.log('✅ [6/8] Task Scheduler ready\n');

            console.log('🟣 [7/8] Initializing AutoPilot...');
            this.autoPilot = new AutoPilot(this);
            console.log('✅ [7/8] AutoPilot ready\n');

            console.log('🌐 [8/8] Connecting to WhatsApp...');
            await this.connect();

            const currentTime = await timeUtils.getCurrentTimeString(this.db);
            const awayMode = await this.db.getSetting('awaymode', 'off');
            const chatbot = await this.db.getSetting('chatbot', 'off');
            const memoryStats = this.memory.getGlobalStats();

            console.log('\n╔═══════════════════════════════════════════════════════════╗');
            console.log('║                    BOT STATUS                              ║');
            console.log('╚═══════════════════════════════════════════════════════════╝');
            console.log(`🕐 Current Time: ${currentTime}`);
            console.log(`🤖 Bot: ${config.BOT_NAME}`);
            console.log(`👤 Owner: ${config.OWNER_NAME}`);
            console.log(`📱 Number: ${config.OWNER_NUMBER}`);
            console.log(`🔧 Prefix: ${config.PREFIX}`);
            console.log(`📚 Commands: ${this.commands.size}`);
            console.log(`🟣 AutoPilot: ${awayMode === 'on' ? '✅ ACTIVE' : '❌ OFF'}`);
            console.log(`💬 Chatbot: ${chatbot}`);
            console.log(`🧠 AI Memory: ${memoryStats.activeChats} chats, ${memoryStats.totalMessages} messages`);
            console.log('═══════════════════════════════════════════════════════════════\n');

            console.log('✅ Megan-Prime is now online with AutoPilot ready!\n');

        } catch (error) {
            console.error(`\n❌ Initialization failed: ${error.message}`);
            console.error(error.stack);
            process.exit(1);
        }
    }

    async setupSession() {
        const sessionString = process.env.SESSION;
        if (!sessionString) {
            throw new Error('No SESSION in .env');
        }

        const sessionDir = path.join(process.cwd(), 'sessions');
        await fs.ensureDir(sessionDir);

        let credsData;
        if (sessionString.startsWith('Megan~')) {
            const { decodeSession } = require('./megan/helpers/sessionDecoder');
            credsData = decodeSession(sessionString);
        } else {
            try {
                credsData = JSON.parse(sessionString);
            } catch (e) {
                throw new Error('Invalid session format');
            }
        }

        const credsPath = path.join(sessionDir, 'creds.json');
        await fs.writeJson(credsPath, credsData, { spaces: 2 });
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'wanga/commands');
        await fs.ensureDir(commandsPath);
        const files = await fs.readdir(commandsPath);
        const jsFiles = files.filter(file => file.endsWith('.js'));

        for (const file of jsFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)];
                const cmdModule = require(filePath);

                let commandsArray = [];
                if (cmdModule.commands && Array.isArray(cmdModule.commands)) {
                    commandsArray = cmdModule.commands;
                } else if (Array.isArray(cmdModule)) {
                    commandsArray = cmdModule;
                } else if (cmdModule.default?.commands) {
                    commandsArray = cmdModule.default.commands;
                }

                for (const cmd of commandsArray) {
                    if (cmd && cmd.name) {
                        this.commands.set(cmd.name.toLowerCase(), cmd);
                        if (cmd.aliases) {
                            cmd.aliases.forEach(alias => {
                                this.aliases.set(alias.toLowerCase(), cmd.name.toLowerCase());
                            });
                        }
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Failed to load ${file}: ${error.message}`);
            }
        }
    }

    // ==================== AI WITH SIMPLE MEMORY ====================
    async getAIResponse(chatId, userId, query, systemPrompt = null) {
        const defaultSystemPrompt = `You are Megan-Prime, a friendly WhatsApp bot created by TrackerWanga. Be helpful, concise, and engaging. Keep responses under 2000 characters.`;

        const system = systemPrompt || defaultSystemPrompt;

        const aiMode = await this.db.getSetting('ai_mode', 'normal');
        let stylePrompt = '';

        if (aiMode === 'short') {
            stylePrompt = ' Be very brief and concise. Use 1-2 sentences maximum.';
        } else if (aiMode === 'detailed') {
            stylePrompt = ' Provide detailed, comprehensive responses with examples when helpful.';
        }

        const fullSystemPrompt = system + stylePrompt;
        const context = this.memory.getContext(chatId, fullSystemPrompt, query, 15);

        const apis = [
            {
                name: 'primary',
                url: 'https://late-salad-9d56.youngwanga254.workers.dev',
                method: 'POST',
                data: { prompt: query, model: '@cf/meta/llama-3.1-8b-instruct' },
                parse: (res) => res.data?.response || res.response
            },
            {
                name: 'gemini',
                url: 'https://api.siputzx.my.id/api/ai/gemini',
                method: 'GET',
                buildUrl: (query, system) => `?text=${encodeURIComponent(query)}&cookie=Megan-Prime&promptSystem=${encodeURIComponent(system)}`,
                parse: (res) => res.data?.response
            },
            {
                name: 'duckai',
                url: 'https://api.siputzx.my.id/api/ai/duckai',
                method: 'GET',
                buildUrl: (query, system) => `?message=${encodeURIComponent(query)}&model=gpt-4o-mini&systemPrompt=${encodeURIComponent(system)}`,
                parse: (res) => res.data?.message
            }
        ];

        for (const api of apis) {
            try {
                let response;
                if (api.method === 'POST') {
                    response = await axios.post(api.url, api.data, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 15000
                    });
                } else {
                    const url = api.url + (api.buildUrl ? api.buildUrl(query, fullSystemPrompt) : `?prompt=${encodeURIComponent(query)}`);
                    response = await axios.get(url, { timeout: 15000 });
                }

                const aiResponse = api.parse(response.data);
                if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
                    console.log(`✅ AI response from ${api.name} API`);
                    this.memory.addMessage(chatId, userId, 'user', query);
                    this.memory.addMessage(chatId, userId, 'assistant', aiResponse);
                    return aiResponse;
                }
            } catch (error) {
                console.log(`⚠️ ${api.name} API failed: ${error.message}`);
                continue;
            }
        }

        return "I'm having trouble connecting to my AI service right now. Please try again in a moment. 🙏";
    }

    isOwnerCheck(senderJid) {
        if (!senderJid || !this.ownerJid) return false;
        const cleanSender = senderJid.split(':')[0];
        const cleanOwner = this.ownerJid.split(':')[0];
        const ownerNumber = this.config.OWNER_NUMBER.replace(/\D/g, '');
        const senderNumber = cleanSender.replace(/[^0-9]/g, '');
        if (cleanSender === cleanOwner) return true;
        if (senderJid === this.ownerJid) return true;
        if (senderNumber === ownerNumber) return true;
        if (senderJid === ownerNumber + '@s.whatsapp.net') return true;
        if (senderJid === this.ownerLid) return true;
        return false;
    }

    async connect() {
        try {
            const { version } = await fetchLatestBaileysVersion();
            console.log(`   • WA Version: ${version.join('.')}`);

            const sessionDir = path.join(process.cwd(), 'sessions');
            const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

            const sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ['Megan-Prime', 'Chrome', '120.0.0.0'],
                printQRInTerminal: false,
                syncFullHistory: false,
                markOnlineOnConnect: true,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                generateHighQualityLinkPreview: false,
                defaultQueryTimeoutMs: 60000,
                retryRequestDelayMs: 500,
                maxMsgRetryCount: 5,
                shouldSyncHistoryMessage: false,
                getMessage: async (key) => {
                    const cached = this.cache.get(key.id);
                    return cached?.message || undefined;
                }
            });

            this.sock = sock;
            // Start dashboard server
            const http = require('http');
            const dashboardServer = http.createServer();
            const Dashboard = require('./megan/lib/dashboard');
            this.dashboard = new Dashboard(this);
            
            dashboardServer.listen(3000, () => {
                console.log('📊 Dashboard: http://localhost:3000');
            });
            this.dashboard.init(dashboardServer);

            this.ownerJid = sock.user?.id;
            this.ownerLid = sock.user?.lid;

            this.buttons = new Buttons(sock, this);
            this.statusHandler = new StatusHandler(this);
            this.eventHandler = new EventHandler(this, this.logger, this.cache, null);

            sock.ev.on('creds.update', () => { saveCreds(); });

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'open') {
                    console.log(`   ✅ Connected!`);
                    console.log(`   📱 Owner JID: ${this.ownerJid}`);
                    if (this.ownerLid) console.log(`   📱 Owner LID: ${this.ownerLid}`);

                    if (this.eventHandler && this.eventHandler.initOwnerManager) {
                        await this.eventHandler.initOwnerManager(this.db, this.ownerJid, this.ownerLid);
                    }

                    if (this.eventHandler && this.eventHandler.initLidStore) {
                        await this.eventHandler.initLidStore();
                    }

                    if (this.lidResolver) {
                        this.lidResolver.setOwnerJids(this.ownerJid, this.ownerLid);
                    }

                    setTimeout(() => this.sendStartupMessage(), 2000);
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error instanceof Boom
                        ? lastDisconnect.error.output?.statusCode : 500;
                    if (statusCode === DisconnectReason.loggedOut) {
                        console.error('❌ Session expired! Please get a new session.');
                        process.exit(1);
                    }
                    setTimeout(() => this.connect(), 5000);
                }
            });

            // ========== MAIN MESSAGE HANDLER ==========
            sock.ev.on('messages.upsert', async ({ messages }) => {
                for (const msg of messages) {
                    await this.processMessage(msg);
                }
            });

            sock.ev.on('messages.update', async (updates) => {
                for (const update of updates) {
                    await handleViewOnce(this.sock, update, this.db, this.ownerJid);
                }
                for (const update of updates) {
                    await this.eventHandler?.handleMessageUpdate(update);
                }
            });

            sock.ev.on('messages.delete', async (deleteData) => {
                const keys = deleteData.keys || deleteData;
                if (!keys || !Array.isArray(keys)) return;
                for (const key of keys) {
                    await this.eventHandler?.handleMessageDelete(key);
                }
            });

            sock.ev.on('group-participants.update', (update) => {
                this.eventHandler?.handleGroupUpdate(update);
            });

            sock.ev.on('call', async (calls) => {
                const antiCall = await this.db?.getSetting('anticall', 'off');
                if (antiCall !== 'off' && this.eventHandler) {
                    await this.eventHandler.handleAntiCall(calls);
                }
            });

        } catch (error) {
            console.error(`   ❌ Connection error: ${error.message}`);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async processMessage(msg) {
        try {
            const from = msg.key.remoteJid;
            const isGroup = isJidGroup(from);
            const isStatus = from === 'status@broadcast';
            const text = MessageHelper.extractText(msg.message);

            let sender;
            if (msg.key.fromMe) {
                sender = this.sock.user?.id || this.ownerJid;
            } else {
                sender = msg.key.participant || from;
            }

            // Anti-delete detection
            if (msg.message?.protocolMessage?.type === 0) {
                const deletedId = msg.message.protocolMessage.key.id;
                const deletedMsg = await this.messageStore?.getMessage(from, deletedId);
                if (deletedMsg && this.eventHandler) {
                    const deleter = msg.key.participant || from;
                    const originalSender = deletedMsg.key?.participant || deletedMsg.key?.remoteJid;
                    await this.eventHandler.handleAntiDelete(deletedMsg, msg.key, deleter, originalSender);
                }
                return;
            }

            // STATUS MESSAGES - Store before processing for anti-delete
            if (isStatus) {
                // Store in message store FIRST for anti-delete recovery
                if (this.messageStore) {
                    await this.messageStore.addMessage(msg);
                    if (!msg.key.fromMe) {
                        await this.messageStore.storeOriginalMessage(msg);
                    }
                }
                if (this.statusHandler) {
                    await this.statusHandler.handleStatus(msg);
                }
                return;
            }

            // Store message
            if (this.messageStore) {
                await this.messageStore.addMessage(msg);
                if (!msg.key.fromMe) {
                    await this.messageStore.storeOriginalMessage(msg);
                }
            }

            // Auto view-once detection
            await handleViewOnce(this.sock, msg, this.db, this.ownerJid);

            // Anti-link
            if (isGroup && text) {
                await handleAntiLink(this.sock, msg, this.db);
            }

            // Auto-read
            const autoReadEnabled = await this.db?.getSetting('autoread', 'off');
            if (autoReadEnabled === 'on' && !isStatus && this.eventHandler) {
                await this.eventHandler.autoRead(msg).catch(() => {});
            }

            // Auto-react
            const autoReactEnabled = await this.db?.getSetting('autoreact', 'off');
            if (autoReactEnabled === 'on' && !isStatus && this.autoReact) {
                setTimeout(() => {
                    this.autoReact.autoReact(msg).catch(() => {});
                }, 500);
            }

            // ========== AUTOPILOT CHECK ==========
            // AutoPilot takes priority over chatbot for DMs when away mode is ON
            const awayModeActive = await this.db.getSetting('awaymode', 'off');
            const ownerPhone = this.config.OWNER_NUMBER.replace(/\D/g, '');
            const fromPhone = from.split('@')[0].split(':')[0].replace(/\D/g, '');
            const isOwnerDM = fromPhone === ownerPhone;

            if (awayModeActive === 'on' && !isGroup && !isOwnerDM && !isStatus && !msg.key.fromMe) {
                console.log('🟣 [AUTOPILOT] Away mode active - processing with AutoPilot...');
                
                // Build metadata for AutoPilot
                const metadata = {
                    textContent: text,
                    messageType: MessageHelper.getMessageType(msg.message),
                    hasLink: false,
                    links: [],
                    hasCode: false,
                    codeLanguage: null,
                    mediaCaption: null,
                    mediaUrl: null,
                    mediaBackupUrl: null,
                    isViewOnce: false,
                    isReply: false,
                    repliedTo: null,
                    isGroup: isGroup
                };

                // Extract links
                if (text) {
                    const linkRegex = /(https?:\/\/[^\s]+)/g;
                    const links = text.match(linkRegex) || [];
                    metadata.hasLink = links.length > 0;
                    metadata.links = links;
                }

                // Extract media info
                if (msg.message?.imageMessage) {
                    metadata.mediaCaption = msg.message.imageMessage.caption || '';
                    metadata.isViewOnce = !!msg.message.imageMessage.viewOnce;
                } else if (msg.message?.videoMessage) {
                    metadata.mediaCaption = msg.message.videoMessage.caption || '';
                    metadata.isViewOnce = !!msg.message.videoMessage.viewOnce;
                }

                // Check for reply
                const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
                if (contextInfo?.stanzaId) {
                    metadata.isReply = true;
                    metadata.repliedTo = contextInfo.stanzaId;
                }

                await this.sock.sendPresenceUpdate('composing', from);
                const autoPilotResponse = await this.autoPilot.processMessage(msg, from, sender, metadata);
                
                if (autoPilotResponse) {
                    await this.sock.sendMessage(from, { text: autoPilotResponse }, { quoted: msg });
                }
                
                // Still process commands even in away mode
                if (text && MessageHelper.isCommand(text, config.PREFIX)) {
                    if (this.eventHandler) {
                        await this.eventHandler.handleCommand(msg, text, from, sender, isGroup);
                    }
                }
                return;
            }

            // Chatbot with memory (only if AutoPilot didn't handle it)
            if (text && !msg.key.fromMe && !isStatus) {
                await this.handleChatbot(msg, text, from, sender, isGroup);
            }

            // Commands
            if (text && MessageHelper.isCommand(text, config.PREFIX)) {
                if (this.eventHandler) {
                    await this.eventHandler.handleCommand(msg, text, from, sender, isGroup);
                }
            }

        } catch (error) {
            console.error(`Message error: ${error.message}`);
        }
    }

    async handleChatbot(msg, text, from, sender, isGroup) {
        try {
            const chatbotEnabled = await this.db.getSetting('chatbot', 'off');
            if (chatbotEnabled === 'off') return false;

            if (MessageHelper.isCommand(text, config.PREFIX)) return false;

            let shouldRespond = false;
            if (chatbotEnabled === 'both') shouldRespond = true;
            else if (chatbotEnabled === 'dm' && !isGroup) shouldRespond = true;
            else if (chatbotEnabled === 'group' && isGroup) shouldRespond = true;

            if (!shouldRespond) return false;

            await this.sock.sendPresenceUpdate('composing', from);
            const aiResponse = await this.getAIResponse(from, sender, text);
            await this.sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
            return true;

        } catch (error) {
            console.error('Chatbot error:', error);
            return false;
        }
    }

    async sendStartupMessage() {
        try {
            if (!this.sock) return;
            const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
            const currentTime = await timeUtils.getCurrentTimeString(this.db);
            const awayMode = await this.db.getSetting('awaymode', 'off');
            const memoryStats = this.memory.getGlobalStats();
            const message = `✅ *${config.BOT_NAME} CONNECTED*\n\n` +
                           `🕐 *Time:* ${currentTime}\n` +
                           `👤 *Owner:* ${config.OWNER_NAME}\n` +
                           `📞 *Number:* ${config.OWNER_NUMBER}\n` +
                           `🔧 *Prefix:* ${config.PREFIX}\n` +
                           `📚 *Commands:* ${this.commands.size}\n` +
                           `🟣 *AutoPilot:* ${awayMode === 'on' ? 'ACTIVE' : 'OFF'}\n` +
                           `🧠 *AI Memory:* ${memoryStats.activeChats} chats\n\n` +
                           `> Megan-Prime | TrackerWanga`;
            await this.sock.sendMessage(ownerJid, { text: message });
        } catch (error) {}
    }

    async cleanup() {
        console.log('\n🛑 [SHUTDOWN] Cleaning up...');
        if (this.taskScheduler) { this.taskScheduler.stop(); }
        if (this.autoPilot) { await this.autoPilot.cleanup(); }
        if (this.db) await this.db.save();
        if (this.sock) await this.sock.end();
        console.log('👋 Megan-Prime shut down successfully\n');
        process.exit(0);
    }
}

const bot = new MeganPrime();

process.on('SIGINT', () => bot.cleanup());
process.on('SIGTERM', () => bot.cleanup());

bot.initialize().catch(error => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
