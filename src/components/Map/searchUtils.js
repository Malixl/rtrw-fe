/*
 * Search utilities for MapSidebar
 * - fuzzyMatch(query, text): simple in-order fuzzy match (case-insensitive)
 * - highlightParts(text, query): returns array of { text, match } parts to render highlights
 * - filterTree(treeData, query, options): returns filtered nodes (parents with matching children or parent matches)
 */

export function normalize(s = '') {
    return String(s || '').toLowerCase();
}

export function fuzzyMatch(query = '', text = '') {
    const q = normalize(query);
    const t = normalize(text);
    if (!q) return true;
    
    // Fast path: exact substring
    if (t.includes(q)) return true;
    
    // Multi-word strict match: all words in query must exist in text
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
        return words.every(word => t.includes(word));
    }
    
    return false;
}

export function highlightParts(text = '', query = '') {
    const t = String(text || '');
    const q = String(query || '').trim();
    if (!q) return [{ text: t, match: false }];

    const lowT = t.toLowerCase();
    const lowQ = q.toLowerCase();

    // If substring present, highlight entire matching substrings
    if (lowT.includes(lowQ)) {
        const escaped = lowQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'ig');
        const parts = String(t).split(regex);
        return parts.map((part) => ({ text: part, match: part.toLowerCase() === lowQ }));
    }

    // Otherwise, fallback to in-order per-character highlight
    const parts = [];
    let qi = 0;
    let current = '';
    let currentMatch = false;
    for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        const isMatch = qi < lowQ.length && ch.toLowerCase() === lowQ[qi];
        if (isMatch) {
            // flush current non-match
            if (current && !currentMatch) parts.push({ text: current, match: false });
            // push matching char
            parts.push({ text: ch, match: true });
            current = '';
            currentMatch = false;
            qi += 1;
        } else {
            current += ch;
            currentMatch = false;
        }
    }
    if (current) parts.push({ text: current, match: false });

    return parts;
}

export function filterTree(treeData = [], query = '') {
    if (!query) return treeData;
    const q = query.trim().toLowerCase();
    
    function filterNodes(nodes) {
        if (!Array.isArray(nodes)) return [];
        return nodes.reduce((acc, node) => {
            const nodeMatches = 
                fuzzyMatch(q, node.title || node.nama || '') || 
                fuzzyMatch(q, node.deskripsi || '') ||
                fuzzyMatch(q, node.geojson_file || '');
                
            let matchedChildren = [];
            if (node.children && node.children.length > 0) {
                matchedChildren = filterNodes(node.children);
            }
            
            if (nodeMatches || matchedChildren.length > 0) {
                if (nodeMatches) {
                    acc.push(node);
                } else {
                    acc.push({ ...node, children: matchedChildren });
                }
            }
            return acc;
        }, []);
    }
    
    return filterNodes(treeData);
}
/**
 * Filter a flat list of items by query against provided keys (defaults to ['name','nama']).
 * Returns the filtered array.
 */
export function filterList(items = [], query = '', keys = ['name', 'nama']) {
    if (!query) return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
        for (const k of keys) {
            const v = (it[k] || '').toString();
            if (v && fuzzyMatch(q, v)) return true;
        }
        // also check nested descriptives
        if (it.deskripsi && fuzzyMatch(q, it.deskripsi)) return true;
        return false;
    });
}