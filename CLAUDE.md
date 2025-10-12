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
- **User Types**: Defined in `utils/constants/user.ts` using database-generated types
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

**⚠️ CRITICAL: Always use `utils/constants/` for type references**

- **Database Types**: Auto-generated from Supabase in `utils/constants/database.ts`
  - **Source of Truth**: This file is auto-generated via `supabase gen types typescript`
  - Contains all table schemas (Row, Insert, Update types)
  - Contains all enum types (user_role, asset_type, etc.)
  - Contains all database functions signatures
  - **Never manually edit this file** - regenerate after schema changes

- **User Types** (`utils/constants/user.ts`):
  - `UserData` - Complete user record from database
  - `UserDataInsert` - Type for inserting new users
  - `UserDataUpdate` - Type for updating users
  - `UserRole` - Enum type for user roles
  - `USER_ROLE` - Const object with role values
  - All types derived from `database.ts`

- **Transaction Types** (`utils/constants/transaction.ts`):
  - `Transaction` - Complete transaction record from database
  - `TransactionInsert` - Type for inserting new transactions
  - `TransactionUpdate` - Type for updating transactions
  - `TransactionWithCategory` - Transaction with joined category data
  - `TransactionInput` - Client-side input for single transaction
  - `TransactionBulkInput` - Client-side input for bulk insert
  - `TransactionUpdateInput` - Client-side input for updates
  - Response types: `TransactionListResponse`, `TransactionCreateResponse`, `TransactionUpdateResponse`, `TransactionDeleteResponse`
  - `TransactionQueryParams` - Query parameters for GET endpoint
  - `TRANSACTION_TYPE` - Const object with transaction type values ('expense', 'income')
  - All types derived from `database.ts`

- **Type Pattern**:
  - Use interfaces over types for extendability
  - No enums - use const objects with `satisfies` keyword
  - Always import types from `utils/constants/` instead of defining inline
  - For database table types, use: `Database['public']['Tables']['table_name']['Row']`
  - For enums, use: `Database['public']['Enums']['enum_name']`

- **Asset Types**: 12 distinct types defined in `utils/types/assets.ts`
- **Risk Levels**: `low`, `medium`, `high` for investment assets

**Type Reference Examples**:
```typescript
// ✅ CORRECT - Import from utils/constants
import type { UserData } from '~/utils/constants/user';
import type { Transaction, TransactionWithCategory } from '~/utils/constants/transaction';
import type { Database } from '~/utils/constants/database';

// ✅ CORRECT - Use pre-defined types for transactions
import type {
  TransactionInput,
  TransactionListResponse
} from '~/utils/constants/transaction';

// ❌ WRONG - Don't define inline types that exist in database or utils/constants
interface Transaction {
  id: string;
  amount: number;
  // ... manually defining fields
}

// ❌ WRONG - Don't use raw database types when typed versions exist
type Transaction = Database['public']['Tables']['transactions']['Row']; // Use import instead
```

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
- **⚠️ ALWAYS import types from `utils/constants/` - never define inline types**
- Use interfaces over types for extendability
- Avoid enums; use const objects with `satisfies` keyword
- Prefer functional components with Composition API `<script setup>`
- Leverage auto-imports (no need to import `ref`, `useState`, `useRouter`)
- When working with database tables, reference `utils/constants/database.ts` for type definitions

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

### Financial Calculations with Decimal.js

**⚠️ CRITICAL: ALWAYS use `useFinancial()` composable for money calculations**

JavaScript's native arithmetic has floating-point precision errors that make it unsuitable for financial calculations:
```typescript
// ❌ WRONG - Floating-point errors
0.1 + 0.2 === 0.3 // false! (returns 0.30000000000000004)
```

**Solution: Use the `useFinancial()` composable**

Located at `composables/useFinancial.ts`, this composable provides:

