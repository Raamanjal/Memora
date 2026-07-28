import * as cheerio from 'cheerio';
import * as _pdfParse from 'pdf-parse';
const pdfParse = (_pdfParse as any).default || _pdfParse;
import { YoutubeTranscript } from 'youtube-transcript';


export async function scrapeWebPage(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract metadata to provide top-level context for all chunks
        const pageTitle = $('title').text().trim() || 'Untitled Page';
        const description = $('meta[name="description"]').attr('content')?.trim() || '';

        // 1. Aggressive junk removal (added sidebars and comment sections)
        $('script, style, noscript, iframe, img, svg, video, audio, footer, header, nav, aside, .ad, .advertisement, #comments, .comments, .sidebar').remove();

        // 2. Identify the main content area
        let mainContent = $('article');
        if (mainContent.length === 0) {
            mainContent = $('main');
        }
        if (mainContent.length === 0) {
            mainContent = $('[role="main"]');
        }
        if (mainContent.length === 0) {
            mainContent = $('body');
        }

        // 3. Pro-Trick: Markdown-style formatting injection for superior RAG context
        // This converts HTML structure into Markdown, which LLMs understand perfectly.

        // Format Headers
        $('h1').prepend('# ').append('\n\n');
        $('h2').prepend('## ').append('\n\n');
        $('h3').prepend('### ').append('\n\n');
        $('h4, h5, h6').prepend('#### ').append('\n\n');

        // Format Lists
        $('li').prepend('- ').append('\n');
        $('ul, ol').append('\n\n');

        // Format Tables
        $('tr').append('\n');
        $('td, th').append(' | ');
        $('table').append('\n\n');

        // Format Paragraphs
        $('p').append('\n\n');

        // Emphasize bold text slightly
        $('strong, b').prepend('**').append('**');

        // 4. Extract raw text
        let extractedText = mainContent.text();

        // 5. Final Cleanup
        extractedText = extractedText
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/[ \t]+/g, ' ')     // Collapse multiple spaces
            .trim();

        // 6. Prepend Metadata Context (Crucial for AI to know what article it's reading)
        let finalContext = `# ${pageTitle}\n`;
        if (description) {
            finalContext += `> ${description}\n\n`;
        }
        finalContext += extractedText;

        return finalContext;

    } catch (error) {
        console.error(`Error scraping webpage (${url}):`, error);
        throw new Error("Failed to extract content from the webpage.");
    }
}

/**
 * Downloads and extracts text from a PDF file.
 */
export async function scrapePdf(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        // We must fetch PDFs as ArrayBuffers, not raw text
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const pdfData = await pdfParse(buffer);
        let text = pdfData.text;

        // PDF text cleanup: PDFs often have broken words across lines (e.g. "hyphen-\nation")
        // and excessive whitespace. This cleans it up for better chunks.
        text = text
            .replace(/-\n/g, '') // Fix hyphenated line breaks
            .replace(/\n+/g, '\n') // Collapse excessive newlines
            .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
            .trim();

        return text;
    } catch (error) {
        console.error(`Error scraping PDF (${url}):`, error);
        throw new Error("Failed to extract content from the PDF.");
    }
}

/**
 * Extracts the transcript from a YouTube video.
 */
export async function scrapeYoutubeVideo(url: string): Promise<string> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(url);

        // Combine transcript pieces into a clean, flowing text string
        let text = transcriptItems.map(item => item.text.replace(/\n/g, ' ')).join(' ');

        // Final whitespace cleanup
        text = text.replace(/\s{2,}/g, ' ').trim();

        return text;
    } catch (error) {
        console.error(`Error scraping YouTube video (${url}):`, error);
        throw new Error("Failed to extract transcript from the YouTube video. (Note: The video must have captions enabled)");
    }
}

/**
 * Master extractor function. You can call this from your controller!
 */
export async function extractContentText(url: string, type: 'article' | 'video' | 'pdf' | 'audio' | 'tweet' | 'image'): Promise<string> {
    switch (type) {
        case 'article':
            return await scrapeWebPage(url);
        case 'video':
            return await scrapeYoutubeVideo(url);
        case 'pdf':
            return await scrapePdf(url);
        case 'tweet':
            // Usually, Twitter requires an API, but we can try normal scraping as a fallback
            return await scrapeWebPage(url);
        default:
            throw new Error(`Content extraction for type '${type}' is not supported yet.`);
    }
}
