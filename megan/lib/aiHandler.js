// Megan-Prime AI Handler - Using Megan APIs v3.6.4
const axios = require('axios');

class AIHandler {
    constructor(bot) {
        this.bot = bot;
        this.apiBase = "https://apis.megan.qzz.io";
        this.apiKey = "megan_admin_master";
        this.defaultBibleVersion = 'ESV';
        this.timeout = 30000;
    }

    async apiGet(endpoint, params = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const res = await axios.get(url, { params: { ...params, apikey: this.apiKey }, timeout: this.timeout });
        return res.data;
    }

    async apiPost(endpoint, data = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const res = await axios.post(url, data, { params: { apikey: this.apiKey }, timeout: this.timeout, headers: { 'Content-Type': 'application/json' } });
        return res.data;
    }

    // Generic AI chat (uses Megan API endpoints)
    async callAI(endpoint, prompt) {
        try {
            const data = await this.apiGet(endpoint, { q: prompt });
            if (data.status && data.result) return data.result;
            return null;
        } catch (e) { return null; }
    }

    // Megan AI (Cloudflare Worker fallback)
    async meganAI(message) {
        try {
            const res = await axios.post('https://late-salad-9d56.youngwanga254.workers.dev', {
                prompt: message,
                model: '@cf/meta/llama-3.1-8b-instruct'
            }, { headers: { 'Content-Type': 'application/json' }, timeout: this.timeout });
            const result = res.data?.data?.response || res.data?.response;
            if (result) return result;
        } catch (e) {}
        return await this.callAI('/api/ai/gpt', message);
    }

    // Bible AI - Using Megan API
    async bibleAI(question, translation = null) {
        try {
            const version = translation || this.defaultBibleVersion;
            const data = await this.apiGet('/api/bible/ai', { q: question, translation: version });
            if (data.success && data.result) {
                return { answer: data.result, version: version };
            }
            return { answer: "I couldn't find an answer to that question.", version: version };
        } catch (error) {
            return { answer: "I'm having trouble connecting. Please try again.", version: translation || this.defaultBibleVersion };
        }
    }

    getBibleVersions() { return ['ESV', 'KJV', 'NASB20', 'ASV14', 'LSG', 'LUT', 'IRV', 'RVR09']; }
    setBibleVersion(v) { if (this.getBibleVersions().includes(v)) { this.defaultBibleVersion = v; return true; } return false; }

    // All Chat Models via Megan API
    async gptAI(prompt) { return await this.callAI('/api/ai/gpt', prompt) || 'GPT is thinking...'; }
    async claudeAI(prompt) { return await this.callAI('/api/ai/claude', prompt) || 'Claude is thinking...'; }
    async mistralAI(prompt) { return await this.callAI('/api/ai/mistral', prompt) || 'Mistral is thinking...'; }
    async geminiAI(prompt) { return await this.callAI('/api/ai/gemini', prompt) || 'Gemini is thinking...'; }
    async deepseekAI(prompt) { return await this.callAI('/api/ai/deepseek', prompt) || 'DeepSeek is thinking...'; }
    async veniceAI(prompt) { return await this.callAI('/api/ai/venice', prompt) || 'Venice is thinking...'; }
    async groqAI(prompt) { return await this.callAI('/api/ai/groq', prompt) || 'Groq is thinking...'; }
    async cohereAI(prompt) { return await this.callAI('/api/ai/cohere', prompt) || 'Cohere is thinking...'; }
    async llamaAI(prompt) { return await this.callAI('/api/ai/llama', prompt) || 'LLaMA is thinking...'; }
    async mixtralAI(prompt) { return await this.callAI('/api/ai/mixtral', prompt) || 'Mixtral is thinking...'; }
    async phiAI(prompt) { return await this.callAI('/api/ai/phi', prompt) || 'Phi is thinking...'; }
    async qwenAI(prompt) { return await this.callAI('/api/ai/qwen', prompt) || 'Qwen is thinking...'; }
    async falconAI(prompt) { return await this.callAI('/api/ai/falcon', prompt) || 'Falcon is thinking...'; }
    async vicunaAI(prompt) { return await this.callAI('/api/ai/vicuna', prompt) || 'Vicuna is thinking...'; }
    async openchatAI(prompt) { return await this.callAI('/api/ai/openchat', prompt) || 'OpenChat is thinking...'; }
    async wizardAI(prompt) { return await this.callAI('/api/ai/wizard', prompt) || 'WizardLM is thinking...'; }
    async zephyrAI(prompt) { return await this.callAI('/api/ai/zephyr', prompt) || 'Zephyr is thinking...'; }
    async codeLlamaAI(prompt) { return await this.callAI('/api/ai/codellama', prompt) || 'CodeLlama is thinking...'; }
    async starcoderAI(prompt) { return await this.callAI('/api/ai/starcoder', prompt) || 'StarCoder is thinking...'; }
    async dolphinAI(prompt) { return await this.callAI('/api/ai/dolphin', prompt) || 'Dolphin is thinking...'; }
    async nousAI(prompt) { return await this.callAI('/api/ai/nous', prompt) || 'Nous is thinking...'; }
    async openHermesAI(prompt) { return await this.callAI('/api/ai/openhermes', prompt) || 'OpenHermes is thinking...'; }
    async neuralAI(prompt) { return await this.callAI('/api/ai/neural', prompt) || 'NeuralChat is thinking...'; }
    async solarAI(prompt) { return await this.callAI('/api/ai/solar', prompt) || 'Solar is thinking...'; }
    async yiAI(prompt) { return await this.callAI('/api/ai/yi', prompt) || 'Yi is thinking...'; }
    async tinyLlamaAI(prompt) { return await this.callAI('/api/ai/tinyllama', prompt) || 'TinyLlama is thinking...'; }
    async orcaAI(prompt) { return await this.callAI('/api/ai/orca', prompt) || 'Orca is thinking...'; }
    async commandAI(prompt) { return await this.callAI('/api/ai/command', prompt) || 'Command R is thinking...'; }
    async nemotronAI(prompt) { return await this.callAI('/api/ai/nemotron', prompt) || 'Nemotron is thinking...'; }
    async internlmAI(prompt) { return await this.callAI('/api/ai/internlm', prompt) || 'InternLM is thinking...'; }
    async chatGLM(prompt) { return await this.callAI('/api/ai/chatglm', prompt) || 'ChatGLM is thinking...'; }
    async wormGPT(prompt) { return await this.callAI('/api/ai/wormgpt', prompt) || 'WormGPT is thinking...'; }
    async replitAI(prompt) { return await this.callAI('/api/ai/replit', prompt) || 'Replit AI is thinking...'; }

