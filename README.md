# Ngirit 💰

**Biar dompet gak nangis di akhir bulan** 💸

**Version 4.0.0** - Phase 2 Complete

A modern financial expense tracking application built with Nuxt 4, TypeScript, Supabase, and Pinia. Features family sharing, real-time updates, and smart expense parsing.

## 🚀 Quick Start

This project uses **pnpm** as the package manager.

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Coding guidelines, architecture, and patterns
- **[ROADMAP.md](./docs/ROADMAP.md)** - Development phases and planned features
- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Completed features and implementation history
- **[SEO Guide](./docs/SEO_GUIDE.md)** - SEO implementation and best practices
- **[SEO Analysis](./docs/SEO_ANALYSIS.md)** - Nuxt 4.x vs Nuxt SEO module comparison
- **[Realtime Guide](./docs/REALTIME_TESTING.md)** - Realtime subscriptions testing guide

## ✨ Features

### Phase 1: Foundation ✅
- Google OAuth authentication with Supabase
- Role-based access control (superadmin, manager, user)
- Mobile-first responsive design
- API versioning (`/api/v1/*`)

### Phase 2: Transaction Management ✅ (Completed Oct 26, 2025)
- Real-time expense tracking dashboard with live updates
- Smart natural language expense parser ("Makan 35000" → parsed automatically)
- Today's expenses & monthly summaries
- Family sharing with realtime member sync
- Permission system (owner/manager/user)
- Decimal.js for accurate financial calculations
- Comprehensive SEO implementation (Open Graph, Twitter Cards, structured data)
- Polished Bahasa Indonesia copywriting

### Phase 3: AI & Settings 🚀 (Next Up)
- OpenAI-powered expense parser
- Category management
- Daily budget tracking
- User preferences

## 🛠️ Tech Stack

- **Framework:** Nuxt 4.1.3 (Vue 3.5.22)
- **Package Manager:** pnpm 10.18.1+
- **UI:** Nuxt UI 4.0.1 (Tailwind CSS 4.1.14)
- **Database:** Supabase (PostgreSQL + RLS)
- **State:** Pinia 3.0.3
- **Auth:** Supabase Auth (@nuxtjs/supabase 2.0.0)
- **Financial Calculations:** Decimal.js

## 📦 Scripts

```bash
# Development
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm preview            # Preview production build

# Data Migration (Superadmin)
pnpm firestore:fetch    # Fetch from Firebase Firestore
pnpm mysql:fetch        # Parse MySQL dump
pnpm data:merge         # Merge datasets

# Database
supabase gen types typescript --local > utils/constants/database.ts
```

## 🗂️ Project Structure

```
ngirit/
├── components/         # Vue components (kebab-case)
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard widgets
│   └── profile/       # Profile page widgets
├── composables/       # Vue composables (useFinancial, etc.)
├── pages/             # Auto-routed pages
│   ├── index.vue      # Login page (/)
│   ├── dashboard.vue  # Main dashboard
│   └── profile.vue    # User profile
├── server/api/v1/     # API endpoints (versioned)
├── stores/            # Pinia stores (auth, transaction)
├── supabase/
│   ├── migrations/    # 7 database migrations
│   └── data/          # Migration data
└── utils/constants/   # Type definitions (database, user, transaction, family)
```

## 🔒 Security & Privacy

- All sensitive files blocked via `.claudeignore`
- Environment variables in `.env` (never committed)
- RLS policies on all database tables
- SECURITY DEFINER functions to avoid infinite recursion
- Soft delete pattern (no hard deletes)

## 🌐 Environment Variables

See `.env.example` for required variables:

- `NUXT_PUBLIC_HOST` - Application host URL
- `SUPABASE_URL`, `SUPABASE_KEY` - Public Supabase credentials
- `SUPABASE_SERVICE_KEY` - Server-side service key
- Optional: Google Auth, Firebase credentials

## 📱 Language

- **User-facing text:** Bahasa Indonesia
- **Code & documentation:** English
- **Variable/function names:** English

## 🤝 Contributing

This is a personal project. For coding guidelines, please refer to [CLAUDE.md](./CLAUDE.md).

## 📄 License

MIT

---

Built with ❤️ using [Nuxt](https://nuxt.com) and [Supabase](https://supabase.com)
