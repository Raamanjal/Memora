

/**
 * @param text The raw text to chunk
 * @param chunkSize Maximum number of words per chunk
 * @param overlap Number of words to overlap between consecutive chunks
 * @returns Array of text chunks
 */
export function chunkWithOverlap(text: string, chunkSize = 400, overlap = 100): string[] {
    if (!text || text.trim() === '') return [];

    // This allows us to count words while keeping the exact spaces, tabs, and newlines attached to them!
    const tokens = text.match(/\S+\s*/g) || [];

    const chunks: string[] = [];

    const step = Math.max(1, chunkSize - overlap);

    for (let i = 0; i < tokens.length; i += step) {
        // Slice the tokens for the current chunk
        const chunkTokens = tokens.slice(i, i + chunkSize);

        // Join them back together and trim any dangling whitespace at the ends
        chunks.push(chunkTokens.join("").trim());
    }

    return chunks;
}