    // AI Tools
    async translate(text, from = 'auto', to = 'en') {
        try {
            const data = await this.apiPost('/api/ai/translate', { text, from, to });
            if (data.success) return data.translated;
            return null;
        } catch (e) { return null; }
    }

    async summarize(text) {
        try {
            const data = await this.apiPost('/api/ai/summarize', { text });
            if (data.success) return data.summary;
            return null;
        } catch (e) { return null; }
    }

    async code(prompt, language = null) {
        try {
            const data = await this.apiPost('/api/ai/code', { prompt, language });
            if (data.success) return data.code;
            return null;
        } catch (e) { return null; }
    }

    async scanner(text) {
        try {
            const data = await this.apiPost('/api/ai/scanner', { text });
            if (data.success) return data.analysis;
            return null;
        } catch (e) { return null; }
    }

    async humanizer(text) {
        try {
            const data = await this.apiPost('/api/ai/humanizer', { text });
            if (data.success) return data.humanized;
            return null;
        } catch (e) { return null; }
    }

    // Image endpoints
    async generateImage(prompt) {
        try {
            const data = await this.apiPost('/api/ai/image/dall-e', { prompt });
            if (data.success) return data.url;
            return null;
        } catch (e) { return null; }
    }

    async searchImage(query) {
        try {
            const data = await this.apiGet('/api/ai/image/pixabay', { q: query });
            if (data.success) return data.featured || (data.images?.[0]?.url);
            return null;
        } catch (e) { return null; }
    }

    async randomImage() {
        try {
            const data = await this.apiGet('/api/ai/image/lorem-picsum');
            if (data.success) return data.image?.url;
            return null;
        } catch (e) { return null; }
    }

    async dogImage() {
        try {
            const data = await this.apiGet('/api/ai/image/dog');
            if (data.success) return data.image;
            return null;
        } catch (e) { return null; }
    }

    async catImage() {
        try {
            const data = await this.apiGet('/api/ai/image/cat');
            if (data.success) return data.image;
            return null;
        } catch (e) { return null; }
    }

    // Legacy compatibility
    async gitaAI(question) {
        return "Gita AI is now available via Megan API. Please use .megan or .gpt for questions.";
    }
    async geminiLiteAI(message) { return await this.geminiAI(message); }
    async duckAI(message) { return await this.gptAI(message); }
    getDuckAIModels() { return ['gpt-4o-mini']; }
    async teacherAI(question, subject) {
        const prompt = subject ? `[Subject: ${subject}] ${question}` : question;
        return await this.mistralAI(prompt);
    }
    async codeAssistant(prompt, language) { return await this.code(prompt, language); }
}

module.exports = AIHandler;
