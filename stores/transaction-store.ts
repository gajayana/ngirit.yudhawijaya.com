import { defineStore } from 'pinia';
import { startOfMonth, endOfMonth } from 'date-fns';
import type {
  TransactionWithCategory,
  TransactionInput,
} from '~/utils/constants/transaction';
import { TRANSACTION_TYPE } from '~/utils/constants/transaction';
import type { Database } from '~/utils/constants/database';
import { logger } from '~/utils/logger';

/**
 * Pinia store for transaction management
 * Manages current month's transactions with realtime subscriptions
 */
export const useTransactionStore = defineStore('transaction', () => {
  const { sum, add, compare } = useFinancial();
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  // State
  const transactions = ref<TransactionWithCategory[]>([]);
  const currentMonth = ref<string>(''); // Format: 'YYYY-MM'
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const isSubscribed = ref(false);
  const familyMemberIds = ref<string[]>([]); // IDs of family members (including self)
  const includeFamily = ref(true); // Toggle for showing family transactions (default: true)

  // Realtime subscriptions
  const { subscribe, unsubscribe, isSubscribed: checkSubscribed } = useRealtime();
  let transactionChannelId = '';
  let familyMemberChannelId = '';

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
   * Get active (non-deleted) transactions
   * Filters out soft-deleted transactions (deleted_at is not null)
   */
  const activeTransactions = computed(() => {
    return transactions.value.filter(t => !t.deleted_at);
  });

  /**
   * Get today's transactions
   */
  const todayTransactions = computed(() => {
    return activeTransactions.value.filter(t => isToday(t.created_at));
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
    const amounts = activeTransactions.value
      .filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE)
      .map(t => t.amount);
    return sum(amounts);
  });

  /**
   * Get monthly transaction count
   */
  const monthlyCount = computed(() => {
    return activeTransactions.value.filter(t => t.transaction_type === TRANSACTION_TYPE.EXPENSE).length;
  });

  /**
   * Get monthly summary grouped by category
   */
  const monthlySummaryByCategory = computed(() => {
    const expenseTransactions = activeTransactions.value.filter(
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

    // Sort by total descending using Decimal.js compare
    return summaries.sort((a, b) => compare(b.total, a.total));
  });

  /**
   * Check if user has family members (more than just themselves)
   */
  const hasFamilyMembers = computed(() => familyMemberIds.value.length > 1);

  /**
   * Get monthly summary grouped by description (case insensitive)
   */
  const monthlySummaryByDescription = computed(() => {
    const expenseTransactions = activeTransactions.value.filter(
      t => t.transaction_type === TRANSACTION_TYPE.EXPENSE
    );

    // Group by description (case insensitive)
    const grouped = new Map<
      string,
      {
        total: number;
        count: number;
        originalDescription: string; // Keep original case for display
      }
    >();

    for (const tx of expenseTransactions) {
      const descriptionLower = tx.description.toLowerCase();
      const originalDescription = tx.description;

      if (!grouped.has(descriptionLower)) {
        grouped.set(descriptionLower, {
          total: 0,
          count: 0,
          originalDescription, // Use first occurrence's original case
        });
      }

      const group = grouped.get(descriptionLower)!;
      group.total = add(group.total, tx.amount);
      group.count++;
    }

    // Convert to array and calculate percentages
    const total = monthlyTotal.value;
    const summaries = Array.from(grouped.values()).map(data => ({
      label: data.originalDescription,
      total: data.total,
      count: data.count,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
    }));

    // Sort by total descending using Decimal.js compare
    return summaries.sort((a, b) => compare(b.total, a.total));
  });

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetch family member IDs from all families the user belongs to
   */
  async function fetchFamilyMembers() {
    try {
      logger.log('Fetching family members...');
      const response = await $fetch<{
        success: boolean;
        data: Array<{
          id: string;
          members: Array<{
            user_id: string;
          }>;
        }>;
      }>('/api/v1/families', {
        method: 'GET',
        credentials: 'include',
      });

      logger.log('API response:', response);
      logger.log('Families count:', response.data.length);

      // Extract all unique user IDs from all families
      const allMemberIds = new Set<string>();
      response.data.forEach(family => {
        logger.log('Family:', family.id, 'Members:', family.members.length);
        family.members.forEach(member => {
          allMemberIds.add(member.user_id);
        });
      });

      familyMemberIds.value = Array.from(allMemberIds);
      logger.log('✅ Fetched family members:', familyMemberIds.value.length, familyMemberIds.value);
    } catch (err) {
      logger.error('❌ Error fetching family members:', err);
      familyMemberIds.value = [];
    }
  }

  /**
   * Fetch current month's transactions via API endpoint
   */
  async function fetchCurrentMonth() {
    isLoading.value = true;
    error.value = null;

    try {
      currentMonth.value = getCurrentMonthString();

      // Calculate start and end of current month in UTC
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      logger.log('Fetching transactions for month:', currentMonth.value);
      logger.log('Date range (UTC):', start.toISOString(), 'to', end.toISOString());
      logger.log('Include family:', includeFamily.value);

      // Fetch via API endpoint with proper auth handling
      const response = await $fetch<{
        success: boolean;
        data: TransactionWithCategory[];
        count: number;
      }>('/api/v1/transactions', {
        method: 'GET',
        query: {
          start: start.toISOString(),
          end: end.toISOString(),
          include_family: includeFamily.value,
        },
        credentials: 'include',
      });

      logger.log('✅ Fetched transactions:', response.count);
      transactions.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch transactions');
      logger.error('❌ Error fetching transactions:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Add new transaction(s) (bulk insert) via API endpoint
   */
  async function addTransaction(newTransactions: TransactionInput[]) {
    try {
      logger.log('Adding transactions via API endpoint...');

      // Call API endpoint - it will handle user auth and created_by
      const response = await $fetch<{
        success: boolean;
        data: TransactionWithCategory[];
        count: number;
      }>('/api/v1/transactions', {
        method: 'POST',
        body: {
          transactions: newTransactions,
        },
        credentials: 'include',
      });

      logger.log('✅ Inserted transactions:', response.count);

      // Optimistically add to store for instant feedback
      // Duplicate check in handleTransactionInsert will prevent realtime from adding duplicates
      const currentMonthString = getCurrentMonthString();
      const currentMonthTransactions = response.data.filter(
        t => getMonthFromDate(t.created_at) === currentMonthString
      );

      // Prepend to transactions array
      transactions.value.unshift(...currentMonthTransactions);
      logger.log('  ✅ Optimistically added', currentMonthTransactions.length, 'transactions');

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to add transaction');
      logger.error('❌ Error adding transaction:', err);
      throw err;
    }
  }

  /**
   * Update transaction via API endpoint
   */
  async function updateTransaction(id: string, updateData: Partial<TransactionInput>) {
    try {
      logger.log('Updating transaction via API:', id);

      // Call API endpoint - it will handle user auth and permissions
      const response = await $fetch<{
        success: boolean;
        data: TransactionWithCategory;
      }>(`/api/v1/transactions/${id}`, {
        method: 'PUT',
        body: updateData,
        credentials: 'include',
      });

      logger.log('✅ Updated transaction');

      // Update in local state
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index] = response.data;
      }

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update transaction');
      logger.error('❌ Error updating transaction:', err);
      throw err;
    }
  }

  /**
   * Delete transaction (soft delete) via API endpoint
   * Note: The transaction will be updated with deleted_at, not removed from the array
   * It will be filtered out by activeTransactions computed
   */
  async function deleteTransaction(id: string) {
    try {
      logger.log('Deleting transaction via API:', id);

      // Call API endpoint - it will handle user auth and permissions
      await $fetch(`/api/v1/transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      logger.log('✅ Soft deleted transaction');

      // Optimistically mark as deleted in local state
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        const updatedTransaction = {
          ...transactions.value[index],
          deleted_at: new Date().toISOString(),
        } as TransactionWithCategory;
        transactions.value[index] = updatedTransaction;
        logger.log('  ⏳ Marked as deleted locally, waiting for realtime UPDATE...');
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to delete transaction');
      logger.error('❌ Error deleting transaction:', err);
      throw err;
    }
  }

  /**
   * Handle transaction insert event
   */
  async function handleTransactionInsert(
    payload: { new: TransactionWithCategory }
  ) {
    const transaction = payload.new;
    logger.log('🔵 Realtime INSERT:', transaction.id);

    // Only add if it belongs to current month
    const transactionMonth = getMonthFromDate(transaction.created_at);
    if (transactionMonth !== currentMonth.value) {
      logger.log('  ⏭️  Skipping - different month:', transactionMonth);
      return;
    }

    // Filter based on includeFamily setting
    if (includeFamily.value) {
      // Family mode ON: Only show transactions from family members
      const isFromFamily = familyMemberIds.value.includes(transaction.created_by);
      if (!isFromFamily) {
        logger.log('  ⏭️  Skipping - not from family member');
        return;
      }
    } else {
      // Family mode OFF: Only show current user's transactions
      const isOwnTransaction = transaction.created_by === user.value?.sub;
      if (!isOwnTransaction) {
        logger.log('  ⏭️  Skipping - family mode OFF, not own transaction');
        return;
      }
    }

    // Avoid duplicates
    const exists = transactions.value.some(t => t.id === transaction.id);
    if (exists) {
      logger.log('  ⏭️  Skipping - already exists');
      return;
    }

    // Fetch full transaction with category join
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(id, name, icon, color, type)')
        .eq('id', transaction.id)
        .single();

      if (data) {
        // Add to beginning of array
        transactions.value.unshift(data as TransactionWithCategory);
        logger.log('  ✅ Added to store');
      }
    } catch (err) {
      logger.error('  ❌ Error fetching full transaction:', err);
      // Fallback: add the transaction without full category data
      transactions.value.unshift(transaction);
    }
  }

  /**
   * Handle transaction update event
   * Note: Soft deletes (deleted_at is set) will be filtered out by activeTransactions computed
   */
  async function handleTransactionUpdate(
    payload: { new: TransactionWithCategory }
  ) {
    const transaction = payload.new;
    logger.log('🟡 Realtime UPDATE:', transaction.id);

    const index = transactions.value.findIndex(t => t.id === transaction.id);

    if (index === -1) {
      logger.log('  ⏭️  Skipping - not in current list');
      return;
    }

    // Fetch full transaction with category join
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(id, name, icon, color, type)')
        .eq('id', transaction.id)
        .single();

      if (data) {
        transactions.value[index] = data as TransactionWithCategory;
        if (data.deleted_at) {
          logger.log('  🗑️  Soft delete - will be filtered by activeTransactions');
        } else {
          logger.log('  ✅ Updated in store');
        }
      }
    } catch (err) {
      logger.error('  ❌ Error fetching full transaction:', err);
      // Fallback: update with payload data
      transactions.value[index] = transaction;
    }
  }

  /**
   * Handle transaction delete event
   */
  function handleTransactionDelete(
    payload: { old: { id: string } }
  ) {
    const transactionId = payload.old.id;
    logger.log('🔴 Realtime DELETE:', transactionId);

    const index = transactions.value.findIndex(t => t.id === transactionId);
    if (index !== -1) {
      transactions.value.splice(index, 1);
      logger.log('  ✅ Removed from store');
    } else {
      logger.log('  ⏭️  Skipping - not in current list');
    }
  }

  /**
   * Handle family member changes
   */
  async function handleFamilyMemberChange() {
    logger.log('👨‍👩‍👧‍👦 Family members changed - refreshing...');

    // Refetch family members
    await fetchFamilyMembers();

    // Refetch transactions with updated family filter
    await fetchCurrentMonth();

    logger.log('  ✅ Refreshed family data');
  }

  /**
   * Initialize realtime subscriptions
   * Subscribes to both transactions and family_members tables
   */
  function initRealtimeSubscription() {
    if (isSubscribed.value || !import.meta.client) return;

    logger.log('🔄 Initializing realtime subscriptions...');

    // Subscribe to transactions table
    transactionChannelId = subscribe({
      table: 'transactions',
      event: '*',
      onInsert: (payload) => handleTransactionInsert(payload as { new: TransactionWithCategory }),
      onUpdate: (payload) => handleTransactionUpdate(payload as { new: TransactionWithCategory }),
      onDelete: (payload) => handleTransactionDelete(payload as { old: { id: string } }),
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed.value = true;
          logger.log('✅ Subscribed to transactions');
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('⚠️  Transactions realtime failed');
          logger.warn('Enable in: Supabase Dashboard → Database → Replication');
        }
      },
      debug: true,
    });

    // Subscribe to family_members table for membership changes
    familyMemberChannelId = subscribe({
      table: 'family_members',
      event: '*',
      onInsert: () => handleFamilyMemberChange(),
      onUpdate: () => handleFamilyMemberChange(),
      onDelete: () => handleFamilyMemberChange(),
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          logger.log('✅ Subscribed to family_members');
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('⚠️  Family members realtime failed');
        }
      },
      debug: true,
    });

    logger.log('🎯 Realtime subscriptions initialized');
  }

  /**
   * Clean up realtime subscriptions
   */
  function cleanupRealtimeSubscription() {
    logger.log('🧹 Cleaning up realtime subscriptions...');

    if (transactionChannelId) {
      unsubscribe(transactionChannelId, true);
      transactionChannelId = '';
    }

    if (familyMemberChannelId) {
      unsubscribe(familyMemberChannelId, true);
      familyMemberChannelId = '';
    }

    isSubscribed.value = false;
    logger.log('✅ Cleanup complete');
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
    transactions: activeTransactions, // Export filtered transactions (without soft-deleted)
    allTransactions: transactions, // Export all transactions including soft-deleted (for debugging)
    currentMonth,
    isLoading,
    error,
    isSubscribed,
    familyMemberIds,
    includeFamily,

    // Getters
    todayTransactions,
    todayTotal,
    todayCount,
    monthlyTotal,
    monthlyCount,
    monthlySummaryByCategory,
    monthlySummaryByDescription,
    hasFamilyMembers,

    // Actions
    fetchFamilyMembers,
    fetchCurrentMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    initRealtimeSubscription,
    cleanupRealtimeSubscription,
    resetState,
  };
});
