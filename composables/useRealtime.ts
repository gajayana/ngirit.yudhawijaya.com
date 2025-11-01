/**
 * Realtime subscription composable for Supabase
 *
 * Provides utilities for managing Supabase Realtime subscriptions with:
 * - Automatic cleanup on unmount
 * - Type-safe event handlers
 * - Subscription status tracking
 * - Error handling and logging
 *
 * @example
 * ```typescript
 * const { subscribe, unsubscribe, isSubscribed } = useRealtime();
 *
 * // Subscribe to table changes
 * subscribe({
 *   table: 'transactions',
 *   event: '*',
 *   onInsert: (payload) => logger.log('New:', payload.new),
 *   onUpdate: (payload) => logger.log('Updated:', payload.new),
 *   onDelete: (payload) => logger.log('Deleted:', payload.old),
 * });
 *
 * // Cleanup
 * onUnmounted(() => unsubscribe('transactions'));
 * ```
 */

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '~/utils/constants/database';
import { logger } from '~/utils/logger';

// Type for database table names
type TableName = keyof Database['public']['Tables'];

// Type for realtime events
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Type for subscription options
interface SubscriptionOptions<T extends TableName> {
  /** Database table to subscribe to */
  table: T;
  /** Event type to listen for (INSERT, UPDATE, DELETE, or *) */
  event?: RealtimeEvent;
  /** Filter for specific conditions (e.g., 'id=eq.123') */
  filter?: string;
  /** Callback for INSERT events */
  onInsert?: (payload: RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>) => void;
  /** Callback for UPDATE events */
  onUpdate?: (payload: RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>) => void;
  /** Callback for DELETE events */
  onDelete?: (payload: RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>) => void;
  /** Callback for subscription status changes */
  onStatusChange?: (status: string) => void;
  /** Enable debug logging */
  debug?: boolean;
}

export const useRealtime = () => {
  const supabase = useSupabaseClient<Database>();

  // Store active channels by table name (using any for Supabase client channel type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channels = ref<Map<string, any>>(new Map());
  const subscriptionStatus = ref<Map<string, string>>(new Map());

  /**
   * Subscribe to realtime changes on a table
   */
  function subscribe<T extends TableName>(options: SubscriptionOptions<T>): string {
    const {
      table,
      event = '*',
      filter,
      onInsert,
      onUpdate,
      onDelete,
      onStatusChange,
      debug = false,
    } = options;

    // Only run on client-side
    if (!import.meta.client) {
      logger.warn('[useRealtime] Realtime subscriptions only work on client-side');
      return '';
    }

    // Create unique channel ID
    const channelId = filter
      ? `${table}:${filter}:${Date.now()}`
      : `${table}:${Date.now()}`;

    // Check if already subscribed
    if (channels.value.has(channelId)) {
      if (debug) logger.log(`[useRealtime] Already subscribed to ${channelId}`);
      return channelId;
    }

    if (debug) {
      logger.log(`[useRealtime] Subscribing to table: ${table}`);
      logger.log(`[useRealtime] Event: ${event}, Filter: ${filter || 'none'}`);
    }

    // Create channel with unique ID
    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: true },
        presence: { key: '' },
      },
    });

    // Add postgres changes listener
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        ...(filter && { filter }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (debug) {
          logger.log(`[useRealtime] ${table} - ${payload.eventType}:`, payload);
        }

        // Call appropriate handler based on event type
        if (payload.eventType === 'INSERT' && onInsert) {
          onInsert(payload as RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>);
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
          onUpdate(payload as RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete(payload as RealtimePostgresChangesPayload<Database['public']['Tables'][T]['Row']>);
        }
      }
    );

    // Subscribe and handle status
    channel.subscribe((status) => {
      subscriptionStatus.value.set(channelId, status);

      if (debug) {
        logger.log(`[useRealtime] ${table} subscription status:`, status);
      }

      if (status === 'SUBSCRIBED') {
        if (debug) logger.log(`✅ [useRealtime] Subscribed to ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error(`❌ [useRealtime] Subscription failed for ${table}`);
        logger.warn('Make sure Realtime is enabled in Supabase Dashboard → Database → Replication');
      }

      // Call custom status handler
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    // Store channel
    channels.value.set(channelId, channel);

    return channelId;
  }

  /**
   * Unsubscribe from a channel by ID
   */
  function unsubscribe(channelId: string, debug = false): void {
    const channel = channels.value.get(channelId);

    if (channel) {
      if (debug) logger.log(`[useRealtime] Unsubscribing from ${channelId}`);

      supabase.removeChannel(channel);
      channels.value.delete(channelId);
      subscriptionStatus.value.delete(channelId);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  function unsubscribeAll(debug = false): void {
    if (debug) logger.log(`[useRealtime] Unsubscribing from all channels (${channels.value.size})`);

    channels.value.forEach((channel, channelId) => {
      supabase.removeChannel(channel);
      subscriptionStatus.value.delete(channelId);
    });

    channels.value.clear();
  }

  /**
   * Check if subscribed to a specific channel
   */
  function isSubscribed(channelId: string): boolean {
    return subscriptionStatus.value.get(channelId) === 'SUBSCRIBED';
  }

  /**
   * Get subscription status for a channel
   */
  function getStatus(channelId: string): string | undefined {
    return subscriptionStatus.value.get(channelId);
  }

  /**
   * Get all active channel IDs
   */
  function getActiveChannels(): string[] {
    return Array.from(channels.value.keys());
  }

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    isSubscribed,
    getStatus,
    getActiveChannels,
    channels: computed(() => channels.value),
    subscriptionStatus: computed(() => subscriptionStatus.value),
  };
};
