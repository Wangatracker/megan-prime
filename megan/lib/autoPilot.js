// Megan-Prime AutoPilot - With Name Detection & Owner Notifications
const axios = require('axios');
const AIMessageStore = require('./aiMessageStore');

class AutoPilot {
    constructor(bot) {
        this.bot = bot;
        this.sock = bot.sock;
        this.db = bot.db;
        this.activeStores = new Map();
        this.commandList = '';
        this.nameCache = new Map();
        console.log('🟣 [AUTOPILOT] Engine initialized');
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
        // Check cache first
        if (this.nameCache.has(sender)) return this.nameCache.get(sender);
        
        let name = sender.split('@')[0];
        
        try {
            // Try push name from message
            if (msg?.pushName) {
                name = msg.pushName;
            }
            // Try contact lookup
            if (this.sock && typeof this.sock.getContact === 'function') {
                const contact = await this.sock.getContact(sender);
                if (contact?.name) name = contact.name;
                else if (contact?.notify) name = contact.notify;
                else if (contact?.verifiedName) name = contact.verifiedName;
            }
        } catch(e) {
            // Use JID number as fallback
        }
        
        this.nameCache.set(sender, name);
        return name;
    }

    async isActive() {
        const awayMode = await this.db.getSetting('awaymode', 'off');
        return awayMode === 'on';
    }

    shouldRespond(from, isGroup) {
        if (isGroup) return false;
        const ownerPhone = this.bot.config.OWNER_NUMBER.replace(/\D/g, '');
        const fromPhone = from.split('@')[0].split(':')[0].replace(/\D/g, '');
        if (fromPhone === ownerPhone) return false;
        return true;
    }

    getCommandsList() {
        if (this.commandList) return this.commandList;
        const commands = [];
        for (const [name, cmd] of this.bot.commands) {
            if (cmd.description) commands.push(`.${name} - ${cmd.description}`);
        }
        this.commandList = commands.slice(0, 20).join('\n');
        return this.commandList;
    }

    getSystemPrompt(senderName) {
        const commands = this.getCommandsList();
        return `You are Megan-Prime, AI assistant for TrackerWanga who is away. 
The person texting you is named "${senderName}". 
Be friendly and use their name naturally. 
Keep responses under 400 characters. 
Available commands:\n${commands}`;
    }

    async processMessage(msg, from, sender, metadata) {
        if (!await this.isActive()) return null;
        if (!this.shouldRespond(from, metadata.isGroup)) return null;

        console.log('🟣 [AUTOPILOT] Processing...');
        
        // Get sender name
        const senderName = await this.getUserName(sender, msg);
        const senderPhone = sender.split('@')[0].split(':')[0];
        console.log(`👤 [AUTOPILOT] Sender: ${senderName} (${senderPhone})`);
        
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

        let response = '';

        if (metadata.messageType === 'image' || metadata.messageType === 'video') {
            response = `Hey ${senderName}! I received your media but I can't analyze images/videos yet. TrackerWanga will see it when he's back! Need anything else?`;
        } else if (metadata.hasLink && metadata.links.length > 0) {
            response = await this.handleLinkMessage(metadata, from, senderName);
        } else if (userContent && userContent.trim() && userContent !== '[Message received]') {
            response = await this.handleTextMessage(from, userContent, metadata, senderName);
        } else {
            response = `Hey ${senderName}! I received your message. TrackerWanga is away. I'm Megan-Prime, his AI assistant. How can I help?`;
        }

        // Check for tasks/reminders
        if (metadata.textContent && 
            (metadata.textContent.toLowerCase().includes('remind') || 
             metadata.textContent.toLowerCase().includes('notify') ||
             metadata.textContent.toLowerCase().includes('tell') && metadata.textContent.toLowerCase().includes('later'))) {
            await this.handleTaskDetection(metadata, from, sender, senderName);
        }

        if (response) {
            response = response.replace(/🟣\s*\*AWAY MODE\*\s*\n*/gi, '');
            response = response.replace(/>\s*Megan-Prime\s*\|\s*TrackerWanga\s*$/gi, '');
            response = response.trim();
            
            const finalResponse = `🟣 *AWAY MODE*\n\n${response}\n\n> Megan-Prime | TrackerWanga`;
            
            await store.addMessage({
                chatId: from, userId: 'assistant', role: 'assistant',
                content: finalResponse, messageType: 'text', timestamp: Date.now(), processedByAI: 1
            });
            
            return finalResponse;
        }

        return null;
    }

