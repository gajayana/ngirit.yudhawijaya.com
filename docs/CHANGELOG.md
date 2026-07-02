# Changelog

All notable completed features and changes to this project are documented here.

---

## Version 4.0.4 (Jul 1, 2026)

### Dependency Upgrade & Code Quality Cleanup

**Full Dependency Update (including majors):**
- ⬆️ `nuxt` 4.1.3 → 4.4.8
- ⬆️ `@nuxt/ui` 4.1.0 → 4.9.0
- ⬆️ `@nuxt/image` 1.11.0 → 2.0.0 (major)
- ⬆️ `@unhead/vue` 2.0.19 → 3.1.7 (major)
- ⬆️ `vue-router` 4.6.3 → 5.1.0 (major)
- ⬆️ `typescript` 5.9.3 → 6.0.3 (major)
- ⬆️ `eslint` 9.38.0 → 10.6.0 (major)
- ⬆️ `@nuxt/test-utils` 3.19.2 → 4.0.3 (major)
- ⬆️ `@nuxt/scripts` 0.13.0 → 1.3.0 (major)
- ⬆️ `vue`, `pinia`, `firebase`, `date-fns`, `@nuxtjs/supabase`, `@supabase/supabase-js`, `@nuxt/eslint`, `@nuxt/icon`, `@nuxt/fonts`, `tailwindcss`, `@types/node`, `dotenv`, `tsx` — patch/minor bumps
- ➕ Added `vue-tsc` as an explicit devDependency (required by `nuxt typecheck`, previously resolved incidentally and broke after the major bump)

**Fixes required by the upgrade:**
- 🐛 `components/auth/action-button.vue` — fixed unsafe optional chaining (`user.email?.[0].toUpperCase()` → `?.[0]?.toUpperCase()`) caught by stricter TypeScript 6 checks
- 🐛 `components/theme/switch.vue` — inline `@click` handler returned `boolean` instead of `void`; extracted to a named `toggleDark()` function
- 🔧 `pnpm-workspace.yaml` — added `sharp`, `@parcel/watcher`, `protobufjs`, `unrs-resolver` to `onlyBuiltDependencies` so their install scripts run under pnpm

**SonarQube Cleanup:**
- 🧹 `server/api/v1/transactions/index.get.ts`: `parseInt` → `Number.parseInt`, array `.includes()` → `Set.has()`, removed unnecessary `as Transaction[]` assertion, removed dead `if (!userId)` check (the `getAuthenticatedUserId()` helper already throws), removed leftover debug `logger.log()` calls
- 🧹 `stores/transaction-store.ts`: moved `getCurrentMonthString`, `getMonthFromDate`, `isToday` out of the store setup function to module scope (they're pure, don't need recreating per store instance); flipped a negated `if (index !== -1) {...} else {...}` condition for readability
- ⚠️ Verified (and left in place) three SonarLint "unnecessary assertion" flags on `as TransactionWithCategory` casts — all three are genuinely required by `tsc`; see `docs/TROUBLESHOOTING.md` for details

**Not touched:**
- `utils/constants/database.ts` — SonarQube flag on auto-generated Supabase codegen boilerplate; per project convention this file is never hand-edited
- Pre-existing `eslint` errors (`no-explicit-any`, unused vars) in `server/api/v1/families/**` and `composables/useRealtime.ts` — confirmed identical before/after the dependency bump, out of scope for this pass

**Related Files:**
- `docs/TROUBLESHOOTING.md` - New entries: sharp/libvips install failure, missing vue-tsc, SonarLint false positives

---

## Version 4.0.3 (Nov 2, 2025)

### Bug Fixes & Build Improvements

**Critical Production Fix:**
- 🐛 Fixed `ReferenceError: logger is not defined` in production server API endpoints
  - Added explicit logger imports to 20 server API endpoint files
  - Root cause: Server-side code doesn't have access to Nuxt auto-imports
  - Affected endpoints: transactions, assets, families, user APIs

**Duplicate Transaction Fix:**
- 🐛 Fixed duplicate transaction display on first transaction of the day
  - Root cause: Race condition between optimistic updates and realtime subscriptions
  - Solution: De-duplication in `activeTransactions` computed getter using `Set<string>`
  - Simple, foolproof approach - handles ALL edge cases in one place
  - Related: `stores/transaction-store.ts:80-93`

