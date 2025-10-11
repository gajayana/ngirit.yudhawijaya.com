<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
  >
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-chart-bar" class="h-5 w-5 text-primary-500" />
        <h2 class="text-base font-semibold sm:text-lg">Ringkasan Bulan Ini</h2>
      </div>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ currentMonth }}
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="summaries.length === 0" class="py-8 text-center">
      <UIcon
        name="i-heroicons-chart-bar-square"
        class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700"
      />
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Belum ada pengeluaran bulan ini
      </p>
    </div>

    <!-- Summary List -->
    <div v-else class="space-y-3">
      <div
        v-for="summary in summaries"
        :key="summary.label"
        class="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
      >
        <div class="mb-2 flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ summary.label }}</p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ summary.count }} transaksi
            </p>
          </div>
          <p class="ml-4 text-sm font-semibold text-red-600 dark:text-red-400">
            {{ formatCurrency(summary.total) }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full bg-primary-500 transition-all"
            :style="{ width: `${summary.percentage}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Total Footer -->
    <div v-if="summaries.length > 0" class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Bulan Ini</span>
        <span class="text-base font-bold text-red-600 dark:text-red-400">
          {{ formatCurrency(monthlyTotal) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { formatCurrency } = useFinancial();
  const transactionStore = useTransactionStore();

  // Consume data from store - grouped by description instead of category
  const { monthlySummaryByDescription, monthlyTotal } = storeToRefs(transactionStore);

  // Use the store's summary data directly
  const summaries = monthlySummaryByDescription;

  // Current month formatted
  const currentMonth = computed(() => {
    return new Date().toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  });
</script>
