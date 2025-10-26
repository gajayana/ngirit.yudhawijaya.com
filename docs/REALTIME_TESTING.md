# Realtime Testing Guide

This guide explains how to test the Supabase Realtime functionality implemented in Ngirit.

## Overview

The application now has realtime subscriptions for:

1. **Transactions** - Live updates when transactions are added, edited, or deleted
2. **Family Members** - Live updates when family membership changes
3. **User Data** - Live updates when user role or blocked status changes

## Prerequisites

### 1. Enable Realtime in Supabase

You must enable Realtime replication for the following tables in your Supabase dashboard:

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Enable Realtime for these tables:
   - `transactions`
   - `family_members`
   - `user_data`

### 2. Check Supabase CLI Version

Ensure you have Supabase CLI v2.53.6 or later:

```bash
supabase --version
```

If not, update:

```bash
npm install -g supabase@latest
```

## Testing Scenarios

### Test 1: Transaction Realtime Updates

**Setup:**
- Open the app in two browser windows/tabs
- Log in as the same user in both
- Navigate to the dashboard in both windows

**Test Steps:**

1. **Add Transaction** - In Window 1:
   - Click the "Quick Add" button
   - Add a new transaction
   - ✅ **Expected**: Window 2 should instantly show the new transaction without refresh

2. **Edit Transaction** - In Window 1:
   - Click on a transaction to edit it
   - Change the amount or description
   - ✅ **Expected**: Window 2 should instantly reflect the changes

3. **Delete Transaction** - In Window 1:
   - Delete a transaction
   - ✅ **Expected**: Window 2 should instantly remove it from the list

**Console Logs to Check:**

```
🔄 Initializing realtime subscriptions...
✅ Subscribed to transactions
✅ Subscribed to family_members
```

When events occur:
```
🔵 Realtime INSERT: [transaction-id]
  ✅ Added to store

🟡 Realtime UPDATE: [transaction-id]
  ✅ Updated in store

🔴 Realtime DELETE: [transaction-id]
  ✅ Removed from store
```

### Test 2: Family Member Realtime Updates

**Setup:**
- Create a family or use an existing one
- Open the app in two windows
- Window 1: User A (family owner)
- Window 2: User B (family member)

**Test Steps:**

1. **Add Family Member** - In Window 1:
   - Go to family settings
   - Add a new member
   - ✅ **Expected**: All open windows should refresh family data

2. **Remove Family Member** - In Window 1:
   - Remove a family member
   - ✅ **Expected**: All windows should update member list

3. **Add Transaction as Family Member** - In Window 2 (User B):
   - Add a transaction
   - ✅ **Expected**: Window 1 (User A) should see the transaction instantly

**Console Logs to Check:**

```
👨‍👩‍👧‍👦 Family members changed - refreshing...
  ✅ Refreshed family data
```

### Test 3: User Role/Status Realtime Updates

**Setup:**
- Open the app as User A
- Open Supabase Studio or use another admin account

**Test Steps:**

1. **Change User Role** - From Supabase Studio:
   - Go to Table Editor → `user_data`
   - Change User A's role from `user` to `manager`
   - ✅ **Expected**: User A's app should log the role change

2. **Block User** - From Supabase Studio:
   - Change User A's `is_blocked` to `true`
   - ✅ **Expected**: User A's app should log the block status

**Console Logs to Check:**

```
🔄 Subscribing to user_data changes...
✅ Subscribed to user_data changes

👤 User data changed in realtime: { user_id, role, is_blocked }
  🔄 Role changed: user → manager
```

Or:

```
  🔄 Block status changed: false → true
  ⚠️  Your account has been blocked
```

## Common Issues & Troubleshooting

### Issue 1: "CHANNEL_ERROR" Status

**Symptoms:**
```
⚠️  Transactions realtime failed
Enable in: Supabase Dashboard → Database → Replication
```