**Basic Operations:**
```typescript
const { add, subtract, multiply, divide, sum, average } = useFinancial();

// Addition
const total = add(100.10, 200.20); // 300.30 (accurate)

// Subtraction
const change = subtract(500, 123.45); // 376.55

// Multiplication
const tax = multiply(1000, 0.11); // 110.00

// Division
const split = divide(100, 3); // 33.33

// Sum array
const monthlyTotal = sum([100, 200.50, 300.75]); // 601.25

// Average
const avg = average([100, 200, 300]); // 200.00
```

**Formatting & Parsing:**
```typescript
const { formatCurrency, parseAmount } = useFinancial();

// Format as Rupiah
formatCurrency(1234567.89); // "Rp 1.234.568" (no decimals by default)
formatCurrency(1234567.89, { showDecimals: true }); // "Rp 1.234.567,89"
formatCurrency(1234567.89, { showSymbol: false }); // "1.234.568"

// Parse user input
parseAmount("Rp 1.234.567,89"); // 1234567.89
parseAmount("1,234,567.89"); // 1234567.89
```

**Validation & Comparison:**
```typescript
const { isValidAmount, compare, isPositive, isZero } = useFinancial();

// Validate
isValidAmount(100.50); // true
isValidAmount("abc"); // false
isValidAmount(-50); // false (negative amounts invalid)

// Compare
compare(100, 200); // -1 (100 < 200)
compare(100, 100); // 0 (equal)
compare(200, 100); // 1 (200 > 100)

// Boolean checks
isPositive(100); // true
isZero(0); // true
```

**Usage Rules:**
1. ✅ **Always import** `useFinancial()` in components/composables dealing with money
2. ✅ **Use for all calculations**: totals, averages, percentages, tax calculations
3. ✅ **Use for comparisons**: Always use `compare()` function for sorting/comparing amounts
4. ✅ **Use in API endpoints**: Server-side calculations must also use Decimal.js
5. ❌ **Never use native operators** for money: no `+`, `-`, `*`, `/`, or direct comparison
6. ✅ **Database storage**: Already configured as `DECIMAL(15,2)` in migrations

**Examples:**
```typescript
// ✅ CORRECT - Using compare() for sorting
const { compare } = useFinancial();
summaries.sort((a, b) => compare(b.total, a.total)); // Sort descending

// ❌ WRONG - Direct numeric comparison
summaries.sort((a, b) => b.total - a.total); // Floating-point errors!
```

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

**⚠️ CRITICAL: Always use `getAuthenticatedUserId()` for user authentication**

- Use `defineEventHandler()` for all endpoints
- **Authentication**: Always use `getAuthenticatedUserId(event)` helper from `server/utils/auth.ts`
  - **Never use** `serverSupabaseUser()` directly - it may change in future library versions
  - `getAuthenticatedUserId()` is centralized and throws proper 401 errors automatically
  - Returns `user.sub` which is the consistent user ID in `@nuxtjs/supabase`