    async handleLinkMessage(metadata, from, senderName) {
        const link = metadata.links[0];
        let linkSummary = 'I could not access this link.';
        
        try {
            const response = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const text = typeof response.data === 'string' ? response.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000) : '';
            if (text.length > 50) {
                const summary = await this.callAI(`Summarize in 2 sentences:\n\n${text}`, 'Summarize concisely.');
                if (summary) linkSummary = summary;
            }
        } catch (e) {}

        const prompt = `User ${senderName} sent link: ${link}\nSummary: ${linkSummary}\n\nRespond naturally about this link.`;
        const aiResponse = await this.callAI(prompt, this.getSystemPrompt(senderName));
        return aiResponse || `Hey ${senderName}, I checked your link! ${linkSummary}`;
    }

    async handleTextMessage(from, userContent, metadata, senderName) {
        const prompt = `User "${senderName}" says: ${userContent}\n\nRespond naturally as Megan-Prime. Use their name "${senderName}" naturally. Keep under 400 chars.`;
        
        let aiResponse = await this.callAI(prompt, this.getSystemPrompt(senderName));
        if (!aiResponse) aiResponse = await this.callMistral(prompt, this.getSystemPrompt(senderName));
        
        if (aiResponse && aiResponse.length > 5) {
            console.log('✅ [AUTOPILOT] AI:', aiResponse.substring(0, 80));
            return aiResponse;
        }
        
        return this.getContextualDefault(userContent, senderName);
    }

    getContextualDefault(userText, senderName) {
        if (!userText) return `Hey ${senderName}! How can I help you?`;
        const text = userText.toLowerCase();
        if (text.includes('hi') || text.includes('hello')) {
            return `Hello ${senderName}! 👋 TrackerWanga is away. I'm Megan-Prime, his AI assistant. What can I help with?`;
        }
        if (text.includes('?')) {
            return `${senderName}, good question! Could you try asking differently, or type *.menu* to see commands?`;
        }
        if (text.includes('remind') || text.includes('notify')) {
            return `${senderName}, I've set that reminder for you! ⏰`;
        }
        return `Hey ${senderName}! Got your message. TrackerWanga will see it when he's back. Need anything?`;
    }

    async handleTaskDetection(metadata, from, sender, senderName) {
        try {
            if (!this.bot.sock) return;
            
            const task = await this.bot.taskScheduler?.extractTaskFromMessage(metadata.textContent, from, sender);
            if (task) {
                // Add user's name to task
                task.userName = senderName;
                task.userPhone = sender.split('@')[0].split(':')[0];
                
                const scheduled = await this.bot.taskScheduler.scheduleTask(task);
                if (scheduled.success) {
                    // Send to user
                    await this.bot.sock.sendMessage(from, { 
                        text: `📅 *Reminder Set!*\n\nHey ${senderName}, I'll remind you about: "${task.message}"\n\n⏰ Time: ${new Date(task.scheduledTime).toLocaleString()}\n\n> Megan-Prime | TrackerWanga`
                    });
                    
                    // Send to owner
                    const ownerJid = this.bot.config.getOwnerJid();
                    await this.bot.sock.sendMessage(ownerJid, {
                        text: `📅 *Reminder Set (Away Mode)*\n\n👤 *From:* ${senderName}\n📞 *Phone:* ${sender.split('@')[0].split(':')[0]}\n📝 *Task:* "${task.message}"\n⏰ *Time:* ${new Date(task.scheduledTime).toLocaleString()}\n⏰ *Set at:* ${new Date().toLocaleString()}\n\n> Megan-Prime | TrackerWanga`
                    });
                }
            }
        } catch (error) {
            console.error('❌ [AUTOPILOT] Task error:', error.message);
        }
    }

    async callAI(prompt, systemPrompt) {
        try {
            const url = `https://api.siputzx.my.id/api/ai/gemini?text=${encodeURIComponent(prompt)}&promptSystem=${encodeURIComponent(systemPrompt)}&cookie=Megan-Prime`;
            const response = await axios.get(url, { timeout: 25000 });
            if (response.data?.data?.response) return response.data.data.response;
            if (response.data?.result) return response.data.result;
            return null;
        } catch (error) { return null; }
    }

    async callMistral(prompt, systemPrompt) {
        try {
            const url = `https://api.siputzx.my.id/api/ai/mistral?text=${encodeURIComponent(prompt)}&promptSystem=${encodeURIComponent(systemPrompt)}`;
            const response = await axios.get(url, { timeout: 25000 });
            if (response.data?.data?.response) return response.data.data.response;
            return null;
        } catch (error) { return null; }
    }

    async cleanup() {
        for (const [chatId, store] of this.activeStores) store.close();
        this.activeStores.clear();
    }
}

module.exports = AutoPilot;
