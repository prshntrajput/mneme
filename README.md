# Mneme — AI Memory Layer for Your Browser Tabs

> _Close every tab. Forget nothing._

Mneme is a Chrome extension + web dashboard that automatically captures, understands, and remembers everything you browse — so you can finally close those 600 tabs without losing your mind.

**Live dashboard:** [mneme-web.vercel.app](https://mneme-web.vercel.app)

---

## What it does

- **Auto-saves tabs** as you browse — on load, on close, on inactivity
- **AI summaries** — every saved tab gets a summary and key points (powered by Gemini)
- **Smart categorization** — automatically sorts tabs into categories like Coding, Research, Shopping, etc.
- **Semantic search** — search by meaning, not just keywords ("that React auth article")
- **Smart Collections** — AI groups related tabs into projects automatically
- **Session restore** — bring back any past browsing session in one click

---

## Install the Extension

### Option 1 — Download from GitHub Releases (recommended)

1. Go to [Releases](https://github.com/prshntrajput/mneme/releases)
2. Download `mneme-extension.zip`
3. Unzip it — you get a `dist` folder
4. Open Chrome → go to `chrome://extensions`
5. Enable **Developer mode** (toggle in top-right)
6. Click **Load unpacked** → select the `dist` folder
7. The Mneme icon appears in your toolbar — click it and sign in with Google

### Option 2 — Download the ZIP directly from this repo

1. Go to [`apps/extension/mneme-extension.zip`](https://github.com/prshntrajput/mneme/raw/main/apps/extension/mneme-extension.zip)
2. Follow steps 3–7 above

---

## Using Mneme

1. **Sign in** — click the extension icon → Sign in with Google
2. **Browse normally** — tabs are saved automatically in the background
3. **Open the dashboard** — [mneme-web.vercel.app](https://mneme-web.vercel.app) to search and manage your saved tabs
4. **Search** — use the search bar to find any tab by topic, not just URL or title

---

## Tech Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Extension       | Chrome MV3, TypeScript, React, Vite                   |
| Web dashboard   | Next.js 14, TailwindCSS, shadcn/ui                    |
| Database        | Supabase (Postgres + pgvector)                        |
| Auth            | Supabase Auth + Google OAuth                          |
| AI              | Google Gemini (summaries, categorization, embeddings) |
| Background jobs | Inngest                                               |
| Hosting         | Vercel                                                |

---

## Run Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- An [Inngest](https://inngest.com) account

### Setup

```bash
# Clone the repo
git clone https://github.com/prshntrajput/mneme.git
cd mneme

# Install dependencies
npm install

# Copy env file and fill in your keys
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Run the web app + Inngest dev server
npm run dev

# In a separate terminal, build the extension
cd apps/extension
npm run build
# Load apps/extension/dist as unpacked extension in Chrome
```

### Database

Run the migrations against your Supabase project:

```bash
npx supabase db push
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT
