// Megan-Prime AI Message Store - Per-Contact Memory System
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class AIMessageStore {
    constructor(userJid = null) {
        // Per-contact database
        if (userJid) {
            const phone = userJid.split('@')[0].replace(/[^0-9]/g, '') || 'global';
            this.dbPath = path.join(process.cwd(), 'ai_memories', `memory_${phone}.db`);
        } else {
            this.dbPath = path.join(process.cwd(), 'ai_memories', 'memory_global.db');
        }
        this.db = null;
        this.retentionDays = 7;
        this.maxMessages = 50;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return this;
        await fs.ensureDir(path.dirname(this.dbPath));
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) { console.error('❌ [AISTORE] Connection failed:', err.message); reject(err); return; }
                await this.createTables();
                this.initialized = true;
                console.log(`🧠 [AISTORE] Memory ready: ${path.basename(this.dbPath)}`);
                setInterval(() => this.cleanup(), 60 * 60 * 1000);
                resolve(this);
            });
        });
    }

    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                messageId TEXT,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
                content TEXT,
                messageType TEXT DEFAULT 'text',
                hasLink INTEGER DEFAULT 0,
                links TEXT DEFAULT '[]',
                hasCode INTEGER DEFAULT 0,
                codeLanguage TEXT,
                mediaCaption TEXT,
                mediaUrl TEXT,
                mediaBackupUrl TEXT,
                isViewOnce INTEGER DEFAULT 0,
                isReply INTEGER DEFAULT 0,
                repliedTo TEXT,
                aiSummary TEXT,
                aiIntent TEXT,
                aiEntities TEXT DEFAULT '{}',
                timestamp INTEGER NOT NULL,
                processedByAI INTEGER DEFAULT 0
            )`,
            `CREATE INDEX IF NOT EXISTS idx_msgs_chat ON messages(chatId)`,
            `CREATE INDEX IF NOT EXISTS idx_msgs_time ON messages(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_msgs_role ON messages(role)`
        ];
        for (const sql of queries) {
            await new Promise((resolve, reject) => {
                this.db.run(sql, (err) => { if (err) reject(err); else resolve(); });
            });
        }
        console.log('✅ [AISTORE] Tables ready');
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => { if (err) reject(err); else resolve(); });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows || []); });
        });
    }

    async addMessage(data) {
        const timestamp = Date.now();
        await this.run(
            `INSERT INTO messages (messageId, chatId, userId, role, content, messageType,
            hasLink, links, hasCode, codeLanguage, mediaCaption, mediaUrl, mediaBackupUrl,
            isViewOnce, isReply, repliedTo, aiSummary, aiIntent, aiEntities, timestamp, processedByAI)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                data.messageId || null, data.chatId, data.userId, data.role, data.content || '',
                data.messageType || 'text', data.hasLink ? 1 : 0, JSON.stringify(data.links || []),
                data.hasCode ? 1 : 0, data.codeLanguage || null, data.mediaCaption || null,
                data.mediaUrl || null, data.mediaBackupUrl || null, data.isViewOnce ? 1 : 0,
                data.isReply ? 1 : 0, data.repliedTo || null, data.aiSummary || null,
                data.aiIntent || null, JSON.stringify(data.aiEntities || {}), timestamp,
                data.processedByAI ? 1 : 0
            ]
        );
        // Trim old messages
        const count = await this.all(`SELECT COUNT(*) as c FROM messages WHERE chatId = ?`, [data.chatId]);
        if (count[0]?.c > this.maxMessages) {
            const excess = count[0].c - this.maxMessages;
            await this.run(
                `DELETE FROM messages WHERE id IN (SELECT id FROM messages WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?)`,
                [data.chatId, excess]
            );
        }
    }

    async getContext(chatId, limit = 20) {
        const rows = await this.all(
            `SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?`,
            [chatId, limit]
        );
        return rows.map(r => ({
            ...r,
            links: JSON.parse(r.links || '[]'),
            aiEntities: JSON.parse(r.aiEntities || '{}'),
            hasLink: !!r.hasLink,
            hasCode: !!r.hasCode,
            isViewOnce: !!r.isViewOnce,
            isReply: !!r.isReply
        }));
    }

    async buildAIPrompt(chatId, currentMessage, metadata = {}) {
        const history = await this.getContext(chatId, 20);
        let context = 'CONVERSATION HISTORY:\n\n';
        
        for (const msg of history) {
            let desc = '';
            switch (msg.messageType) {
                case 'image':
                    desc = `[IMAGE${msg.mediaCaption ? `: "${msg.mediaCaption}"` : ''}]`;
                    break;
                case 'video':
                    desc = `[VIDEO${msg.mediaCaption ? `: "${msg.mediaCaption}"` : ''}]`;
                    break;
                case 'voice_note':
                    desc = '[VOICE NOTE]';
                    break;
                case 'sticker':
                    desc = '[STICKER]';
                    break;
                case 'view_once':
                case 'view_once_image':
                case 'view_once_video':
                    desc = '[VIEW ONCE MEDIA]';
                    break;
                case 'document':
                    desc = '[DOCUMENT]';
                    break;
                case 'location':
                    desc = '[LOCATION]';
                    break;
                default:
                    desc = msg.content || '[empty]';
            }
            if (msg.hasLink && msg.links.length > 0) {
                desc += ` [LINK: ${msg.links[0]}]`;
            }
            if (msg.hasCode) {
                desc += ` [CODE: ${msg.codeLanguage || 'unknown'}]`;
            }
            context += `${msg.role.toUpperCase()}: ${desc}\n`;
        }

        // Add current message context
        let currentDesc = currentMessage || '';
        if (metadata.messageType === 'image') {
            currentDesc = `[User sent an IMAGE${metadata.mediaCaption ? `: "${metadata.mediaCaption}"` : ''}]`;
        } else if (metadata.messageType === 'video') {
            currentDesc = `[User sent a VIDEO${metadata.mediaCaption ? `: "${metadata.mediaCaption}"` : ''}]`;
        }
        context += `\nCURRENT: ${currentDesc}`;
        
        return context;
    }

    async cleanup() {
        const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
        await this.run(`DELETE FROM messages WHERE timestamp < ?`, [cutoff]);
    }

    async clearChat(chatId) {
        await this.run(`DELETE FROM messages WHERE chatId = ?`, [chatId]);
    }

    close() {
        if (this.db) { this.db.close(); }
    }
}

module.exports = AIMessageStore;
