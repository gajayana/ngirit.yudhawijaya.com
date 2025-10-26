# Development Roadmap

This document outlines the development phases and planned features for the Ngirit application.

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

See `CHANGELOG.md` for detailed implementation history.

---

## Phase 2: Transaction Management Dashboard ✅ COMPLETED (with known issues)

**Status:** ✅ Feature-complete (Oct 13, 2025) | ⏳ Investigating realtime in local dev

**Goal:** Create a functional expense tracking dashboard with CRUD operations

### Completed Features

- [x] Decimal.js integration for financial calculations
- [x] Transaction CRUD API endpoints (GET, POST, PUT, DELETE)
- [x] Transaction store with Pinia (centralized state management)
- [x] Dashboard widgets:
  - [x] Expense Summary Card (today & monthly totals)
  - [x] Quick Add Expense Widget (smart parser with natural language)
  - [x] Today's Expenses Widget (list view with edit/delete)
  - [x] Monthly Summary Widget (grouped by description)
- [x] Permission system (RLS + UI checks)
- [x] Family Sharing Feature
  - [x] Database schema (families, family_members tables)
  - [x] 8 Family API endpoints (CRUD operations)
  - [x] Family Management Widget in `/profile`
  - [x] Family transaction filtering in dashboard
  - [x] Family toggle UI component

### Known Issues & Workarounds

- **Realtime Subscriptions in Local Development**
  - **Issue**: Supabase CLI uses non-JWT keys that are incompatible with Realtime service
  - **Workaround**: Realtime is automatically disabled in local dev (127.0.0.1/localhost)
  - **Status**: ✅ Works in production, disabled in local dev
  - **Impact**: In local development, changes won't update in real-time (requires manual refresh)
  - **Code**: See `stores/transaction-store.ts:438-449`
  - **Note**: This is a known Supabase CLI limitation, not a bug in our code

See `CHANGELOG.md` for detailed implementation history.

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
