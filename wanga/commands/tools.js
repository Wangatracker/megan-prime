// Megan-Prime Complete Tools - 50 Commands Using Megan APIs v3.6.4
// Powered by Megan APIs | Tracker Wanga | Falcon Tech

const axios = require('axios');
const CryptoJS = require('crypto-js');
const morse = require('morse');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const math = require('mathjs');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');

const commands = [];

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const TEMP_DIR = path.join(__dirname, '../../temp');
const FOOTER = '> Megan-Prime | TrackerWanga';
const CREATOR = 'Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech';

fs.ensureDirSync(TEMP_DIR);

// ==================== HELPER FUNCTIONS ====================

async function apiGet(endpoint, params = {}, timeout = 90000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout + 30000, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
    return res.data;
}

async function apiPost(endpoint, data = {}, timeout = 90000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.post(url, data, { params: { apikey: API_KEY }, timeout + 30000, headers: { 'User-Agent': 'Megan-Prime/1.0', 'Content-Type': 'application/json' } });
    return res.data;
}

async function sendButtonsMsg(sock, from, text, quoted, extraButtons = []) {
    const buttons = [...extraButtons, { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📢 Join Channel', url: CHANNEL_LINK }) }];
    try {
        await sendButtons(sock, from, { title: 'Megan-Prime', text, footer: FOOTER, buttons }, { quoted });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted });
    }
}

// ==================== ENCODING / DECODING ====================

// 1. BINARY ENCODER (Local)
commands.push({
    name: 'binary',
    description: 'Convert text to binary code',
    aliases: ['bin', 'texttobinary'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔢 *BINARY ENCODER*\n\n*Usage:* ${config.PREFIX}binary <text>\n\n${FOOTER}`); }
        await react('🔄');
        const binaryResult = text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        await sendButtonsMsg(sock, from, `🔢 *Binary Encoded*\n\n*Original:* ${text}\n\n*Binary:*\n${binaryResult}\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Binary', copy_code: binaryResult }) }
        ]);
        await react('✅');
    }
});

// 2. BINARY DECODER (Local)
commands.push({
    name: 'debinary',
    description: 'Convert binary to text',
    aliases: ['unbinary', 'binarydecode'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔢 *BINARY DECODER*\n\n*Usage:* ${config.PREFIX}debinary <binary>\n\n${FOOTER}`); }
        await react('🔄');
        const cleanBinary = text.replace(/\s+/g, '');
        if (!/^[01]+$/.test(cleanBinary)) return reply(`❌ Invalid binary code\n\n${FOOTER}`);
        let result = '';
        for (let i = 0; i < cleanBinary.length; i += 8) {
            const byte = cleanBinary.substr(i, 8);
            if (byte.length === 8) result += String.fromCharCode(parseInt(byte, 2));
        }
        await sendButtonsMsg(sock, from, `🔢 *Binary Decoded*\n\n*Binary:* ${text}\n\n*Text:* ${result}\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Text', copy_code: result }) }
        ]);
        await react('✅');
    }
});

// 3. BASE64 (Local)
commands.push({
    name: 'base64',
    description: 'Encode/decode Base64',
    aliases: ['b64'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`📄 *BASE64*\n\n*Usage:*\n• ${config.PREFIX}base64 <text> (encode)\n• ${config.PREFIX}base64 decode <base64>\n\n${FOOTER}`); }
        await react('🔄');
        if (text.toLowerCase().startsWith('decode ')) {
            const decoded = Buffer.from(text.substring(7), 'base64').toString('utf8');
            await sendButtonsMsg(sock, from, `📄 *Base64 Decoded*\n\n${decoded}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: decoded }) }
            ]);
        } else {
            const encoded = text.toLowerCase().startsWith('encode ') ? Buffer.from(text.substring(7)).toString('base64') : Buffer.from(text).toString('base64');
            await sendButtonsMsg(sock, from, `📄 *Base64 Encoded*\n\n${encoded}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: encoded }) }
            ]);
        }
        await react('✅');
    }
});

