// ╔══════════════════════════════════════════════════╗
// ║   MEGAN-PRIME OWNER COMMANDS                     ║
// ║  Bot Management | Owner Only                     ║
// ╚══════════════════════════════════════════════════╝

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');

const commands = [];
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const FOOTER = '> Megan-Prime | TrackerWanga';
const PKG = require('../../package.json');

async function sendBtn(sock, from, text, quoted) {
    const btns = [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons: btns }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

function formatUptime(s) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}

// ═══════════════════════════════════════════
// 1. RESTART
// ═══════════════════════════════════════════
commands.push({
    name: 'restart', description: 'Restart the bot (Owner Only)',
    aliases: ['reboot', 'reload', 'refresh'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        
        await react('🔄');
        await sock.sendMessage(from, { text: `╭───[ 🔄 RESTART ]───\n│\n│ ⏳ Restarting bot...\n│ 📋 Process will auto-restart\n│\n╰──◇\n${FOOTER}` }, { quoted: msg });
        
        // Cleanup and exit - PM2/screen/systemd will restart
        setTimeout(() => {
            console.log('🔄 Restart command received, exiting...');
            process.exit(0);
        }, 2000);
    }
});

// ═══════════════════════════════════════════
// 2. UPDATE (Git pull + restart)
// ═══════════════════════════════════════════
commands.push({
    name: 'update', description: 'Update bot from GitHub (Owner Only)',
    aliases: ['upgrade', 'gitpull'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }

        await react('⬆️');
        
        // Check if git is available
        try {
            await execAsync('git --version');
        } catch (e) {
            await react('❌');
            return reply(`❌ *Git not installed*\n\nCannot update without git.\n\n${FOOTER}`);
        }

        // Check if this is a git repo
        try {
            const { stdout: remotes } = await execAsync('git remote -v');
            if (!remotes.includes('origin')) throw new Error('No origin remote');
        } catch (e) {
            await react('❌');
            return reply(`❌ *Not a git repository*\n\nPush code to GitHub first:\n\`\`\`\ngit init\ngit remote add origin <url>\ngit push -u origin main\n\`\`\`\n${FOOTER}`);
        }

        await sock.sendMessage(from, { text: `╭───[ ⬆️ UPDATE ]───\n│\n│ 🔄 Stashing local changes...\n│\n╰──◇\n${FOOTER}` }, { quoted: msg });

        try {
            // Stash any local changes
            await execAsync('git stash').catch(() => {});
            
            // Pull latest
            const { stdout: pullOut } = await execAsync('git pull origin main 2>&1 || git pull origin master 2>&1');
            
            // Check if there were actual changes
            if (pullOut.includes('Already up to date') || pullOut.includes('already up to date')) {
                await react('✅');
                return sendBtn(sock, from, `╭───[ ✅ UP TO DATE ]───\n│\n│ 📦 Bot is already latest version\n│ 🔧 No changes needed\n│\n╰──◇\n${FOOTER}`, msg);
            }
            
            // Install any new dependencies
            await sock.sendMessage(from, { text: `╭───[ ⬆️ UPDATE ]───\n│\n│ 📥 Pulled new code\n│ 📦 Installing dependencies...\n│\n╰──◇\n${FOOTER}` }, { quoted: msg });
            
            const { stdout: installOut } = await execAsync('npm install --no-audit --no-fund 2>&1');
            
            // Success - now restart
            await sock.sendMessage(from, { text: `╭───[ ✅ UPDATED ]───\n│\n│ 📥 Code updated\n│ 📦 Dependencies installed\n│ 🔄 Restarting...\n│\n╰──◇\n${FOOTER}` }, { quoted: msg });
            
            console.log('🔄 Update complete, restarting...');
            setTimeout(() => process.exit(0), 2000);
            
        } catch (e) {
            await react('❌');
            console.error('Update error:', e.message);
            return sendBtn(sock, from, `╭───[ ❌ FAILED ]───\n│\n│ ${e.message.substring(0, 200)}\n│\n│ 💡 Try manual update:\n│ \`git pull && npm install\`\n│\n╰──◇\n${FOOTER}`, msg);
        }
    }
});

// ═══════════════════════════════════════════
// 3. VERSION
// ═══════════════════════════════════════════
commands.push({
    name: 'version', description: 'Show bot version info',
    aliases: ['ver', 'botversion'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📌');
        
        let gitHash = 'unknown';
        let gitBranch = 'unknown';
        let lastCommit = 'unknown';
        
        try {
            const { stdout: hash } = await execAsync('git rev-parse --short HEAD');
            gitHash = hash.trim();
        } catch(e) {}
        try {
            const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
            gitBranch = branch.trim();
        } catch(e) {}
        try {
            const { stdout: commit } = await execAsync('git log -1 --format=%cd --date=short');
            lastCommit = commit.trim();
        } catch(e) {}
        
        const uptime = process.uptime();
        const mem = process.memoryUsage();
        const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
        
        const text = `╔══════════════════════╗\n` +
            `║   📌 BOT VERSION    ║\n` +
            `╚══════════════════════╝\n\n` +
            `│ 🤖 *${config.BOT_NAME}*\n` +
            `│ 📦 v${PKG.version}\n` +
            `│ 🔧 Git: \`${gitHash}\`\n` +
            `│ 🌿 Branch: \`${gitBranch}\`\n` +
            `│ 📅 Commit: ${lastCommit}\n` +
            `│\n` +
            `│ ⚡ Node: ${process.version}\n` +
            `│ 💻 Platform: ${process.platform}\n` +
            `│ ⏱️ Uptime: ${formatUptime(uptime)}\n` +
            `│ 💾 RAM: ${usedMB}MB\n` +
            `│ 📚 Commands: ${bot.commands.size}\n` +
            `│ 📡 API: Megan v3.6.4\n` +
            `╰──────────────────◇\n${FOOTER}`;
        
        await sendBtn(sock, from, text, msg);
        await react('✅');
    }
});