**Build Pipeline Enhancements:**
- ✅ Added TypeScript type checking to build process
  - `pnpm build` now runs `pnpm typecheck` first
  - Build fails immediately if type errors exist
  - Prevents broken code from reaching production
- ✅ Added new npm scripts:
  - `pnpm typecheck` - Run TypeScript type checking
  - `pnpm lint` - Run ESLint
  - `pnpm lint:fix` - Auto-fix linting errors
- ✅ Enhanced ESLint configuration:
  - Added `no-undef` rule to catch undefined variables
  - Added `@typescript-eslint/no-unused-vars` with ignore patterns

**Type System Fixes:**
- 🔧 Fixed `scripts/find-duplicates.ts` - Added null check for `firstRecord`
- 🔧 Fixed `scripts/mysql.ts` - Added comprehensive null checks for regex matches
- 🔧 Fixed `utils/constants/category.ts` - Changed from non-existent enum to explicit union type
  - Before: `Database['public']['Enums']['category_type']` (doesn't exist)
  - After: `type CategoryType = 'income' | 'expense'`

**Code Quality:**
- 🧹 Removed unused `checkSubscribed` variable from transaction store
- 📝 Updated `TROUBLESHOOTING.md` with detailed documentation of all fixes
- 📝 Added prevention strategies and workflow improvements

**Key Lessons:**
- Auto-imports are client-only - server API code needs explicit imports
- Type checking in build pipeline catches errors before deployment
- De-duplication in computed getters is simpler than preventing duplicates at insertion
- Always test in production-like environments

---

## Version 4.0.0 (Oct 26, 2025)

### Phase 2 Completion

**Major Release**: Complete rewrite from asset tracking to expense tracking application with family sharing capabilities.

**Features:**
- ✅ Transaction management dashboard with CRUD operations
- ✅ Family sharing with real-time collaboration
- ✅ Realtime subscriptions for transactions, family members, and user data
- ✅ Smart natural language expense parser ("Makan 35000" → auto-parsed)
- ✅ Mobile-first responsive design with touch-friendly UI
- ✅ Decimal.js for accurate financial calculations
- ✅ Comprehensive SEO implementation (Open Graph, Twitter Cards, structured data)
- ✅ Polished Bahasa Indonesia copywriting with personality
- ✅ Logo optimization (PNG, WebP, favicon, apple-touch-icon)

**Documentation:**
- ✅ Complete SEO guide and analysis
- ✅ Realtime testing and implementation guides
- ✅ Updated roadmap with Phase 2 marked complete
- ✅ Reorganized documentation into `docs/` folder

**Technical Highlights:**
- 7 database migrations with Row Level Security
- Type-safe composables and stores
- Nuxt 4.1.3 with Vue 3.5.22
- Supabase Auth and Realtime
- Pinia state management

---

## Recent Updates

### Realtime Subscriptions (Oct 25, 2025)

- ✅ Created reusable `useRealtime()` composable for managing Supabase Realtime subscriptions
- ✅ Enhanced transaction store with improved realtime handling:
  - Live updates for INSERT, UPDATE, DELETE events
  - Smart filtering by current month and family members
  - Automatic category data fetching for new transactions
  - Duplicate detection and proper error handling
- ✅ Added realtime subscriptions for family members:
  - Auto-refresh when members join or leave families
  - Ensures transaction lists stay in sync with family membership
- ✅ Added realtime subscriptions for user data changes:
  - Live updates when user role changes
  - Live updates when account is blocked/unblocked
  - Console warnings for significant status changes
- ✅ Created comprehensive testing documentation (`docs/REALTIME_TESTING.md`)
- ✅ Type-safe event handlers with TypeScript
- ✅ Automatic cleanup on unmount and logout
- ✅ Debug logging for easier troubleshooting
- ✅ Works with Supabase CLI v2.53.6+

**Benefits:**
- Instant synchronization across multiple browser tabs/windows
- No manual refresh needed for transaction updates
- Family collaboration with real-time visibility
- Immediate feedback for admin actions on user accounts

---

## Phase 1: Foundation & Authentication (Completed Oct 10, 2025)

### Authentication & Routes

- ✅ Login page at `/` (root) with Google OAuth button
- ✅ OAuth callback handler at `/confirm`
- ✅ Redirect logic: logged-in users → `/dashboard`, logged-out users → `/`
- ✅ Logout functionality
- ✅ Fixed OAuth callback stuck on `/confirm` page (Oct 10, 2025)
  - Replaced `watchEffect` with direct `getSession()` call
  - Added proper error handling and console logging
  - Removed race condition with `useSupabaseUser()` reactive watching

### UI/UX

- ✅ Clean, mobile-first login page design
- ✅ Header navigation hidden for unauthenticated users
- ✅ Google OAuth button with feature highlights
- ✅ Responsive design optimized for mobile screens
- ✅ All UI text in Bahasa Indonesia
- ✅ Mobile UI optimizations:
  - Login page with 48px+ touch targets
  - Dashboard redesigned for mobile-first experience
  - CSS safe area padding and mobile optimizations
  - Responsive spacing (sm: breakpoints)
  - Collapsible debug section on mobile
  - Feature cards with borders on mobile, transparent on desktop
  - Funnier tagline: "Biar dompet gak nangis di akhir bulan 💸"

### API Versioning

- ✅ All API endpoints moved to `/api/v1/*` structure
- ✅ Frontend calls updated to use v1 prefix
- ✅ User endpoint: POST `/api/v1/user/me`
- ✅ Assets CRUD: `/api/v1/assets/*`
- ✅ Asset summaries: `/api/v1/assets/summary/total` & `/api/v1/assets/summary/by-type`

### Auth Store

- ✅ Pinia store at `stores/auth-store.ts`
- ✅ Role checking utilities (superadmin, manager, user)
- ✅ Computed properties: `isAdmin`, `isSuperAdmin`
- ✅ Auto-fetches user role on login
- ✅ Uses POST `/api/v1/user/me` endpoint

### Database Migrations

#### Initial Migrations (5 migrations)

1. **`20240718000001_create_user_data.sql`**: Core user data table
   - user_data table with auto-sync to auth.users
   - Columns: id, email, full_name, role, is_blocked, timestamps
   - Auto-sync triggers: `handle_new_user()`, `handle_user_updated()`
   - SECURITY DEFINER functions to avoid RLS infinite recursion
   - Functions: `is_superadmin()`, `update_user_role()`, `update_user_blocked_status()`

2. **Categories table**: Income/expense categories with soft delete

3. **Currencies table**: Currency definitions with exchange rates

4. **Transactions table**: Financial transactions linked to categories

5. **Assets table**: 12 asset types (cash, savings, investments, crypto, real estate, etc.)

#### Migration Refactoring (Oct 10, 2025)

- ✅ Replaced `user_roles` table → `user_data` table
- ✅ Added `email` column (UNIQUE NOT NULL) with auto-sync from auth.users
- ✅ Added auto-sync triggers
- ✅ Fixed infinite recursion with SECURITY DEFINER functions
- ✅ Consolidated RLS optimizations into base table migrations
- ✅ Verified all migrations free from infinite recursion issues
- ✅ Renamed `utils/constants/role.ts` → `utils/constants/user.ts`
- ✅ Added comprehensive user types: `UserData`, `UserDataInsert`, `UserDataUpdate`
- ✅ Updated all imports across codebase (3 files) to use new `user.ts`

**RLS Optimizations:**

- All policies use `(SELECT auth.uid())` pattern to prevent per-row re-evaluation
- Consolidated policies to avoid multiple permissive policies per action
- SECURITY DEFINER functions for role checks to avoid infinite recursion

### Data Migration System (Phase 1.5 - Oct 10, 2025)

#### Data Organization

- ✅ Created `supabase/data/oldies/` directory structure
- ✅ Moved `spendings_18bulan.sql` → `supabase/data/oldies/`
- ✅ Modified `scripts/firestore.ts` to save to `supabase/data/oldies/expense-firestore.json`

#### MySQL Migration Script (`scripts/mysql.ts`)

- ✅ Read MySQL dump file at `supabase/data/oldies/spendings_18bulan.sql`
- ✅ Parse `tblspending` table data (columns: `ID`, `dt`, `event`, `spending`)
- ✅ Transform to unified JSON format (same structure as Firestore export)
- ✅ Save to `supabase/data/oldies/expense-mysql.json`
- ✅ Show statistics: total records, date range, total value
- ✅ Run with: `pnpm mysql:fetch`
- ✅ Result: 1,055 MySQL records from Aug 9, 2014 - Oct 8, 2015

#### Data Merge Script (`scripts/merge.ts`)

- ✅ Read `supabase/data/oldies/expense-firestore.json`
- ✅ Read `supabase/data/oldies/expense-mysql.json`
- ✅ Combine both datasets into single array
- ✅ Sort by date ascending (oldest first)
- ✅ Keep all records (no deduplication to preserve data integrity)
- ✅ Save to `supabase/data/combined-expense.json`
- ✅ Show merge statistics: Firestore count, MySQL count, final total
- ✅ Run with: `pnpm data:merge`
- ✅ Result: 2,652 total records (1,597 Firestore + 1,055 MySQL)

#### Migration Workflow

1. ✅ Run `pnpm firestore:fetch` → generates `oldies/expense-firestore.json`
2. ✅ Run `pnpm mysql:fetch` → generates `oldies/expense-mysql.json`
3. ✅ Run `pnpm data:merge` → generates `combined-expense.json`
4. ⏭️ Import via UI: Superadmin uploads `combined-expense.json` at `/dashboard/import`
5. ⏭️ Existing import endpoint handles the rest (batch insert, user mapping, etc.)

#### Final Migration Statistics

- Total records: 2,652 expense records
- Date range: Aug 9, 2014 → Oct 10, 2025 (11+ years)
- Total value: Rp 291,770,331
- Ready for import: `supabase/data/combined-expense.json`

#### Initial Migration Features

- ✅ Firestore fetch script at `scripts/firestore.ts`
  - Fetches ALL spendings collection from Firebase Firestore (no pagination limits)
  - Sorted by `created_at` ascending (oldest first)
  - Authentication with Firebase email/password
  - Shows statistics: total value, date range, document count
  - Run with: `pnpm firestore:fetch`
- ✅ Superadmin import feature at `/dashboard/import`
  - Upload JSON file UI with drag & drop support
  - Maps Firebase user IDs to Supabase user IDs
  - Converts Unix timestamps to ISO 8601 UTC
  - Batch insert (100 records per batch)
  - Shows import summary (total, inserted, failed, skipped)
  - API endpoint: POST `/api/v1/transactions/import`

---

## Phase 2: Transaction Management Dashboard (Completed Oct 13, 2025)

### Decimal.js Integration (Oct 10, 2025)

- ✅ Install: `pnpm add decimal.js`
- ✅ Types are built-in, no separate package needed
- ✅ Created `composables/useFinancial.ts` with utilities
- ✅ Configured Decimal.js: precision 20, ROUND_HALF_UP, 2 decimal places output
- ✅ Implemented operations: add, subtract, multiply, divide, sum, average, percentage
- ✅ Implemented formatting: formatCurrency (Indonesian Rupiah)
- ✅ Implemented parsing: parseAmount (handles various formats)
- ✅ Implemented validation: isValidAmount, compare, isPositive, isZero
- ✅ Added comprehensive documentation to CLAUDE.md

### Page Restructuring (Oct 10, 2025)

- ✅ Moved dashboard content to `/profile` page
  - User info card
  - Debug info section
  - Admin tools widget
  - Logout button
  - User ID display
- ✅ Transformed `/dashboard` into main expense tracking interface
  - New dashboard with header and profile link
  - Mobile-optimized layout ready for widgets

### Transaction CRUD API Endpoints (Oct 11, 2025)

- ✅ **GET `/api/v1/transactions`** - List user's transactions
  - Query params: `date` (YYYY-MM-DD), `month` (YYYY-MM), `limit`, `offset`
  - Returns transactions with joined category data
  - Sorted by `created_at DESC`
  - Filters out soft-deleted records
  - File: `server/api/v1/transactions/index.get.ts`

- ✅ **POST `/api/v1/transactions`** - Create new transactions (bulk)
  - Body: `{ transactions: [{ description, amount, transaction_type, category? }] }`
  - Supports bulk insert
  - Validates each transaction
  - Returns inserted transactions with category data
  - File: `server/api/v1/transactions/index.post.ts`

- ✅ **PUT `/api/v1/transactions/:id`** - Update transaction
  - Permission checks: Owner OR manager/superadmin
  - Validates amount if provided
  - Returns updated transaction with category data
  - File: `server/api/v1/transactions/[id].put.ts`

- ✅ **DELETE `/api/v1/transactions/:id`** - Delete transaction (soft delete)
  - Soft delete: sets `deleted_at` timestamp
  - Permission checks: Owner OR manager/superadmin
  - File: `server/api/v1/transactions/[id].delete.ts`

#### Architecture Refactoring (Oct 11, 2025)

- ✅ All endpoints refactored to use `getAuthenticatedUserId()` helper from `server/utils/auth.ts`
- ✅ Removed direct `serverSupabaseUser()` calls for better centralization
- ✅ Fixed GET endpoint to return joined category data (was returning only category UUID)
- ✅ Added proper TypeScript generic types to all `$fetch` calls in store
- ✅ Fixed realtime channel type mismatch by using `any` type
- ✅ All CRUD operations now use API endpoints instead of direct Supabase client queries

### Transaction Store (Oct 11-12, 2025)

- ✅ Created `stores/transaction-store.ts` with Pinia
- ✅ State: transactions, currentMonth, isLoading, error, isSubscribed
- ✅ Getters: todayTransactions, todayTotal, monthlyTotal, monthlySummaryByDescription
- ✅ Actions: fetchCurrentMonth, addTransaction, updateTransaction, deleteTransaction
- ✅ Realtime subscription: initRealtimeSubscription, cleanupRealtimeSubscription
- ✅ Type-safe with transaction types from `utils/constants/transaction.ts`

### Dashboard Widgets

#### Expense Summary Card (Oct 10, 2025)

- ✅ Display total sum of today's expenses
- ✅ Display total sum of current month's expenses
- ✅ Show comparison percentage with last month
- ✅ Gradient cards with icons
- ✅ Uses Decimal.js for formatting
- ✅ Connected to transaction store

#### Quick Add Expense Widget (Oct 10, 2025)

- ✅ Floating action button (bottom-right) with fullscreen dialog
- ✅ Smart Parser: Single textarea with natural language parsing
  - Supports formats: "Makan 35000", "Bensin 50rb", "Parkir 5k"
  - Auto-extracts description and amount from input
  - Handles abbreviations: `rb`, `ribu`, `k` (multiply by 1000)
  - Real-time preview showing parsed data
- ✅ Mobile UX Optimizations:
  - Fullscreen dialog on mobile (slides up from bottom)
  - Centered modal on desktop (scale transition)
  - Auto-focus textarea on open
  - Escape key to close
  - Touch-friendly buttons (52px min height)
- ✅ Category selector (optional, 6 categories with emoji icons)
- ✅ Success toast inside dialog
- ✅ Validates amount with Decimal.js before submission
- ✅ Uses Teleport API for fullscreen overlay
- ✅ Connected to transaction store

#### Today's Expenses Widget (Oct 10, 2025)

- ✅ List today's expenses sorted by `created_at DESC`
- ✅ Show: description, amount, time, category
- ✅ Empty state when no expenses
- ✅ "Show All" button when > 5 items
- ✅ Mobile-optimized list with touch targets
- ✅ Uses Decimal.js for amount calculations
- ✅ Connected to transaction store
- ✅ Edit/delete functionality with permission checks

#### Monthly Summary Widget (Oct 12, 2025)

- ✅ Group current month's expenses by description (case insensitive)
- ✅ Show: grouped label, total sum, transaction count
- ✅ Progress bars showing percentage of total
- ✅ Sorted by total sum DESC using `compare()` from Decimal.js
- ✅ Total footer with monthly sum
- ✅ Uses Decimal.js for all summations and comparisons
- ✅ Connected to transaction store via `monthlySummaryByDescription`
- ✅ Auto-updates when transactions change via Pinia reactivity

### Permission System (Oct 10-12, 2025)

- ✅ RLS policy checks in API endpoints
  - Users can only CRUD their own transactions
  - Managers can view/edit all non-deleted transactions
  - Superadmins can view/edit all transactions
  - Permission logic in PUT and DELETE endpoints
- ✅ Permission checks in UI
  - Show edit/delete buttons only for owned transactions
  - Show all transactions for managers/superadmins
  - Implemented `canModifyTransaction()` helper in TodayExpensesWidget
  - Conditional rendering using `v-if="expense.canModify"`
  - Uses `isAdmin` computed from auth store for role checking

### Family Sharing Feature (Oct 12-13, 2025)

#### Database Schema (Migration 6 & 7)

- ✅ **Migration 6: `20241012000006_create_families.sql`** (Oct 12, 2025)
  - `families` table: id, name, description, created_by, timestamps
  - `family_members` table: id, family_id, user_id, role, joined_at, timestamps
  - Indexes on created_by, family_id, user_id
  - RLS policies for families and family_members
  - Roles: owner, admin, member
  - Unique constraint on (family_id, user_id)
  - Triggers for updated_at

- ✅ **Migration 7: `20241012000007_add_family_visibility_to_transactions.sql`** (Oct 12, 2025)
  - RLS policy created with SECURITY DEFINER function `is_family_transaction()`
  - Users can view their own transactions + family members' transactions

#### Family Types (Oct 12, 2025)

- ✅ Created `utils/constants/family.ts`
- ✅ All types derived from `Database` types
- ✅ Includes: `Family`, `FamilyInsert`, `FamilyUpdate`
- ✅ Includes: `FamilyMember`, `FamilyMemberInsert`, `FamilyMemberUpdate`
- ✅ Includes: `FamilyMemberRole`, `FAMILY_MEMBER_ROLE` const
- ✅ Includes: `FamilyWithMembers` interface
- ✅ Response types: `FamilyListResponse`, `AddFamilyMemberResponse`, `RemoveFamilyMemberResponse`
- ✅ Input types: `FamilyInput`, `AddFamilyMemberInput`

#### Family API Endpoints (Oct 12, 2025)

- ✅ `GET /api/v1/families` - List user's families with members
- ✅ `POST /api/v1/families` - Create new family (auto-adds creator as owner)
- ✅ `GET /api/v1/families/:id` - Get family details with members
- ✅ `PUT /api/v1/families/:id` - Update family (owner only)
- ✅ `DELETE /api/v1/families/:id` - Delete family (soft delete, owner only)
- ✅ `GET /api/v1/families/:id/members` - List family members
- ✅ `POST /api/v1/families/:id/members` - Add member by email (owner only)
- ✅ `DELETE /api/v1/families/:id/members/:userId` - Remove member (owner can remove anyone, members can leave)
- ✅ All endpoints manually join user_data due to PostgREST foreign key limitations

#### Transaction Store Updates (Oct 13, 2025)

- ✅ Added `date-fns` package for proper date/timezone handling
- ✅ Added `familyMemberIds: string[]` state to cache family member IDs
- ✅ Added `includeFamily: boolean` state (default: `true`)
- ✅ Added `hasFamilyMembers` computed getter (checks if more than 1 member)
- ✅ Created `fetchFamilyMembers()` action to fetch and cache family member IDs
- ✅ Updated `fetchCurrentMonth()` to use ISO datetime ranges with `startOfMonth`/`endOfMonth`
- ✅ Sends `start`, `end`, `include_family` query params to API

#### Transaction API Updates (Oct 13, 2025)

- ✅ **GET `/api/v1/transactions` Enhanced**
  - Replaced `date`/`month` params with `start`/`end` ISO datetime params
  - Added `include_family` boolean query param
  - When `include_family=true`: server fetches family member IDs and queries `WHERE created_by IN (userIds)`
  - Returns all family transactions without showing whose transaction it is
  - Uses UTC timestamps (PostgreSQL `timestamptz`)

#### Dashboard UI (Oct 13, 2025)

- ✅ **Family Toggle Component**
  - Created `components/dashboard/FamilyToggle.vue` (client-only component)
  - Custom toggle switch using Tailwind CSS (UToggle had SSR issues)
  - Toggle label: "Keluarga" (Bahasa Indonesia)
  - Only shows if `hasFamilyMembers` is true (more than just self)
  - Positioned in dashboard header next to profile icon
  - Wrapped in `<ClientOnly>` to avoid SSR hydration mismatch
  - Default state: ON (shows family transactions by default)
  - Clicking toggle refetches transactions with new filter

#### Profile Page Widget (Oct 12, 2025)

- ✅ **Family Management Widget** (`components/profile/FamilyManagementWidget.vue`)
  - Complete family CRUD interface
  - 4 dialogs: Create Family, Edit Family, Add Member, Remove Member confirmation
  - Shows list of user's families with member counts
  - For each family:
    - Family name and description
    - List of members with email and full name
    - Add member button (by email, owner only)
    - Remove member button (owner can remove anyone, members can leave)
    - Edit family button (owner only)
    - Delete family button (owner only, soft delete)
  - Mobile-optimized design with 48px+ touch targets
  - Uses Teleport API for fullscreen dialogs
  - All text in Bahasa Indonesia
  - No TypeScript `any` usage - all properly typed

#### Family Sharing Key Features

- Family creators automatically promoted to `manager` role
- Family toggle defaults to ON (shows family transactions)
- Server-side family member ID resolution for security
- Date filtering uses `date-fns` with UTC timestamps
- No user attribution shown (privacy-focused design)
- Owner-only permissions (simplified from role hierarchy)

### Known Issues & Investigations

#### Realtime Subscriptions in Local Development (Oct 13, 2025)

- **Issue**: Supabase CLI uses non-JWT keys incompatible with Realtime service
- **Workaround**: Auto-detect local dev and disable realtime (see `stores/transaction-store.ts:438-449`)
- **Status**: ⏳ Under investigation
- **Changes Made**:
  - Added custom `runtimeConfig` in `nuxt.config.ts` for potential service key usage
  - May use service key for realtime in local dev in future
- **Impact**: Manual refresh needed in local dev; works seamlessly in production
- **Note**: Refer to `nuxt.config.ts` for canonical runtime config (not `.env.example`)

---

## Database Migration Summary

Total migrations: **7 migrations**

1. `20240718000001_create_user_data.sql` - User data with auto-sync
2. Categories table migration
3. Currencies table migration
4. Transactions table migration
5. Assets table migration
6. `20241012000006_create_families.sql` - Families and family members
7. `20241012000007_add_family_visibility_to_transactions.sql` - Family transaction visibility

All migrations implement:
- RLS policies with `(SELECT auth.uid())` pattern
- Soft delete pattern
- Audit fields (created_at, updated_at, created_by)
- Proper indexes
- SECURITY DEFINER functions where needed

---

## Development Tools & Scripts

- `pnpm firestore:fetch` - Fetch data from Firebase Firestore
- `pnpm mysql:fetch` - Parse MySQL dump file
- `pnpm data:merge` - Merge Firestore and MySQL data
- `supabase gen types typescript --local > utils/constants/database.ts` - Generate TypeScript types

---

## Type System Evolution

### Constants Modules

1. `utils/constants/database.ts` - Auto-generated from Supabase (source of truth)
2. `utils/constants/user.ts` - User and role types (renamed from role.ts on Oct 10, 2025)
3. `utils/constants/transaction.ts` - Transaction types and responses (created Oct 11, 2025)
4. `utils/constants/family.ts` - Family and family member types (created Oct 12, 2025)

### Type Safety Improvements

- ✅ All types derived from `Database` types
- ✅ No `any` types allowed (ESLint enforced)
- ✅ Interfaces over types for extendability
- ✅ Const objects instead of enums
- ✅ Generic types for all `$fetch` calls

---

## Next Steps

See `ROADMAP.md` for upcoming phases:
- Phase 3: AI-Powered Smart Input & Settings 🔮
- Phase 4: Advanced Features 🚀
