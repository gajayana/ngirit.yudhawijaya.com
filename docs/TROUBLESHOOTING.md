# Troubleshooting & Decisions

This document tracks issues encountered during development, their solutions, and architectural decisions made.

## Table of Contents

- [Development Issues](#development-issues)
- [Architecture Decisions](#architecture-decisions)
- [Performance Issues](#performance-issues)

---

## Development Issues

### Supabase Realtime WebSocket Errors

**Date:** 2025-11-01

**Issue:**
WebSocket connection errors when using Supabase Realtime subscriptions:
```
WebSocket connection to 'ws://127.0.0.1:54321/realtime/v1/websocket?apikey=...' failed
[useRealtime] subscription status: CHANNEL_ERROR
❌ [useRealtime] Subscription failed for user_data
❌ [useRealtime] Subscription failed for transactions
❌ [useRealtime] Subscription failed for family_members
```

**Root Cause:**
Outdated Supabase CLI version causing incompatibility with realtime WebSocket connections.

**Solution:**
Update Supabase CLI via Homebrew:
```bash
brew update && brew upgrade
```

**Prevention:**
- Regularly check for Supabase CLI updates: `supabase --version`
- When `supabase status` shows "A new version of Supabase CLI is available", update immediately
- Consider adding a pre-commit hook or monthly reminder to check for updates

**Related Files:**
- `composables/useRealtime.ts` - Realtime subscription composable
- `supabase/config.toml` - Supabase configuration (line 60-65 shows realtime is enabled)

---

### Duplicate Transactions After Submission

**Date:** 2025-11-01 (Updated: 2025-11-02)

**Issue:**
When adding a new expense through the QuickAddWidget, the transaction appears twice in the UI, especially on the first transaction of the day. This happens due to race conditions between optimistic updates and realtime subscriptions.

**Symptoms:**
- User clicks submit button
- Transaction is saved successfully
- Transaction appears duplicated in the transaction list
- Duplicate appears immediately after submission

**Root Cause:**
Race condition between three concurrent operations:

1. **Optimistic update**: After API call returns, transactions are immediately added to local state for instant feedback
2. **Realtime INSERT event**: When database INSERT completes, realtime fires and adds the transaction again
3. **Timing variance**: Sometimes realtime arrives before optimistic update completes, sometimes after

Since realtime was not working in local dev (due to outdated Supabase CLI), the duplicate was only visible in production where realtime was properly configured.

**Solution Evolution:**

❌ **Initial approach**: Add duplicate checks in `handleTransactionInsert()` - Complex, error-prone, multiple code paths to maintain

✅ **Final approach**: De-duplicate in the `activeTransactions` computed getter - Simple, handles ALL cases in one place

**Changes Made:**
- `stores/transaction-store.ts:80-93`: Added de-duplication logic using `Set<string>` to track seen IDs in `activeTransactions` computed

**Code Changes:**
```typescript
const activeTransactions = computed(() => {
  const seen = new Set<string>();
  const unique: TransactionWithCategory[] = [];

  for (const t of transactions.value) {
    // Skip deleted and duplicates
    if (t.deleted_at || seen.has(t.id)) continue;

    seen.add(t.id);
    unique.push(t);
  }

  return unique;
});
```

**Why This Works Better:**
- **Single source of truth**: All duplicate handling in ONE place (the computed getter)
- **Handles ALL cases**: Optimistic updates, realtime inserts, race conditions - doesn't matter
- **Dead simple**: Track seen IDs, skip duplicates
- **Reactive**: Automatically updates when anything changes
- **No complex logic**: Don't need to prevent duplicates at insertion time

**Trade-offs:**
- **Pros**: Foolproof deduplication, simple to understand, works for all edge cases, minimal performance impact
- **Cons**: Slightly more iteration (negligible for typical transaction volumes)
- **Note**: Performance is O(n) where n = number of transactions, but with Set lookup being O(1), this is very fast

**Related Files:**
- `stores/transaction-store.ts` - Transaction store with realtime subscriptions and de-duplication
- `components/dashboard/QuickAddWidget.vue` - Add expense form component

---

### Production Error: ReferenceError - logger is not defined

**Date:** 2025-11-02

**Issue:**
Production server crashed with `ReferenceError: logger is not defined` when POST request was made to `/api/v1/transactions`.

**Symptoms:**
- Error only appeared in production, not in development
- Error occurred in server API endpoints
- Stack trace pointed to: `file:///var/task/chunks/routes/api/v1/index.post3.mjs:16:3`

**Root Cause:**
Server-side API endpoints (`server/api/*`) do NOT have access to Nuxt's auto-imports. The `logger` utility was auto-imported for client-side code but NOT for server-side code:

```typescript
// .nuxt/imports.d.ts:33
export { logger } from '../utils/logger';
```

This auto-import only works on the client. Server endpoints must explicitly import utilities.

**Solution:**
Add explicit `import { logger } from '~/utils/logger';` to all server API endpoints that use it.

**Changes Made:**
- Added logger import to 20 server API endpoint files:
  - `server/api/v1/transactions/*.ts` (4 files)
  - `server/api/v1/assets/**/*.ts` (7 files)
  - `server/api/v1/families/**/*.ts` (8 files)
  - `server/api/v1/user/me/*.ts` (1 file)

**Prevention - Build-Time Type Checking:**

Enhanced the build process to catch these errors before deployment:

**1. Added TypeScript type checking to build:**
```json
// package.json
{
  "scripts": {
    "build": "pnpm typecheck && nuxt build",
    "typecheck": "nuxt typecheck",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**2. Enhanced ESLint configuration:**
```javascript
// eslint.config.mjs
{
  rules: {
    'no-undef': 'error',  // Catch undefined variables
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  }
}
```

**Key Lessons:**
- **Auto-imports are client-only**: Server API code must use explicit imports
- **Development ≠ Production**: Always test in production-like environment
- **Type checking saves lives**: `pnpm build` now catches these errors early
- **Build pipeline matters**: Type checking BEFORE build prevents broken deployments

**Workflow Now:**
```bash
# Before committing
pnpm typecheck  # Catches type errors
pnpm lint       # Catches undefined variables

# Before deploying
pnpm build      # Runs typecheck automatically, fails if errors
```

**Related Files:**
- `utils/logger.ts` - Logger utility (client AND server compatible)
- `server/api/v1/**/*.ts` - All server endpoints now have explicit imports
- `package.json` - Enhanced build scripts
- `eslint.config.mjs` - Enhanced linting rules

---

### Realtime DELETE Not Syncing Across Users

**Date:** 2025-11-01

**Issue:**
When User A deletes a transaction, it disappears from User A's UI immediately, but User B (in the same family) doesn't see the deletion until they refresh the page.

**Symptoms:**
- INSERT events work (both users see new transactions)
- UPDATE events work (both users see edits)
- DELETE events don't work for other users

**Root Cause:**
The application uses **soft delete** (UPDATE with `deleted_at` timestamp), not hard DELETE. The API endpoint (`server/api/v1/transactions/[id].delete.ts:56`) executes:

```typescript
.update({ deleted_at: new Date().toISOString() })
```

This triggers a realtime UPDATE event, not DELETE. However, the RLS SELECT policies had `deleted_at IS NULL` filter:

```sql
CREATE POLICY "Users can view family members' transactions"
  USING (is_family_transaction(...) AND deleted_at IS NULL);
```

When a transaction was soft-deleted, it no longer passed the SELECT policy, so **realtime couldn't send the UPDATE event** to other users (they don't have SELECT permission on that row anymore).

**Solution:**
Two-part fix:

1. **Remove `deleted_at IS NULL` from RLS SELECT policies** - Allow users to SEE soft-deleted rows (so realtime events arrive)
2. **Filter soft-deletes in application layer** - Use computed `activeTransactions` to hide deleted items from UI

**Code Changes:**
```typescript
// 1. Add computed filter for active transactions
const activeTransactions = computed(() => {
  return transactions.value.filter(t => !t.deleted_at);
});

// 2. Update all getters to use activeTransactions instead of transactions
const monthlyTotal = computed(() => {
  const amounts = activeTransactions.value
    .filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE)
    .map(t => t.amount);
  return sum(amounts);
});

// 3. Export filtered transactions to components
return {
  transactions: activeTransactions, // Components get filtered view
  allTransactions: transactions, // Raw data for debugging
  // ...
};

// 4. Optimistic delete marks transaction as deleted
const updatedTransaction = {
  ...transactions.value[index],
  deleted_at: new Date().toISOString(),
} as TransactionWithCategory;
transactions.value[index] = updatedTransaction;
```

**Changes Made:**

Database (RLS):
- `supabase/migrations/20251101000009_fix_rls_for_realtime_soft_deletes.sql`: Removed `deleted_at IS NULL` from SELECT policies
- Recreated policies: "Users can view their own transactions", "Users can view family members' transactions", "Managers can view all transactions"

Application (Store):
- `stores/transaction-store.ts:78-80`: Added `activeTransactions` computed filter
- `stores/transaction-store.ts:86, 111, 121, 128, 182`: Updated all computed getters to use `activeTransactions`
- `stores/transaction-store.ts:407-411`: Optimistic delete marks transaction with `deleted_at`
- `stores/transaction-store.ts:635-636`: Export filtered transactions as main `transactions` property

**Why This Approach?**
- **Soft delete** allows transaction recovery/audit trail and prevents permanent data loss
- **RLS without deleted_at filter** allows realtime events to propagate while still protecting family boundaries
- **Application-layer filtering** provides clean reactive UI without seeing deleted items
- **Security**: RLS still protects which users/families can see each other's transactions

**Trade-offs:**
- Users can technically SELECT soft-deleted rows (but UI filters them out)
- Database queries return more rows (filtered in app)
- Better realtime sync vs stricter database-level filtering

**Related Files:**
- `stores/transaction-store.ts:78-80, 407-411, 471-509, 635-636` - Computed filtering and soft delete handling
- `server/api/v1/transactions/[id].delete.ts:53-57` - Soft delete API implementation
- `supabase/migrations/20251101000009_fix_rls_for_realtime_soft_deletes.sql` - RLS policy fix

---

### Regular Users Cannot Soft Delete Their Own Transactions (RLS Error 42501)

**Date:** 2025-11-01

**Issue:**
Users with role 'user' get an RLS policy violation error when trying to delete their own transactions:

```
Error deleting transaction: { code: '42501',
  message: 'new row violates row-level security policy for table "transactions"' }
```

**Root Cause:**
The UPDATE policy for regular users had `deleted_at IS NULL` filter:

```sql
CREATE POLICY "Users can update their own transactions"
  USING (auth.uid() = created_by AND deleted_at IS NULL);
```

When performing a soft delete (UPDATE to set `deleted_at = NOW()`), PostgreSQL checks the policy against the **new row state**. Since the new row has `deleted_at` set, it fails the `deleted_at IS NULL` check, blocking the UPDATE.

**Solution:**
Remove `deleted_at IS NULL` from the UPDATE policy's USING and WITH CHECK clauses:

```sql
CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
```

**Changes Made:**
- `supabase/migrations/20251101000009_fix_rls_for_realtime_soft_deletes.sql:60-74`: Dropped and recreated UPDATE policy without `deleted_at` filter
- Updated migration description to cover both SELECT and UPDATE policy fixes

**PostgreSQL Policy Evaluation:**
- **USING clause**: Checked against existing row before UPDATE
- **WITH CHECK clause**: Checked against new row after UPDATE
- Having `deleted_at IS NULL` in either clause blocks soft deletes

**Related Files:**
- `supabase/migrations/20251101000009_fix_rls_for_realtime_soft_deletes.sql` - RLS policy fix for SELECT and UPDATE
- `server/api/v1/transactions/[id].delete.ts:56` - Soft delete implementation

---

### Regular Users Cannot See Edit/Delete Buttons on Their Own Transactions

**Date:** 2025-11-01

**Issue:**
Users with role 'user' cannot see the edit and delete buttons on their own transactions, even though they created them. Only managers and superadmins see the buttons.

**Symptoms:**
- Edit/delete buttons visible for admins on all transactions ✅
- Edit/delete buttons NOT visible for regular users on their own transactions ❌
- Permission check always fails for regular users

**Root Cause:**
The permission check was using `user.value?.id` to compare with `transaction.created_by`:

```typescript
// ❌ WRONG - user.id doesn't exist in Supabase user object
return user.value?.id === transactionCreatedBy;
```

The Nuxt Supabase module stores the user ID in `user.sub`, not `user.id`. However, the application uses the Pinia auth store which exposes `userId` computed property that wraps `user.sub`.

**Solution:**
Use `userId` from the Pinia auth store instead of accessing `user.value?.id` directly:

```typescript
// ✅ CORRECT - Use userId from Pinia auth store
const { userId } = storeToRefs(authStore);
return userId.value === transactionCreatedBy;
```

**Changes Made:**
- `components/dashboard/TodayExpensesWidget.vue:102`: Import `userId` from auth store
- `components/dashboard/TodayExpensesWidget.vue:119`: Use `userId.value` for comparison
- Removed direct `user` reference from `useSupabaseUser()`

**Best Practice:**
Always use the Pinia auth store for user data instead of `useSupabaseUser()` directly:
- ✅ Use `authStore.userId` for user ID
- ✅ Use `authStore.isAdmin`, `authStore.isSuperAdmin` for role checks
- ❌ Don't use `user.value?.id` (doesn't exist)
- ❌ Don't use `user.value?.sub` directly (use auth store instead)

**Related Files:**
- `components/dashboard/TodayExpensesWidget.vue:114-120` - Permission check function
- `stores/auth-store.ts:170` - userId computed property definition

---

## Architecture Decisions

### Development-Only Logger Implementation

**Date:** 2025-11-01

**Context:**
The codebase had 222 console statements scattered across components, stores, API endpoints, and pages. These logs are useful for development but pollute production environments and can impact performance.

**Decision:**
Created a development-only logger utility (`utils/logger.ts`) that wraps console methods and only outputs in development mode.

**Implementation:**

```typescript
// utils/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => isDevelopment && console.log(...args),
  error: (...args) => console.error(...args), // Always log errors
  warn: (...args) => isDevelopment && console.warn(...args),
  info: (...args) => isDevelopment && console.info(...args),
  debug: (...args) => isDevelopment && console.debug(...args),
};
```

**Changes Made:**
- Created `utils/logger.ts` with environment-aware logging
- Replaced 222 console statements across 36 files:
  - `stores/` - transaction-store.ts (48), auth-store.ts (9)
  - `composables/` - useRealtime.ts (14)
  - `components/` - 7 components
  - `pages/` - 3 pages (dashboard, index, confirm)
  - `server/api/` - 21 API endpoints
- Added logger imports to all affected files

**Rationale:**
- **Performance**: No logging overhead in production
- **Clean console**: Production logs only show errors
- **Developer experience**: Full logging in development
- **Centralized control**: Easy to add features (log levels, file output, etc.)

**Exceptions:**
- `console.error` always logs (even in production) for critical error tracking
- `scripts/` folder keeps console (utility scripts, not application code)
- `utils/logger.ts` contains actual console calls (implementation)

**Usage:**
```typescript
import { logger } from '~/utils/logger';

logger.log('User logged in');           // Dev only
logger.error('Failed to fetch', err);   // Always logged
logger.warn('Deprecated API');           // Dev only
logger.info('Transaction created');     // Dev only
logger.debug('State:', state);          // Dev only
```

**Related Files:**
- `utils/logger.ts` - Logger implementation
- All `.ts` and `.vue` files in `stores/`, `composables/`, `components/`, `pages/`, `server/api/`

---

### Removing Category Selection from Add and Edit Dialogs

**Date:** 2025-11-01

**Context:**
Both the QuickAddWidget (add expense) and EditTransactionDialog had optional category dropdowns. This was adding unnecessary complexity and friction to the workflows.

**Decision:**
Removed the category dropdown from both QuickAddWidget and EditTransactionDialog. All transactions are now created/updated with `category: null`.

**Rationale:**
- The widget is designed for **quick input** - adding extra fields slows down the workflow
- Categories can be added later through the edit transaction feature if needed
- Most users don't categorize during quick input anyway
- Simplifies the UI and makes the form more focused on the core task: capturing description and amount

**Alternatives Considered:**
1. **Keep categories optional** - Rejected because even optional fields add visual clutter and cognitive load
2. **Smart category detection** - Could be added in Phase 3 (AI-powered features) to auto-suggest categories based on description
3. **Category shortcuts** - Could add quick category icons after input, but this still adds complexity

**Consequences:**
- **Pros**: Faster input flow, cleaner UI, more focused user experience
- **Cons**: Users must edit transactions later if they want to add categories
- **Future Enhancement**: Phase 3 could add AI-powered smart category suggestions based on transaction descriptions

**Changes Made:**

QuickAddWidget (Add):
- `components/dashboard/QuickAddWidget.vue:108-129`: Removed category dropdown HTML
- `components/dashboard/QuickAddWidget.vue:177`: Removed `category` from form state
- `components/dashboard/QuickAddWidget.vue:275`: Set `category: null` in transaction creation
- `components/dashboard/QuickAddWidget.vue:254`: Removed category from form reset

EditTransactionDialog (Edit):
- `components/dashboard/EditTransactionDialog.vue:90-108`: Removed category dropdown HTML
- `components/dashboard/EditTransactionDialog.vue:150-153`: Removed `category` from form state
- `components/dashboard/EditTransactionDialog.vue:197-200`: Removed category from form population
- `components/dashboard/EditTransactionDialog.vue:216-219`: Removed category from update payload
- `components/dashboard/EditTransactionDialog.vue:239-242`: Removed category from form reset

**Related Files:**
- `components/dashboard/QuickAddWidget.vue` - Quick add expense form
- `components/dashboard/EditTransactionDialog.vue` - Edit transaction form

---

### Decision Log Format

When documenting decisions, include:
- **Date:** When the decision was made
- **Context:** What problem we were solving
- **Decision:** What we chose to do
- **Rationale:** Why we made this choice
- **Alternatives Considered:** Other options we evaluated
- **Consequences:** Trade-offs and implications

---

## Performance Issues

*No performance issues documented yet.*

---

## How to Use This Document

1. **When encountering an issue:**
   - Document it under the appropriate section
   - Include error messages, screenshots if helpful
   - Document the solution step-by-step
   - Add prevention tips

2. **When making architectural decisions:**
   - Use the Decision Log Format
   - Reference related issues or discussions
   - Link to relevant code files

3. **Keep it updated:**
   - Add new issues as they occur
   - Update solutions if better approaches are found
   - Archive resolved issues that are no longer relevant (move to bottom with "Archived" label)
