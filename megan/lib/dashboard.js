const fs = require('fs');
const path = require('path');
const axios = require('axios');

class Dashboard {
    constructor(bot) {
        this.bot = bot;
        this.io = null;
        this.stats = {
            commands: 0,
            errors: 0,
            startTime: Date.now(),
            apiStatus: 'unknown'
        };
    }

    getStats() {
        const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const mem = process.memoryUsage();
        return {
            status: this.bot?.sock?.user ? 'connected' : 'disconnected',
            commands: this.stats.commands,
            errors: this.stats.errors,
            uptime: uptime,
            memory: { mb: Math.round(mem.heapUsed / 1024 / 1024) },
            commandsLoaded: this.bot?.commands?.size || 0,
            prefix: this.bot?.config?.PREFIX || '.',
            botName: this.bot?.config?.BOT_NAME || 'Megan-Prime',
            ownerName: this.bot?.config?.OWNER_NAME || 'TrackerWanga',
            apiStatus: this.stats.apiStatus,
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    async checkApiStatus() {
        try {
            const res = await axios.get('https://apis.megan.qzz.io/api/status', {
                params: { apikey: 'megan_admin_master' },
                timeout: 10000
            });
            this.stats.apiStatus = res.data?.success ? 'online' : 'degraded';
            if (this.io) this.io.emit('apiStatus', { status: this.stats.apiStatus, data: res.data });
        } catch (e) {
            this.stats.apiStatus = 'offline';
            if (this.io) this.io.emit('apiStatus', { status: 'offline' });
        }
    }

    async init(httpServer) {
        const { Server } = require('socket.io');
        this.io = new Server(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });

        const dashboardHtml = path.join(__dirname, '../dashboard.html');
        
        httpServer.on('request', (req, res) => {
            if (req.url === '/' || req.url === '/dashboard') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(dashboardHtml).pipe(res);
            } else if (req.url === '/api/stats') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: this.getStats() }));
            }
        });

        this.io.on('connection', (socket) => {
            console.log('📊 Dashboard connected');
            socket.emit('stats', this.getStats());

            socket.on('getStats', () => {
                socket.emit('stats', this.getStats());
            });
            socket.on('checkApi', async () => {
                await this.checkApiStatus();
            });
            socket.on('disconnect', () => {
                console.log('📊 Dashboard disconnected');
            });
        });

        // Periodic API check
        this.checkApiStatus();
        setInterval(() => this.checkApiStatus(), 60000);
        
        // Periodic stats broadcast
        setInterval(() => {
            if (this.io) this.io.emit('stats', this.getStats());
        }, 10000);

        console.log('📊 Dashboard ready on port 3000');
        return this;
    }

    addLog(level, message) {
        this.stats.commands++;
        if (level === 'error') this.stats.errors++;
        if (this.io) this.io.emit('stats', this.getStats());
    }
}

module.exports = Dashboard;
