# Realtime Implementation Summary

## Overview

Implemented comprehensive Supabase Realtime subscriptions for live data synchronization across the Ngirit application.

## Architecture

### Core Composable: `useRealtime()`

**Location:** `composables/useRealtime.ts`

**Purpose:** Reusable composable for managing Supabase Realtime subscriptions with type safety and automatic cleanup.

**Key Features:**
- Type-safe event handlers using TypeScript generics
- Automatic subscription management (subscribe/unsubscribe)
- Status tracking for each channel
- Filter support for server-side event filtering
- Debug logging for troubleshooting
- Handles all realtime events: INSERT, UPDATE, DELETE, or *

**API:**

```typescript
const { subscribe, unsubscribe, isSubscribed, getStatus } = useRealtime();

// Subscribe to a table
const channelId = subscribe({
  table: 'transactions',
  event: '*',
  filter: 'user_id=eq.123',  // Optional RLS filter
  onInsert: (payload) => { /* handle insert */ },
  onUpdate: (payload) => { /* handle update */ },
  onDelete: (payload) => { /* handle delete */ },
  onStatusChange: (status) => { /* handle status */ },
  debug: true,
});

// Cleanup
unsubscribe(channelId);
```

## Store Implementations

### 1. Transaction Store

**Location:** `stores/transaction-store.ts`

**Subscriptions:**
- `transactions` table - For transaction CRUD operations
- `family_members` table - For family membership changes

**Event Handlers:**

**`handleTransactionInsert()`**
- Validates transaction belongs to current month
- Checks if transaction is from family member (when includeFamily is on)
- Fetches full transaction with category join
- Prevents duplicates
- Adds to beginning of transaction list

**`handleTransactionUpdate()`**
- Finds transaction in local state
- Fetches updated data with category join
- Updates in-place

**`handleTransactionDelete()`**
- Removes transaction from local state
- Handles soft deletes

**`handleFamilyMemberChange()`**
- Refetches family member list
- Refetches transactions with updated family filter
- Ensures transaction list stays in sync with family membership

**Initialization:**
- Called from `dashboard.vue` on mount
- Subscribes to both transactions and family_members tables
- Cleaned up on unmount

### 2. Auth Store

**Location:** `stores/auth-store.ts`

**Subscriptions:**
- `user_data` table - For user role and blocked status changes

**Event Handlers:**

**`handleUserDataUpdate()`**
- Validates event is for current user (using filter)
- Updates role and blocked status
- Logs significant changes
- Shows console warnings when account is blocked

**Initialization:**
- Automatically initialized when user logs in
- Uses filter: `user_id=eq.{userId}` for efficiency
- Cleaned up on logout

## Data Flow

### Transaction Insert Flow

```
User adds transaction in Window 1
         ↓
API creates transaction in Supabase
         ↓
Supabase triggers realtime event
         ↓
All subscribed clients receive event
         ↓
handleTransactionInsert() validates event
         ↓
Fetch full transaction with category join
         ↓
Add to local state (transactions array)
         ↓
UI automatically updates (Vue reactivity)
         ↓
Window 2 shows new transaction instantly
```

### Family Member Change Flow

```
Admin adds member in Window 1
         ↓
API updates family_members table
         ↓
Supabase triggers realtime event
         ↓
All family members receive event
         ↓
handleFamilyMemberChange() triggered
         ↓
Refetch family member list
         ↓
Refetch transactions with new family filter
         ↓
All windows show updated data
```

### User Role Change Flow

```
Superadmin updates user role
         ↓
API updates user_data table
         ↓
Supabase triggers realtime event
         ↓
Affected user receives event (server-side filtered)
         ↓
handleUserDataUpdate() validates and updates role
         ↓
Console logs role change
         ↓
User's permissions update instantly
```

## Technical Details

### RLS and Realtime

Realtime events are filtered server-side by RLS policies:
- Users only receive events for data they can access
- No need for client-side permission checks
- Efficient - reduces unnecessary event processing

