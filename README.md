Memora

Memora is a full-stack **personal knowledge-management / second-brain application**. It allows you to register, save web links, documents, and videos, organize them with tags, and share read-only public collections. Additionally, it features a powerful AI integration that prepares saved material for Retrieval-Augmented Generation (RAG), enabling smart semantic search and question-answering over your saved knowledge base.

---

## 🚀 Getting Started (How to Use It)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (with Vector Search index configured)
- [Google Gemini API Key](https://aistudio.google.com/) for embeddings and AI chat
- [Cloudinary](https://cloudinary.com/) account for PDF hosting

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd memora
```

### 2. Backend Setup
```bash
cd Server
npm install
```
Create a `.env` file in the `Server` directory:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_AI_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```
Run the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Client
npm install
npm run dev
```
The app will be accessible at `http://localhost:5173`. 

---

## 🌟 Features

Memora is split into Manual Features (standard second-brain organization) and AI Features (intelligent insights and search).

### 📝 Manual Features
- **Save Content:** Store web links, YouTube videos, tweets, and upload PDFs.
- **Tagging System:** Create custom tags and categorize your content for easy visual retrieval.
- **Dashboard:** A unified grid view of all your saved knowledge.
- **Public Sharing:** Generate unique, secure, read-only links to share specific collections of your "brain" with others.
- **Authentication:** Secure JWT-based signup and login system.

### 🤖 AI Features
- **Auto-Detection:** Automatically detect and assign relevant titles and tags to your content when you paste a generic link.
- **Semantic Search:** Search your content by *meaning* rather than exact keywords (e.g., searching "how to learn programming" will find a video about "JavaScript basics").
- **Question & Answering (Q&A):** Ask questions directly to your second brain, and the AI will synthesize an answer using only the context of the articles and videos you have saved.

---

## 🧠 AI Pipeline & RAG Pipeline

Memora utilizes a state-of-the-art **Retrieval-Augmented Generation (RAG)** pipeline to power its semantic search and Q&A features.

### 1. Extraction & Cleaning (Data Ingestion)
When you add a supported link, the server uses targeted scrapers (`cheerio`, `youtube-transcript`, `pdf-parse`) to extract the raw text. 
- HTML is stripped of ads, sidebars, and junk.
- Text is dynamically converted into Markdown format, which Large Language Models (LLMs) understand best.

### 2. Chunking
Because documents are too large to process all at once, the `textChunker.ts` service splits the extracted Markdown into smaller, semantically meaningful chunks (typically 1000-1500 characters).

### 3. Embeddings (Vectorization)
Each text chunk is sent to the **Google Gemini API** (`text-embedding-004`), which converts the text into a dense mathematical vector array (embeddings). 

### 4. Vector Storage
These vector arrays, along with a reference to the original document, are stored in **MongoDB Atlas**. A Vector Search Index is utilized to allow lightning-fast neighbor searches.

### 5. Retrieval & Generation (The RAG Query)
- **Search:** When a user types a search query or asks a question, their query is converted into a vector. MongoDB performs a Vector Search (Cosine Similarity) to find the top most relevant chunks of text across the user's entire database.
- **Answer Synthesis:** For Q&A, the retrieved chunks are bundled as "Context" and fed to the Gemini AI chat model. The AI reads your specific saved content and generates an accurate, hallucination-free response based *only* on your personal second brain.

---

## 📄 Supported Documents

### For Standard Saving (Manual Organization)
You can save and manually tag the following types of content (supported by the database schema):
- Articles / Web Pages
- YouTube Videos
- Twitter (X) Tweets
- Uploaded PDFs
- Images
- Audio Links

### For AI Semantic Search & Q&A
To generate text embeddings and be searchable via natural language, the application specifically supports deep text-extraction for the following formats:
- **Articles & Blogs:** Full extraction of main body text, converted to markdown format.
- **YouTube Videos:** Extracts full closed captions/transcripts directly from the video URL.
- **PDFs:** Extracts raw text from uploaded PDF documents (or Google Drive PDF links).
*(Note: Images and raw audio without transcripts are currently excluded from semantic text search).*
