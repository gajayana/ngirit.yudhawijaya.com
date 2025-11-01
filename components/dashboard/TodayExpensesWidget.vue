<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
  >
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="h-5 w-5 text-primary-500" />
        <h2 class="text-base font-semibold sm:text-lg">Pengeluaran Hari Ini</h2>
      </div>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ currentDate }}
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="expenses.length === 0" class="py-8 text-center">
      <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Belum ada pengeluaran hari ini 🎉</p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
        Hari yang hemat! Atau belum sempat dicatat?
      </p>
    </div>

    <!-- Expense List -->
    <div v-else class="space-y-3">
      <div
        v-for="expense in expenses"
        :key="expense.id"
        class="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
      >
        <!-- Content -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ expense.description }}</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ expense.time }}</p>
        </div>

        <!-- Amount -->
        <div class="text-right">
          <p class="text-sm font-semibold text-red-600 dark:text-red-400">
            {{ formatCurrency(expense.amount) }}
          </p>
          <p v-if="expense.category" class="mt-0.5 text-xs text-gray-500">
            {{ expense.category }}
          </p>
        </div>

        <!-- Actions (only show if user has permission) -->
        <div v-if="expense.canModify" class="flex items-center gap-1">
          <UButton
            icon="i-heroicons-pencil"
            size="xs"
            color="primary"
            variant="ghost"
            square
            @click="openEditDialog(expense.id)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            color="error"
            variant="ghost"
            square
            @click="openDeleteDialog(expense.id)"
          />
        </div>
      </div>
    </div>

    <!-- Edit Transaction Dialog -->
    <DashboardEditTransactionDialog
      v-model:open="isEditDialogOpen"
      :transaction-id="selectedTransactionId"
      @updated="handleTransactionUpdated"
    />

    <!-- Delete Confirmation Dialog -->
    <DashboardDeleteTransactionDialog
      v-model:open="isDeleteDialogOpen"
      :transaction-id="selectedTransactionId"
      @deleted="handleTransactionDeleted"
    />

    <!-- Show All Button (if more than 5) -->
    <div v-if="expenses.length > 5" class="mt-4">
      <UButton block variant="soft" size="sm" class="min-h-[40px]">
        <span>Lihat Semua ({{ expenses.length }})</span>
        <UIcon name="i-heroicons-arrow-right" class="ml-1 h-4 w-4" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { formatCurrency } = useFinancial();
  const transactionStore = useTransactionStore();
  const authStore = useAuthStore();
  const toast = useToast();

  // Consume data from store
  const { todayTransactions } = storeToRefs(transactionStore);
  const { isAdmin, userId } = storeToRefs(authStore);

  // Dialog states
  const isEditDialogOpen = ref(false);
  const isDeleteDialogOpen = ref(false);
  const selectedTransactionId = ref<string | null>(null);

  /**
   * Check if user can edit/delete a transaction
   * Users can only edit/delete their own transactions
   * Managers and superadmins can edit/delete all transactions
   */
  function canModifyTransaction(transactionCreatedBy: string): boolean {
    // Admins (manager/superadmin) can modify all transactions
    if (isAdmin.value) return true;

    // Regular users can only modify their own transactions
    return userId.value === transactionCreatedBy;
  }

  // Transform transactions for display
  const expenses = computed(() => {
    return todayTransactions.value.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      time: new Date(tx.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      category: tx.category?.name || null,
      createdBy: tx.created_by,
      canModify: canModifyTransaction(tx.created_by),
    }));
  });

  // Current date formatted
  const currentDate = computed(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  });

  // Open edit dialog
  function openEditDialog(transactionId: string) {
    selectedTransactionId.value = transactionId;
    isEditDialogOpen.value = true;
  }

  // Open delete dialog
  function openDeleteDialog(transactionId: string) {
    selectedTransactionId.value = transactionId;
    isDeleteDialogOpen.value = true;
  }

  // Handle transaction updated
  function handleTransactionUpdated() {
    toast.add({
      title: 'Berhasil!',
      description: 'Transaksi berhasil diperbarui',
      color: 'success',
    });
  }

  // Handle transaction deleted
  function handleTransactionDeleted() {
    toast.add({
      title: 'Berhasil!',
      description: 'Transaksi berhasil dihapus',
      color: 'success',
    });
  }
</script>
