// Megan-Prime Image AI Commands - Clean version with buttons
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../megan/config');
const uploader = require('../../megan/lib/upload');

const commands = [];
const TEMP_DIR = path.join(__dirname, '../../temp');
fs.ensureDirSync(TEMP_DIR);

const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const TIMEOUT = 15000;
const CREATOR = "\n\n> Megan-Prime | TrackerWanga";

async function safeApiCall(apiCall, fallbackData = null) {
    try {
        return await Promise.race([
            apiCall(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
            )
        ]);
    } catch (error) {
        console.error('API Error:', error.message);
        if (fallbackData) return fallbackData;
        throw error;
    }
}

async function downloadImage(url, filename) {
    const filePath = path.join(TEMP_DIR, filename);
    const response = await safeApiCall(() => axios({
        method: 'GET', url: url, responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' }
    }));
    await fs.writeFile(filePath, response.data);
    return filePath;
}

async function getQuotedImage(msg, sock) {
    try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return null;
        if (quoted.imageMessage) {
            const buffer = await require('gifted-baileys').downloadMediaMessage(
                { key: { id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted },
                'buffer', {}, { logger: console }
            );
            const filename = `image_${Date.now()}.jpg`;
            const filePath = path.join(TEMP_DIR, filename);
            await fs.writeFile(filePath, buffer);
            return filePath;
        }
        return null;
    } catch (error) {
        console.error('Error extracting quoted image:', error);
        return null;
    }
}

async function sendImage(sock, from, imagePath, caption, quotedMsg, buttons = null) {
    try {
        const buffer = await fs.readFile(imagePath);
        if (buttons) {
            await buttons.send(from, {
                title: '🖼️ IMAGE READY',
                text: caption + CREATOR,
                footer: '> Megan-Prime | TrackerWanga',
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📢 Join Channel',
                        url: CHANNEL_LINK
                    })
                }]
            }, quotedMsg);
        }
        await sock.sendMessage(from, {
            image: buffer, caption: caption + CREATOR
        }, { quoted: quotedMsg });
        await fs.unlink(imagePath).catch(() => {});
        return true;
    } catch (error) {
        if (await fs.pathExists(imagePath)) {
            await fs.unlink(imagePath).catch(() => {});
        }
        throw error;
    }
}

async function sendError(sock, from, quotedMsg, customMessage = null) {
    const errorText = customMessage || `❌ *Oops!* Something went wrong.\n\nPlease try again later.\n\n> Megan-Prime | TrackerWanga`;
    await sock.sendMessage(from, { text: errorText }, { quoted: quotedMsg });
}

// IMAGE SEARCH
commands.push({
    name: 'image',
    description: 'Search for high-quality images',
    aliases: ['img', 'picsum'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🖼️ *IMAGE SEARCH*\n\n*Usage:* ${config.PREFIX}image <search term>\n\n*Example:* ${config.PREFIX}image beautiful sunset\n\n> Megan-Prime | TrackerWanga`);
        }
        const query = args.join(' ');
        let tempFiles = [];
        await react('🔍');
        try {
            const response = await safeApiCall(() => axios.get(
                `https://picsum.photos/800/600?random=${Date.now()}`,
                { responseType: 'arraybuffer', timeout: TIMEOUT }
            ));
            const filename = `search_${Date.now()}.jpg`;
            const imagePath = path.join(TEMP_DIR, filename);
            await fs.writeFile(imagePath, response.data);
            tempFiles.push(imagePath);
            await sendImage(sock, from, imagePath,
                `🖼️ *Random Image*\n\n*Search:* "${query}"\n📸 Source: Picsum`,
                msg, buttons
            );
            try {
                const unsplashResponse = await safeApiCall(() => axios.get(
                    `https://api.siputzx.my.id/api/tools/unsplash?query=${encodeURIComponent(query)}`,
                    { timeout: TIMEOUT }
                ));
                if (unsplashResponse.data?.data?.urls?.regular) {
                    const unsplashFilename = `unsplash_${Date.now()}.jpg`;
                    const unsplashPath = await downloadImage(unsplashResponse.data.data.urls.regular, unsplashFilename);
                    tempFiles.push(unsplashPath);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await sendImage(sock, from, unsplashPath,
                        `🖼️ *Unsplash Image*\n\n*Search:* "${query}"\n📸 Photo by: ${unsplashResponse.data.data.user?.name || 'Unknown'}`,
                        null, buttons
                    );
                }
            } catch (e) { console.log('Unsplash fallback failed:', e.message); }
            await react('✅');
        } catch (error) {
            bot.logger.error('Image search error:', error);
            await react('❌');
            let errorMsg = `❌ *No images found* for "${query}".\nTry different keywords.\n\n> Megan-Prime | TrackerWanga`;
            if (error.message.includes('timeout')) {
                errorMsg = `❌ *Request timed out*.\nPlease try again with a simpler search.\n\n> Megan-Prime | TrackerWanga`;
            }
            await sendError(sock, from, msg, errorMsg);
            for (const file of tempFiles) {
                if (await fs.pathExists(file)) await fs.unlink(file).catch(() => {});
            }
        }
    }
});