// 4. BASE64 ENCODE (Megan API)
commands.push({
    name: 'base64encode',
    description: 'Encode text to Base64',
    aliases: ['b64e', 'encode64'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`📄 *BASE64 ENCODE*\n\n*Usage:* ${config.PREFIX}base64encode <text>\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/tools/base64encode', { text });
            const result = data.result || text;
            await sendButtonsMsg(sock, from, `📄 *Base64 Encoded*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 5. BASE64 DECODE (Megan API)
commands.push({
    name: 'base64decode',
    description: 'Decode Base64 to text',
    aliases: ['b64d', 'decode64'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`📄 *BASE64 DECODE*\n\n*Usage:* ${config.PREFIX}base64decode <base64>\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/tools/base64decode', { text });
            const result = data.result || text;
            await sendButtonsMsg(sock, from, `📄 *Base64 Decoded*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 6. URL ENCODE (Megan API)
commands.push({
    name: 'urlencode',
    description: 'URL encode text',
    aliases: ['urlenc'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔗 *URL ENCODE*\n\n*Usage:* ${config.PREFIX}urlencode <text>\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/tools/urlencode', { text });
            const result = data.result || encodeURIComponent(text);
            await sendButtonsMsg(sock, from, `🔗 *URL Encoded*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 7. URL DECODE (Megan API)
commands.push({
    name: 'urldecode',
    description: 'URL decode text',
    aliases: ['urldec'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔗 *URL DECODE*\n\n*Usage:* ${config.PREFIX}urldecode <encoded text>\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/tools/urldecode', { text });
            const result = data.result || decodeURIComponent(text);
            await sendButtonsMsg(sock, from, `🔗 *URL Decoded*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 8. HASH (Local + Megan API)
commands.push({
    name: 'hash',
    description: 'Generate hash values',
    aliases: ['hashgen', 'hashgenerator'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔒 *HASH GENERATOR*\n\n*Usage:* ${config.PREFIX}hash <text>\n\nGenerates MD5, SHA1, SHA256\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/tools/hash', { text, algorithm: 'sha256' });
            const result = data.result || {};
            const md5 = CryptoJS.MD5(text).toString();
            const sha1 = CryptoJS.SHA1(text).toString();
            const sha256 = CryptoJS.SHA256(text).toString();
            await sendButtonsMsg(sock, from, `🔒 *Hash Values*\n\n*MD5:* \`${md5}\`\n*SHA1:* \`${sha1}\`\n*SHA256:* \`${sha256}\`\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy MD5', copy_code: md5 }) },
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy SHA256', copy_code: sha256 }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 9. HASH IDENTIFY (Megan API)
commands.push({
    name: 'hashidentify',
    description: 'Identify hash type',
    aliases: ['hashid', 'identifyhash'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const hash = args[0];
        if (!hash) { await react('ℹ️'); return reply(`🔍 *HASH IDENTIFY*\n\n*Usage:* ${config.PREFIX}hashidentify <hash>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/security/hash-identify', { hash });
            const result = data.result || 'Unknown';
            await sendButtonsMsg(sock, from, `🔍 *Hash Identified*\n\n*Hash:* ${hash}\n*Type:* ${typeof result === 'string' ? result : JSON.stringify(result)}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 10. MORSE (Local)
commands.push({
    name: 'morse',
    description: 'Convert text to/from Morse code',
    aliases: ['morsecode', 'morseconvert'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`📡 *MORSE CODE*\n\n*Usage:*\n• ${config.PREFIX}morse <text> (encode)\n• ${config.PREFIX}morse .... . .-.. .-.. --- (decode)\n\n${FOOTER}`); }
        await react('🔄');
        if (/^[\.\-\s]+$/.test(text)) {
            const decoded = morse.decode(text);
            await sendButtonsMsg(sock, from, `📡 *Morse Decoded*\n\n*Morse:* ${text}\n\n*Text:* ${decoded}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: decoded }) }
            ]);
        } else {
            const encoded = morse.encode(text);
            await sendButtonsMsg(sock, from, `📡 *Morse Encoded*\n\n*Text:* ${text}\n\n*Morse:* ${encoded}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: encoded }) }
            ]);
        }
        await react('✅');
    }
});

// 11. ENCRYPT (Local)
commands.push({
    name: 'encrypt',
    description: 'Encrypt text with password',
    aliases: ['enc', 'aesencrypt'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔐 *ENCRYPT*\n\n*Usage:* ${config.PREFIX}encrypt <password> <text>\n\n${FOOTER}`); }
        const [password, ...messageParts] = text.split(' ');
        const message = messageParts.join(' ');
        if (!password || !message) return reply(`❌ Need both password and message\n\n${FOOTER}`);
        await react('🔄');
        const encrypted = CryptoJS.AES.encrypt(message, password).toString();
        await sendButtonsMsg(sock, from, `🔐 *Encrypted*\n\n*Password:* ||${password}||\n\n*Encrypted:*\n${encrypted}\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: encrypted }) }
        ]);
        await react('✅');
    }
});

// 12. DECRYPT (Local)
commands.push({
    name: 'decrypt',
    description: 'Decrypt text with password',
    aliases: ['dec', 'aesdecrypt'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔐 *DECRYPT*\n\n*Usage:* ${config.PREFIX}decrypt <password> <encrypted>\n\n${FOOTER}`); }
        const [password, ...encryptedParts] = text.split(' ');
        const encrypted = encryptedParts.join(' ');
        if (!password || !encrypted) return reply(`❌ Need both password and encrypted text\n\n${FOOTER}`);
        await react('🔄');
        const bytes = CryptoJS.AES.decrypt(encrypted, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return reply(`❌ Wrong password or corrupted data\n\n${FOOTER}`);
        await sendButtonsMsg(sock, from, `🔐 *Decrypted*\n\n*Password:* ||${password}||\n\n*Decrypted:*\n${decrypted}\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: decrypted }) }
        ]);
        await react('✅');
    }
});

// ==================== GENERATORS ====================

// 13. PASSWORD (Local)
commands.push({
    name: 'password',
    description: 'Generate strong passwords',
    aliases: ['pass', 'genpass', 'passgen'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const length = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
        await react('🔐');
        const passwords = [];
        for (let i = 0; i < 3; i++) {
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const allChars = lowercase + uppercase + numbers + symbols;
            let password = '';
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += symbols[Math.floor(Math.random() * symbols.length)];
            for (let j = 4; j < length; j++) password += allChars[Math.floor(Math.random() * allChars.length)];
            password = password.split('').sort(() => Math.random() - 0.5).join('');
            passwords.push(password);
        }
        await sendButtonsMsg(sock, from, `🔐 *Passwords (${length} chars)*\n\n*1:* \`${passwords[0]}\`\n*2:* \`${passwords[1]}\`\n*3:* \`${passwords[2]}\`\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy 1', copy_code: passwords[0] }) },
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy 2', copy_code: passwords[1] }) },
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy 3', copy_code: passwords[2] }) }
        ]);
        await react('✅');
    }
});

// 14. VCC (External API + Local fallback)
commands.push({
    name: 'vcc',
    description: 'Generate fake credit cards for testing',
    aliases: ['vccgen', 'fakecard'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const type = args[0]?.toUpperCase() || 'Visa';
        const count = Math.min(parseInt(args[1]) || 1, 5);
        const validTypes = ['Visa', 'MasterCard', 'Amex', 'JCB', 'Diners'];
        if (!validTypes.includes(type)) return reply(`❌ Invalid type. Use: ${validTypes.join(', ')}\n\n${FOOTER}`);
        await react('💳');
        let cards = [];
        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/tools/vcc-generator`, { params: { type, count }, timeout: 20000 });
            if (response.data?.data?.length) cards = response.data.data;
        } catch (apiError) {}
        if (!cards.length) {
            for (let i = 0; i < count; i++) {
                const cardNumber = Math.floor(Math.random() * 10000000000000000).toString().padStart(16, '0');
                const expMonth = Math.floor(Math.random() * 12) + 1;
                const expYear = 25 + Math.floor(Math.random() * 5);
                const cvv = Math.floor(Math.random() * 900) + 100;
                const names = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Maria Garcia', 'David Brown'];
                cards.push({ cardNumber, expirationDate: `${expMonth.toString().padStart(2, '0')}/${expYear}`, cvv: cvv.toString(), cardholderName: names[Math.floor(Math.random() * names.length)] });
            }
        }
        let resultText = `💳 *${type} Cards (${cards.length})*\n\n`;
        cards.forEach((card, i) => {
            resultText += `*${i+1}.* \`${card.cardNumber}\`\n   Exp: ${card.expirationDate} | CVV: ${card.cvv}\n   Name: ${card.cardholderName}\n\n`;
        });
        resultText += `${FOOTER}`;
        const btns = cards.slice(0, 3).map((card, i) => ({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: `📋 Copy Card ${i+1}`, copy_code: `${card.cardNumber}|${card.expirationDate}|${card.cvv}` }) }));
        await sendButtonsMsg(sock, from, resultText, msg, btns);
        await react('✅');
    }
});

// 15. EMAIL (Faker)
commands.push({
    name: 'email',
    description: 'Generate random email addresses',
    aliases: ['genemail', 'randomemail'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const count = Math.min(parseInt(args[0]) || 1, 20);
        await react('📧');
        const emails = [];
        for (let i = 0; i < count; i++) emails.push(faker.internet.email());
        await sendButtonsMsg(sock, from, `📧 *Random Emails (${count})*\n\n${emails.map((e, i) => `${i+1}. \`${e}\``).join('\n')}\n\n${FOOTER}`, msg,
            emails.slice(0, 3).map((email, i) => ({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: `📋 Copy ${i+1}`, copy_code: email }) }))
        );
        await react('✅');
    }
});

// 16. UUID (npm)
commands.push({
    name: 'uuid',
    description: 'Generate UUIDs',
    aliases: ['guid', 'genuuid'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const count = Math.min(parseInt(args[0]) || 5, 20);
        await react('🔑');
        const uuids = [];
        for (let i = 0; i < count; i++) uuids.push(uuidv4());
        await sendButtonsMsg(sock, from, `🔑 *UUIDs (${count})*\n\n${uuids.map((u, i) => `${i+1}. \`${u}\``).join('\n')}\n\n${FOOTER}`, msg,
            uuids.slice(0, 3).map((uuid, i) => ({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: `📋 Copy ${i+1}`, copy_code: uuid }) }))
        );
        await react('✅');
    }
});

// 17. LOREM (Megan API)
commands.push({
    name: 'lorem',
    description: 'Generate Lorem Ipsum text',
    aliases: ['loremipsum', 'dummytext'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const paragraphs = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10);
        await react('📝');
        try {
            const data = await apiGet('/api/tools/lorem', { paragraphs });
            const result = data.result || '';
            await sendButtonsMsg(sock, from, `📝 *Lorem Ipsum (${paragraphs} paragraph(s))*\n\n${result.substring(0, 2000)}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result.substring(0, 2000) }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 18. COLOR (Megan API)
commands.push({
    name: 'color',
    description: 'Generate random color',
    aliases: ['randomcolor', 'colour'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('🎨');
        try {
            const data = await apiGet('/api/tools/color');
            const color = data.result || {};
            const hex = color.hex || color;
            const name = color.name || 'Random Color';
            await sendButtonsMsg(sock, from, `🎨 *Random Color*\n\n*Name:* ${name}\n*Hex:* ${typeof hex === 'string' ? hex : JSON.stringify(hex)}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Hex', copy_code: typeof hex === 'string' ? hex : JSON.stringify(hex) }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 19. TIMESTAMP (Megan API)
commands.push({
    name: 'timestamp',
    description: 'Get current timestamp',
    aliases: ['ts', 'unixtime'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('⏰');
        try {
            const data = await apiGet('/api/tools/timestamp');
            const ts = data.result || Date.now();
            const date = new Date(typeof ts === 'number' ? ts * 1000 : ts);
            await sendButtonsMsg(sock, from, `⏰ *Timestamp*\n\n*Unix:* ${typeof ts === 'number' ? ts : Date.now()}\n*ISO:* ${date.toISOString()}\n*Local:* ${date.toLocaleString()}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: String(typeof ts === 'number' ? ts : Date.now()) }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== VALIDATION ====================

// 20. EMAIL VALIDATE (Megan API)
commands.push({
    name: 'emailvalidate',
    description: 'Validate email address',
    aliases: ['checkemail', 'validemail'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const email = args[0];
        if (!email) { await react('ℹ️'); return reply(`📧 *EMAIL VALIDATE*\n\n*Usage:* ${config.PREFIX}emailvalidate <email>\n\n${FOOTER}`); }
        await react('📧');
        try {
            const data = await apiGet('/api/tools/email-validate', { email });
            const result = data.result || {};
            await sendButtonsMsg(sock, from, `📧 *Email Validation*\n\n*Email:* ${email}\n*Valid:* ${result.valid ? '✅ Yes' : '❌ No'}\n${result.reason ? `*Reason:* ${result.reason}\n` : ''}\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 21. IP VALIDATE (Megan API)
commands.push({
    name: 'ipvalidate',
    description: 'Validate IP address',
    aliases: ['checkip', 'validip'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ip = args[0];
        if (!ip) { await react('ℹ️'); return reply(`🌐 *IP VALIDATE*\n\n*Usage:* ${config.PREFIX}ipvalidate <IP>\n\n${FOOTER}`); }
        await react('🌐');
        try {
            const data = await apiGet('/api/tools/ip-validate', { ip });
            const result = data.result || {};
            await sendButtonsMsg(sock, from, `🌐 *IP Validation*\n\n*IP:* ${ip}\n*Valid:* ${result.valid ? '✅ Yes' : '❌ No'}\n${result.version ? `*Version:* ${result.version}\n` : ''}\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 22. PASSWORD STRENGTH (Megan API)
commands.push({
    name: 'passwordstrength',
    description: 'Check password strength',
    aliases: ['passstrength', 'checkpass'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const password = args.join(' ');
        if (!password) { await react('ℹ️'); return reply(`🔒 *PASSWORD STRENGTH*\n\n*Usage:* ${config.PREFIX}passwordstrength <password>\n\n${FOOTER}`); }
        await react('🔒');
        try {
            const data = await apiGet('/api/tools/password-strength', { password });
            const result = data.result || {};
            await sendButtonsMsg(sock, from, `🔒 *Password Strength*\n\n*Password:* ||${password}||\n*Score:* ${result.score || 'N/A'}/100\n*Strength:* ${result.strength || 'N/A'}\n${result.feedback ? `*Feedback:* ${result.feedback}\n` : ''}\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 23. PASSWORD AUDIT (Megan API)
commands.push({
    name: 'passwordaudit',
    description: 'Audit password security',
    aliases: ['passaudit', 'auditpass'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const password = args.join(' ');
        if (!password) { await react('ℹ️'); return reply(`🔍 *PASSWORD AUDIT*\n\n*Usage:* ${config.PREFIX}passwordaudit <password>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/tools/password-audit', { password });
            const result = data.result || {};
            await sendButtonsMsg(sock, from, `🔍 *Password Audit*\n\n*Password:* ||${password}||\n*Length:* ${result.length || password.length}\n*Has Upper:* ${result.hasUpper ? '✅' : '❌'}\n*Has Lower:* ${result.hasLower ? '✅' : '❌'}\n*Has Digit:* ${result.hasDigit ? '✅' : '❌'}\n*Has Special:* ${result.hasSpecial ? '✅' : '❌'}\n*Common:* ${result.common ? '⚠️ Yes' : '✅ No'}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 24. TEXT STATS (Megan API)
commands.push({
    name: 'textstats',
    description: 'Get text statistics',
    aliases: ['textinfo', 'counttext'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`📊 *TEXT STATS*\n\n*Usage:* ${config.PREFIX}textstats <text>\n\n${FOOTER}`); }
        await react('📊');
        try {
            const data = await apiGet('/api/tools/textstats', { text });
            const result = data.result || {};
            await sendButtonsMsg(sock, from, `📊 *Text Statistics*\n\n*Characters:* ${result.characters || text.length}\n*Words:* ${result.words || text.split(/\s+/).length}\n*Lines:* ${result.lines || text.split('\n').length}\n*Sentences:* ${result.sentences || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 25. JSON FORMAT (Megan API)
commands.push({
    name: 'jsonformat',
    description: 'Format/validate JSON',
    aliases: ['json', 'formatjson', 'prettify'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const json = args.join(' ');
        if (!json) { await react('ℹ️'); return reply(`📋 *JSON FORMAT*\n\n*Usage:* ${config.PREFIX}jsonformat <json string>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiPost('/api/tools/jsonformat', { json });
            const result = data.result || json;
            const formatted = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            await sendButtonsMsg(sock, from, `📋 *JSON Formatted*\n\n${formatted.substring(0, 3000)}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: formatted }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Invalid JSON*\n\n${FOOTER}`); }
    }
});

// ==================== WEB / SCRAPER ====================

// 26. BROWSE (Local)
commands.push({
    name: 'browse',
    description: 'Fetch webpage content',
    aliases: ['fetch', 'getpage'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🌐 *BROWSE*\n\n*Usage:* ${config.PREFIX}browse <url>\n\n${FOOTER}`); }
        if (!url.startsWith('http')) return reply(`❌ Please include http:// or https://\n\n${FOOTER}`);
        await react('🌐');
        try {
            const response = await axios.get(url, { timeout: 15000 });
            const textData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            const truncated = textData.length > 4000 ? textData.substring(0, 4000) + '...' : textData;
            await sendButtonsMsg(sock, from, `🌐 *Browse: ${url}*\n\n${truncated}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Content', copy_code: truncated }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Open URL', url }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Error: ${e.message}\n\n${FOOTER}`); }
    }
});

// 27. TINYURL (External)
commands.push({
    name: 'tinyurl',
    description: 'Shorten URLs via TinyURL',
    aliases: ['short', 'shortenurl'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔗 *TINYURL*\n\n*Usage:* ${config.PREFIX}tinyurl <url>\n\n${FOOTER}`); }
        if (!url.startsWith('http')) return reply(`❌ Please include http:// or https://\n\n${FOOTER}`);
        await react('🔗');
        try {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            const shortUrl = response.data;
            await sendButtonsMsg(sock, from, `🔗 *URL Shortened*\n\n*Original:* ${url}\n*Short:* ${shortUrl}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: shortUrl }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Open', url: shortUrl }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed to shorten URL\n\n${FOOTER}`); }
    }
});

// 28. SCREENSHOT (Megan API)
commands.push({
    name: 'screenshot',
    description: 'Take website screenshot',
    aliases: ['ss', 'ssweb', 'webshot'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📸 *SCREENSHOT*\n\n*Usage:* ${config.PREFIX}screenshot <url>\n\n${FOOTER}`); }
        if (!url.startsWith('http')) return reply(`❌ Please include http:// or https://\n\n${FOOTER}`);
        await react('📸');
        try {
            const data = await apiGet('/api/tools/screenshot', { url });
            const ssUrl = data.result?.url || data.result;
            await sock.sendMessage(from, { image: { url: ssUrl }, caption: `📸 *Screenshot*\n🌐 ${url}\n\n📡 ${CREATOR}\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Screenshot failed\n\n${FOOTER}`); }
    }
});

// 29. SUBDOMAINS (External)
commands.push({
    name: 'subdomains',
    description: 'Find subdomains for a domain',
    aliases: ['subdomain', 'findsubs'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🔍 *SUBDOMAINS*\n\n*Usage:* ${config.PREFIX}subdomains <domain>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/tools/subdomains`, { params: { domain }, timeout: 20000 });
            if (!response.data?.data?.length) throw new Error('No subdomains found');
            const subdomains = response.data.data.slice(0, 20);
            await sendButtonsMsg(sock, from, `🔍 *Subdomains: ${domain}*\n\n${subdomains.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy List', copy_code: subdomains.join('\n') }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed to find subdomains\n\n${FOOTER}`); }
    }
});

// 30. SCRAPE (Megan API)
commands.push({
    name: 'scrape',
    description: 'Full page scraper',
    aliases: ['scrapepage', 'fullscrape'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🕷️ *SCRAPE*\n\n*Usage:* ${config.PREFIX}scrape <url>\n\n${FOOTER}`); }
        await react('🕷️');
        try {
            const data = await apiPost('/api/scrape/full', { url });
            const result = JSON.stringify(data.result, null, 2).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🕷️ *Scrape: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Scrape failed\n\n${FOOTER}`); }
    }
});

// 31. LINKS (Megan API)
commands.push({
    name: 'links',
    description: 'Extract links from webpage',
    aliases: ['extractlinks', 'getlinks'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔗 *EXTRACT LINKS*\n\n*Usage:* ${config.PREFIX}links <url>\n\n${FOOTER}`); }
        await react('🔗');
        try {
            const data = await apiGet('/api/scrape/links', { url });
            const links = data.result || [];
            const linkList = Array.isArray(links) ? links.slice(0, 20).join('\n') : JSON.stringify(links);
            await sendButtonsMsg(sock, from, `🔗 *Links: ${url}*\n\n${linkList}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: linkList }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 32. INSPECT (Megan API)
commands.push({
    name: 'inspect',
    description: 'Inspect website',
    aliases: ['inspectsite', 'siteinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔍 *INSPECT SITE*\n\n*Usage:* ${config.PREFIX}inspect <url>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/scrape/inspect', { url });
            const result = JSON.stringify(data.result, null, 2).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🔍 *Site Inspect: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 33. SCRIPTS (Megan API)
commands.push({
    name: 'scripts',
    description: 'Extract scripts from webpage',
    aliases: ['extractscripts', 'getscripts'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📜 *EXTRACT SCRIPTS*\n\n*Usage:* ${config.PREFIX}scripts <url>\n\n${FOOTER}`); }
        await react('📜');
        try {
            const data = await apiGet('/api/scrape/scripts', { url });
            const scripts = data.result || [];
            const scriptList = Array.isArray(scripts) ? scripts.slice(0, 10).join('\n') : JSON.stringify(scripts).substring(0, 3000);
            await sendButtonsMsg(sock, from, `📜 *Scripts: ${url}*\n\n${scriptList}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: scriptList }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 34. COOKIES (Megan API)
commands.push({
    name: 'cookies',
    description: 'Get cookies from webpage',
    aliases: ['getcookies', 'sitecookies'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🍪 *GET COOKIES*\n\n*Usage:* ${config.PREFIX}cookies <url>\n\n${FOOTER}`); }
        await react('🍪');
        try {
            const data = await apiGet('/api/scrape/cookies', { url });
            const result = JSON.stringify(data.result, null, 2).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🍪 *Cookies: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// ==================== DEV TOOLS ====================

// 35. DEOBFUSCATE (Megan API)
commands.push({
    name: 'deobfuscate',
    description: 'Deobfuscate JavaScript code',
    aliases: ['deobf', 'unobfuscate'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const code = args.join(' ');
        if (!code) { await react('ℹ️'); return reply(`🔓 *DEOBFUSCATE*\n\n*Usage:* ${config.PREFIX}deobfuscate <js code>\n\n${FOOTER}`); }
        await react('🔓');
        try {
            const data = await apiPost('/api/tools/deobfuscate', { code });
            const result = (data.result || code).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🔓 *Deobfuscated*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 36. DEMINIFY (Megan API)
commands.push({
    name: 'deminify',
    description: 'Deminify/beautify code',
    aliases: ['beautify', 'unminify'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const language = ['js', 'css', 'html'].includes(args[0]?.toLowerCase()) ? args.shift().toLowerCase() : 'js';
        const code = args.join(' ');
        if (!code) { await react('ℹ️'); return reply(`📝 *DEMINIFY*\n\n*Usage:* ${config.PREFIX}deminify [js/css/html] <code>\n\n${FOOTER}`); }
        await react('📝');
        try {
            const data = await apiPost('/api/tools/deminify', { code, language });
            const result = (data.result || code).substring(0, 3000);
            await sendButtonsMsg(sock, from, `📝 *Deminified (${language})*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 37. RUNJS (Megan API)
commands.push({
    name: 'runjs',
    description: 'Run JavaScript in sandbox',
    aliases: ['execjs', 'evaljs'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const code = args.join(' ');
        if (!code) { await react('ℹ️'); return reply(`⚡ *RUN JS*\n\n*Usage:* ${config.PREFIX}runjs <javascript code>\n\n${FOOTER}`); }
        await react('⚡');
        try {
            const data = await apiPost('/api/tools/run-js', { code });
            const result = JSON.stringify(data.result, null, 2).substring(0, 3000);
            await sendButtonsMsg(sock, from, `⚡ *JS Sandbox Result*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 38. HEADLESS (Megan API)
commands.push({
    name: 'headless',
    description: 'Headless browser fetch',
    aliases: ['headlessbrowser', 'fetchdynamic'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🌐 *HEADLESS BROWSER*\n\n*Usage:* ${config.PREFIX}headless <url>\n\n${FOOTER}`); }
        await react('🌐');
        try {
            const data = await apiGet('/api/tools/headless', { url });
            const result = (typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🌐 *Headless: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 39. DECODE (Megan API)
commands.push({
    name: 'decode',
    description: 'Auto-decode text (Base64, Hex, URL etc)',
    aliases: ['autodecode', 'decodetext'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔍 *AUTO DECODE*\n\n*Usage:* ${config.PREFIX}decode <encoded text>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiPost('/api/tools/decode', { text });
            const result = (data.result || text).substring(0, 3000);
            await sendButtonsMsg(sock, from, `🔍 *Auto-Decoded*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// ==================== INFO / LOOKUP ====================

// 40. COUNTRY INFO (External)
commands.push({
    name: 'countryinfo',
    description: 'Get country information',
    aliases: ['country', 'nationinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const country = args.join(' ');
        if (!country) { await react('ℹ️'); return reply(`🌍 *COUNTRY INFO*\n\n*Usage:* ${config.PREFIX}countryinfo <country>\n\n${FOOTER}`); }
        await react('🌍');
        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/tools/countryInfo`, { params: { name: country }, timeout: 15000 });
            if (!response.data?.data) throw new Error('Not found');
            const data = response.data.data;
            let languages = 'N/A';
            if (data.languages) {
                if (Array.isArray(data.languages)) languages = data.languages.join(', ');
                else if (typeof data.languages === 'object') languages = Object.values(data.languages).join(', ');
                else languages = data.languages.toString();
            }
            let resultText = `🌍 *${data.name}*\n\n🏛️ *Capital:* ${data.capital || 'N/A'}\n👥 *Population:* ${data.population?.toLocaleString() || 'N/A'}\n🗺️ *Area:* ${data.area?.toLocaleString() || 'N/A'} km²\n💰 *Currency:* ${data.currency || 'N/A'}\n🗣️ *Languages:* ${languages}\n⏰ *Timezones:* ${data.timezones?.join(', ') || 'N/A'}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, resultText, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Country not found\n\n${FOOTER}`); }
    }
});

// 41. GITHUB STALK (External)
commands.push({
    name: 'githubstalk',
    description: 'Get GitHub user info',
    aliases: ['ghstalk', 'githubinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const username = args[0];
        if (!username) { await react('ℹ️'); return reply(`🐙 *GITHUB STALK*\n\n*Usage:* ${config.PREFIX}githubstalk <username>\n\n${FOOTER}`); }
        await react('🐙');
        try {
            let user = null;
            let htmlUrl = `https://github.com/${username}`;
            try {
                const response = await axios.get(`https://api.github.com/users/${username}`, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                user = response.data;
            } catch (githubError) {
                try {
                    const response = await axios.get(`https://api.siputzx.my.id/api/stalk/github`, { params: { user: username }, timeout: 10000 });
                    if (response.data?.data) user = response.data.data;
                } catch (siputzxError) {
                    user = { login: username, name: username, bio: 'GitHub user', public_repos: 0, followers: 0, following: 0, created_at: new Date().toISOString(), html_url: htmlUrl };
                }
            }
            let resultText = `🐙 *${user.login || username}*\n\n📛 *Name:* ${user.name || 'N/A'}\n📝 *Bio:* ${user.bio || 'N/A'}\n📦 *Public Repos:* ${user.public_repos || 0}\n👥 *Followers:* ${user.followers || 0}\n👤 *Following:* ${user.following || 0}\n📅 *Created:* ${new Date(user.created_at).toLocaleDateString()}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, resultText, msg, [
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 View Profile', url: user.html_url || htmlUrl }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ User not found\n\n${FOOTER}`); }
    }
});

// 42. YOUTUBE STALK (External)
commands.push({
    name: 'youtubestalk',
    description: 'Get YouTube channel info',
    aliases: ['ytstalk', 'channelinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const channel = args[0];
        if (!channel) { await react('ℹ️'); return reply(`📺 *YOUTUBE STALK*\n\n*Usage:* ${config.PREFIX}youtubestalk <channel>\n\n${FOOTER}`); }
        await react('📺');
        try {
            let channelData = null;
            let channelUrl = `https://youtube.com/@${channel}`;
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube`, { params: { username: channel }, timeout: 15000 });
                if (response.data?.data) channelData = response.data.data;
            } catch (apiError) {
                channelData = { channelName: channel, subscribers: 'N/A', totalViews: 'N/A', totalVideos: 'N/A', joinedDate: 'N/A', channelUrl: channelUrl };
            }
            let resultText = `📺 *${channelData.channelName || channel}*\n\n👥 *Subscribers:* ${channelData.subscribers || 'N/A'}\n👁️ *Total Views:* ${channelData.totalViews || 'N/A'}\n🎬 *Total Videos:* ${channelData.totalVideos || 'N/A'}\n📅 *Joined:* ${channelData.joinedDate || 'N/A'}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, resultText, msg, [
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 View Channel', url: channelData.channelUrl || channelUrl }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Channel not found\n\n${FOOTER}`); }
    }
});

// 43. PHONE LOOKUP (Megan API)
commands.push({
    name: 'phone',
    description: 'Lookup phone number info',
    aliases: ['phonelookup', 'numberinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const phone = args[0];
        if (!phone) { await react('ℹ️'); return reply(`📞 *PHONE LOOKUP*\n\n*Usage:* ${config.PREFIX}phone <number>\n\n${FOOTER}`); }
        await react('📞');
        try {
            const data = await apiGet('/api/tools/phone-lookup', { phone });
            const r = data.result || {};
            await sendButtonsMsg(sock, from, `📞 *Phone: ${phone}*\n\n🌍 *Country:* ${r.country || 'N/A'}\n📍 *Location:* ${r.location || 'N/A'}\n📡 *Carrier:* ${r.carrier || 'N/A'}\n📱 *Type:* ${r.type || 'N/A'}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 44. DNS (Megan API)
commands.push({
    name: 'dns',
    description: 'DNS lookup for a domain',
    aliases: ['dnslookup', 'domaindns'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🌐 *DNS LOOKUP*\n\n*Usage:* ${config.PREFIX}dns <domain>\n\n${FOOTER}`); }
        await react('🌐');
        try {
            const data = await apiGet('/api/tools/dns-inspector', { domain });
            const r = data.result || {};
            let text = `🌐 *DNS: ${domain}*\n\n`;
            if (r.A) text += `📌 *A:* ${Array.isArray(r.A) ? r.A.join(', ') : r.A}\n`;
            if (r.AAAA) text += `📌 *AAAA:* ${Array.isArray(r.AAAA) ? r.AAAA.join(', ') : r.AAAA}\n`;
            if (r.MX) text += `📧 *MX:* ${Array.isArray(r.MX) ? r.MX.join(', ') : r.MX}\n`;
            if (r.NS) text += `🌐 *NS:* ${Array.isArray(r.NS) ? r.NS.join(', ') : r.NS}\n`;
            if (r.CNAME) text += `🔗 *CNAME:* ${r.CNAME}\n`;
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// 45. WIFI SCAN (Megan API)
commands.push({
    name: 'wifi',
    description: 'Scan WiFi networks',
    aliases: ['wifiscan', 'networks'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('📡');
        try {
            const data = await apiGet('/api/tools/wifi-scan');
            const result = data.result || [];
            const list = Array.isArray(result) ? result.slice(0, 15).map((n, i) => `${i+1}. ${n.ssid || n} - ${n.signal || 'N/A'}`).join('\n') : JSON.stringify(result);
            await sendButtonsMsg(sock, from, `📡 *WiFi Scan*\n\n${list || 'No networks found'}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed\n\n${FOOTER}`); }
    }
});

// ==================== MATH / TEXT / FUN ====================

// 46. CALCULATOR (mathjs)
commands.push({
    name: 'calculate',
    description: 'Solve math equations',
    aliases: ['calc', 'math', 'solve'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length) { await react('ℹ️'); return reply(`🧮 *CALCULATOR*\n\n*Usage:* ${config.PREFIX}calc <equation>\n*Example:* ${config.PREFIX}calc 2+2*5\n\n${FOOTER}`); }
        const equation = args.join(' ').replace(/×/g, '*').replace(/÷/g, '/');
        await react('🧮');
        try {
            const result = math.evaluate(equation);
            await sendButtonsMsg(sock, from, `🧮 *Calculator*\n\n*Equation:* ${equation}\n*Result:* ${result}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Result', copy_code: result.toString() }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Invalid equation\n\n${FOOTER}`); }
    }
});

// 47. FLIP TEXT (Local)
commands.push({
    name: 'fliptext',
    description: 'Flip text upside down',
    aliases: ['flip', 'upsidedown'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔄 *FLIP TEXT*\n\n*Usage:* ${config.PREFIX}fliptext <text>\n\n${FOOTER}`); }
        await react('🔄');
        const flipMap = {
            'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z',
            'A':'∀','B':'𐐒','C':'Ɔ','D':'ᗡ','E':'Ǝ','F':'Ⅎ','G':'⅁','H':'H','I':'I','J':'ſ','K':'ʞ','L':'⅂','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Q','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z',
            '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','!':'¡','?':'¿','.':'˙',',':"'",'"':'„',"'":',','(':')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<','&':'⅋','_':'‾'
        };
        const flipped = text.split('').map(char => flipMap[char] || char).reverse().join('');
        await sendButtonsMsg(sock, from, `🔄 *Flipped Text*\n\n*Original:* ${text}\n*Flipped:* ${flipped}\n\n${FOOTER}`, msg, [
            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: flipped }) }
        ]);
        await react('✅');
    }
});

// 48. EMOJI MIX (External)
commands.push({
    name: 'emojimix',
    description: 'Mix two emojis together',
    aliases: ['emix', 'mixemoji'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (!args.length || !args[0].includes('+')) { await react('ℹ️'); return reply(`😊 *EMOJI MIX*\n\n*Usage:* ${config.PREFIX}emojimix 😅+🤔\n\n${FOOTER}`); }
        const [emoji1, emoji2] = args[0].split('+').map(e => e.trim());
        if (!emoji1 || !emoji2) return reply(`❌ Please provide two emojis separated by +\n\n${FOOTER}`);
        await react('🎨');
        try {
            const response = await axios.get(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`, { timeout: 15000 });
            if (!response.data.results?.length) return reply(`❌ Could not mix these emojis\n\n${FOOTER}`);
            const result = response.data.results[0];
            await sock.sendMessage(from, { image: { url: result.url }, caption: `🎨 *Emoji Mix*\n\n${emoji1} + ${emoji2}\n\n${FOOTER}` }, { quoted: msg });
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Failed to mix emojis\n\n${FOOTER}`); }
    }
});

// 49. ZODIAK (External)
commands.push({
    name: 'zodiak',
    description: 'Get zodiac information',
    aliases: ['zodiac', 'horoscope', 'starsign'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const sign = args[0]?.toLowerCase();
        const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        if (!sign || !signs.includes(sign)) { await react('ℹ️'); return reply(`⭐ *ZODIAK*\n\n*Usage:* ${config.PREFIX}zodiak <sign>\n*Signs:* ${signs.join(', ')}\n\n${FOOTER}`); }
        await react('⭐');
        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/primbon/zodiak`, { params: { zodiak: sign }, timeout: 15000 });
            if (!response.data?.data) throw new Error('Not found');
            const data = response.data.data;
            let resultText = `⭐ *${sign.toUpperCase()}*\n\n📝 *Description:* ${data.zodiak || 'N/A'}\n🔢 *Lucky Numbers:* ${data.nomor_keberuntungan || 'N/A'}\n🌸 *Lucky Flowers:* ${data.bunga_keberuntungan || 'N/A'}\n🎨 *Lucky Color:* ${data.warna_keberuntungan || 'N/A'}\n💧 *Element:* ${data.elemen_keberuntungan || 'N/A'}\n🪐 *Planet:* ${data.planet_yang_mengitari || 'N/A'}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, resultText, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ Zodiac not found\n\n${FOOTER}`); }
    }
});

// ==================== TOOLS HELP ====================

// 50. TOOLS HELP
commands.push({
    name: 'tools',
    description: 'Show all tool commands',
    aliases: ['toolhelp', 'toolsmenu', 'utilities'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `🛠️ *𝐓𝐎𝐎𝐋𝐒 (𝟒𝟗)*\n\n` +
            `*🔢 𝐄𝐍𝐂𝐎𝐃𝐈𝐍𝐆*\n${p}binary | ${p}debinary | ${p}base64\n${p}base64encode | ${p}base64decode\n${p}urlencode | ${p}urldecode | ${p}hash\n${p}hashidentify | ${p}morse\n${p}encrypt | ${p}decrypt\n\n` +
            `*🎲 𝐆𝐄𝐍𝐄𝐑𝐀𝐓𝐎𝐑𝐒*\n${p}password | ${p}vcc | ${p}email\n${p}uuid | ${p}lorem | ${p}color\n${p}timestamp\n\n` +
            `*✅ 𝐕𝐀𝐋𝐈𝐃𝐀𝐓𝐈𝐎𝐍*\n${p}emailvalidate | ${p}ipvalidate\n${p}passwordstrength | ${p}passwordaudit\n${p}textstats | ${p}jsonformat\n\n` +
            `*🌐 𝐖𝐄𝐁 / 𝐒𝐂𝐑𝐀𝐏𝐄𝐑*\n${p}browse | ${p}tinyurl | ${p}screenshot\n${p}subdomains | ${p}scrape | ${p}links\n${p}inspect | ${p}scripts | ${p}cookies\n\n` +
            `*💻 𝐃𝐄𝐕 𝐓𝐎𝐎𝐋𝐒*\n${p}deobfuscate | ${p}deminify\n${p}runjs | ${p}headless | ${p}decode\n\n` +
            `*📞 𝐈𝐍𝐅𝐎*\n${p}countryinfo | ${p}githubstalk\n${p}youtubestalk | ${p}phone\n${p}dns | ${p}wifi\n\n` +
            `*🧮 𝐌𝐀𝐓𝐇 & 𝐅𝐔𝐍*\n${p}calc | ${p}fliptext\n${p}emojimix | ${p}zodiak\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});


// ZODIAK ALL (Megan API)
commands.push({
    name: 'zodiakall',
    description: 'Get all zodiac signs',
    aliases: ['allzodiac', 'zodiaclist'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        await react('⭐');
        try {
            const data = await apiGet('/api/zodiac/all');
            const signs = data.signs || [];
            let text = `⭐ *All Zodiac Signs*\n\n`;
            signs.forEach((s, i) => { text += `*${i+1}. ${s.name}* (${s.symbol}) - ${s.date}\n${s.element} | ${s.planet}\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ZODIAK ELEMENT (Megan API)
commands.push({
    name: 'zodiakelement',
    description: 'Get zodiac signs by element',
    aliases: ['element', 'zodiacsigns'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const element = args[0]?.toLowerCase();
        const validElements = ['fire', 'earth', 'air', 'water'];
        if (!element || !validElements.includes(element)) {
            await react('ℹ️');
            return reply(`🔮 *ZODIAK ELEMENTS*\n\n*Usage:* ${config.PREFIX}zodiakelement <element>\n*Elements:* fire, earth, air, water\n\n${FOOTER}`);
        }
        await react('🔮');
        try {
            const data = await apiGet(`/api/zodiac/element/${element}`);
            const signs = data.signs || [];
            let text = `🔮 *${element.toUpperCase()} Signs*\n\n`;
            signs.forEach(s => { text += `⭐ *${s.name}* (${s.symbol})\n📅 ${s.date}\n\n`; });
            text += `📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ZODIAK COMPATIBILITY (Megan API)
commands.push({
    name: 'zodiakmatch',
    description: 'Check zodiac compatibility',
    aliases: ['compatibility', 'zodiaclove'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 2) {
            await react('ℹ️');
            return reply(`💕 *ZODIAK COMPATIBILITY*\n\n*Usage:* ${config.PREFIX}zodiakmatch <sign1> <sign2>\n*Example:* ${config.PREFIX}zodiakmatch aries leo\n\n${FOOTER}`);
        }
        const sign1 = args[0].toLowerCase();
        const sign2 = args[1].toLowerCase();
        await react('💕');
        try {
            const data = await apiGet(`/api/zodiac/compatibility/${sign1}/${sign2}`);
            const r = data.result || {};
            let text = `💕 *Compatibility*\n\n${sign1.toUpperCase()} + ${sign2.toUpperCase()}\n\n`;
            if (r.score) text += `💯 *Score:* ${r.score}%\n`;
            if (r.description) text += `📝 ${r.description}\n`;
            if (r.love) text += `❤️ *Love:* ${r.love}\n`;
            if (r.friendship) text += `👥 *Friendship:* ${r.friendship}\n`;
            if (r.communication) text += `💬 *Communication:* ${r.communication}\n`;
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});


module.exports = { commands };
