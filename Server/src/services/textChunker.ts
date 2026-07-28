


export function chunkWithOverlap(text: string, chunkSize = 400, overlap = 100) {
    text = text.replace(/\s+/g, ' ').trim();
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        chunks.push(
            words.slice(i, i + chunkSize).join(" ")
        );
    }

    return chunks;
}