// ═══════════════════════════════════════════
// 4. CHECK GIT STATUS
// ═══════════════════════════════════════════
commands.push({
    name: 'gitstatus', description: 'Check git repository status (Owner Only)',
    aliases: ['git', 'gitlog'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        
        await react('🔍');
        try {
            const { stdout: status } = await execAsync('git status --short');
            const { stdout: branch } = await execAsync('git branch --show-current');
            const { stdout: log } = await execAsync('git log --oneline -5');
            
            let text = `╭───[ 🔍 GIT STATUS ]───\n│\n`;
            text += `│ 🌿 Branch: *${branch.trim()}*\n`;
            text += `│\n`;
            if (status.trim()) {
                text += `│ 📝 *Changes:*\n│ ${status.trim().split('\n').join('\n│ ')}\n│\n`;
            } else {
                text += `│ ✅ Working tree clean\n│\n`;
            }
            text += `│ 📋 *Recent commits:*\n│ ${log.trim().split('\n').join('\n│ ')}\n│\n`;
            text += `╰──◇\n${FOOTER}`;
            
            await sendBtn(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Error:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

// ═══════════════════════════════════════════
// 5. RUN SHELL COMMAND
// ═══════════════════════════════════════════
commands.push({
    name: 'shell', description: 'Run shell command (Owner Only)',
    aliases: ['exec', 'cmd', 'bash', '$'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        if (!args.length) { await react('ℹ️'); return reply(`💻 *SHELL*\n\nUsage: ${config.PREFIX}shell <command>\n\n${FOOTER}`); }
        
        const cmd = args.join(' ');
        // Block dangerous commands
        const blocked = ['rm -rf', 'sudo', 'su', 'passwd', 'shutdown', 'reboot', 'init', 'mkfs'];
        if (blocked.some(b => cmd.toLowerCase().includes(b))) {
            await react('🚫');
            return reply(`🚫 *Blocked command*\n\n${FOOTER}`);
        }
        
        await react('💻');
        try {
            const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
            const output = (stdout + stderr).substring(0, 3000) || '(no output)';
            const text = `╭───[ 💻 SHELL ]───\n│\n│ \`${cmd.substring(0, 60)}\`\n│\n│ ${output.split('\n').join('\n│ ')}\n│\n╰──◇\n${FOOTER}`;
            await sendBtn(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await sendBtn(sock, from, `╭───[ ❌ ERROR ]───\n│\n│ ${e.message.substring(0, 500)}\n│\n╰──◇\n${FOOTER}`, msg);
        }
    }
});

// ═══════════════════════════════════════════
// 6. BOT STATS (Full)
// ═══════════════════════════════════════════
commands.push({
    name: 'botstats', description: 'Show full bot statistics (Owner Only)',
    aliases: ['fullstats', 'sysinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) { await react('❌'); return reply(`❌ *Owner Only*\n\n${FOOTER}`); }
        
        await react('📊');
        try {
            const os = require('os');
            const uptime = process.uptime();
            const mem = process.memoryUsage();
            const cpuUsage = os.loadavg();
            const totalMem = (os.totalmem() / 1073741824).toFixed(2);
            const freeMem = (os.freemem() / 1073741824).toFixed(2);
            
            let gitHash = 'N/A';
            try { const { stdout } = await execAsync('git rev-parse --short HEAD'); gitHash = stdout.trim(); } catch(e) {}
            
            const { stdout: disk } = await execAsync('df -h . | tail -1 | awk "{print $3, $4, $5}"').catch(() => ({ stdout: 'N/A' }));
            
            const text = `╔══════════════════════╗\n` +
                `║   📊 SYSTEM STATS   ║\n` +
                `╚══════════════════════╝\n\n` +
                `│ 🤖 *Bot:* ${config.BOT_NAME} v${PKG.version}\n` +
                `│ 📦 Git: \`${gitHash}\`\n` +
                `│\n` +
                `│ ⏱️ *Uptime:* ${formatUptime(uptime)}\n` +
                `│ 📚 *Commands:* ${bot.commands.size}\n` +
                `│\n` +
                `│ 💾 *RAM:* ${Math.round(mem.heapUsed/1048576)}MB / ${Math.round(mem.heapTotal/1048576)}MB\n` +
                `│ 💻 *System:* ${totalMem}GB total, ${freeMem}GB free\n` +
                `│ 📊 *CPU Load:* ${cpuUsage.map(c => c.toFixed(1)).join(' / ')}\n` +
                `│ 💿 *Disk:* ${disk.trim()}\n` +
                `│\n` +
                `│ ⚡ *Node:* ${process.version}\n` +
                `│ 💻 *Platform:* ${os.platform()} ${os.arch()}\n` +
                `│ 🆔 *PID:* ${process.pid}\n` +
                `│ 🏠 *CWD:* ${process.cwd()}\n` +
                `╰──────────────────◇\n${FOOTER}`;
            
            await sendBtn(sock, from, text, msg);
            await react('✅');
        } catch (e) {
            await react('❌');
            await reply(`❌ *Error:* ${e.message}\n\n${FOOTER}`);
        }
    }
});

module.exports = { commands };
