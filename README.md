# EmberOS — AI-Powered Portfolio & Blog Engine

EmberOS is a high-performance, aesthetically driven personal portfolio and blog engine built with **Next.js 15**, **Supabase**, and **Groq AI**. It features a custom-built, Google Docs-style rich text editor with deep AI integration and a live dashboard for content management.

![EmberOS Preview](public/preview.png)

## ✨ Features

### 🖋️ Advanced Blog Engine
- **Rich Text Editor**: Custom TipTap-based editor with support for tables, task lists, and code blocks.
- **Mermaid Diagrams**: Live-rendered flowcharts, sequence diagrams, and Gantt charts directly in your posts.
- **Google Photos Integration**: Scroll through and insert photos directly from your Google Photos library.
- **AI writing assistant**: Improve, simplify, expand, or summarize your writing using Groq AI.
- **Categorization**: Multi-category management with color-coded tags and search filtering.

### 🧠 Intelligent Assistant
- **Context-Aware Chatbot**: A floating AI assistant that knows your portfolio and past projects.
- **Deep Memory**: The AI automatically extracts facts from your blog posts to keep your digital profile updated.
- **Reasoning Mode**: Toggle "Deep Reasoning" (DeepSeek R1) for complex queries.

### 📊 Professional Dashboard
- **Live Analytics**: Track visitor counts and read contact messages in real-time.
- **CMS Control**: Full CRUD for blog posts, categories, and AI context memory.
- **Photo Manager**: Connect your Google account to bridge your cloud photos to your portfolio.

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS + Framer Motion
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq SDK (Llama 3 / DeepSeek R1)
- **Editor**: TipTap (ProseMirror)
- **Diagrams**: Mermaid.js

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/emberos.git
cd emberos
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and fill in your keys:
- **Supabase**: URL and Anon Key
- **Groq**: API Key (console.groq.com)
- **EmailJS**: Service/Template IDs for the contact form
- **Google Cloud**: Client ID/Secret for Photos integration

### 3. Database Setup
Run the SQL commands provided in [supabase/SUPABASE_SCHEMA.sql](supabase/SUPABASE_SCHEMA.sql) in your Supabase SQL Editor to create the necessary tables and policies.

### 4. Run Locally
```bash
npm run dev
```

## 🌐 Deployment
This project is optimized for **Vercel**. Connect your repository, add your environment variables in the Vercel dashboard, and deploy.

Don't forget to update your **Google Cloud OAuth Redirect URIs** to your production domain (e.g., `https://yourdomain.com/api/google-photos/callback`).

---

Developed by [Pranay Chandra](https://pranaychandra.dev)
