// Megan-Prime Group Cache - Extracts and stores LID mappings from groups
const NodeCache = require('node-cache');
const { persistLidMapping, getLidMappingFromDb } = require('../database/lidMapping');

const groupCache = new NodeCache({
    stdTTL: 5 * 60,
    useClones: false,
    checkperiod: 60
});

const lidToJidStore = new NodeCache({
    stdTTL: 24 * 60 * 60,
    useClones: false,
    checkperiod: 300
});

const storeLidMapping = (lid, jid) => {
    if (lid && jid && lid.endsWith('@lid') && jid.endsWith('@s.whatsapp.net')) {
        lidToJidStore.set(lid, jid);
        persistLidMapping(lid, jid, 'group').catch(() => {});
    }
};

const getLidMapping = (lid) => {
    if (!lid || !lid.endsWith('@lid')) return null;
    return lidToJidStore.get(lid);
};

const updateLidMappingsFromMetadata = (metadata) => {
    if (!metadata?.participants) return;
    let count = 0;
    for (const p of metadata.participants) {
        const lid = p.lid || p.id;
        const jid = p.pn || p.jid || p.phoneNumber;
        if (lid && jid && lid.endsWith('@lid') && jid.endsWith('@s.whatsapp.net')) {
            storeLidMapping(lid, jid);
            count++;
        }
    }
};

const isExpectedError = (errorMsg) => {
    const expectedErrors = ["forbidden", "item-not-found", "not-authorized", "gone", "not found"];
    return expectedErrors.some((e) => errorMsg?.toLowerCase().includes(e));
};

const getGroupMetadata = async (sock, jid) => {
    if (!jid || !jid.endsWith('@g.us')) return null;
    try {
        const cached = groupCache.get(jid);
        if (cached) {
            updateLidMappingsFromMetadata(cached);
            return cached;
        }
        const metadata = await sock.groupMetadata(jid);
        if (metadata) {
            groupCache.set(jid, metadata);
            updateLidMappingsFromMetadata(metadata);
        }
        return metadata;
    } catch (error) {
        if (!isExpectedError(error.message)) {}
        return null;
    }
};

const updateGroupCache = (jid, metadata) => {
    if (jid && metadata) {
        groupCache.set(jid, metadata);
        updateLidMappingsFromMetadata(metadata);
    }
};

const deleteGroupCache = (jid) => { groupCache.del(jid); };

const clearGroupCache = () => {
    groupCache.flushAll();
    console.log('🧹 Group cache cleared');
};

const setupGroupCacheListeners = (sock) => {
    sock.ev.on("groups.update", async ([event]) => {
        try {
            if (event?.id) {
                const metadata = await sock.groupMetadata(event.id);
                updateGroupCache(event.id, metadata);
            }
        } catch (error) {
            deleteGroupCache(event?.id);
            if (!isExpectedError(error.message)) {
                console.error("Group cache update failed:", error.message);
            }
        }
    });
    sock.ev.on("group-participants.update", async (event) => {
        try {
            if (event?.id) {
                const cachedMeta = groupCache.get(event.id);
                if (cachedMeta) {
                    updateLidMappingsFromMetadata(cachedMeta);
                }
                const metadata = await sock.groupMetadata(event.id);
                updateGroupCache(event.id, metadata);
            }
        } catch (error) {
            deleteGroupCache(event?.id);
            if (!isExpectedError(error.message)) {
                console.error("Participant cache update failed:", error.message);
            }
        }
    });
};

const cachedGroupMetadata = async (jid) => { return groupCache.get(jid); };

const initializeLidStore = async (sock) => {
    try {
        console.log('🔄 Initializing LID store...');
        const { loadPersistedLidMappings } = require('../database/lidMapping');
        await loadPersistedLidMappings();
        const groups = await sock.groupFetchAllParticipating();
        if (groups) {
            let groupCount = 0;
            let mappingCount = 0;
            for (const groupJid of Object.keys(groups)) {
                const meta = groups[groupJid];
                if (meta?.participants) {
                    const beforeCount = lidToJidStore.keys().length;
                    updateLidMappingsFromMetadata(meta);
                    groupCache.set(groupJid, meta);
                    groupCount++;
                    mappingCount += lidToJidStore.keys().length - beforeCount;
                }
            }
            console.log(`✅ LID store initialized: ${mappingCount} mappings from ${groupCount} groups`);
            console.log(`📊 Total LID mappings in cache: ${lidToJidStore.keys().length}`);
        }
        return lidToJidStore.keys().length;
    } catch (error) {
        console.error("Failed to initialize LID store:", error.message);
        return 0;
    }
};

const getLidMappingWithFallback = async (lid) => {
    if (!lid || !lid.endsWith('@lid')) return null;
    const cached = getLidMapping(lid);
    if (cached) return cached;
    const fromDb = await getLidMappingFromDb(lid);
    if (fromDb) {
        storeLidMapping(lid, fromDb);
        return fromDb;
    }
    return null;
};

const getLidCacheStats = () => {
    const keys = lidToJidStore.keys();
    const stats = {
        totalMappings: keys.length,
        keys: keys.slice(0, 10),
        groupCacheSize: groupCache.keys().length
    };
    return stats;
};

module.exports = {
    groupCache,
    lidToJidStore,
    getGroupMetadata,
    updateGroupCache,
    deleteGroupCache,
    clearGroupCache,
    setupGroupCacheListeners,
    cachedGroupMetadata,
    getLidMapping,
    storeLidMapping,
    updateLidMappingsFromMetadata,
    initializeLidStore,
    getLidMappingWithFallback,
    getLidCacheStats
};
