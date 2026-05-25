// Megan-Prime Task Scheduler - With Personalized Reminders
const axios = require('axios');

class TaskScheduler {
    constructor(bot) {
        this.bot = bot;
        this.db = bot.db;
        this.tasks = new Map();
        this.checkInterval = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        await this.loadTasks();
        this.checkInterval = setInterval(() => this.checkTasks(), 30000);
        this.initialized = true;
        console.log(`📅 [SCHEDULER] Ready - ${this.tasks.size} tasks`);
    }

    async loadTasks() {
        try {
            const tasksJson = await this.db.getSetting('pending_tasks', '[]');
            const tasks = JSON.parse(tasksJson);
            for (const task of tasks) {
                if (!task.executed && task.scheduledTime > Date.now() - 86400000) {
                    this.tasks.set(task.taskId, task);
                }
            }
        } catch (error) {}
    }

    async saveTasks() {
        const tasksArray = Array.from(this.tasks.values());
        await this.db.setSetting('pending_tasks', JSON.stringify(tasksArray));
    }

    async extractTaskFromMessage(text, chatId, userId) {
        try {
            const prompt = `Extract reminder from: "${text}". Return JSON: {"type":"reminder","time":"ISO_TIME","message":"task"} or {"type":"none"}. Return ONLY valid JSON.`;
            const response = await axios.get(
                `https://api.siputzx.my.id/api/ai/gemini?text=${encodeURIComponent(prompt)}&promptSystem=Extract reminders as JSON only.&cookie=Megan-Prime`,
                { timeout: 20000 }
            );
            if (response.data?.data?.response) {
                const jsonStr = response.data.data.response.trim();
                const task = JSON.parse(jsonStr);
                if (task.type === 'reminder' && task.message) {
                    task.chatId = chatId;
                    task.userId = userId;
                    task.created = Date.now();
                    task.taskId = `task_${Date.now()}`;
                    task.executed = false;
                    task.taskType = 'reminder';
                    task.scheduledTime = task.time ? new Date(task.time).getTime() : Date.now() + 3600000;
                    return task;
                }
            }
            return null;
        } catch (error) { return null; }
    }

    async scheduleTask(task) {
        this.tasks.set(task.taskId, task);
        await this.saveTasks();
        const min = Math.round((task.scheduledTime - Date.now()) / 60000);
        console.log(`📅 Scheduled in ${min} min: "${task.message}" for ${task.userName || task.userId}`);
        return { success: true, message: `✅ Reminder set for "${task.message}" in ~${min} minutes.` };
    }

    async checkTasks() {
        const now = Date.now();
        for (const [taskId, task] of this.tasks) {
            if (!task.executed && now >= task.scheduledTime) {
                await this.executeTask(task);
            }
        }
    }

    async executeTask(task) {
        try {
            if (!this.bot.sock) return;
            
            const userName = task.userName || task.userPhone || 'there';
            const text = `⏰ *Hey ${userName}!*\n\n📝 Your reminder: ${task.message}\n\n🕐 Set: ${new Date(task.created).toLocaleString()}\n⏰ Now: ${new Date().toLocaleString()}\n\n> Megan-Prime | TrackerWanga`;
            
            await this.bot.sock.sendMessage(task.chatId, { text });
            task.executed = true;
            await this.saveTasks();
            console.log(`✅ Reminder sent to ${userName}: ${task.message}`);
            
            // Also notify owner
            const ownerJid = this.bot.config.getOwnerJid();
            await this.bot.sock.sendMessage(ownerJid, {
                text: `📅 *Reminder Executed*\n\n👤 *To:* ${userName} (${task.userPhone || task.userId})\n📝 *Task:* "${task.message}"\n⏰ *Executed:* ${new Date().toLocaleString()}\n\n> Megan-Prime | TrackerWanga`
            });
        } catch (error) {
            console.error('❌ [SCHEDULER] Execute error:', error.message);
        }
    }

    stop() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }
}

module.exports = TaskScheduler;
