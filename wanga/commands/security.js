// Megan-Prime Security Tools - 37 Commands Using Megan APIs v3.6.4
// Powered by Megan APIs | Tracker Wanga | Falcon Tech

const axios = require('axios');
const config = require('../../megan/config');
const { sendButtons } = require('gifted-btns');

const commands = [];

const API_BASE = 'https://apis.megan.qzz.io';
const API_KEY = 'megan_admin_master';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37';
const FOOTER = '> Megan-Prime | TrackerWanga';
const CREATOR = 'Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech';

// ==================== HELPER FUNCTIONS ====================

async function apiGet(endpoint, params = {}, timeout = 90000) {
    const url = `${API_BASE}${endpoint}`;
    const res = await axios.get(url, { params: { ...params, apikey: API_KEY }, timeout, headers: { 'User-Agent': 'Megan-Prime/1.0' } });
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

function formatResult(result, maxLen = 3000) {
    if (!result) return 'No data returned';
    if (typeof result === 'string') return result.substring(0, maxLen);
    return JSON.stringify(result, null, 2).substring(0, maxLen);
}

// ==================== DOMAIN / DNS ====================

// 1. WHOIS
commands.push({
    name: 'whois',
    description: 'WHOIS lookup for a domain',
    aliases: ['whoislookup', 'domainwhois'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🔍 *WHOIS LOOKUP*\n\n*Usage:* ${config.PREFIX}whois <domain>\n*Example:* ${config.PREFIX}whois google.com\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/security/whois', { domain });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *WHOIS: ${domain}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 2. DNS LOOKUP
commands.push({
    name: 'dnslookup',
    description: 'DNS record lookup',
    aliases: ['dnsrecords', 'dnsinfo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🌐 *DNS LOOKUP*\n\n*Usage:* ${config.PREFIX}dnslookup <domain>\n\n${FOOTER}`); }
        await react('🌐');
        try {
            const data = await apiGet('/api/security/dns', { domain });
            const r = data.result || {};
            let text = `🌐 *DNS: ${domain}*\n\n`;
            if (r.A) text += `📌 *A:* ${Array.isArray(r.A) ? r.A.join(', ') : r.A}\n`;
            if (r.AAAA) text += `📌 *AAAA:* ${Array.isArray(r.AAAA) ? r.AAAA.join(', ') : r.AAAA}\n`;
            if (r.MX) text += `📧 *MX:* ${Array.isArray(r.MX) ? r.MX.join(', ') : r.MX}\n`;
            if (r.NS) text += `🌐 *NS:* ${Array.isArray(r.NS) ? r.NS.join(', ') : r.NS}\n`;
            if (r.CNAME) text += `🔗 *CNAME:* ${r.CNAME}\n`;
            if (r.TXT) text += `📝 *TXT:* ${Array.isArray(r.TXT) ? r.TXT.join(', ') : r.TXT}\n`;
            text += `\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 3. SUBDOMAIN SCAN
commands.push({
    name: 'subdomainscan',
    description: 'Scan for subdomains',
    aliases: ['subscan', 'findsubdomains'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🔍 *SUBDOMAIN SCAN*\n\n*Usage:* ${config.PREFIX}subdomainscan <domain>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/security/subdomain', { domain });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *Subdomains: ${domain}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 4. REVERSE IP
commands.push({
    name: 'reverseip',
    description: 'Reverse IP lookup',
    aliases: ['revip', 'ipreverse'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ip = args[0];
        if (!ip) { await react('ℹ️'); return reply(`🔄 *REVERSE IP*\n\n*Usage:* ${config.PREFIX}reverseip <IP>\n\n${FOOTER}`); }
        await react('🔄');
        try {
            const data = await apiGet('/api/security/reverse-ip', { ip });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔄 *Reverse IP: ${ip}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== IP / NETWORK ====================

// 5. GEOIP
commands.push({
    name: 'geoip',
    description: 'Geolocation lookup for IP',
    aliases: ['iplocation', 'ipgeo'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ip = args[0];
        if (!ip) { await react('ℹ️'); return reply(`📍 *GEO IP*\n\n*Usage:* ${config.PREFIX}geoip <IP>\n\n${FOOTER}`); }
        await react('📍');
        try {
            const data = await apiGet('/api/security/geoip', { ip });
            const r = data.result || {};
            let text = `📍 *GeoIP: ${ip}*\n\n🌍 *Country:* ${r.country || 'N/A'}\n🏙️ *City:* ${r.city || 'N/A'}\n📍 *Region:* ${r.region || 'N/A'}\n🏢 *ISP:* ${r.isp || r.org || 'N/A'}\n📌 *Coordinates:* ${r.lat || ''}, ${r.lon || ''}\n\n📡 ${CREATOR}\n\n${FOOTER}`;
            await sendButtonsMsg(sock, from, text, msg);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 6. PORT SCAN
commands.push({
    name: 'portscan',
    description: 'Scan open ports',
    aliases: ['ports', 'scanports'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const host = args[0];
        if (!host) { await react('ℹ️'); return reply(`🔌 *PORT SCAN*\n\n*Usage:* ${config.PREFIX}portscan <host/IP>\n\n${FOOTER}`); }
        await react('🔌');
        try {
            const data = await apiGet('/api/security/portscan', { host });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔌 *Port Scan: ${host}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 7. OPEN PORTS
commands.push({
    name: 'openports',
    description: 'Check commonly open ports',
    aliases: ['checkports', 'portcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const host = args[0];
        if (!host) { await react('ℹ️'); return reply(`🔓 *OPEN PORTS*\n\n*Usage:* ${config.PREFIX}openports <host>\n\n${FOOTER}`); }
        await react('🔓');
        try {
            const data = await apiGet('/api/security/openports', { host });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔓 *Open Ports: ${host}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 8. PING
commands.push({
    name: 'pinghost',
    description: 'Ping a host',
    aliases: ['ping', 'checkhost'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const host = args[0];
        if (!host) { await react('ℹ️'); return reply(`🏓 *PING HOST*\n\n*Usage:* ${config.PREFIX}pinghost <host/IP>\n\n${FOOTER}`); }
        await react('🏓');
        try {
            const data = await apiGet('/api/security/ping', { host });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🏓 *Ping: ${host}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 9. LATENCY
commands.push({
    name: 'latency',
    description: 'Check host latency',
    aliases: ['speedtest', 'hostlatency'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const host = args[0];
        if (!host) { await react('ℹ️'); return reply(`⏱️ *LATENCY*\n\n*Usage:* ${config.PREFIX}latency <host>\n\n${FOOTER}`); }
        await react('⏱️');
        try {
            const data = await apiGet('/api/security/latency', { host });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `⏱️ *Latency: ${host}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 10. TRACEROUTE
commands.push({
    name: 'traceroute',
    description: 'Trace route to host',
    aliases: ['trace', 'routetrace'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const host = args[0];
        if (!host) { await react('ℹ️'); return reply(`🛣️ *TRACEROUTE*\n\n*Usage:* ${config.PREFIX}traceroute <host>\n\n${FOOTER}`); }
        await react('🛣️');
        try {
            const data = await apiGet('/api/security/traceroute', { host });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🛣️ *Traceroute: ${host}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 11. ASN LOOKUP
commands.push({
    name: 'asn',
    description: 'ASN information lookup',
    aliases: ['asnlookup', 'asnumber'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const asn = args[0];
        if (!asn) { await react('ℹ️'); return reply(`🔢 *ASN LOOKUP*\n\n*Usage:* ${config.PREFIX}asn <AS number or IP>\n\n${FOOTER}`); }
        await react('🔢');
        try {
            const data = await apiGet('/api/security/asn', { asn });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔢 *ASN: ${asn}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 12. MAC LOOKUP
commands.push({
    name: 'maclookup',
    description: 'MAC address lookup',
    aliases: ['mac', 'macaddress'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const mac = args[0];
        if (!mac) { await react('ℹ️'); return reply(`🔌 *MAC LOOKUP*\n\n*Usage:* ${config.PREFIX}maclookup <MAC address>\n\n${FOOTER}`); }
        await react('🔌');
        try {
            const data = await apiGet('/api/security/mac', { mac });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔌 *MAC Lookup: ${mac}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 13. IP INFO
commands.push({
    name: 'ipinfo',
    description: 'Comprehensive IP information',
    aliases: ['ipdetails', 'fullip'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const ip = args[0];
        if (!ip) { await react('ℹ️'); return reply(`🌐 *IP INFO*\n\n*Usage:* ${config.PREFIX}ipinfo <IP>\n\n${FOOTER}`); }
        await react('🌐');
        try {
            const data = await apiGet('/api/security/ip-info', { ip });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🌐 *IP Info: ${ip}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== SSL / TLS ====================

// 14. SSL CHECK
commands.push({
    name: 'ssl',
    description: 'SSL certificate check',
    aliases: ['sslcheck', 'certificate'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🔒 *SSL CHECK*\n\n*Usage:* ${config.PREFIX}ssl <domain>\n\n${FOOTER}`); }
        await react('🔒');
        try {
            const data = await apiGet('/api/security/ssl', { domain });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔒 *SSL: ${domain}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 15. TLS INFO
commands.push({
    name: 'tls',
    description: 'TLS version/cipher info',
    aliases: ['tlsinfo', 'tlscheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const domain = args[0];
        if (!domain) { await react('ℹ️'); return reply(`🔐 *TLS INFO*\n\n*Usage:* ${config.PREFIX}tls <domain>\n\n${FOOTER}`); }
        await react('🔐');
        try {
            const data = await apiGet('/api/security/tls', { domain });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔐 *TLS: ${domain}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== HTTP / HEADERS ====================

// 16. HTTP HEADERS
commands.push({
    name: 'httpheaders',
    description: 'Fetch HTTP response headers',
    aliases: ['headers', 'responseheaders'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📋 *HTTP HEADERS*\n\n*Usage:* ${config.PREFIX}httpheaders <url>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiGet('/api/security/headers', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📋 *HTTP Headers: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 17. SECURITY HEADERS
commands.push({
    name: 'securityheaders',
    description: 'Check security headers',
    aliases: ['secheaders', 'headerscheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🛡️ *SECURITY HEADERS*\n\n*Usage:* ${config.PREFIX}securityheaders <url>\n\n${FOOTER}`); }
        await react('🛡️');
        try {
            const data = await apiGet('/api/security/security-headers', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🛡️ *Security Headers: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== WEB SECURITY ====================

// 18. WAF DETECT
commands.push({
    name: 'wafdetect',
    description: 'Detect Web Application Firewall',
    aliases: ['waf', 'firewalldetect'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🛡️ *WAF DETECT*\n\n*Usage:* ${config.PREFIX}wafdetect <url>\n\n${FOOTER}`); }
        await react('🛡️');
        try {
            const data = await apiGet('/api/security/waf', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🛡️ *WAF Detect: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 19. FIREWALL CHECK
commands.push({
    name: 'firewall',
    description: 'Check firewall presence',
    aliases: ['firewallcheck', 'fwcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔥 *FIREWALL CHECK*\n\n*Usage:* ${config.PREFIX}firewall <url>\n\n${FOOTER}`); }
        await react('🔥');
        try {
            const data = await apiGet('/api/security/firewall', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔥 *Firewall: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== VULNERABILITY SCANS ====================

// 20. XSS CHECK
commands.push({
    name: 'xss',
    description: 'Check for XSS vulnerabilities',
    aliases: ['xsscheck', 'xssscan'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`⚠️ *XSS CHECK*\n\n*Usage:* ${config.PREFIX}xss <url>\n\n${FOOTER}`); }
        await react('⚠️');
        try {
            const data = await apiGet('/api/security/xss', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `⚠️ *XSS Check: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 21. SQLI CHECK
commands.push({
    name: 'sqli',
    description: 'Check for SQL injection vulnerabilities',
    aliases: ['sqlcheck', 'sqliscan'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`💉 *SQLi CHECK*\n\n*Usage:* ${config.PREFIX}sqli <url>\n\n${FOOTER}`); }
        await react('💉');
        try {
            const data = await apiGet('/api/security/sqli', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `💉 *SQLi Check: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 22. CSRF CHECK
commands.push({
    name: 'csrf',
    description: 'Check CSRF protection',
    aliases: ['csrfcheck', 'csrfscan'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔐 *CSRF CHECK*\n\n*Usage:* ${config.PREFIX}csrf <url>\n\n${FOOTER}`); }
        await react('🔐');
        try {
            const data = await apiGet('/api/security/csrf', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔐 *CSRF Check: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 23. CLICKJACK CHECK
commands.push({
    name: 'clickjack',
    description: 'Check clickjacking vulnerability',
    aliases: ['clickjacking', 'cjcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🖼️ *CLICKJACK CHECK*\n\n*Usage:* ${config.PREFIX}clickjack <url>\n\n${FOOTER}`); }
        await react('🖼️');
        try {
            const data = await apiGet('/api/security/clickjack', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🖼️ *Clickjack: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 24. DIRECTORY SCAN
commands.push({
    name: 'directoryscan',
    description: 'Scan for exposed directories',
    aliases: ['dirscan', 'dirb'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📂 *DIRECTORY SCAN*\n\n*Usage:* ${config.PREFIX}directoryscan <url>\n\n${FOOTER}`); }
        await react('📂');
        try {
            const data = await apiGet('/api/security/directory', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📂 *Directory Scan: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 25. EXPOSED FILES
commands.push({
    name: 'exposedfiles',
    description: 'Check for exposed files',
    aliases: ['exposed', 'filecheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📄 *EXPOSED FILES*\n\n*Usage:* ${config.PREFIX}exposedfiles <url>\n\n${FOOTER}`); }
        await react('📄');
        try {
            const data = await apiGet('/api/security/exposed-files', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📄 *Exposed Files: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 26. MISCONFIG CHECK
commands.push({
    name: 'misconfig',
    description: 'Check for security misconfigurations',
    aliases: ['misconfiguration', 'misconfigcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`⚙️ *MISCONFIG CHECK*\n\n*Usage:* ${config.PREFIX}misconfig <url>\n\n${FOOTER}`); }
        await react('⚙️');
        try {
            const data = await apiGet('/api/security/misconfig', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `⚙️ *Misconfig: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== SITE ANALYSIS ====================

// 27. ROBOTS.TXT
commands.push({
    name: 'robots',
    description: 'Check robots.txt',
    aliases: ['robotstxt', 'robotcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🤖 *ROBOTS.TXT*\n\n*Usage:* ${config.PREFIX}robots <url>\n\n${FOOTER}`); }
        await react('🤖');
        try {
            const data = await apiGet('/api/security/robots', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🤖 *Robots.txt: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 28. SITEMAP
commands.push({
    name: 'sitemap',
    description: 'Check sitemap.xml',
    aliases: ['sitemapxml', 'sitemapcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🗺️ *SITEMAP*\n\n*Usage:* ${config.PREFIX}sitemap <url>\n\n${FOOTER}`); }
        await react('🗺️');
        try {
            const data = await apiGet('/api/security/sitemap', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🗺️ *Sitemap: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 29. CMS DETECT
commands.push({
    name: 'cmsdetect',
    description: 'Detect CMS/platform',
    aliases: ['cms', 'whatcms'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔍 *CMS DETECT*\n\n*Usage:* ${config.PREFIX}cmsdetect <url>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/security/cms', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *CMS Detect: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 30. TECH STACK
commands.push({
    name: 'techstack',
    description: 'Detect technology stack',
    aliases: ['tech', 'whattech'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`💻 *TECH STACK*\n\n*Usage:* ${config.PREFIX}techstack <url>\n\n${FOOTER}`); }
        await react('💻');
        try {
            const data = await apiGet('/api/security/techstack', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `💻 *Tech Stack: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 31. COOKIE SCAN
commands.push({
    name: 'cookiescan',
    description: 'Scan website cookies',
    aliases: ['cookiesecurity', 'cookiecheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🍪 *COOKIE SCAN*\n\n*Usage:* ${config.PREFIX}cookiescan <url>\n\n${FOOTER}`); }
        await react('🍪');
        try {
            const data = await apiGet('/api/security/cookies', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🍪 *Cookie Scan: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 32. REDIRECTS CHECK
commands.push({
    name: 'redirects',
    description: 'Check URL redirects',
    aliases: ['redirectcheck', 'redirectchain'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`↪️ *REDIRECTS*\n\n*Usage:* ${config.PREFIX}redirects <url>\n\n${FOOTER}`); }
        await react('↪️');
        try {
            const data = await apiGet('/api/security/redirects', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `↪️ *Redirects: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 33. URL SCAN
commands.push({
    name: 'urlscan',
    description: 'Comprehensive URL security scan',
    aliases: ['scanurl', 'urlcheck'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🔍 *URL SCAN*\n\n*Usage:* ${config.PREFIX}urlscan <url>\n\n${FOOTER}`); }
        await react('🔍');
        try {
            const data = await apiGet('/api/security/url-scan', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔍 *URL Scan: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 34. PHISH CHECK
commands.push({
    name: 'phishcheck',
    description: 'Check if URL is phishing',
    aliases: ['phish', 'phishing'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`🎣 *PHISH CHECK*\n\n*Usage:* ${config.PREFIX}phishcheck <url>\n\n${FOOTER}`); }
        await react('🎣');
        try {
            const data = await apiGet('/api/security/phish', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🎣 *Phish Check: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 35. METADATA EXTRACT
commands.push({
    name: 'metadata',
    description: 'Extract webpage metadata',
    aliases: ['meta', 'pagemeta'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const url = args[0];
        if (!url) { await react('ℹ️'); return reply(`📋 *METADATA*\n\n*Usage:* ${config.PREFIX}metadata <url>\n\n${FOOTER}`); }
        await react('📋');
        try {
            const data = await apiGet('/api/security/metadata', { url });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `📋 *Metadata: ${url}*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// 36. HASH GENERATE (Security)
commands.push({
    name: 'hashgenerate',
    description: 'Generate hash with algorithm',
    aliases: ['genhash', 'hashgen2'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const text = args.join(' ');
        if (!text) { await react('ℹ️'); return reply(`🔒 *HASH GENERATE*\n\n*Usage:* ${config.PREFIX}hashgenerate <text> [algorithm]\n*Algorithms:* md5, sha1, sha256, sha512\n\n${FOOTER}`); }
        await react('🔒');
        try {
            const data = await apiGet('/api/security/hash-generate', { text });
            const result = formatResult(data.result);
            await sendButtonsMsg(sock, from, `🔒 *Hash Generated*\n\n${result}\n\n📡 ${CREATOR}\n\n${FOOTER}`, msg, [
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy', copy_code: result }) }
            ]);
            await react('✅');
        } catch (e) { await react('❌'); await reply(`❌ *Failed*\n\n${FOOTER}`); }
    }
});

// ==================== SECURITY HELP ====================

// 37. SECURITY HELP
commands.push({
    name: 'securityhelp',
    description: 'Show all security commands',
    aliases: ['security', 'sec', 'pentest'],
    async execute({ msg, from, sender, args, bot, sock, react, reply }) {
        const p = config.PREFIX;
        const help = `🛡️ *𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 𝐓𝐎𝐎𝐋𝐒 (𝟑𝟔)*\n\n` +
            `*🌐 𝐃𝐎𝐌𝐀𝐈𝐍 / 𝐃𝐍𝐒*\n${p}whois | ${p}dnslookup | ${p}subdomainscan\n${p}reverseip\n\n` +
            `*📍 𝐈𝐏 / 𝐍𝐄𝐓𝐖𝐎𝐑𝐊*\n${p}geoip | ${p}portscan | ${p}openports\n${p}pinghost | ${p}latency | ${p}traceroute\n${p}asn | ${p}maclookup | ${p}ipinfo\n\n` +
            `*🔒 𝐒𝐒𝐋 / 𝐓𝐋𝐒*\n${p}ssl | ${p}tls\n\n` +
            `*📋 𝐇𝐓𝐓𝐏 / 𝐇𝐄𝐀𝐃𝐄𝐑𝐒*\n${p}httpheaders | ${p}securityheaders\n\n` +
            `*🛡️ 𝐖𝐄𝐁 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘*\n${p}wafdetect | ${p}firewall\n\n` +
            `*⚠️ 𝐕𝐔𝐋𝐍𝐄𝐑𝐀𝐁𝐈𝐋𝐈𝐓𝐘*\n${p}xss | ${p}sqli | ${p}csrf\n${p}clickjack | ${p}directoryscan\n${p}exposedfiles | ${p}misconfig\n\n` +
            `*🔍 𝐒𝐈𝐓𝐄 𝐀𝐍𝐀𝐋𝐘𝐒𝐈𝐒*\n${p}robots | ${p}sitemap | ${p}cmsdetect\n${p}techstack | ${p}cookiescan\n${p}redirects | ${p}urlscan\n${p}phishcheck | ${p}metadata\n\n` +
            `*🔒 ${p}hashgenerate*\n\n` +
            `📡 Powered by ${CREATOR}\n\n${FOOTER}`;
        await sendButtonsMsg(sock, from, help, msg);
        await react('✅');
    }
});

module.exports = { commands };