- Error Handling: Use `createError()` with appropriate status codes
- Query Building: Use Supabase query builder with RLS enforcement
- Soft Deletes: Filter out soft-deleted records with `.is('deleted_at', null)`
- **Category Joins**: When fetching transactions, always use `.select('*, categories(id, name, icon, color, type)')` to return joined category data
- Example endpoint structure (note `/v1/` prefix in file path):
  ```typescript
  // File: server/api/v1/resource/index.get.ts
  // URL: /api/v1/resource
  import { serverSupabaseClient } from '#supabase/server';
  import type { Database } from '~/utils/constants/database';

  export default defineEventHandler(async event => {
    const supabase = await serverSupabaseClient<Database>(event);
    const userId = await getAuthenticatedUserId(event); // ✅ Use helper

    // No need to check if (!userId) - helper throws 401 automatically

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('created_by', userId)
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
    - [x] Replaced `user_roles` table → `user_data` table with email, full_name auto-sync
    - [x] Added `email` column (UNIQUE NOT NULL) with auto-sync from auth.users
    - [x] Added auto-sync triggers: `handle_new_user()`, `handle_user_updated()`
    - [x] Fixed infinite recursion with SECURITY DEFINER functions
    - [x] Consolidated RLS optimizations into base table migrations
    - [x] Verified all migrations free from infinite recursion issues
    - [x] Renamed `utils/constants/role.ts` → `utils/constants/user.ts`
    - [x] Added comprehensive user types: `UserData`, `UserDataInsert`, `UserDataUpdate`
    - [x] Updated all imports across codebase (3 files) to use new `user.ts`
    - [x] Updated transaction import endpoint with email-based user mapping
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

#### Decimal.js for Financial Calculations
- [x] **Install and Configure decimal.js** ✅ (Oct 10, 2025)
  - [x] Install: `pnpm add decimal.js`
  - [x] Types are built-in, no separate package needed
  - [x] Created `composables/useFinancial.ts` with utilities
  - [x] Configured Decimal.js: precision 20, ROUND_HALF_UP, 2 decimal places output
  - [x] Implemented operations: add, subtract, multiply, divide, sum, average, percentage
  - [x] Implemented formatting: formatCurrency (Indonesian Rupiah)
  - [x] Implemented parsing: parseAmount (handles various formats)
  - [x] Implemented validation: isValidAmount, compare, isPositive, isZero
  - [x] Added comprehensive documentation to CLAUDE.md
  - Use for ALL financial calculations to avoid floating-point errors
  - **Critical**: Never use JavaScript `+`, `-`, `*`, `/` for money calculations
  - Store as `DECIMAL(15,2)` in database (already configured in migrations)
  - Always round to 2 decimal places for display

#### Restructure Pages
- [x] Move current `/dashboard` content to `/profile` page ✅ (Oct 10, 2025)
  - [x] Created `/profile` page with user info card
  - [x] Moved debug info section
  - [x] Moved admin tools widget
  - [x] Moved logout button
  - [x] Added User ID display
- [x] Transform `/dashboard` into main expense tracking interface ✅ (Oct 10, 2025)
  - [x] Created new dashboard with header and profile link
  - [x] Added "Coming Soon" placeholder with feature preview
  - [x] Listed upcoming widgets: Today's Expenses, Monthly Summary, Quick Add
  - [x] Mobile-optimized layout ready for widgets

#### Dashboard Widgets (all in `/dashboard`)
- [x] **Expense Summary Card** ✅ (Oct 10, 2025 - UI Only)
  - [x] Display total sum of today's expenses
  - [x] Display total sum of current month's expenses
  - [x] Show comparison percentage with last month
  - [x] Gradient cards with icons
  - [x] Uses Decimal.js for formatting
  - [ ] **Data integration pending**: Fetch real data from API
  - [ ] **Realtime pending**: Subscribe to transactions channel

- [x] **Quick Add Expense Widget** ✅ (Oct 10, 2025 - UI Only)
  - [x] **Design**: Floating action button (bottom-right) with fullscreen dialog
  - [x] **Smart Parser**: Single textarea with natural language parsing
    - [x] Supports formats: "Makan 35000", "Bensin 50rb", "Parkir 5k"
    - [x] Auto-extracts description and amount from input
    - [x] Handles abbreviations: `rb`, `ribu`, `k` (multiply by 1000)
    - [x] Real-time preview showing parsed data
  - [x] **Mobile UX Optimizations**:
    - [x] Fullscreen dialog on mobile (slides up from bottom)
    - [x] Centered modal on desktop (scale transition)
    - [x] Auto-focus textarea on open
    - [x] Escape key to close
    - [x] Touch-friendly buttons (52px min height)
  - [x] Category selector (optional, 6 categories with emoji icons)
  - [x] Success toast inside dialog
  - [x] Validates amount with Decimal.js before submission
  - [x] Uses Teleport API for fullscreen overlay
  - [ ] **Data integration pending**: POST to `/api/v1/transactions`

- [x] **Today's Expenses Widget** ✅ (Oct 10, 2025 - UI Only)
  - [x] List today's expenses sorted by `created_at DESC`
  - [x] Show: description, amount, time, category
  - [x] Empty state when no expenses
  - [x] "Show All" button when > 5 items
  - [x] Mobile-optimized list with touch targets
  - [x] Uses Decimal.js for amount calculations
  - [ ] **Data integration pending**: Fetch today's transactions from API
  - [ ] **Realtime pending**: Auto-update on new transactions

- [x] **Monthly Summary Widget** ✅ (Oct 12, 2025)
  - [x] Group current month's expenses by **description** (case insensitive)
  - [x] Show: grouped label, total sum, transaction count
  - [x] Progress bars showing percentage of total
  - [x] Sorted by total sum DESC using `compare()` from Decimal.js
  - [x] Total footer with monthly sum
  - [x] Uses Decimal.js for all summations and comparisons
  - [x] **Data integration**: Connected to transaction store via `monthlySummaryByDescription`
  - [x] **Realtime**: Auto-updates when transactions change via Pinia reactivity

**Data Integration Strategy:**

All transaction data will be managed through a centralized Pinia store (`stores/transaction-store.ts`) to minimize API calls and provide reactive state management across all widgets.

**Key Principles:**
1. **Single Source of Truth**: One Pinia store manages all transaction data
2. **Fetch Once**: Load current month's transactions on dashboard mount
3. **Realtime Updates**: Supabase channel subscription in Pinia store
4. **Reactive Widgets**: Widgets consume store data via `storeToRefs()`

**Transaction Store Structure:**
```typescript
// stores/transaction-store.ts

