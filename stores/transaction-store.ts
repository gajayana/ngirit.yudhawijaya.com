import { defineStore } from 'pinia';
import type {
  TransactionWithCategory,
  TransactionInput,
  TransactionInsert,
  TransactionUpdate,
} from '~/utils/constants/transaction';
import { TRANSACTION_TYPE } from '~/utils/constants/transaction';
import type { Database } from '~/utils/constants/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Pinia store for transaction management
 * Manages current month's transactions with realtime subscriptions
 */
export const useTransactionStore = defineStore('transaction', () => {
  const { sum, add } = useFinancial();
  const supabase = useSupabaseClient<Database>();

  // State
  const transactions = ref<TransactionWithCategory[]>([]);
  const currentMonth = ref<string>(''); // Format: 'YYYY-MM'
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const isSubscribed = ref(false);

  // Realtime channel
  let realtimeChannel: RealtimeChannel;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get current month in YYYY-MM format
   */
  function getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get month from date string in YYYY-MM format
   */
  function getMonthFromDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Check if date is today
   */
  function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // ============================================================================
  // Getters (Computed)
  // ============================================================================

  /**
   * Get today's transactions
   */
  const todayTransactions = computed(() => {
    return transactions.value.filter(t => isToday(t.created_at));
  });

  /**
   * Get today's total amount
   */
  const todayTotal = computed(() => {
    const amounts = todayTransactions.value
      .filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE)
      .map(t => t.amount);
    return sum(amounts);
  });

  /**
   * Get today's transaction count
   */
  const todayCount = computed(() => {
    return todayTransactions.value.filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE)
      .length;
  });

  /**
   * Get monthly total amount
   */
  const monthlyTotal = computed(() => {
    const amounts = transactions.value
      .filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE)
      .map(t => t.amount);
    return sum(amounts);
  });

  /**
   * Get monthly transaction count
   */
  const monthlyCount = computed(() => {
    return transactions.value.filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE).length;
  });

  /**
   * Get monthly summary grouped by category
   */
  const monthlySummaryByCategory = computed(() => {
    const expenseTransactions = transactions.value.filter(
      t => t.transaction_type === TRANSACTION_TYPE.EXPENSE
    );

    // Group by category name or "Tak Terkategori"
    const grouped = new Map<
      string,
      {
        total: number;
        count: number;
        category: TransactionWithCategory['category'];
      }
    >();

    for (const tx of expenseTransactions) {
      const categoryName = tx.category?.name || 'Tak Terkategori';

      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, {
          total: 0,
          count: 0,
          category: tx.category,
        });
      }

      const group = grouped.get(categoryName)!;
      group.total = add(group.total, tx.amount);
      group.count++;
    }

    // Convert to array and calculate percentages
    const total = monthlyTotal.value;
    const summaries = Array.from(grouped.entries()).map(([label, data]) => ({
      label,
      total: data.total,
      count: data.count,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
      icon: data.category?.icon || null,
      color: data.category?.color || null,
    }));

    // Sort by total descending
    return summaries.sort((a, b) => b.total - a.total);
  });

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetch current month's transactions
   */
  async function fetchCurrentMonth() {
    isLoading.value = true;
    error.value = null;

    try {
      currentMonth.value = getCurrentMonthString();

      // Calculate month range
      const [year, monthNum] = currentMonth.value.split('-');
      if (!year || !monthNum) {
        throw new Error('Invalid month format');
      }
      const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

      console.log('Fetching transactions for month:', currentMonth.value);
      console.log('Date range:', startOfMonth.toISOString(), 'to', endOfMonth.toISOString());

      // Fetch directly from Supabase (client-side)
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('Fetched transactions:', data?.length || 0);
      transactions.value = (data || []) as TransactionWithCategory[];
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Add new transaction(s) (bulk insert)
   * Uses direct Supabase insert since API endpoints don't work well with client-side auth
   */
  async function addTransaction(newTransactions: TransactionInput[]) {
    try {
      console.log('Adding transactions via Supabase client...');

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Adding transactions for user:', user.id);

      // Prepare transactions with created_by using proper type
      const transactionsToInsert: TransactionInsert[] = newTransactions.map(tx => ({
        description: tx.description,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        category: tx.category || null,
        created_by: user.id,
      }));

      // Insert directly via Supabase client
      // RLS policies will enforce that user can only insert with their own ID
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select('*');

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(insertError.message);
      }

      console.log('✅ Inserted transactions:', data?.length || 0);

      // Optimistically add to store for instant feedback
      // Only add if they belong to current month
      const currentMonthString = getCurrentMonthString();
      const currentMonthTransactions = (data || []).filter(
        t => getMonthFromDate(t.created_at) === currentMonthString
      );

      // Prepend to transactions array (cast to proper type)
      transactions.value.unshift(...(currentMonthTransactions as TransactionWithCategory[]));

      return {
        success: true,
        data: data as TransactionWithCategory[],
        count: data?.length || 0,
      };
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to add transaction');
      console.error('❌ Error adding transaction:', err);
      throw err;
    }
  }

  /**
   * Update transaction
   * Uses direct Supabase update with RLS protection
   */
  async function updateTransaction(id: string, updateData: Partial<TransactionInput>) {
    try {
      console.log('Updating transaction:', id);

      // Prepare update data with proper type
      const updatePayload: TransactionUpdate = {
        description: updateData.description,
        amount: updateData.amount,
        transaction_type: updateData.transaction_type,
        category: updateData.category,
        updated_at: new Date().toISOString(),
      };

      // Update directly via Supabase client
      // RLS policies will enforce that user can only update their own transactions
      const { data, error: updateError } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ Updated transaction');

      // Update in local state
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index] = data as TransactionWithCategory;
      }

      return {
        success: true,
        data: data as TransactionWithCategory,
      };
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update transaction');
      console.error('❌ Error updating transaction:', err);
      throw err;
    }
  }

  /**
   * Delete transaction (soft delete)
   * Uses direct Supabase update with RLS protection
   */
  async function deleteTransaction(id: string) {
    try {
      console.log('Soft deleting transaction:', id);

      // Prepare soft delete payload with proper type
      const deletePayload: TransactionUpdate = {
        deleted_at: new Date().toISOString(),
      };

      // Soft delete via Supabase client (set deleted_at timestamp)
      // RLS policies will enforce that user can only delete their own transactions
      const { error: deleteError } = await supabase
        .from('transactions')
        .update(deletePayload)
        .eq('id', id);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw new Error(deleteError.message);
      }

      console.log('✅ Soft deleted transaction');

      // Remove from local state
      transactions.value = transactions.value.filter(t => t.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to delete transaction');
      console.error('❌ Error deleting transaction:', err);
      throw err;
    }
  }

  /**
   * Handle realtime event from Supabase
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleRealtimeEvent(payload: any) {
    // Only process events for current month
    const transactionDate = payload.new?.created_at || payload.old?.created_at;
    if (!transactionDate) return;

    const transactionMonth = getMonthFromDate(transactionDate);
    if (transactionMonth !== currentMonth.value) {
      console.log('Ignoring realtime event from different month:', transactionMonth);
      return;
    }

    console.log('Processing realtime event:', payload.eventType, payload);

    if (payload.eventType === 'INSERT' && payload.new) {
      // Add new transaction to the beginning
      transactions.value.unshift(payload.new as TransactionWithCategory);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      // Update existing transaction
      const index = transactions.value.findIndex(t => t.id === payload.new?.id);
      if (index !== -1) {
        transactions.value[index] = payload.new as TransactionWithCategory;
      }
    } else if (payload.eventType === 'DELETE' && payload.old) {
      // Remove transaction
      transactions.value = transactions.value.filter(t => t.id !== payload.old?.id);
    }
  }

  /**
   * Initialize realtime subscription
   */
  function initRealtimeSubscription() {
    if (isSubscribed.value || !import.meta.client) return;

    // Skip realtime in local development
    // Supabase CLI now uses non-JWT keys which don't work with Realtime service
    const config = useRuntimeConfig();
    const isLocalDev = config.public.supabase.url.includes('127.0.0.1') ||
                       config.public.supabase.url.includes('localhost');

    if (isLocalDev) {
      console.log('⚠️ Realtime disabled in local development');
      console.log('💡 Reason: Supabase CLI uses non-JWT keys that are incompatible with Realtime service');
      console.log('✅ Realtime will work automatically in production');
      return;
    }

    console.log('Initializing realtime subscription for transactions');

    realtimeChannel = supabase.channel('public:transactions').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
      },
      payload => {
        console.log('Change received!', payload);
        handleRealtimeEvent(payload);
      }
    );

    realtimeChannel.subscribe((status: string) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribed.value = true;
        console.log('✅ Realtime subscription active for transactions');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn(
          '⚠️ Realtime subscription failed. This is expected if Realtime is not enabled in Supabase.'
        );
        console.warn("The app will work normally, but changes won't update in real-time.");
        console.warn(
          'To enable: Go to Supabase Dashboard → Database → Replication → Enable for transactions table'
        );
      }
    });
  }

  /**
   * Clean up realtime subscription
   */
  function cleanupRealtimeSubscription() {
    if (realtimeChannel) {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(realtimeChannel);
      isSubscribed.value = false;
    }
  }

  /**
   * Reset store state
   */
  function resetState() {
    transactions.value = [];
    currentMonth.value = '';
    isLoading.value = false;
    error.value = null;
    cleanupRealtimeSubscription();
  }

  return {
    // State
    transactions,
    currentMonth,
    isLoading,
    error,
    isSubscribed,

    // Getters
    todayTransactions,
    todayTotal,
    todayCount,
    monthlyTotal,
    monthlyCount,
    monthlySummaryByCategory,

    // Actions
    fetchCurrentMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    initRealtimeSubscription,
    cleanupRealtimeSubscription,
    resetState,
  };
});
