// Megan-Prime LID Resolver - 3-Layer LID to JID Resolution
const { getLidMapping, getLidMappingWithFallback, storeLidMapping } = require('./groupCache');
const { persistLidMapping, getLidMappingFromDb } = require('../database/lidMapping');

class LidResolver {
    constructor(bot) {
        this.bot = bot;
        this.sock = bot?.sock;
        this.cache = new Map();
        this.cacheTTL = 24 * 60 * 60 * 1000;
    }

    async resolveRealJid(jid) {
        if (!jid) return null;
        if (!jid.endsWith('@lid')) {
            return this.normalizeJid(jid);
        }
        const cached = getLidMapping(jid);
        if (cached) { return cached; }
        const localCached = this.cache.get(jid);
        if (localCached && (Date.now() - localCached.timestamp) < this.cacheTTL) {
            return localCached.jid;
        }
        try {
            const fromDb = await getLidMappingFromDb(jid);
            if (fromDb) {
                storeLidMapping(jid, fromDb);
                this.cache.set(jid, { jid: fromDb, timestamp: Date.now() });
                return fromDb;
            }
        } catch (err) {}
        try {
            if (this.sock && typeof this.sock.getJidFromLid === 'function') {
                const resolved = await this.sock.getJidFromLid(jid);
                if (resolved && resolved.endsWith('@s.whatsapp.net')) {
                    storeLidMapping(jid, resolved);
                    persistLidMapping(jid, resolved, 'api').catch(() => {});
                    this.cache.set(jid, { jid: resolved, timestamp: Date.now() });
                    return resolved;
                }
            }
        } catch (err) {}
        return jid;
    }

    async resolveParticipantJid(participant, groupMetadata = null) {
        if (!participant) return null;
        if (groupMetadata && groupMetadata.participants && participant.endsWith('@lid')) {
            const found = groupMetadata.participants.find(p =>
                p.lid === participant || p.id === participant
            );
            if (found) {
                const jid = found.pn || found.jid || found.phoneNumber;
                if (jid && jid.endsWith('@s.whatsapp.net')) {
                    storeLidMapping(participant, jid);
                    return jid;
                }
            }
        }
        return await this.resolveRealJid(participant);
    }

    normalizeJid(jid) {
        if (!jid) return null;
        let jidStr = String(jid);
        jidStr = jidStr.split(':')[0];
        jidStr = jidStr.split('/')[0];
        if (jidStr.endsWith('@lid')) {
            return jidStr.toLowerCase();
        }
        if (!jidStr.includes('@')) {
            jidStr = jidStr + '@s.whatsapp.net';
        }
        if (!jidStr.endsWith('@s.whatsapp.net') && !jidStr.endsWith('@g.us')) {
            const phoneMatch = jidStr.match(/(\d+)/);
            if (phoneMatch) {
                jidStr = phoneMatch[1] + '@s.whatsapp.net';
            }
        }
        return jidStr.toLowerCase();
    }

    extractPhoneNumber(jid) {
        if (!jid) return null;
        const normalized = this.normalizeJid(jid);
        const phoneMatch = normalized.match(/(\d+)/);
        return phoneMatch ? phoneMatch[1] : null;
    }

    isLid(jid) { return jid && jid.endsWith('@lid'); }

    getCachedJid(lid) { return getLidMapping(lid) || this.cache.get(lid)?.jid; }

    setOwnerJids(ownerJid, ownerLid) {
        this.ownerJid = ownerJid;
        this.ownerLid = ownerLid;
        if (ownerLid) {
            storeLidMapping(ownerLid, ownerJid);
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 LID resolver cache cleared');
    }

    getStats() {
        return {
            localCacheSize: this.cache.size,
            globalCacheSize: require('./groupCache').lidToJidStore?.keys()?.length || 0
        };
    }
}

let instance = null;

function getLidResolver(bot) {
    if (!instance) {
        instance = new LidResolver(bot);
    }
    return instance;
}

async function resolveRealJid(sock, jid) {
    const resolver = new LidResolver({ sock });
    return await resolver.resolveRealJid(jid);
}

module.exports = {
    LidResolver,
    getLidResolver,
    resolveRealJid
};