// State
state: {
  transactions: Transaction[]        // Current month's transactions only
  currentMonth: string               // Format: 'YYYY-MM' (e.g., '2025-10')
  isLoading: boolean                 // Loading state for API calls
  error: Error | null                // Error state
  isSubscribed: boolean              // Realtime subscription status
}

// Getters (computed from current month data)
getters: {
  todayTransactions: Transaction[]          // Filtered by today's date
  todayTotal: number                        // Sum of today's expenses
  todayCount: number                        // Count of today's transactions
  monthlyTotal: number                      // Sum of all current month expenses
  monthlyCount: number                      // Count of all current month transactions
  monthlySummaryByCategory: Array<{         // Grouped by category
    label: string,
    total: number,
    count: number,
    percentage: number
  }>
  monthlySummaryByDescription: Array<{      // Grouped by description (case insensitive)
    label: string,
    total: number,
    count: number,
    percentage: number
  }>
}

// Actions
actions: {
  fetchCurrentMonth()                       // GET /api/v1/transactions?month=YYYY-MM
  addTransaction(transaction)               // POST /api/v1/transactions (bulk)
  updateTransaction(id, data)               // PUT /api/v1/transactions/:id
  deleteTransaction(id)                     // DELETE /api/v1/transactions/:id
  initRealtimeSubscription()                // Start Supabase channel
  cleanupRealtimeSubscription()             // Stop Supabase channel
  handleRealtimeEvent(payload)              // Process INSERT/UPDATE/DELETE events
}
```

**Realtime Subscription in Pinia Store:**
```typescript
// Inside transaction store
const supabase = useSupabaseClient();
let channel: RealtimeChannel | null = null;

const initRealtimeSubscription = () => {
  if (isSubscribed.value) return;

  channel = supabase
    .channel('transactions-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      handleRealtimeEvent
    )
    .subscribe();

  isSubscribed.value = true;
};

const handleRealtimeEvent = (payload) => {
  // Only process events for current month
  const transactionMonth = getMonthFromDate(payload.new?.created_at);
  if (transactionMonth !== currentMonth.value) return;

  if (payload.eventType === 'INSERT') {
    transactions.value.unshift(payload.new);
  } else if (payload.eventType === 'UPDATE') {
    const index = transactions.value.findIndex(t => t.id === payload.new.id);
    if (index !== -1) transactions.value[index] = payload.new;
  } else if (payload.eventType === 'DELETE') {
    transactions.value = transactions.value.filter(t => t.id !== payload.old.id);
  }
};

