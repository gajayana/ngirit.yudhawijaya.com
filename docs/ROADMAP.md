# Development Roadmap

This document outlines the development phases and planned features for the Ngirit application.

**Current Version:** 4.0.0 (Phase 2 Complete)

## Phase 1: Foundation & Authentication ✅ COMPLETED

**Status:** ✅ Complete (Oct 10, 2025)

- [x] User authentication with Supabase Google OAuth
  - [x] Login page at `/` (root) with Google OAuth button
  - [x] OAuth callback handler at `/confirm`
  - [x] Redirect logic: logged-in users → `/dashboard`, logged-out users → `/`
  - [x] Logout functionality
- [x] API versioning
  - [x] All API routes use `/v1/` prefix (e.g., `/api/v1/user/me`, `/api/v1/assets/*`)
- [x] Mobile-first UI/UX optimization
  - [x] Touch-friendly interfaces (48px+ touch targets)
  - [x] Vertical scroll-optimized layouts
  - [x] Single-handed operation support
  - [x] Safe area padding for notched devices
  - [x] Prevent zoom on input focus (iOS)
- [x] Supabase database initial migrations
- [x] Auth store with role-based access control
- [x] Server API endpoints (all with `/v1/` prefix)

See `docs/CHANGELOG.md` for detailed implementation history.

---

## Phase 2: Transaction Management Dashboard ✅ COMPLETED

**Status:** ✅ Complete (Oct 26, 2025)

**Goal:** Create a functional expense tracking dashboard with CRUD operations, family sharing, and real-time updates

### Core Features

- [x] Decimal.js integration for financial calculations
- [x] Transaction CRUD API endpoints (GET, POST, PUT, DELETE)
- [x] Transaction store with Pinia (centralized state management)
- [x] Dashboard widgets:
  - [x] Expense Summary Card (today & monthly totals)
  - [x] Quick Add Expense Widget (smart parser with natural language)
  - [x] Today's Expenses Widget (list view with edit/delete)
  - [x] Monthly Summary Widget (grouped by description)
- [x] Permission system (RLS + UI checks)

### Family Sharing

- [x] Database schema (families, family_members tables)
- [x] 8 Family API endpoints (CRUD operations)
- [x] Family Management Widget in `/profile`
- [x] Family transaction filtering in dashboard
- [x] Family toggle UI component
- [x] Realtime updates for family member changes

### Realtime Subscriptions (Oct 26, 2025)

- [x] **Core Realtime Composable** (`composables/useRealtime.ts`)
  - Type-safe subscription management
  - Automatic cleanup on unmount
  - Status tracking per channel
  - Debug logging support
- [x] **Transaction Realtime** (store integration)
  - Live INSERT/UPDATE/DELETE events
  - Smart filtering by month and family
  - Automatic category data fetching
  - Duplicate detection
- [x] **Family Member Realtime**
  - Auto-refresh when members join/leave
  - Keeps transaction lists in sync with family membership
- [x] **User Data Realtime** (auth store)
  - Live role changes
  - Live blocked status updates
  - Console warnings for important changes
- [x] **Documentation**
  - Comprehensive testing guide (`docs/REALTIME_TESTING.md`)
  - Technical implementation docs (`docs/REALTIME_IMPLEMENTATION.md`)
  - Quick reference summary (`docs/REALTIME_SUMMARY.md`)

**Note:** Realtime now works with Supabase CLI v2.53.6+

### Copywriting & UX (Oct 26, 2025)

- [x] **Bahasa Indonesia Audit**
  - Eliminated all code-switching (English → Bahasa)
  - Fixed spelling errors ("tau" → "tahu")
  - Improved formality (more conversational tone)
  - 6 code-switching fixes
  - 3 formality improvements
- [x] **Empty States Enhancement**
  - Added personality with emojis and humor
  - More engaging messaging
  - 2 empty state improvements
- [x] **Error Messages**
  - Made error messages helpful with actionable guidance
  - 6 error message improvements
