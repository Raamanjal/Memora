# Brainly 🧠

Brainly is a full-stack **personal knowledge-management / second-brain application**. It allows you to register, save web links or PDFs, organize them with tags, share a read-only public collection, and prepare saved material for Retrieval-Augmented Generation (RAG) using AI.

## 🌟 Features

- **Save Anywhere**: Store articles, YouTube videos, tweets, and upload PDFs.
- **AI-Powered Organization**: Automatically extracts text, generates summaries, and categorizes content using Gemini AI.
- **Smart Search (RAG)**: Uses MongoDB Atlas Vector Search and Gemini embeddings for semantic search capabilities across your saved knowledge.
- **Tagging System**: Organize your content with custom tags for easy retrieval.
- **Public Sharing**: Generate read-only shareable links for your curated collections.
- **Secure Authentication**: JWT-based authentication to keep your second brain private.

## 🛠️ Tech Stack

**Frontend (Client)**
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Axios

**Backend (Server)**
- Node.js + Express 5
- TypeScript
- MongoDB Atlas & Mongoose
- Google GenAI (Gemini)
- Cloudinary (for PDF storage)
- Zod (Validation), JWT & bcrypt (Auth)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (with Vector Search capabilities)
- [Google Gemini API Key](https://aistudio.google.com/)
- [Cloudinary](https://cloudinary.com/) account for PDF hosting

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd brainly
```

### 2. Backend Setup

Navigate to the Server directory:
```bash
cd Server
npm install
```

Create a `.env` file in the `Server` directory with the following variables:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_AI_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal and navigate to the Client directory:
```bash
cd Client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application frontend will typically be accessible at `http://localhost:5173` while the backend runs on `http://localhost:4000`.

## 🏗️ Architecture Overview

The application separates two main concerns:
1. **Content Library:** Handles the CRUD operations for saving, displaying, tagging, deleting, and sharing your material.
2. **AI Knowledge Pipeline:** Extracts text from your saved content (via scraping, PDF parsing, or YouTube transcripts), summarizes it, chunks it, generates embeddings with Gemini, and stores vectors in MongoDB Atlas Vector Search.

For a comprehensive deep dive into the architecture, database design, system flows, and APIs, please refer to the [architecture.md](./architecture.md) document.


## 📄 License

This project is licensed under the ISC License.