const cleanupRealtimeSubscription = () => {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
    isSubscribed.value = false;
  }
};
```

**Dashboard Page Lifecycle:**
```typescript
// pages/dashboard.vue
const transactionStore = useTransactionStore();

onMounted(async () => {
  // Fetch current month's transactions once
  await transactionStore.fetchCurrentMonth();

  // Start realtime subscription
  transactionStore.initRealtimeSubscription();
});

onUnmounted(() => {
  // Clean up subscription
  transactionStore.cleanupRealtimeSubscription();
});
```

**Widget Integration (Pure Consumers):**
```typescript
// Widgets only consume data from store - no direct API calls

// ExpenseSummaryCard.vue
const transactionStore = useTransactionStore();
const { todayTotal, monthlyTotal, todayCount, monthlyCount } = storeToRefs(transactionStore);

// TodayExpensesWidget.vue
const { todayTransactions } = storeToRefs(transactionStore);

// MonthlySummaryWidget.vue
const { monthlySummaryByDescription, monthlyTotal } = storeToRefs(transactionStore);

// QuickAddWidget.vue
const transactionStore = useTransactionStore();
await transactionStore.addTransaction(transactions); // POST via store action
```

**Benefits:**
- ✅ Single API call for current month's data
- ✅ Reactive updates across all widgets
- ✅ Centralized data management
- ✅ Clean separation of concerns (widgets = presentation only)
- ✅ Real-time synchronization via Supabase channel
- ✅ Type-safe with transaction types from `utils/constants/transaction.ts`

#### Transaction CRUD API Endpoints
- [x] **GET `/api/v1/transactions`** ✅ (Oct 11, 2025) - List user's transactions
  - Query params: `date` (YYYY-MM-DD), `month` (YYYY-MM), `limit`, `offset`
  - Filter by current user (from auth via `getAuthenticatedUserId()`)
  - Returns transactions with joined category data using `.select('*, categories(...)')`
  - Sorted by `created_at DESC`
  - Filters out soft-deleted records
  - File: `server/api/v1/transactions/index.get.ts`

- [x] **POST `/api/v1/transactions`** ✅ (Oct 11, 2025) - Create new transactions (bulk)
  - Body: `{ transactions: [{ description, amount, transaction_type, category? }] }`
  - Supports bulk insert (array of transactions)
  - Validates each transaction (description, amount > 0, transaction_type)
  - Sets `created_by` from authenticated user via `getAuthenticatedUserId()`
  - Returns inserted transactions with category data
  - File: `server/api/v1/transactions/index.post.ts`

- [x] **PUT `/api/v1/transactions/:id`** ✅ (Oct 11, 2025) - Update transaction
  - Body: `{ description?, amount?, transaction_type?, category? }`
  - Permission checks: Owner OR manager/superadmin
  - Uses `getAuthenticatedUserId()` for auth
  - Validates amount if provided (must be > 0)
  - Returns updated transaction with category data
  - File: `server/api/v1/transactions/[id].put.ts`

- [x] **DELETE `/api/v1/transactions/:id`** ✅ (Oct 11, 2025) - Delete transaction (soft delete)
  - Soft delete: sets `deleted_at` timestamp
  - Permission checks: Owner OR manager/superadmin
  - Uses `getAuthenticatedUserId()` for auth
  - Returns success message
  - File: `server/api/v1/transactions/[id].delete.ts`

**Architecture Refactoring (Oct 11, 2025):**
- ✅ All endpoints refactored to use `getAuthenticatedUserId()` helper from `server/utils/auth.ts`
- ✅ Removed direct `serverSupabaseUser()` calls for better centralization
- ✅ Fixed GET endpoint to return joined category data (was returning only category UUID)
- ✅ Added proper TypeScript generic types to all `$fetch` calls in store
- ✅ Fixed realtime channel type mismatch by using `any` type
- ✅ All CRUD operations now use API endpoints instead of direct Supabase client queries

#### Permission System
- [x] **Implement RLS policy checks in API endpoints** ✅ (Oct 10, 2025)
  - ✅ Users can only CRUD their own transactions (checked via `created_by`)
  - ✅ Managers can view/edit all non-deleted transactions (role-based checks)
  - ✅ Superadmins can view/edit all transactions (role-based checks)
  - ✅ Permission logic in PUT and DELETE endpoints
  - Note: Hard delete not implemented (only soft delete for data integrity)
- [x] **Add permission checks in UI** ✅ (Oct 12, 2025)
  - ✅ Show edit/delete buttons only for owned transactions
  - ✅ Show all transactions for managers/superadmins
  - ✅ Implemented `canModifyTransaction()` helper in TodayExpensesWidget
  - ✅ Conditional rendering using `v-if="expense.canModify"`
  - ✅ Uses `isAdmin` computed from auth store for role checking

#### Implementation Plan
1. **Install decimal.js** - Add dependency for accurate financial calculations
2. **Create `/profile` page** - Move existing dashboard content
3. **Build API endpoints** - Start with GET and POST for transactions (use Decimal.js)
4. **Create Today's Widget** - Fetch and display today's expenses (use Decimal.js)
5. **Create Summary Widgets** - Aggregate and display totals (use Decimal.js)
6. **Build Quick Add Form** - Create transaction input widget (validate with Decimal.js)
7. **Add Edit/Delete functionality** - Inline editing with modals
8. **Test permissions** - Verify RLS and UI permissions work correctly
9. **Test calculations** - Verify all financial calculations are accurate

#### Family Sharing Feature 👨‍👩‍👧‍👦
**Goal:** Allow users to create families and share expense tracking with family members

##### Database Schema
- [ ] **Create migration for families table**
  ```sql
  -- Migration: supabase/migrations/[timestamp]_create_families.sql

  -- Families table
  CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );

  -- Family members junction table
  CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(family_id, user_id)
  );

  -- Indexes
  CREATE INDEX idx_families_created_by ON families(created_by) WHERE deleted_at IS NULL;
  CREATE INDEX idx_family_members_family_id ON family_members(family_id) WHERE deleted_at IS NULL;
  CREATE INDEX idx_family_members_user_id ON family_members(user_id) WHERE deleted_at IS NULL;

  -- RLS Policies
  ALTER TABLE families ENABLE ROW LEVEL SECURITY;
  ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

  -- Families: Users can view families they belong to
  CREATE POLICY "Users can view their families"
    ON families FOR SELECT
    USING (
      (SELECT auth.uid()) IN (
        SELECT user_id FROM family_members
        WHERE family_id = families.id AND deleted_at IS NULL
      )
    );

  -- Families: Only creators can create
  CREATE POLICY "Users can create families"
    ON families FOR INSERT
    WITH CHECK (created_by = (SELECT auth.uid()));

  -- Families: Only owners can update
  CREATE POLICY "Owners can update families"
    ON families FOR UPDATE
    USING (
      (SELECT auth.uid()) IN (
        SELECT user_id FROM family_members
        WHERE family_id = families.id
        AND role = 'owner'
        AND deleted_at IS NULL
      )
    );

  -- Families: Only owners can delete (soft delete)
  CREATE POLICY "Owners can delete families"
    ON families FOR UPDATE
    USING (
      created_by = (SELECT auth.uid())
      AND deleted_at IS NULL
    )
    WITH CHECK (deleted_at IS NOT NULL);

  -- Family Members: Users can view members of their families
  CREATE POLICY "Users can view family members"
    ON family_members FOR SELECT
    USING (
      (SELECT auth.uid()) IN (
        SELECT user_id FROM family_members fm2
        WHERE fm2.family_id = family_members.family_id
        AND fm2.deleted_at IS NULL
      )
    );

  -- Family Members: Owners and admins can add members
  CREATE POLICY "Owners and admins can add members"
    ON family_members FOR INSERT
    WITH CHECK (
      (SELECT auth.uid()) IN (
        SELECT user_id FROM family_members
        WHERE family_id = family_members.family_id
        AND role IN ('owner', 'admin')
        AND deleted_at IS NULL
      )
    );

  -- Family Members: Owners and admins can remove members
  CREATE POLICY "Owners and admins can remove members"
    ON family_members FOR UPDATE
    USING (
      (SELECT auth.uid()) IN (
        SELECT user_id FROM family_members fm2
        WHERE fm2.family_id = family_members.family_id
        AND fm2.role IN ('owner', 'admin')
        AND fm2.deleted_at IS NULL
      )
    );

  -- Triggers for updated_at
  CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