// IMAGE GENERATION
commands.push({
    name: 'imagine',
    description: 'Generate AI images',
    aliases: ['gen', 'dream', 'imagineai'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🎨 *IMAGINE AI*\n\n*Usage:* ${config.PREFIX}imagine <prompt>\n\n*Example:* ${config.PREFIX}imagine a beautiful sunset over mountains\n\n> Megan-Prime | TrackerWanga`);
        }
        const prompt = args.join(' ');
        let tempFile = null;
        await react('🎨');
        try {
            await sock.sendMessage(from, {
                text: `🎨 *Generating your image...*\n\n*Prompt:* "${prompt}"\n\n⏱️ This may take a moment.\n\n> Megan-Prime | TrackerWanga`
            }, { quoted: msg });
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
            const filename = `imagine_${Date.now()}.jpg`;
            tempFile = await downloadImage(imageUrl, filename);
            await sendImage(sock, from, tempFile,
                `🎨 *Generated Image*\n\n*Prompt:* ${prompt}`,
                msg, buttons
            );
            await react('✅');
        } catch (error) {
            bot.logger.error('Imagine error:', error);
            await react('❌');
            try {
                const formData = new FormData();
                formData.append('prompt', prompt);
                const response = await safeApiCall(() => axios({
                    method: 'POST',
                    url: 'https://api.siputzx.my.id/api/ai/duckaiimage',
                    data: formData,
                    headers: { ...formData.getHeaders() },
                    responseType: 'arraybuffer'
                }));
                const fallbackFilename = `imagine_fallback_${Date.now()}.png`;
                tempFile = path.join(TEMP_DIR, fallbackFilename);
                await fs.writeFile(tempFile, response.data);
                await sendImage(sock, from, tempFile,
                    `🎨 *Generated Image (Fallback)*\n\n*Prompt:* ${prompt}`,
                    msg, buttons
                );
                await react('✅');
            } catch (fallbackError) {
                await sendError(sock, from, msg,
                    `❌ *Generation failed*\n\nTry a different prompt.\n\n> Megan-Prime | TrackerWanga`
                );
            }
            if (tempFile && await fs.pathExists(tempFile)) {
                await fs.unlink(tempFile).catch(() => {});
            }
        }
    }
});

// LOGO CREATOR
commands.push({
    name: 'create',
    description: 'Create logo/text images',
    aliases: ['logo', 'textlogo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        if (!args.length) {
            await react('ℹ️');
            return reply(`🔥 *CREATE LOGO*\n\n*Usage:* ${config.PREFIX}create <text>\n\n*Example:* ${config.PREFIX}create Megan-Prime\n\n> Megan-Prime | TrackerWanga`);
        }
        const text = args.join(' ');
        let tempFile = null;
        await react('🔥');
        try {
            await sock.sendMessage(from, {
                text: `🔥 *Creating your logo...*\n\n*Text:* "${text}"\n\n> Megan-Prime | TrackerWanga`
            }, { quoted: msg });
            const imageUrl = `https://image.pollinations.ai/prompt/logo%20design%20${encodeURIComponent(text)}?width=800&height=400&nologo=true`;
            const filename = `logo_${Date.now()}.jpg`;
            tempFile = await downloadImage(imageUrl, filename);
            await sendImage(sock, from, tempFile,
                `🔥 *Logo Created*\n\n*Text:* ${text}`,
                msg, buttons
            );
            await react('✅');
        } catch (error) {
            bot.logger.error('Create error:', error);
            await react('❌');
            await sendError(sock, from, msg,
                `❌ *Couldn't create logo* for "${text}".\nTry different text.\n\n> Megan-Prime | TrackerWanga`
            );
            if (tempFile && await fs.pathExists(tempFile)) {
                await fs.unlink(tempFile).catch(() => {});
            }
        }
    }
});

