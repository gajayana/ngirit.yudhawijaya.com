# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 application built with TypeScript, Supabase, Pinia, and Nuxt UI. It's a financial asset management application with user authentication, role-based access control, and comprehensive asset tracking capabilities.

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
- **Redirect Flow**: Login → `/login`, callback → `/confirm`, public routes exclude `/`

### Database & Backend
- **Supabase**: PostgreSQL database with Row Level Security (RLS) policies
- **Migrations**: Located in `supabase/migrations/`, includes:
  - User roles with soft delete support
  - Categories (income/expense types)
  - Currencies with exchange rates
  - Transactions with category relationships
  - Assets (12 types: cash, savings, investments, crypto, real estate, etc.)
- **Server API**: RESTful endpoints in `server/api/`
  - User endpoint: `/api/user/me/index.get.ts` - returns authenticated user with role
  - Asset endpoints: Full CRUD operations in `/api/assets/`
  - All endpoints use `serverSupabaseClient()` and `serverSupabaseUser()` helpers
  - Implements soft delete pattern (checking `deleted_at IS NULL`)

### Frontend Structure
- **Pages**: Auto-routed from `pages/` directory
  - `/login` - Authentication page
  - `/confirm` - OAuth callback handler
  - `/` (index) - Main dashboard
- **Components**: Located in `components/`, use kebab-case naming
- **Stores**: Pinia stores in `stores/` (only auth-store currently)
- **Utils**:
  - `utils/constants/` - Type-safe constants matching database enums
  - `utils/types/` - TypeScript interfaces for assets, roles, etc.

### Type System
- **Database Types**: Auto-generated from Supabase in `utils/constants/database.ts`
- **Type Pattern**: Use interfaces over types, no enums (use const objects with `satisfies`)
- **Asset Types**: 12 distinct types defined in `utils/types/assets.ts`
- **Risk Levels**: `low`, `medium`, `high` for investment assets

## Code Style Rules

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
- **Styling**: Tailwind utility classes
- **Color Mode**: Use built-in `@nuxtjs/color-mode` with `useColorMode()`

### Server API Patterns
- Use `defineEventHandler()` for all endpoints
- Authentication: Always check `serverSupabaseUser()` before proceeding
- Error Handling: Use `createError()` with appropriate status codes
- Query Building: Use Supabase query builder with RLS enforcement
- Soft Deletes: Filter out soft-deleted records with `.is('deleted_at', null)`

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
- RLS policies scoped to `auth.uid()`
- Soft delete pattern (`deleted_at` timestamp)
- Audit fields (`created_at`, `updated_at`, `created_by`)
