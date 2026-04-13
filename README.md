# 🍳 CookNook

A cozy family recipe book with AI-powered meal suggestions.

**Stack:** React + Vite · Tailwind CSS · Supabase · Claude API · Vercel

---

## Getting started

### 1. Clone & install

```bash
git clone <your-repo>
cd cooknook
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it
3. Go to **Project Settings → API** and copy your project URL and anon key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your three environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Every `git push` to your main branch auto-deploys. That's it.

---

## Features

- 📖 **Recipes** — save full recipes with ingredients, steps, notes, tags, and season
- 🧅 **Pantry** — track your favourite ingredients and what you have in stock
- ✨ **Suggestions** — AI picks what to cook based on season, diversity, pantry, pairings, and more
- 📅 **History** — log every cook, see weekly calorie averages
- 🔥 **Calorie tracking** — per-portion and per-100g, with AI estimation from ingredients

## Adding auth later

When you're ready to add login:

1. Enable **Email auth** in Supabase → Authentication
2. Install: `npm install @supabase/auth-ui-react`
3. Wrap `<App>` with a session check
4. Enable **Row Level Security** on all tables and add user-scoped policies

---

## Project structure

```
src/
  pages/         # One file per route
  hooks/         # Data fetching (useRecipes, useIngredients, useCookLog)
  components/
    layout/      # Nav + Layout wrapper
    ui/          # Shared components (Button, Tag, EmptyState…)
  lib/
    supabase.js  # Client init
    utils.js     # Season detection, calorie helpers, date formatting
```