##### Transaction Visibility Updates
- [ ] **Update transactions RLS policies to include family members**
  - Users can view their own transactions
  - Users can view transactions from family members they share a family with
  - Implement via LEFT JOIN with family_members table
  ```sql
  -- Migration: Add family visibility to transactions
  CREATE POLICY "Users can view family transactions"
    ON transactions FOR SELECT
    USING (
      created_by = (SELECT auth.uid())
      OR created_by IN (
        SELECT fm2.user_id
        FROM family_members fm1
        JOIN family_members fm2 ON fm1.family_id = fm2.family_id
        WHERE fm1.user_id = (SELECT auth.uid())
        AND fm1.deleted_at IS NULL
        AND fm2.deleted_at IS NULL
      )
    );
  ```

##### API Endpoints
- [ ] **Family Management Endpoints**
  - `GET /api/v1/families` - List user's families
  - `POST /api/v1/families` - Create new family
  - `GET /api/v1/families/:id` - Get family details
  - `PUT /api/v1/families/:id` - Update family (owner only)
  - `DELETE /api/v1/families/:id` - Delete family (soft delete, owner only)
  - `GET /api/v1/families/:id/members` - List family members
  - `POST /api/v1/families/:id/members` - Add member to family (by email)
  - `DELETE /api/v1/families/:id/members/:userId` - Remove member from family

