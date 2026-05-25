// Megan-Prime Language Commands
const config = require('../../megan/config');
const axios = require('axios');

const commands = [];

const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'sw': 'Swahili',
    'fr': 'French',
    'es': 'Spanish',
    'ar': 'Arabic',
    'pt': 'Portuguese',
    'de': 'German',
    'it': 'Italian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi'
};

// SET LANGUAGE
commands.push({
    name: 'setlanguage',
    description: 'Change bot response language - Owner Only',
    aliases: ['setlang', 'language'],
    async execute({ msg, from, sender, args, bot, sock, react, reply, isOwner }) {
        if (!isOwner) {
            await react('❌');
            return reply('❌ *Owner Only Command*\n\nOnly the bot owner can change the language.\n\n> Megan-Prime | TrackerWanga');
        }

        if (args.length === 0) {
            const current = await bot.db.getSetting('bot_language', 'en');
            const currentLang = SUPPORTED_LANGUAGES[current] || 'Unknown';
            
            let langList = '🌐 *AVAILABLE LANGUAGES*\n\n';
            langList += `Current: ${currentLang} (${current})\n\n`;
            
            for (const [code, name] of Object.entries(SUPPORTED_LANGUAGES)) {
                langList += `• ${code} - ${name}\n`;
            }
            
            langList += `\n*Usage:* ${config.PREFIX}setlanguage <code>\n`;
            langList += `*Example:* ${config.PREFIX}setlanguage sw\n\n`;
            langList += `> Megan-Prime | TrackerWanga`;
            
            await react('🌐');
            return reply(langList);
        }

        const langCode = args[0].toLowerCase();
        
        if (!SUPPORTED_LANGUAGES[langCode]) {
            await react('❌');
            return reply(`❌ Unsupported language: ${langCode}\n\nUse ${config.PREFIX}setlanguage to see available languages.\n\n> Megan-Prime | TrackerWanga`);
        }

        await bot.db.setSetting('bot_language', langCode);
        await react('✅');
        
        const langName = SUPPORTED_LANGUAGES[langCode];
        
        // If not English, test translation
        if (langCode !== 'en') {
            try {
                const testText = `Language changed to ${langName}`;
                const translated = await axios.get(
                    `https://api.siputzx.my.id/api/ai/translate?text=${encodeURIComponent(testText)}&to=${langCode}`,
                    { timeout: 10000 }
                );
                
                const translation = translated.data?.translated || testText;
                
                await reply(`✅ *LANGUAGE UPDATED*\n\n🌐 New language: ${langName} (${langCode})\n\nTranslation test: ${translation}\n\nAll bot responses will now be in ${langName}.\n\n> Megan-Prime | TrackerWanga`);
            } catch (error) {
                await reply(`✅ *LANGUAGE SET TO ${langName}*\n\n⚠️ Translation service unavailable. Responses may remain in English until service is restored.\n\n> Megan-Prime | TrackerWanga`);
            }
        } else {
            await reply(`✅ *LANGUAGE SET TO ENGLISH*\n\nAll bot responses will now be in English.\n\n> Megan-Prime | TrackerWanga`);
        }
        
        console.log(`🌐 [LANGUAGE] Bot language changed to ${langName} (${langCode})`);
    }
});

// TRANSLATE TEXT
commands.push({
    name: 'translate',
    description: 'Translate text to another language',
    aliases: ['tr'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        if (args.length < 2) {
            await react('🌐');
            return reply(`🌐 *TRANSLATE*\n\n*Usage:* ${config.PREFIX}translate <language> <text>\n*Example:* ${config.PREFIX}translate sw Hello, how are you?\n\n> Megan-Prime | TrackerWanga`);
        }

        const targetLang = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        if (!SUPPORTED_LANGUAGES[targetLang]) {
            await react('❌');
            return reply(`❌ Unsupported language: ${targetLang}\n\nUse ${config.PREFIX}setlanguage to see available languages.\n\n> Megan-Prime | TrackerWanga`);
        }

        await react('🌐');

        try {
            const response = await axios.get(
                `https://api.siputzx.my.id/api/ai/translate?text=${encodeURIComponent(text)}&to=${targetLang}`,
                { timeout: 10000 }
            );

            if (response.data?.translated) {
                const langName = SUPPORTED_LANGUAGES[targetLang];
                await reply(`🌐 *TRANSLATION (${langName})*\n\nOriginal: ${text}\nTranslated: ${response.data.translated}\n\n> Megan-Prime | TrackerWanga`);
            } else {
                await reply('❌ Translation failed. Please try again.\n\n> Megan-Prime | TrackerWanga');
            }
        } catch (error) {
            console.error('❌ [TRANSLATE] Error:', error.message);
            await reply('❌ Translation service unavailable. Please try again later.\n\n> Megan-Prime | TrackerWanga');
        }
    }
});

// LANGUAGE STATUS
commands.push({
    name: 'languagestatus',
    description: 'Check current language settings',
    aliases: ['langstatus'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const currentLang = await bot.db.getSetting('bot_language', 'en');
        const langName = SUPPORTED_LANGUAGES[currentLang] || 'English';
        
        const info = `🌐 *LANGUAGE STATUS*\n\n` +
                    `Current: ${langName} (${currentLang})\n` +
                    `Auto-translate: ${currentLang !== 'en' ? '✅ Active' : '❌ Off (English)'}\n\n` +
                    `Change: ${config.PREFIX}setlanguage <code>\n` +
                    `Translate: ${config.PREFIX}translate <lang> <text>\n\n` +
                    `> Megan-Prime | TrackerWanga`;

        await react('🌐');
        await reply(info);
    }
});

module.exports = { commands };