**Solution:**
- Go to Supabase Dashboard
- Navigate to Database → Replication
- Enable Realtime for the affected table

### Issue 2: No Realtime Updates

**Symptoms:**
- No console logs for realtime events
- Changes don't appear in other windows

**Troubleshooting Steps:**

1. Check browser console for errors
2. Verify Realtime is enabled in Supabase
3. Check that you're on the client-side (not SSR)
4. Verify your Supabase CLI version is up to date
5. Check your network tab for WebSocket connections to Supabase

### Issue 3: Duplicate Transactions

**Symptoms:**
- Same transaction appears multiple times

**Solution:**
- The code has duplicate detection built-in
- Check console logs for "⏭️ Skipping - already exists"
- If still happening, it might be a race condition - report as a bug

### Issue 4: RLS Policies Blocking Realtime

**Symptoms:**
- Realtime connects but no events are received
- Console shows "⏭️ Skipping - not from family member"

**Solution:**
- RLS policies filter events server-side
- This is expected behavior - you only receive events for data you have access to
- Verify your RLS policies allow the user to SELECT the data

## Debugging Tips

### Enable Debug Mode

The realtime composable has debug mode enabled by default. Check console for detailed logs:

```typescript
[useRealtime] Subscribing to table: transactions
[useRealtime] Event: *, Filter: none
[useRealtime] transactions subscription status: SUBSCRIBED
```

### Monitor Active Channels

You can inspect active realtime channels in the console:

```javascript
// In browser console
const { channels } = useRealtime()
console.log(channels.value)
```

### Check Supabase Realtime Status

In browser DevTools → Network tab:
- Look for WebSocket connections to `wss://[your-project].supabase.co/realtime/v1/websocket`
- Status should be "101 Switching Protocols"
- Connection should stay open (not close immediately)

## Performance Considerations

### Subscription Cleanup

Subscriptions are automatically cleaned up when:
- User logs out (`resetState()` is called)
- Component unmounts (dashboard page)
- User navigates away

### Network Impact

Realtime uses WebSockets which are:
- More efficient than polling
- Low bandwidth overhead
- Minimal latency (usually < 100ms)

### Database Load

Realtime subscriptions:
- Do NOT increase database load (no polling)
- Use PostgreSQL's built-in LISTEN/NOTIFY
- Are filtered server-side by RLS policies

## What to Expect

### ✅ Working Correctly

When realtime is working, you should see:

1. **Instant updates** across all open windows
2. **Console logs** showing subscription status
3. **Colored emoji logs** (🔵, 🟡, 🔴) for transaction events
4. **Family icon logs** (👨‍👩‍👧‍👦) for family member changes
5. **User icon logs** (👤) for user data changes

### ❌ Known Limitations

1. **SSR**: Realtime only works on client-side (expected)
2. **RLS Filtering**: You only see events for data you can access (expected)
3. **Historical Data**: Realtime only sends new changes, not historical data
4. **Connection Drops**: WebSocket may disconnect if network is unstable (will auto-reconnect)

## Testing Checklist

- [ ] Supabase Realtime enabled for all required tables
- [ ] Supabase CLI version 2.53.6 or higher
- [ ] Two browser windows open with same user
- [ ] Console logs showing subscription success
- [ ] Add transaction → appears in other window
- [ ] Edit transaction → updates in other window
- [ ] Delete transaction → removed from other window
- [ ] Add family member → both windows refresh
- [ ] Family member adds transaction → appears for family owner
- [ ] Change user role → console logs the change
- [ ] Block user → console logs the block

## Next Steps

If all tests pass:
- ✅ Realtime is working correctly
- Consider disabling debug mode in production
- Monitor for any performance issues
- Consider adding toast notifications for realtime events

If tests fail:
- Review the troubleshooting section above
- Check browser console for errors
- Verify Supabase configuration
- Check RLS policies
- Report issues with console logs and steps to reproduce
