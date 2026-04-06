# Podium by Zenlyr Labs

AI-powered LinkedIn post creation tool built with React, Vite, and Claude.

## Features

- **5-Step Post Creation Flow** — Topic selection, writing style, AI hook generation, review, and post editor
- **Drafts** — Save, edit, and manage your posts locally
- **Profile** — Upload your LinkedIn PDF to personalize AI-generated content
- **Dark Theme** — Gold accent (#c8a84b), Playfair Display headings, DM Sans body

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Setup

```bash
git clone <repo-url>
cd Podium
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Development

Run with Netlify CLI (recommended, handles serverless functions):

```bash
npx netlify dev
```

Or run the Vite dev server only (API calls won't work without Netlify):

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

Deploy to Netlify and add `ANTHROPIC_API_KEY` as an environment variable in Site Settings > Environment Variables.

## Architecture

```
src/
  components/   Sidebar, StepIndicator
  views/        CreatePost, Drafts, MyProfile
  utils/        api.js (Claude proxy), storage.js (localStorage)
netlify/
  functions/    claude.js (serverless proxy for Anthropic API)
```

## Tech Stack

- React 19 + Vite
- Lucide React (icons)
- Netlify Functions (serverless API proxy)
- Claude API (Anthropic)
