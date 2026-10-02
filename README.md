# 💎 FinCraft: Personal Wealth & Expense Tracker

> A zero-cost, production-ready, mobile-first Progressive Web App (PWA) for tracking expenses, debts, savings, and getting AI-powered financial advice.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 8 |
| Styling | Tailwind CSS 3 |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI Advisor | Google Gemini 2.5 Flash (free tier) |
| Charts | Recharts |
| PWA | vite-plugin-pwa + Workbox |
| Routing | React Router v6 |

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Set Up Supabase Database

1. Create free project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/migrations/20260101000000_init_schema.sql`
3. Copy Project URL + anon key from Settings → API

### 4. Get Gemini API Key (Free)

Visit [ai.google.dev](https://ai.google.dev) — free tier: 15 req/min, 1M tokens/day

### 5. Run

```bash
npm run dev
```

> **The app works without credentials** — demo mode loads realistic sample data automatically!

---

## 📱 Features

| Module | Features |
|--------|---------|
| 🏠 **Dashboard** | Net worth hero, income/expense split, savings rate, live currency ticker, AI risk alerts |
| 💳 **Expenses** | Add income/expense, 12 categories, donut chart breakdown, searchable list |
| 💰 **Debt Tracker** | Track owe/owed, repayment progress, overdue alerts, mark paid |
| 🏦 **Savings** | Bank accounts, FDs, investments, 12-month projection chart |
| 🤖 **AI Advisor** | Streaming Gemini chat, financial context, suggested prompts, risk analysis |
| ⚙️ **Settings** | 12 currencies, profile, sign out |

---

## 🔒 Security

- Supabase **Row Level Security** on all tables
- Users only access their own data
- No third-party analytics

---

## 🌐 Production Deployment (Zero Cost)

| Service | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth |
| Supabase | 500MB DB, 50K MAU |
| Gemini API | 1M tokens/day |

```bash
# Vercel
npm i -g vercel && vercel --prod

# or build and drop dist/ on Netlify
npm run build
```

---

## 📋 Demo Mode

No signup needed — the app shows realistic demo data immediately. Sign up to persist real data to Supabase.
