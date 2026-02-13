"use strict";
/**
 * Fuzzy search utility for finding items by partial string matches
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringSimilarity = stringSimilarity;
exports.matchesQuery = matchesQuery;
exports.fuzzySearch = fuzzySearch;
exports.findBestMatch = findBestMatch;
exports.findMatches = findMatches;
/**
 * Calculate similarity score between two strings (0-1, where 1 is exact match)
 */
function stringSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2)
        return 1.0;
    if (s1.length === 0 || s2.length === 0)
        return 0.0;
    if (s1.includes(s2) || s2.includes(s1))
        return 0.9;
    // Calculate Levenshtein distance-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}
/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    if (m === 0)
        return n;
    if (n === 0)
        return m;
    const matrix = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++)
        matrix[i][0] = i;
    for (let j = 0; j <= n; j++)
        matrix[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[m][n];
}
/**
 * Extract words from a string
 */
function extractWords(str) {
    return str.toLowerCase().split(/\s+/).filter(w => w.length > 0);
}
/**
 * Check if search query matches text with word boundary awareness
 */
function matchesQuery(text, query) {
    const textWords = extractWords(text);
    const queryWords = extractWords(query);
    if (queryWords.length === 0)
        return true;
    // Check if all query words match (either as full word or prefix)
    return queryWords.every(qw => textWords.some(tw => tw === qw || tw.startsWith(qw)));
}
/**
 * Fuzzy search items by a getter function that extracts searchable text
 */
function fuzzySearch(items, query, getter, options = {}) {
    const { threshold = 0.3, limit } = options;
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
        return items.map(item => ({ item, score: 1, matches: [] }));
    }
    const results = [];
    for (const item of items) {
        const getterResult = getter(item);
        const searchTexts = Array.isArray(getterResult) ? getterResult : [getterResult];
        let bestScore = 0;
        const matches = [];
        for (const text of searchTexts) {
            const normalizedText = text.toLowerCase().trim();
            // Check for exact match
            if (normalizedText === normalizedQuery) {
                bestScore = 1.0;
                matches.push(text);
                break;
            }
            // Check for substring match
            if (normalizedText.includes(normalizedQuery)) {
                bestScore = Math.max(bestScore, 0.95);
                matches.push(text);
                continue;
            }
            // Check for word boundary matches
            if (matchesQuery(text, query)) {
                bestScore = Math.max(bestScore, 0.85);
                matches.push(text);
                continue;
            }
            // Calculate fuzzy similarity
            const similarity = stringSimilarity(text, query);
            if (similarity >= threshold) {
                bestScore = Math.max(bestScore, similarity);
                matches.push(text);
            }
        }
        if (bestScore > 0) {
            results.push({ item, score: bestScore, matches });
        }
    }
    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    return limit ? results.slice(0, limit) : results;
}
/**
 * Find best match from items using fuzzy search
 * Returns null if no match above threshold
 */
function findBestMatch(items, query, getter, threshold = 0.5) {
    const results = fuzzySearch(items, query, getter, { threshold, limit: 1 });
    return results.length > 0 ? results[0].item : null;
}
/**
 * Find all matches above threshold
 */
function findMatches(items, query, getter, threshold = 0.3) {
    const results = fuzzySearch(items, query, getter, { threshold });
    return results.map(r => r.item);
}
//# sourceMappingURL=search.js.map