- [x] **UI Polish**
  - Shortened verbose text for mobile
  - Improved placeholder examples
  - Better success messages
  - 3 consistency improvements

### SEO Implementation (Oct 26, 2025)

- [x] **Global SEO Setup** (`app.vue`)
  - HTML lang="id" for Bahasa Indonesia
  - Title templates for consistency
  - Global structured data (Organization, WebApplication)
  - Default Open Graph and Twitter Card tags
- [x] **Page-Specific SEO**
  - Homepage with full Open Graph/Twitter cards
  - Dashboard (noindex for privacy)
  - Profile (noindex for privacy)
  - Canonical URLs on all pages
- [x] **Technical SEO**
  - Enhanced robots.txt with proper rules
  - XML sitemap for search engines
  - SEO constants (`utils/constants/seo.ts`)
  - Helper functions for OG/Twitter tags
- [x] **Documentation**
  - Complete SEO guide (`docs/SEO_GUIDE.md`)
  - Nuxt 4.x vs Nuxt SEO analysis (`docs/SEO_ANALYSIS.md`)

See `docs/CHANGELOG.md` for detailed implementation history.

---

## Phase 3: AI-Powered Smart Input & Settings 🔮

**Status:** 🚧 Not Started

**Goal:** Enhance UX with AI and user configuration

### AI Smart Input (OpenAI Integration)

- [ ] **Smart Expense Parser**
  - API endpoint: POST `/api/v1/ai/parse-expense`
  - Accept natural language input: "belanja 50000", "makan siang 35rb"
  - Use OpenAI API to extract:
    - `amount`: numeric value
    - `description`: expense description
    - `suggested_category`: best matching category (optional)
  - Return structured object for frontend to use
- [ ] **Integrate with Quick Add Widget**
  - Single text input for natural language
  - Call AI parser on submit
  - Show parsed result for user confirmation
  - Allow manual editing before saving

### Settings Page (`/settings`)

- [ ] **Category Management Widget**
  - List user's custom categories
  - Add new category (name, type: income/expense, color?, icon?)
  - Edit existing category
  - Delete category (soft delete, sets transactions to null)
  - Only show user's own categories
- [ ] **Daily Budget Widget**
  - Set maximum daily spending limit
  - Store in user preferences table (new migration needed)
  - Show warning when approaching/exceeding limit
  - Display on dashboard summary
- [ ] **User Preferences**
  - Default currency
  - Notification preferences
  - Export/import data options

### Implementation Plan

1. **Add OpenAI integration** - Setup API key and client
2. **Create parse endpoint** - Build AI expense parser
3. **Update Quick Add Widget** - Add smart input mode
4. **Create `/settings` page** - Basic layout and structure
5. **Build Category CRUD** - API endpoints and UI
6. **Add Budget Management** - Preferences table and UI
7. **Integrate warnings** - Show budget alerts on dashboard

---

## Phase 4: Advanced Features (Future) 🚀

**Status:** 📋 Planned

- [ ] Multi-currency support with real-time exchange rates
- [ ] Recurring transactions (daily, weekly, monthly)
- [ ] Export functionality (CSV, PDF reports)
- [ ] Budget tracking with visual progress bars
- [ ] Category-based spending analytics with charts
- [ ] Monthly/yearly comparison views
- [ ] Receipt photo upload and OCR parsing
- [ ] Shared budgets for families/groups
- [ ] Push notifications for budget alerts
- [ ] Offline mode with sync

---

## Development Principles

1. **Mobile-First**: All features optimized for mobile screens
2. **Type Safety**: Use `utils/constants/` types, avoid `any`
3. **Financial Accuracy**: Always use `useFinancial()` composable for money calculations
4. **Bahasa Indonesia**: All user-facing text in Indonesian
5. **Security**: RLS policies, soft deletes, proper authentication
6. **Performance**: File size limits (300 lines), optimized queries

---

## Notes

- For coding guidelines and patterns, see `CLAUDE.md`
- For completed feature history, see `CHANGELOG.md`
- Current migration count: 7 migrations in `supabase/migrations/`
