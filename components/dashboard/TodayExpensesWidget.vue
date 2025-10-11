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
      <UIcon
        name="i-heroicons-inbox"
        class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700"
      />
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Belum ada pengeluaran hari ini
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
        Gunakan tombol "Tambah Pengeluaran" untuk mencatat
      </p>
    </div>

    <!-- Expense List -->
    <div v-else class="space-y-3">
      <div
        v-for="expense in expenses"
        :key="expense.id"
        class="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ expense.description }}</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ expense.time }}</p>
        </div>
        <div class="ml-4 text-right">
          <p class="text-sm font-semibold text-red-600 dark:text-red-400">
            {{ formatCurrency(expense.amount) }}
          </p>
          <p v-if="expense.category" class="mt-0.5 text-xs text-gray-500">
            {{ expense.category }}
          </p>
        </div>
      </div>
    </div>

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

  // Consume data from store
  const { todayTransactions } = storeToRefs(transactionStore);

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
</script>
