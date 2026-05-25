// Megan-Prime AI Memory Manager - Separate SQLite Database
// Uses sqlite3 directly, no Sequelize complexity
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class AIMemoryDb {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'ai_memory.db');
        this.db = null;
        this.retentionHours = 24;
        this.maxMessages = 20;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return this;
        await fs.ensureDir(path.dirname(this.dbPath));
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('AI Memory DB error:', err);
                    reject(err);
                    return;
                }
                this.createTables();
                this.initialized = true;
                console.log('🗄️  AI Memory database connected');
                resolve(this);
            });
        });
    }

    createTables() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            )
        `);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_chatId ON chat_memory (chatId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON chat_memory (timestamp)`);
        this.db.run(`
            CREATE TABLE IF NOT EXISTS memory_stats (
                chatId TEXT PRIMARY KEY,
                messageCount INTEGER DEFAULT 0,
                storageBytes INTEGER DEFAULT 0,
                lastActivity INTEGER DEFAULT 0
            )
        `);
        console.log('✅ AI Memory tables ready');
    }

    addMessage(chatId, userId, role, content) {
        if (!chatId || !userId || !role || !content) return false;
        const timestamp = Date.now();
        this.db.run(
            `INSERT INTO chat_memory (chatId, userId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [chatId, userId, role, content, timestamp],
            (err) => {
                if (err) {
                    console.error('Add memory error:', err);
                } else {
                    this.updateStats(chatId);
                    this.trimChat(chatId);
                }
            }
        );
        return true;
    }

    getHistory(chatId, limit = 15, callback) {
        this.db.all(
            `SELECT role, content, userId, timestamp FROM chat_memory WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?`,
            [chatId, limit],
            (err, rows) => {
                if (err) {
                    console.error('Get history error:', err);
                    callback([]);
                } else {
                    callback(rows || []);
                }
            }
        );
    }

    async getHistorySync(chatId, limit = 15) {
        return new Promise((resolve) => {
            this.db.all(
                `SELECT role, content, userId, timestamp FROM chat_memory WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?`,
                [chatId, limit],
                (err, rows) => {
                    if (err) {
                        console.error('Get history error:', err);
                        resolve([]);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    clearMemory(chatId, callback) {
        this.db.run(`DELETE FROM chat_memory WHERE chatId = ?`, [chatId], (err) => {
            if (!err) {
                this.updateStats(chatId);
            }
            if (callback) callback(err ? 0 : 1);
        });
    }

    async clearMemorySync(chatId) {
        return new Promise((resolve) => {
            this.db.run(`DELETE FROM chat_memory WHERE chatId = ?`, [chatId], (err) => {
                if (!err) this.updateStats(chatId);
                resolve(!err);
            });
        });
    }

    trimChat(chatId) {
        this.db.get(
            `SELECT COUNT(*) as count FROM chat_memory WHERE chatId = ?`,
            [chatId],
            (err, row) => {
                if (err || !row) return;
                if (row.count > this.maxMessages) {
                    const toDelete = row.count - this.maxMessages;
                    this.db.run(
                        `DELETE FROM chat_memory WHERE chatId = ? AND id IN (SELECT id FROM chat_memory WHERE chatId = ? ORDER BY timestamp ASC LIMIT ?)`,
                        [chatId, chatId, toDelete]
                    );
                }
            }
        );
    }

    updateStats(chatId) {
        this.db.get(
            `SELECT COUNT(*) as count, SUM(LENGTH(content)) as bytes FROM chat_memory WHERE chatId = ?`,
            [chatId],
            (err, row) => {
                if (err) return;
                const count = row?.count || 0;
                const bytes = row?.bytes || 0;
                this.db.run(
                    `INSERT OR REPLACE INTO memory_stats (chatId, messageCount, storageBytes, lastActivity) VALUES (?, ?, ?, ?)`,
                    [chatId, count, bytes, Date.now()]
                );
            }
        );
    }

    async getStats(chatId) {
        return new Promise((resolve) => {
            this.db.get(
                `SELECT messageCount, storageBytes, lastActivity FROM memory_stats WHERE chatId = ?`,
                [chatId],
                (err, row) => {
                    if (err || !row) {
                        resolve({ messageCount: 0, storageBytes: 0, lastActivity: 0 });
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async getGlobalStats() {
        return new Promise((resolve) => {
            this.db.get(
                `SELECT COUNT(DISTINCT chatId) as activeChats, SUM(messageCount) as totalMessages, SUM(storageBytes) as totalBytes FROM memory_stats`,
                (err, row) => {
                    if (err || !row) {
                        resolve({ activeChats: 0, totalMessages: 0, totalMB: '0' });
                    } else {
                        resolve({
                            activeChats: row.activeChats || 0,
                            totalMessages: row.totalMessages || 0,
                            totalMB: ((row.totalBytes || 0) / (1024 * 1024)).toFixed(2)
                        });
                    }
                }
            );
        });
    }

    cleanupOld(callback) {
        const cutoff = Date.now() - (this.retentionHours * 60 * 60 * 1000);
        this.db.run(
            `DELETE FROM chat_memory WHERE timestamp < ?`,
            [cutoff],
            (err) => {
                if (!err) {
                    this.db.all(`SELECT DISTINCT chatId FROM chat_memory`, [], (err, rows) => {
                        if (rows) {
                            rows.forEach(row => this.updateStats(row.chatId));
                        }
                    });
                }
                if (callback) callback();
            }
        );
    }

    startAutoCleanup(intervalHours = 1) {
        setInterval(() => {
            this.cleanupOld();
        }, intervalHours * 60 * 60 * 1000);
        console.log(`🧠 AI Memory auto-cleanup: every ${intervalHours} hour(s)`);
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = AIMemoryDb;