##### Profile Page Widget
- [ ] **Family Management Widget** (`components/profile/FamilyManagementWidget.vue`)
  - Show list of user's families
  - Create new family button
  - For each family:
    - Family name and description
    - List of members with their roles
    - Add member button (search by email)
    - Remove member button (owners/admins only)
    - Edit family button (owners only)
    - Leave family button (members only)
    - Delete family button (owners only)
  - Mobile-optimized design with touch targets
  - Uses Teleport pattern for dialogs
  - All text in Bahasa Indonesia

##### Family Types
- [ ] **Create family types** in `utils/constants/family.ts`
  ```typescript
  import type { Database } from './database';

  export type Family = Database['public']['Tables']['families']['Row'];
  export type FamilyInsert = Database['public']['Tables']['families']['Insert'];
  export type FamilyUpdate = Database['public']['Tables']['families']['Update'];

  export type FamilyMember = Database['public']['Tables']['family_members']['Row'];
  export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];
  export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update'];

  export type FamilyMemberRole = Database['public']['Enums']['family_member_role'];

  export const FAMILY_MEMBER_ROLE = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  } as const satisfies Record<string, FamilyMemberRole>;

  export interface FamilyWithMembers extends Family {
    members: Array<FamilyMember & { user_data: { email: string; full_name: string } }>;
  }
  ```

##### Implementation Checklist
1. Create families migration with RLS policies
2. Update transactions RLS to include family visibility
3. Create family types in `utils/constants/family.ts`
4. Build family API endpoints (8 endpoints)
5. Create FamilyManagementWidget component
6. Add widget to `/profile` page
7. Test family creation, member management, and transaction visibility

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