// BEAUTIFUL EFFECT
commands.push({
    name: 'beautiful',
    description: 'Add "beautiful" caption to an image',
    aliases: ['bful'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        const imagePath = await getQuotedImage(msg, sock);
        if (!imagePath) {
            await react('❌');
            return reply(`✨ *BEAUTIFUL EFFECT*\n\nPlease reply to an image with ${config.PREFIX}beautiful\n\n> Megan-Prime | TrackerWanga`);
        }
        let outputFile = null;
        await react('✨');
        try {
            const buffer = await fs.readFile(imagePath);
            const { url } = await uploader.uploadAuto(buffer, `beautiful_${Date.now()}.jpg`);
            const response = await safeApiCall(() => axios.get(
                'https://api.siputzx.my.id/api/canvas/beautiful',
                { params: { image: url }, responseType: 'arraybuffer', timeout: TIMEOUT }
            ));
            const filename = `beautiful_${Date.now()}.jpg`;
            outputFile = path.join(TEMP_DIR, filename);
            await fs.writeFile(outputFile, response.data);
            await sendImage(sock, from, outputFile,
                `✨ *Beautiful Effect Applied*`,
                msg, buttons
            );
            await react('✅');
        } catch (error) {
            bot.logger.error('Beautiful effect error:', error);
            await react('❌');
            await sendError(sock, from, msg);
        } finally {
            if (await fs.pathExists(imagePath)) await fs.unlink(imagePath).catch(() => {});
            if (outputFile && await fs.pathExists(outputFile)) await fs.unlink(outputFile).catch(() => {});
        }
    }
});

// REMOVE BACKGROUND
commands.push({
    name: 'removebg',
    description: 'Remove image background',
    aliases: ['nobg', 'rmbg'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        const imagePath = await getQuotedImage(msg, sock);
        if (!imagePath) {
            await react('❌');
            return reply(`✨ *REMOVE BACKGROUND*\n\nPlease reply to an image with ${config.PREFIX}removebg\n\n> Megan-Prime | TrackerWanga`);
        }
        let outputFile = null;
        await react('✨');
        try {
            const buffer = await fs.readFile(imagePath);
            const { url } = await uploader.uploadAuto(buffer, `removebg_${Date.now()}.jpg`);
            const response = await safeApiCall(() => axios.get(
                'https://api.siputzx.my.id/api/ai/removebg',
                { params: { image: url }, responseType: 'arraybuffer', timeout: TIMEOUT }
            ));
            const filename = `nobg_${Date.now()}.png`;
            outputFile = path.join(TEMP_DIR, filename);
            await fs.writeFile(outputFile, response.data);
            await sendImage(sock, from, outputFile,
                `✨ *Background Removed*`,
                msg, buttons
            );
            await react('✅');
        } catch (error) {
            bot.logger.error('RemoveBG error:', error);
            await react('❌');
            await sendError(sock, from, msg);
        } finally {
            if (await fs.pathExists(imagePath)) await fs.unlink(imagePath).catch(() => {});
            if (outputFile && await fs.pathExists(outputFile)) await fs.unlink(outputFile).catch(() => {});
        }
    }
});

// IMAGE MENU
commands.push({
    name: 'imagemen',
    description: 'Show all image commands',
    aliases: ['imgmenu', 'imagemenu'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, buttons }) {
        const menu = `🎨 *IMAGE COMMANDS*\n\n` +
            `*✅ AVAILABLE NOW*\n` +
            `• ${config.PREFIX}image <search> - Search images\n` +
            `• ${config.PREFIX}imagine <prompt> - Generate AI images\n` +
            `• ${config.PREFIX}create <text> - Create logo\n` +
            `• ${config.PREFIX}beautiful - Add caption to image\n` +
            `• ${config.PREFIX}removebg - Remove background\n\n` +
            `*📝 EXAMPLES*\n` +
            `• ${config.PREFIX}image sunset\n` +
            `• ${config.PREFIX}imagine cyberpunk city\n` +
            `• ${config.PREFIX}create Megan-Prime\n` +
            `• Reply to image: ${config.PREFIX}beautiful\n\n` +
            `> Megan-Prime | TrackerWanga`;
        const buttonOptions = {
            title: '🎨 IMAGE COMMANDS',
            text: menu,
            footer: '> Megan-Prime | TrackerWanga',
            buttons: [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Join Channel',
                    url: CHANNEL_LINK
                })
            }]
        };
        if (buttons) {
            await buttons.send(from, buttonOptions, msg);
        } else {
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
        }
        await react('✅');
    }
});

module.exports = { commands };
