// Megan-Prime Auto Cleaner - Aggressive Disk & Memory Management
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class AutoCleaner {
    constructor(bot) {
        this.bot = bot;
        this.maxTempAge = 10 * 60 * 1000; // 10 minutes
        this.maxLogAge = 24 * 60 * 60 * 1000; // 24 hours
        this.maxSessionFiles = 6; // creds.json + 5 signal files
        this.cleanupInterval = 5 * 60 * 1000; // Every 5 minutes
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        // Immediate cleanup on start
        await this.fullCleanup();
        
        // Periodic cleanup every 5 minutes
        this.timer = setInterval(() => this.fullCleanup(), this.cleanupInterval);
        
        // Memory cleanup every 30 seconds
        this.memTimer = setInterval(() => this.cleanMemory(), 30000);
        
        this.initialized = true;
        console.log('🧹 Auto Cleaner initialized (every 5 min)');
    }

    async fullCleanup() {
        let freed = 0;
        freed += await this.cleanTemp();
        freed += await this.cleanSessions();
        freed += await this.cleanDatabases();
        freed += await this.cleanLogs();
        freed += await this.cleanAIMemories();
        freed += await this.cleanMediaStore();
        freed += await this.cleanNPM();
        
        if (freed > 0) {
            console.log(`🧹 Cleaned ${(freed / 1048576).toFixed(1)}MB`);
        }
    }

    async cleanTemp() {
        const tempDir = path.join(process.cwd(), 'temp');
        return this.cleanDir(tempDir, this.maxTempAge);
    }

    async cleanSessions() {
        const sessionsDir = path.join(process.cwd(), 'sessions');
        try {
            if (!await fs.pathExists(sessionsDir)) return 0;
            const files = await fs.readdir(sessionsDir);
            let freed = 0;
            
            // Keep only essential files
            const essential = ['creds.json', 'pre-key-1.json', 'pre-key-2.json', 
                              'sender-key-1.json', 'sender-key-2.json', 'app-state-sync-version.json'];
            
            for (const file of files) {
                const filePath = path.join(sessionsDir, file);
                const stat = await fs.stat(filePath);
                
                // Remove old files not in essential list
                if (!essential.includes(file) && stat.isFile()) {
                    try { freed += stat.size; await fs.unlink(filePath); } catch(e) {}
                }
            }
            return freed;
        } catch(e) { return 0; }
    }

    async cleanDatabases() {
        const dbDir = path.join(process.cwd(), 'database');
        return this.cleanDir(dbDir, this.maxLogAge, ['.sqlite', '.db']);
    }

    async cleanLogs() {
        const logsDir = path.join(process.cwd(), 'logs');
        return this.cleanDir(logsDir, this.maxLogAge);
    }

    async cleanAIMemories() {
        const aiDir = path.join(process.cwd(), 'ai_memories');
        let freed = 0;
        try {
            if (!await fs.pathExists(aiDir)) return 0;
            const files = await fs.readdir(aiDir);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(aiDir, file);
                const stat = await fs.stat(filePath);
                // Remove AI memory files older than 1 hour
                if (now - stat.mtimeMs > 3600000) {
                    try { freed += stat.size; await fs.unlink(filePath); } catch(e) {}
                }
            }
        } catch(e) {}
        return freed;
    }

    async cleanMediaStore() {
        const mediaDir = path.join(process.cwd(), 'media_store');
        return this.cleanDir(mediaDir, this.maxTempAge);
    }

    async cleanNPM() {
        // Clean npm cache
        try {
            execSync('npm cache clean --force 2>/dev/null', { timeout: 10000 });
        } catch(e) {}
        return 0;
    }

    async cleanDir(dirPath, maxAge, extensions = null) {
        let freed = 0;
        try {
            if (!await fs.pathExists(dirPath)) return 0;
            const files = await fs.readdir(dirPath);
            const now = Date.now();
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    const stat = await fs.stat(filePath);
                    if (now - stat.mtimeMs > maxAge) {
                        if (extensions) {
                            if (extensions.some(ext => file.endsWith(ext))) {
                                freed += stat.size;
                                await fs.unlink(filePath);
                            }
                        } else {
                            freed += stat.size;
                            await fs.unlink(filePath);
                        }
                    }
                } catch(e) {}
            }
        } catch(e) {}
        return freed;
    }

    cleanMemory() {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Clear node's internal caches
        if (this.bot?.cache) {
            this.bot.cache.cleanup();
        }
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        if (this.memTimer) clearInterval(this.memTimer);
    }
}

module.exports = AutoCleaner;
