// Megan-Prime Live Dashboard - Real API Monitoring
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';

class Dashboard {
    constructor(bot) {
        this.bot = bot;
        this.io = null;
        this.logs = [];
        this.maxLogs = 200;
        this.apiData = {
            youtube: null,
            crypto: null,
            weather: null,
            news: null,
            forex: null,
            trending: null,
            ephoto: null
        };
        this.health = {
            startTime: Date.now(),
            commands: 0,
            errors: 0,
            messages: 0,
            throttled: 0,
            lastActivity: Date.now(),
            apiCalls: 0,
            apiFails: 0
        };
        this.rotationIndex = 0;
        this.apiEndpoints = [
            { name: 'YouTube Trending', fn: () => this.fetchYouTube() },
            { name: 'Crypto Prices', fn: () => this.fetchCrypto() },
            { name: 'Weather Nairobi', fn: () => this.fetchWeather() },
            { name: 'Global News', fn: () => this.fetchNews() },
            { name: 'Forex Rates', fn: () => this.fetchForex() },
            { name: 'Spotify Trending', fn: () => this.fetchSpotify() },
            { name: 'SoundCloud', fn: () => this.fetchSoundCloud() },
            { name: 'Ephoto Effect', fn: () => this.fetchEphoto() },
            { name: 'Sports Live', fn: () => this.fetchSports() },
            { name: 'Kenya News', fn: () => this.fetchKenyaNews() },
            { name: 'Anime Trending', fn: () => this.fetchAnime() },
            { name: 'Movie Trending', fn: () => this.fetchMovies() }
        ];
    }