### Subscription Filters

Additional filtering with Supabase filters:
- `user_data`: `user_id=eq.{userId}` - Only current user's data
- More efficient than client-side filtering
- Reduces bandwidth and processing

### Category Joins

Transaction events don't include joined data by default:
- **Solution**: Fetch full transaction with `select('*, categories(...)')` after INSERT/UPDATE
- Ensures UI has complete category information (icon, color, name)
- Fallback: Use payload data if fetch fails

### Month Filtering

Only transactions from current month are kept in state:
- INSERT events are validated by `getMonthFromDate()`
- Prevents accumulating transactions from other months
- Keeps memory usage low

### Duplicate Prevention

Multiple sources can trigger the same data change:
- Optimistic updates in API calls
- Realtime events from Supabase
- **Solution**: Check for existing ID before adding to state

### Cleanup

Automatic cleanup on:
- Component unmount (`onUnmounted()` in dashboard)
- User logout (`resetState()` in stores)
- Window/tab close (browser handles WebSocket cleanup)

## Performance Considerations

### Benefits
- **WebSocket**: More efficient than HTTP polling
- **Server-side filtering**: RLS policies reduce client-side processing
- **Minimal bandwidth**: Only changed data is sent
- **Low latency**: Typically < 100ms for events

### Optimization
- Smart filtering prevents unnecessary refetches
- Duplicate detection prevents redundant operations
- Month-based filtering limits state size
- Category joins are only fetched when needed

## Error Handling

### CHANNEL_ERROR
- Logged with helpful message
- Includes instructions to enable Realtime in Supabase
- App continues to work (manual refresh still works)

### Network Errors
- Supabase client auto-reconnects WebSocket
- Failed fetch fallbacks to payload data
- Errors are logged but don't crash app

### Race Conditions
- Duplicate detection prevents double-adds
- Optimistic updates ensure instant feedback
- Realtime events provide eventual consistency

## Testing

See `docs/REALTIME_TESTING.md` for comprehensive testing guide.

## Future Enhancements

### Possible Improvements
1. **Toast Notifications**: Show user-friendly messages for realtime events
2. **Optimistic Updates**: Add skeleton/loading states for better UX
3. **Conflict Resolution**: Handle edit conflicts when multiple users edit same transaction
4. **Presence**: Show which family members are online
5. **Typing Indicators**: Show when others are editing
6. **Categories Realtime**: Subscribe to category changes
7. **Assets Realtime**: Subscribe to asset balance changes

### Production Considerations
1. **Disable Debug Logs**: Set `debug: false` in production
2. **Monitor Performance**: Track WebSocket connection health
3. **Error Tracking**: Send realtime errors to monitoring service
4. **Rate Limiting**: Consider throttling rapid updates
5. **User Notifications**: Implement toast/notification system for important events

## Dependencies

- **Supabase JS Client**: v2.x - For realtime subscriptions
- **Supabase CLI**: v2.53.6+ - Required for local development
- **@supabase/supabase-js**: Auto-reconnecting WebSocket client

## Configuration

### Supabase Dashboard
Enable Realtime replication for:
- `transactions`
- `family_members`
- `user_data`

### Environment Variables
No additional environment variables needed - uses existing Supabase config.

### RLS Policies
Existing RLS policies automatically filter realtime events.

## Troubleshooting

Common issues and solutions are documented in:
- `docs/REALTIME_TESTING.md` - Comprehensive testing and troubleshooting guide

## Code Locations

**Composable:**
- `composables/useRealtime.ts` - Core realtime composable

**Stores:**
- `stores/transaction-store.ts` - Transaction and family member subscriptions
- `stores/auth-store.ts` - User data subscriptions

**Documentation:**
- `docs/REALTIME_TESTING.md` - Testing guide
- `docs/REALTIME_IMPLEMENTATION.md` - This file
- `CHANGELOG.md` - Version history

## Changelog Entry

Added to `CHANGELOG.md` under "Recent Updates" section with complete feature list and benefits.
