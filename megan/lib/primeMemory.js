// Megan-Prime AI Memory Manager - Per-Contact Memory System
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

class PrimeMemory {
    constructor() {
        this.db = null;
        this.dbPath = path.join(process.cwd(), 'ai_memories', 'prime_memory.db');
        this.retentionDays = config.AI_MEMORY.RETENTION_DAYS || 7;
        this.maxMessages = config.AI_MEMORY.MAX_MESSAGES_PER_CHAT || 50;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return this;
        
        console.log('🧠 [MEMORY] Initializing Prime Memory System...');
        
        try {
            await fs.ensureDir(path.dirname(this.dbPath));
            
            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(this.dbPath, async (err) => {
                    if (err) {
                        console.error('❌ [MEMORY] Connection failed:', err.message);
                        reject(err);
                        return;
                    }
                    
                    await this.createTables();
                    this.initialized = true;
                    console.log('✅ [MEMORY] Prime Memory ready');
                    console.log(`🧠 [MEMORY] Retention: ${this.retentionDays} days, Max: ${this.maxMessages} messages/chat`);
                    
                    // Start cleanup interval
                    setInterval(() => this.cleanup(), 60 * 60 * 1000);
                    
                    resolve(this);
                });
            });
        } catch (error) {
            console.error('❌ [MEMORY] Initialization error:', error.message);
            throw error;
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS chat_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                messageType TEXT DEFAULT 'text',
                hasLink INTEGER DEFAULT 0,
                links TEXT,
                hasCode INTEGER DEFAULT 0,
                codeLanguage TEXT,
                mediaCaption TEXT,
                mediaUrl TEXT,
                isViewOnce INTEGER DEFAULT 0,
                aiSummary TEXT,
                timestamp INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS memory_stats (
                chatId TEXT PRIMARY KEY,
                messageCount INTEGER DEFAULT 0,
                lastActivity INTEGER DEFAULT 0
            )`,
            `CREATE INDEX IF NOT EXISTS idx_memory_chat ON chat_memory(chatId)`,
            `CREATE INDEX IF NOT EXISTS idx_memory_timestamp ON chat_memory(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_memory_role ON chat_memory(role)`
        ];

        for (const sql of tables) {
            await this.run(sql);
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async addMessage(chatId, userId, role, content, metadata = {}) {
        if (!chatId || !userId || !role || !content) return false;

        try {
            const timestamp = Date.now();
            await this.run(
                `INSERT INTO chat_memory 
                (chatId, userId, role, content, messageType, hasLink, links, 
                hasCode, codeLanguage, mediaCaption, mediaUrl, isViewOnce, aiSummary, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    chatId, userId, role, content,
                    metadata.messageType || 'text',
                    metadata.hasLink ? 1 : 0,
                    JSON.stringify(metadata.links || []),
                    metadata.hasCode ? 1 : 0,
                    metadata.codeLanguage || null,
                    metadata.mediaCaption || null,
                    metadata.mediaUrl || null,
                    metadata.isViewOnce ? 1 : 0,
                    metadata.aiSummary || null,
                    timestamp
                ]
            );

            await this.updateStats(chatId);
            await this.trimChat(chatId);
            
            console.log(`🧠 [MEMORY] Added ${role} message for ${chatId} (${metadata.messageType || 'text'})`);
            return true;
        } catch (error) {
            console.error('❌ [MEMORY] Add message error:', error.message);
            return false;
        }
    }

    async getHistory(chatId, limit = 15) {
        try {
            const rows = await this.all(
                `SELECT role, content, messageType, hasLink, links, hasCode, 
                codeLanguage, mediaCaption, isViewOnce, aiSummary, timestamp
                FROM chat_memory WHERE chatId = ? 
                ORDER BY timestamp ASC LIMIT ?`,
                [chatId, limit]
            );
            
            console.log(`🧠 [MEMORY] Retrieved ${rows.length} messages for ${chatId}`);
            return rows.map(row => ({
                ...row,
                links: JSON.parse(row.links || '[]'),
                hasLink: !!row.hasLink,
                hasCode: !!row.hasCode,
                isViewOnce: !!row.isViewOnce
            }));
        } catch (error) {
            console.error('❌ [MEMORY] Get history error:', error.message);
            return [];
        }
    }

    async getContextForAI(chatId, currentQuery) {
        const history = await this.getHistory(chatId, 15);
        
        let context = 'CONVERSATION HISTORY:\n\n';
        
        for (const msg of history) {
            let description = '';
            
            switch (msg.messageType) {
                case 'image':
                    description = `[IMAGE${msg.mediaCaption ? `: "${msg.mediaCaption}"` : ''}${msg.aiSummary ? ` | ${msg.aiSummary}` : ''}]`;
                    break;
                case 'video':
                    description = `[VIDEO${msg.mediaCaption ? `: "${msg.mediaCaption}"` : ''}]`;
                    break;
                case 'audio':
                case 'voice_note':
                    description = `[VOICE NOTE]`;
                    break;
                case 'view_once':
                    description = `[VIEW ONCE MEDIA]`;
                    break;
                case 'sticker':
                    description = `[STICKER]`;
                    break;
                default:
                    description = msg.content || '[empty]';
            }
            
            if (msg.hasLink && msg.links.length > 0) {
                description += ` [LINK: ${msg.links[0]}]`;
            }
            if (msg.hasCode) {
                description += ` [CODE: ${msg.codeLanguage || 'unknown'}]`;
            }
            
            context += `${msg.role.toUpperCase()}: ${description}\n`;
        }
        
        context += `\nCURRENT: ${currentQuery}`;
        
        return context;
    }

    async updateStats(chatId) {
        try {
            const row = await this.all(
                `SELECT COUNT(*) as count FROM chat_memory WHERE chatId = ?`,
                [chatId]
            );
            const count = row[0]?.count || 0;
            
            await this.run(
                `INSERT OR REPLACE INTO memory_stats (chatId, messageCount, lastActivity) VALUES (?, ?, ?)`,
                [chatId, count, Date.now()]
            );
        } catch (error) {
            console.error('❌ [MEMORY] Update stats error:', error.message);
        }
    }

    async trimChat(chatId) {
        try {
            const row = await this.all(
                `SELECT COUNT(*) as count FROM chat_memory WHERE chatId = ?`,
                [chatId]
            );
            const count = row[0]?.count || 0;
            
            if (count > this.maxMessages) {
                const excess = count - this.maxMessages;
                await this.run(
                    `DELETE FROM chat_memory WHERE id IN 
                    (SELECT id FROM chat_memory WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?)`,
                    [chatId, excess]
                );
                console.log(`🧹 [MEMORY] Trimmed ${excess} old messages from ${chatId}`);
            }
        } catch (error) {
            console.error('❌ [MEMORY] Trim chat error:', error.message);
        }
    }

    async cleanup() {
        try {
            const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
            await this.run(`DELETE FROM chat_memory WHERE timestamp < ?`, [cutoff]);
            console.log(`🧹 [MEMORY] Cleaned up messages older than ${this.retentionDays} days`);
        } catch (error) {
            console.error('❌ [MEMORY] Cleanup error:', error.message);
        }
    }

    async clearChat(chatId) {
        try {
            await this.run(`DELETE FROM chat_memory WHERE chatId = ?`, [chatId]);
            await this.run(`DELETE FROM memory_stats WHERE chatId = ?`, [chatId]);
            console.log(`🧹 [MEMORY] Cleared all memory for ${chatId}`);
            return true;
        } catch (error) {
            console.error('❌ [MEMORY] Clear chat error:', error.message);
            return false;
        }
    }

    async getStats(chatId) {
        try {
            const row = await this.all(
                `SELECT * FROM memory_stats WHERE chatId = ?`,
                [chatId]
            );
            return row[0] || { messageCount: 0, lastActivity: 0 };
        } catch (error) {
            return { messageCount: 0, lastActivity: 0 };
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('🧠 [MEMORY] Connection closed');
        }
    }
}

module.exports = PrimeMemory;