    async fetchYouTube() {
        const res = await axios.get(`${API_BASE}/api/youtube/trending`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data?.items?.slice(0, 3) || [];
    }

    async fetchCrypto() {
        const res = await axios.get(`${API_BASE}/api/crypto/all`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data?.coins?.slice(0, 5) || [];
    }

    async fetchWeather() {
        const res = await axios.get(`${API_BASE}/api/tools/weather`, { params: { city: 'Nairobi', apikey: API_KEY }, timeout: 15000 });
        return res.data?.result || {};
    }

    async fetchNews() {
        const res = await axios.get(`${API_BASE}/api/news/global`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data?.articles?.slice(0, 3) || [];
    }

    async fetchForex() {
        const res = await axios.get(`${API_BASE}/api/forex/rates`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data?.result || {};
    }

    async fetchSpotify() {
        const res = await axios.get(`${API_BASE}/api/spotify/info/search`, { params: { q: 'top hits', type: 'track', limit: 3, apikey: API_KEY }, timeout: 15000 });
        return res.data?.results || [];
    }

    async fetchSoundCloud() {
        const res = await axios.get(`${API_BASE}/api/soundcloud/search`, { params: { q: 'trending', limit: 3, apikey: API_KEY }, timeout: 15000 });
        return res.data?.results || [];
    }

    async fetchEphoto() {
        try {
            const res = await axios.get(`${API_BASE}/api/ephoto/galaxystyle`, { params: { text: 'MEGAN', apikey: API_KEY }, responseType: 'arraybuffer', timeout: 30000 });
            return { success: true, size: res.data.length };
        } catch(e) { return { success: false }; }
    }

    async fetchSports() {
        const res = await axios.get(`${API_BASE}/api/sports/live`, { params: { sport: 'soccer', apikey: API_KEY }, timeout: 15000 });
        return res.data?.result || [];
    }

    async fetchKenyaNews() {
        const res = await axios.get(`${API_BASE}/api/news/kenya`, { params: { apikey: API_KEY }, timeout: 15000 });
        return res.data?.articles?.slice(0, 3) || [];
    }

    async fetchAnime() {
        const res = await axios.get(`${API_BASE}/api/anime/trending`, { params: { limit: 3, apikey: API_KEY }, timeout: 15000 });
        return res.data?.results || [];
    }

    async fetchMovies() {
        const res = await axios.get('https://movies.megan.qzz.io/api/homepage/trending', { timeout: 15000 });
        return res.data?.trending?.slice(0, 3) || [];
    }

    async rotateApiCheck() {
        const endpoint = this.apiEndpoints[this.rotationIndex % this.apiEndpoints.length];
        try {
            this.health.apiCalls++;
            const data = await endpoint.fn();
            this.apiData[endpoint.name.toLowerCase().replace(/ /g, '')] = {
                name: endpoint.name,
                data: data,
                time: Date.now(),
                status: 'success'
            };
            this.addLog('api', `✅ ${endpoint.name}: OK`);
        } catch(e) {
            this.health.apiFails++;
            this.addLog('error', `❌ ${endpoint.name}: ${e.message.substring(0, 50)}`);
        }
        this.rotationIndex++;

        if (this.io) {
            this.io.emit('apiUpdate', {
                endpoint: endpoint.name,
                data: this.apiData[endpoint.name.toLowerCase().replace(/ /g, '')],
                health: this.getHealth()
            });
        }
    }

    getHealth() {
        const uptime = Math.floor((Date.now() - this.health.startTime) / 1000);
        const mem = process.memoryUsage();
        return {
            uptime,
            memory: { mb: Math.round(mem.heapUsed / 1024 / 1024), total: Math.round(mem.heapTotal / 1024 / 1024) },
            commands: this.health.commands,
            errors: this.health.errors,
            messages: this.health.messages,
            apiCalls: this.health.apiCalls,
            apiFails: this.health.apiFails,
            apiSuccessRate: this.health.apiCalls > 0 ? Math.round((1 - this.health.apiFails / this.health.apiCalls) * 100) : 100,
            lastActivity: this.health.lastActivity,
            idle: Math.floor((Date.now() - this.health.lastActivity) / 1000),
            nodeVersion: process.version,
            platform: process.platform,
            commandsLoaded: this.bot?.commands?.size || 0,
            isConnected: !!this.bot?.sock?.user,
            prefix: this.bot?.config?.PREFIX || '.',
            botName: this.bot?.config?.BOT_NAME || 'Megan-Prime',
            time: moment().tz('Africa/Nairobi').format('HH:mm:ss')
        };
    }

    getStats() {
        return this.getHealth();
    }

    addLog(level, message, data = {}) {
        const entry = {
            time: Date.now(),
            timeStr: moment().tz('Africa/Nairobi').format('HH:mm:ss'),
            level,
            message,
            ...data
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) this.logs.shift();

        if (level === 'cmd') this.health.commands++;
        if (level === 'error') this.health.errors++;
        if (level === 'msg') this.health.messages++;
        this.health.lastActivity = Date.now();

        if (this.io) {
            this.io.emit('log', entry);
            this.io.emit('health', this.getHealth());
        }
    }

    async init(httpServer) {
        const { Server } = require('socket.io');
        this.io = new Server(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
            pingInterval: 10000,
            pingTimeout: 5000
        });

        const dashboardHtml = path.join(__dirname, '../dashboard.html');

        httpServer.on('request', (req, res) => {
            if (req.url === '/' || req.url === '/dashboard') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(dashboardHtml).pipe(res);
            } else if (req.url === '/api/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, health: this.getHealth(), logs: this.logs.slice(-50), apiData: this.apiData }));
            }
        });

        this.io.on('connection', (socket) => {
            console.log('📊 Dashboard client connected');
            socket.emit('health', this.getHealth());
            socket.emit('logs', this.logs.slice(-50));
            socket.emit('apiData', this.apiData);

            socket.on('getHealth', () => socket.emit('health', this.getHealth()));
            socket.on('getLogs', () => socket.emit('logs', this.logs.slice(-100)));

            socket.on('disconnect', () => {
                console.log('📊 Dashboard client disconnected');
            });
        });

        // Rotate API checks every 2 minutes
        this.rotateApiCheck();
        setInterval(() => this.rotateApiCheck(), 120000);

        // Health broadcast every 5 seconds
        setInterval(() => {
            if (this.io) this.io.emit('health', this.getHealth());
        }, 5000);

        // Log rotation every 30 seconds
        setInterval(() => {
            if (this.io) this.io.emit('logs', this.logs.slice(-20));
        }, 30000);

        console.log('📊 Live Dashboard: http://localhost:3000');
        console.log('🔄 API rotation: checking 1 endpoint every 2 minutes (12 total)');
        return this;
    }
}

module.exports = Dashboard;
