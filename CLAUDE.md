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

## 🔒 Security & Privacy

**⚠️ CRITICAL: NEVER READ SENSITIVE FILES**

Do NOT read or access the following files under any circumstances:

- `.env`, `.env.*` - Environment variables with API keys and secrets
- `*.key`, `*.pem`, `*.crt`, `*.p12` - Certificates and private keys
- `credentials.json`, `service-account.json` - Service account credentials
- `secrets/` - Any directory containing secrets
- `*.sql.dump`, `*.db` - Database dumps with user data

**These files are blocked via `.claudeignore` and `.claude/settings.json`**

Protection layers:

1. **`.claudeignore`** - File patterns Claude Code should skip
2. **`.claude/settings.json`** - Permission-based read denial (enforced by Claude Code)

If configuration help is needed:

1. Ask the user to provide only the specific setting name (not the value)
2. Reference `.env.example` instead of `.env`
3. Never request to read actual secrets

**Privacy:**

- All file contents read by Claude Code are transmitted to Anthropic's servers
- See: https://claude.ai/settings/data-privacy-controls
- Data is NOT used for training but retained for 30 days for safety monitoring

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

# Generate TypeScript types from Supabase
supabase gen types typescript --local > utils/constants/database.ts
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
- **Migrations**: Located in `supabase/migrations/`
- **Tables**: user_data, categories, currencies, transactions, assets, families, family_members
- **RLS Optimizations**:
  - All policies use `(SELECT auth.uid())` pattern to prevent per-row re-evaluation
  - Consolidated policies to avoid multiple permissive policies per action
  - SECURITY DEFINER functions for role checks to avoid infinite recursion
  - Admin functions: `is_superadmin()`, `update_user_role()`, `update_user_blocked_status()`
- **Server API**: RESTful endpoints in `server/api/` with `/v1/` prefix
  - All API routes are versioned: `/api/v1/*`
  - All endpoints use `serverSupabaseClient()` and helper functions
  - Implements soft delete pattern (checking `deleted_at IS NULL`)

### Frontend Structure

- **Pages**: Auto-routed from `pages/` directory
  - `/` (index) - Login page (public)
  - `/dashboard` - Main dashboard (protected, user home)
  - `/profile` - User profile and settings
  - `/confirm` - OAuth callback handler
- **Components**: Located in `components/`, use kebab-case naming
- **Stores**: Pinia stores in `stores/` (auth-store, transaction-store)
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

- **Type Modules**:
  - `utils/constants/user.ts` - User and role types
  - `utils/constants/transaction.ts` - Transaction types and responses
  - `utils/constants/family.ts` - Family and family member types

- **Type Pattern**:
  - Use interfaces over types for extendability
  - No enums - use const objects with `satisfies` keyword
  - Always import types from `utils/constants/` instead of defining inline
  - For database table types, use: `Database['public']['Tables']['table_name']['Row']`
  - For enums, use: `Database['public']['Enums']['enum_name']`

**Type Reference Examples**:

```typescript
// ✅ CORRECT - Import from utils/constants
import type { UserData } from '~/utils/constants/user';
import type { Transaction, TransactionWithCategory } from '~/utils/constants/transaction';
import type { Database } from '~/utils/constants/database';

// ❌ WRONG - Don't define inline types that exist in database or utils/constants
interface Transaction {
  id: string;
  amount: number;
  // ... manually defining fields
}
```

## Code Style Rules

### File Size Limits

- **Maximum lines per file: 300 lines**
- Files exceeding 300 lines should be refactored into smaller components or composables
- Use Vue 3 composables pattern for reusable logic
- Split large components into focused sub-components

### TypeScript

- **⚠️ CRITICAL: AVOID USING `any` TYPE AT ALL COSTS**
  - Always use proper types from `utils/constants/`
  - Use type narrowing with type guards instead of `any`
  - Use `unknown` if you truly don't know the type, then narrow it
  - ESLint will flag `any` usage - fix immediately
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
0.1 + 0.2 === 0.3; // false! (returns 0.30000000000000004)
```

**Solution: Use the `useFinancial()` composable**

Located at `composables/useFinancial.ts`, this composable provides:

**Basic Operations:**

```typescript
const { add, subtract, multiply, divide, sum, average } = useFinancial();

// Addition
const total = add(100.1, 200.2); // 300.30 (accurate)

// Subtraction
const change = subtract(500, 123.45); // 376.55

// Multiplication
const tax = multiply(1000, 0.11); // 110.00

// Division
const split = divide(100, 3); // 33.33

// Sum array
const monthlyTotal = sum([100, 200.5, 300.75]); // 601.25

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
parseAmount('Rp 1.234.567,89'); // 1234567.89
parseAmount('1,234,567.89'); // 1234567.89
```

**Validation & Comparison:**

```typescript
const { isValidAmount, compare, isPositive, isZero } = useFinancial();

// Validate
isValidAmount(100.5); // true
isValidAmount('abc'); // false
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

**⚠️ Note:** Refer to `nuxt.config.ts` `runtimeConfig` section for the canonical list of environment variables, not `.env.example`.

Required environment variables:

- `NUXT_PUBLIC_HOST` - Application host URL
- `SUPABASE_URL`, `SUPABASE_KEY` - Public Supabase credentials (from @nuxtjs/supabase)
- `SUPABASE_SECRET_KEY` - Server-side service key (custom runtime config)
- `NUXT_PUBLIC_SUPABASE_KEY` - Public key exposed to client (custom runtime config)
- Optional: Google Auth, Firebase credentials

**Runtime Config Access:**
```typescript
const config = useRuntimeConfig();
config.SUPABASE_SECRET_KEY          // Server-side only
config.public.host                   // Client & Server
config.public.SUPABASE_KEY           // Client & Server
```

## Database Schema Overview

The application uses a multi-table architecture:

1. **user_data**: Maps auth.users to application roles with full_name, role, is_blocked, soft delete
2. **categories**: Income/expense categories with soft delete
3. **currencies**: Currency definitions with exchange rates
4. **assets**: Financial assets with rich metadata (balance, institution, risk level, liquidity)
5. **transactions**: Financial transactions linked to categories
6. **families**: Family groups for shared expense tracking
7. **family_members**: Junction table for family membership

All tables implement:

- RLS policies scoped to `(SELECT auth.uid())` - optimized to prevent per-row re-evaluation
- Soft delete pattern (`deleted_at` timestamp)
- Audit fields (`created_at`, `updated_at`, `created_by`)
- Consolidated policies to avoid multiple permissive policies per action

**For detailed migration history and database evolution, see `docs/CHANGELOG.md`**

## Current State & Next Steps

For detailed information about:

- **Development phases and roadmap**: See `docs/ROADMAP.md`
- **Completed features and migration history**: See `docs/CHANGELOG.md`

**Current Focus:** ✅ Phase 2 complete (Oct 26, 2025) - Transaction Management Dashboard with Family Sharing, Realtime Updates, SEO, and Polished Copywriting. Next up: Phase 3 (AI-Powered Smart Input & Settings).
