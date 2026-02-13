/**
 * Fuzzy search utility for finding items by partial string matches
 */
export interface SearchResult<T> {
    item: T;
    score: number;
    matches: string[];
}
/**
 * Calculate similarity score between two strings (0-1, where 1 is exact match)
 */
export declare function stringSimilarity(str1: string, str2: string): number;
/**
 * Check if search query matches text with word boundary awareness
 */
export declare function matchesQuery(text: string, query: string): boolean;
/**
 * Fuzzy search items by a getter function that extracts searchable text
 */
export declare function fuzzySearch<T>(items: T[], query: string, getter: (item: T) => string | string[], options?: {
    threshold?: number;
    limit?: number;
}): SearchResult<T>[];
/**
 * Find best match from items using fuzzy search
 * Returns null if no match above threshold
 */
export declare function findBestMatch<T>(items: T[], query: string, getter: (item: T) => string | string[], threshold?: number): T | null;
/**
 * Find all matches above threshold
 */
export declare function findMatches<T>(items: T[], query: string, getter: (item: T) => string | string[], threshold?: number): T[];
//# sourceMappingURL=search.d.ts.map