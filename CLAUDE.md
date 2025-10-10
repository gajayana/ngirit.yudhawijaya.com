# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 4 application (compatibilityDate: 2025-07-15) built with TypeScript, Supabase, Pinia, and Nuxt UI. It's a financial asset management application with user authentication, role-based access control, and comprehensive asset tracking capabilities.

**Key Technologies:**
- **Framework**: Nuxt 4.1.3 with Vue 3.5.22
- **Package Manager**: pnpm 10.18.1+
- **UI Framework**: Nuxt UI 4.0.1 (built on Tailwind CSS 4.1.14)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **State Management**: Pinia 3.0.3
- **Authentication**: Supabase Auth (@nuxtjs/supabase 2.0.0)

**Language:**
- **Primary Language**: Bahasa Indonesia
- All user-facing text, UI labels, messages, and content must be in Bahasa Indonesia
- Code comments and technical documentation can be in English
- Variable names, function names, and code should remain in English

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Fetch Firestore data (utility script)
pnpm firestore:fetch
```

## Architecture

### Authentication & Authorization
- **Supabase Auth**: Primary authentication provider (`@nuxtjs/supabase`)
- **Auth Store**: Centralized auth state management in `stores/auth-store.ts`
  - Manages user roles (superadmin, manager, user) via `user_data` table
  - Provides role-checking utilities: `hasRole()`, `canAccess()`, `isAdmin`, `isSuperAdmin`
  - Automatically fetches user role on auth state changes (client-side only)
- **Role Constants**: Defined in `utils/constants/role.ts` using database-generated types
- **Redirect Flow**:
  - Login page at `/` (root)
  - Logged-in users automatically redirect to `/dashboard`
  - OAuth callback at `/confirm`
  - Public route: `/` only

### Database & Backend
- **Supabase**: PostgreSQL database with Row Level Security (RLS) policies
- **Migrations**: Located in `supabase/migrations/`, includes:
  - User data table (`user_data`) with auto-sync to auth.users, includes full_name, role, is_blocked
  - Categories (income/expense types)
  - Currencies with exchange rates
  - Transactions with category relationships
  - Assets (12 types: cash, savings, investments, crypto, real estate, etc.)
- **RLS Optimizations**:
  - All policies use `(SELECT auth.uid())` pattern to prevent per-row re-evaluation
  - Consolidated policies to avoid multiple permissive policies per action
  - SECURITY DEFINER functions for role checks to avoid infinite recursion
  - Admin functions: `is_superadmin()`, `update_user_role()`, `update_user_blocked_status()`
- **Server API**: RESTful endpoints in `server/api/` with `/v1/` prefix
  - All API routes are versioned: `/api/v1/*`
  - User endpoint: `/api/v1/user/me` - returns authenticated user with role
  - Asset endpoints: Full CRUD operations at `/api/v1/assets/*`
  - All endpoints use `serverSupabaseClient()` and `serverSupabaseUser()` helpers
  - Implements soft delete pattern (checking `deleted_at IS NULL`)

### Frontend Structure
- **Pages**: Auto-routed from `pages/` directory
  - `/` (index) - Login page (public)
  - `/dashboard` - Main dashboard (protected, user home)
  - `/confirm` - OAuth callback handler
- **Components**: Located in `components/`, use kebab-case naming
  - `components/auth/` - Authentication-related components
  - `components/page/` - Layout components (header, etc.)
  - `components/theme/` - Theme-related components (dark mode switch)
- **Stores**: Pinia stores in `stores/` (only auth-store currently)
- **Utils**:
  - `utils/constants/` - Type-safe constants matching database enums
  - `utils/types/` - TypeScript interfaces for assets, roles, etc.
- **App Layout**: Root `app.vue` uses `<UApp>` wrapper with `<PageHeader>` and `<NuxtPage>`

### Type System
- **Database Types**: Auto-generated from Supabase in `utils/constants/database.ts`
- **Type Pattern**: Use interfaces over types, no enums (use const objects with `satisfies`)
- **Asset Types**: 12 distinct types defined in `utils/types/assets.ts`
- **Risk Levels**: `low`, `medium`, `high` for investment assets

## Code Style Rules

### File Size Limits
- **Maximum lines per file: 300 lines**
- Files exceeding 300 lines should be refactored into smaller components or composables
- Use Vue 3 composables pattern for reusable logic
- Split large components into focused sub-components
- Current longest files that may need refactoring:
  - `stores/auth-store.ts` (135 lines) ✓
  - `server/api/assets/index.get.ts` (116 lines) ✓

### TypeScript
- Use interfaces over types for extendability
- Avoid enums; use const objects with `satisfies` keyword
- Prefer functional components with Composition API `<script setup>`
- Leverage auto-imports (no need to import `ref`, `useState`, `useRouter`)

### Nuxt 3 Patterns
- **Data Fetching**:
  - `useFetch` for SSR-compatible component data fetching
  - `$fetch` for client-side requests in event handlers
  - `useAsyncData` for complex data fetching logic
  - Use `server: false` to skip SSR, `lazy: true` to defer non-critical data
- **Composables**: Name as `use<Name>`, store in `composables/`
- **Runtime Config**: Use `useRuntimeConfig()` for environment variables
  - Private keys (server-only): `runtimeConfig.SUPABASE_SERVICE_KEY`
  - Public keys: `runtimeConfig.public.host`
- **SEO**: Use `useHead()` and `useSeoMeta()`
- **Images**: Use `<NuxtImage>` or `<NuxtPicture>` components
- **Icons**: Use Nuxt Icons module (`@nuxt/icon`)

### UI & Styling
- **Framework**: Nuxt UI (built on Tailwind CSS)
- **Approach**: Mobile-first responsive design
- **Target Device**: Primarily mobile screens - optimize all UI/UX for mobile usage
- **Styling**: Tailwind utility classes
- **Color Mode**: Use built-in `@nuxtjs/color-mode` with `useColorMode()`
- **Design Priorities**:
  - Touch-friendly interface elements (larger tap targets)
  - Vertical layout optimized for scrolling
  - Bottom navigation for primary actions
  - Minimize horizontal scrolling
  - Optimize for one-handed use

### Server API Patterns
- Use `defineEventHandler()` for all endpoints
- Authentication: Always check `serverSupabaseUser()` before proceeding
- Error Handling: Use `createError()` with appropriate status codes
- Query Building: Use Supabase query builder with RLS enforcement
- Soft Deletes: Filter out soft-deleted records with `.is('deleted_at', null)`
- Example endpoint structure (note `/v1/` prefix in file path):
  ```typescript
  // File: server/api/v1/resource/index.get.ts
  // URL: /api/v1/resource
  export default defineEventHandler(async event => {
    const supabase = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('created_by', user.id)
      .is('deleted_at', null);

    if (error) throw createError({ statusCode: 500, statusMessage: 'Error message' });

    return { success: true, data };
  });
  ```

## Environment Setup

Required environment variables (see `.env.example`):
- `NUXT_PUBLIC_HOST` - Application host URL
- `SUPABASE_URL`, `SUPABASE_KEY` - Public Supabase credentials
- `SUPABASE_SERVICE_KEY` - Server-side service key
- Optional: Google Auth, Firebase credentials

## Database Context

The application uses a multi-table architecture:
1. **user_data**: Maps auth.users to application roles with full_name, role, is_blocked, soft delete
   - Auto-syncs with auth.users via triggers (handle_new_user, handle_user_updated)
   - Includes SECURITY DEFINER functions to avoid RLS infinite recursion
2. **categories**: Income/expense categories with soft delete
3. **currencies**: Currency definitions with exchange rates
4. **assets**: Financial assets with rich metadata (balance, institution, risk level, liquidity)
5. **transactions**: Financial transactions linked to categories

All tables implement:
- RLS policies scoped to `(SELECT auth.uid())` - optimized to prevent per-row re-evaluation
- Soft delete pattern (`deleted_at` timestamp)
- Audit fields (`created_at`, `updated_at`, `created_by`)
- Consolidated policies to avoid multiple permissive policies per action

### Database Migrations

- Located in `supabase/migrations/` with timestamp-based naming (5 total migrations)
- Migration `20240718000001_create_user_data.sql`: Core user data table with auto-sync triggers
- All RLS optimizations consolidated into respective table migrations
- Apply migrations using: `supabase db push` or `supabase migration up`
- RLS policies use `(SELECT auth.uid())` pattern instead of bare `auth.uid()` for better query performance
- **Important**: user_data table uses SECURITY DEFINER functions (`is_superadmin()`, `update_user_role()`, `update_user_blocked_status()`) to avoid infinite recursion when checking roles

### Supabase Local Development

If using Supabase CLI locally:
```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > utils/constants/database.ts
```

## Current Implementation Plan

### Completed in Current Session ✅
1. **Route Restructuring** ✅
   - Moved login page to `/` (root)
   - Created `/dashboard` page for authenticated users
   - Updated Supabase config and all redirects

2. **API Versioning** ✅
   - All API endpoints moved to `/api/v1/*` structure
   - Frontend calls updated to use v1 prefix

3. **Layout & Navigation** ✅
   - Clean, mobile-first login page design at `/`
   - Header navigation hidden for unauthenticated users
   - Removed "Sign In" button from header (not needed on login page)
   - Google OAuth button with feature highlights
   - Responsive design optimized for mobile screens
   - All UI text in Bahasa Indonesia

4. **Mobile UI Optimization** ✅
   - Login page optimized with 48px+ touch targets
   - Dashboard redesigned for mobile-first experience
   - Added CSS safe area padding and mobile optimizations
   - Responsive spacing (sm: breakpoints)
   - Collapsible debug section on mobile
   - Feature cards with borders on mobile, transparent on desktop
   - Funnier, relatable tagline: "Biar dompet gak nangis di akhir bulan 💸"

5. **Bug Fixes** ✅
   - Fixed OAuth callback stuck on `/confirm` page
   - Replaced `watchEffect` with direct `getSession()` call
   - Added proper error handling and console logging
   - Removed race condition with `useSupabaseUser()` reactive watching

### Next Tasks
6. **Testing & Verification** (In Progress)
   - ✅ Test login flow: `/` → Google OAuth → `/confirm` → `/dashboard`
   - Test logout flow: `/dashboard` → logout → `/`
   - Test API endpoints with v1 prefix
   - Verify mobile responsiveness

## Development Phases

### Phase 1: Foundation & Authentication ✅
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
- [x] Supabase database initial migrations (5 migrations total)
  - [x] Migration refactoring and consolidation (Oct 10, 2025)
    - [x] Replaced `user_roles` table → `user_data` table with full_name auto-sync
    - [x] Added auto-sync triggers: `handle_new_user()`, `handle_user_updated()`
    - [x] Fixed infinite recursion with SECURITY DEFINER functions
    - [x] Consolidated RLS optimizations into base table migrations
    - [x] Verified all migrations free from infinite recursion issues
  - [x] User data table (`user_data`) with RLS policies and admin functions
  - [x] Categories table (income/expense types)
  - [x] Currencies table with exchange rates
  - [x] Transactions table
  - [x] Assets table (12 asset types)
  - [x] RLS performance optimization (auth_rls_initplan & multiple_permissive_policies)
- [x] **[P0] Enhanced Data Migration System** ✅ (Phase 1.5 - Completed Oct 10, 2025)
  - [x] **Data Organization**
    - [x] Created `supabase/data/oldies/` directory structure
    - [x] Moved `spendings_18bulan.sql` → `supabase/data/oldies/`
    - [x] Modified `scripts/firestore.ts` to save to `supabase/data/oldies/expense-firestore.json`
  - [x] **MySQL Migration Script** (`scripts/mysql.ts`)
    - [x] Read MySQL dump file at `supabase/data/oldies/spendings_18bulan.sql`
    - [x] Parse `tblspending` table data (columns: `ID`, `dt`, `event`, `spending`)
    - [x] Transform to unified JSON format (same structure as Firestore export)
    - [x] Save to `supabase/data/oldies/expense-mysql.json`
    - [x] Show statistics: total records, date range, total value
    - [x] Run with: `pnpm mysql:fetch`
    - [x] Result: 1,055 MySQL records from Aug 9, 2014 - Oct 8, 2015
  - [x] **Data Merge Script** (`scripts/merge.ts`)
    - [x] Read `supabase/data/oldies/expense-firestore.json`
    - [x] Read `supabase/data/oldies/expense-mysql.json`
    - [x] Combine both datasets into single array
    - [x] Sort by date ascending (oldest first)
    - [x] Keep all records (no deduplication to preserve data integrity)
    - [x] Save to `supabase/data/combined-expense.json`
    - [x] Show merge statistics: Firestore count, MySQL count, final total
    - [x] Run with: `pnpm data:merge`
    - [x] Result: 2,652 total records (1,597 Firestore + 1,055 MySQL)
  - [x] **Migration Workflow Completed**
    1. ✅ Run `pnpm firestore:fetch` → generates `oldies/expense-firestore.json`
    2. ✅ Run `pnpm mysql:fetch` → generates `oldies/expense-mysql.json`
    3. ✅ Run `pnpm data:merge` → generates `combined-expense.json`
    4. ⏭️ Import via UI: Superadmin uploads `combined-expense.json` at `/dashboard/import`
    5. ⏭️ Existing import endpoint handles the rest (batch insert, user mapping, etc.)
  - [x] **Final Migration Statistics**
    - Total records: 2,652 expense records
    - Date range: Aug 9, 2014 → Oct 10, 2025 (11+ years)
    - Total value: Rp 291,770,331
    - Ready for import: `supabase/data/combined-expense.json`

  - [x] **Initial Migration Features** ✅
    - [x] Firestore fetch script at `scripts/firestore.ts`
      - [x] Fetches ALL spendings collection from Firebase Firestore (no pagination limits)
      - [x] Sorted by `created_at` ascending (oldest first)
      - [x] Authentication with Firebase email/password
      - [x] Shows statistics: total value, date range, document count
      - [x] Run with: `pnpm firestore:fetch`
    - [x] Superadmin import feature at `/dashboard/import`
      - [x] Upload JSON file UI with drag & drop support
      - [x] Maps Firebase user IDs to Supabase user IDs
      - [x] Converts Unix timestamps to ISO 8601 UTC
      - [x] Batch insert (100 records per batch)
      - [x] Shows import summary (total, inserted, failed, skipped)
      - [x] API endpoint: POST `/api/v1/transactions/import`
- [x] Auth store with role-based access control
  - [x] Pinia store at `stores/auth-store.ts`
  - [x] Role checking utilities (superadmin, manager, user)
  - [x] Computed properties: `isAdmin`, `isSuperAdmin`
  - [x] Auto-fetches user role on login
  - [x] Uses POST `/api/v1/user/me` endpoint
- [x] Server API endpoints (all with `/v1/` prefix)
  - [x] User endpoint: POST `/api/v1/user/me` (get authenticated user role)
  - [x] Assets CRUD: `/api/v1/assets/*` (GET, POST, PUT, DELETE)
  - [x] Asset summaries: `/api/v1/assets/summary/total` & `/api/v1/assets/summary/by-type`
  - [x] Transaction import: POST `/api/v1/transactions/import` (superadmin only)

### Phase 2: Transaction Management Dashboard 🔄
**Goal:** Create a functional expense tracking dashboard with CRUD operations

#### Restructure Pages
- [ ] Move current `/dashboard` content to `/profile` page
  - User info card
  - Debug info
  - Admin tools widget
- [ ] Transform `/dashboard` into main expense tracking interface

#### Dashboard Widgets (all in `/dashboard`)
- [ ] **Today's Expenses Widget**
  - List today's expenses sorted by `created_at DESC`
  - Show: description, amount, time
  - Mobile-optimized list with touch targets
- [ ] **Monthly Summary Widget**
  - Group current month's expenses by description/label
  - Show: grouped label, total sum for each label
  - Sorted by total sum DESC
- [ ] **Expense Summary Card**
  - Display total sum of today's expenses
  - Display total sum of current month's expenses
  - Show comparison/percentage if possible
- [ ] **Quick Add Expense Widget**
  - Input field for description
  - Input field for amount (number)
  - Optional: category selector (nullable)
  - Submit button to create expense
  - Mobile-optimized with 48px+ touch targets

#### Transaction CRUD API Endpoints
- [ ] GET `/api/v1/transactions` - List user's transactions
  - Query params: `date`, `month`, `limit`, `offset`
  - Filter by current user (from auth)
  - Return sorted by `created_at DESC`
- [ ] POST `/api/v1/transactions` - Create new transaction
  - Body: `{ description, amount, transaction_type, category? }`
  - Set `created_by` from authenticated user
- [ ] PUT `/api/v1/transactions/:id` - Update transaction
  - Only allow user to update their own transactions
  - Managers & superadmins can update any transaction
- [ ] DELETE `/api/v1/transactions/:id` - Delete transaction (soft delete)
  - Only allow user to delete their own transactions
  - Managers & superadmins can delete any transaction

#### Permission System
- [ ] Implement RLS policy checks in API endpoints
  - Users can only CRUD their own transactions
  - Managers can view/edit all non-deleted transactions
  - Superadmins can view/edit/hard-delete all transactions
- [ ] Add permission checks in UI
  - Show edit/delete buttons only for owned transactions
  - Show all transactions for managers/superadmins

#### Implementation Plan
1. **Create `/profile` page** - Move existing dashboard content
2. **Build API endpoints** - Start with GET and POST for transactions
3. **Create Today's Widget** - Fetch and display today's expenses
4. **Create Summary Widgets** - Aggregate and display totals
5. **Build Quick Add Form** - Create transaction input widget
6. **Add Edit/Delete functionality** - Inline editing with modals
7. **Test permissions** - Verify RLS and UI permissions work correctly

### Phase 3: AI-Powered Smart Input & Settings 🔮
**Goal:** Enhance UX with AI and user configuration

#### AI Smart Input (OpenAI Integration)
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

#### Settings Page (`/settings`)
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

#### Implementation Plan
1. **Add OpenAI integration** - Setup API key and client
2. **Create parse endpoint** - Build AI expense parser
3. **Update Quick Add Widget** - Add smart input mode
4. **Create `/settings` page** - Basic layout and structure
5. **Build Category CRUD** - API endpoints and UI
6. **Add Budget Management** - Preferences table and UI
7. **Integrate warnings** - Show budget alerts on dashboard

### Phase 4: Advanced Features (Future) 🚀
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
