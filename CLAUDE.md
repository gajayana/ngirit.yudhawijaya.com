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
  - Manages user roles (superadmin, manager, user) via `user_roles` table
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
  - User roles with soft delete support
  - Categories (income/expense types)
  - Currencies with exchange rates
  - Transactions with category relationships
  - Assets (12 types: cash, savings, investments, crypto, real estate, etc.)
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
1. **user_roles**: Maps auth.users to application roles with block status
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

- Located in `supabase/migrations/` with timestamp-based naming
- Latest migration (`20250710000001_optimize_rls_policies.sql`) optimizes RLS policies for performance
- Apply migrations using: `supabase db push` or `supabase migration up`
- RLS policies use `(SELECT auth.uid())` pattern instead of bare `auth.uid()` for better query performance

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

### Next Tasks
5. **Testing & Verification**
   - Test login flow: `/` → Google OAuth → `/confirm` → `/dashboard`
   - Test logout flow: `/dashboard` → logout → `/`
   - Test API endpoints with v1 prefix
   - Verify mobile responsiveness

## Development Phases

### Phase 1: Foundation & Authentication 🚧
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
  - [x] User roles table with RLS policies
  - [x] Categories table (income/expense types)
  - [x] Currencies table with exchange rates
  - [x] Transactions table
  - [x] Assets table (12 asset types)
  - [x] RLS performance optimization (auth_rls_initplan & multiple_permissive_policies)
- [x] Firebase to Supabase migration script
  - [x] Script created at `scripts/firestore.ts`
  - [x] Fetches spendings collection from Firebase Firestore
  - [x] Saves to `supabase/data/spendings.json`
  - [x] Authentication with Firebase email/password
- [x] Auth store with role-based access control
  - [x] Pinia store at `stores/auth-store.ts`
  - [x] Role checking utilities (superadmin, manager, user)
- [x] Server API endpoints (all with `/v1/` prefix)
  - [x] User endpoint: `/api/v1/user/me` (get authenticated user with role)
  - [x] Assets CRUD: `/api/v1/assets/*` (GET, POST, PUT, DELETE)
  - [x] Asset summaries: `/api/v1/assets/summary/total` & `/api/v1/assets/summary/by-type`

### Phase 2: Asset Management Dashboard 🚧
- [ ] Dashboard UI for viewing assets
  - [ ] Asset list with filtering and sorting
  - [ ] Asset creation form
  - [ ] Asset edit/update functionality
  - [ ] Asset deletion (soft delete)
- [ ] Asset visualization
  - [ ] Charts for asset distribution by type
  - [ ] Charts for asset distribution by currency
  - [ ] Total asset value summary
- [ ] Category management
  - [ ] Category CRUD endpoints
  - [ ] Category UI for income/expense types
- [ ] Currency management
  - [ ] Currency CRUD endpoints
  - [ ] Currency selector with exchange rates

### Phase 3: Transaction Management (Planned)
- [ ] Transaction tracking
  - [ ] Transaction CRUD endpoints (TBD)
  - [ ] Transaction list UI with filters
  - [ ] Transaction creation/edit forms
- [ ] Transaction analytics
  - [ ] Income vs expense charts
  - [ ] Transaction history timeline
  - [ ] Category-based spending analysis

### Phase 4: Advanced Features (Future)
- [ ] Multi-currency support with real-time exchange rates
- [ ] Budget tracking and alerts
- [ ] Recurring transactions
- [ ] Export functionality (CSV, PDF)
- [ ] Mobile responsive optimizations
