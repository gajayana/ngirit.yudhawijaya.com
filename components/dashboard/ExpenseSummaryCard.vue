<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <!-- Today's Total -->
    <div
      class="rounded-lg border border-gray-200 bg-gradient-to-br from-red-50 to-red-100 p-5 dark:border-red-900/30 dark:from-red-950/50 dark:to-red-900/30"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="rounded-full bg-red-500/10 p-2 dark:bg-red-500/20">
            <UIcon name="i-heroicons-calendar" class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <span class="text-sm font-medium text-red-900 dark:text-red-200">Hari Ini</span>
        </div>
      </div>
      <div class="mt-3">
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ formatCurrency(todayTotal) }}
        </p>
        <p class="mt-1 text-xs text-red-700 dark:text-red-300">
          {{ todayCount }} transaksi
        </p>
      </div>
    </div>

    <!-- Monthly Total -->
    <div
      class="rounded-lg border border-gray-200 bg-gradient-to-br from-primary-50 to-primary-100 p-5 dark:border-primary-900/30 dark:from-primary-950/50 dark:to-primary-900/30"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="rounded-full bg-primary-500/10 p-2 dark:bg-primary-500/20">
            <UIcon name="i-heroicons-chart-bar" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <span class="text-sm font-medium text-primary-900 dark:text-primary-200">Bulan Ini</span>
        </div>
      </div>
      <div class="mt-3">
        <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
          {{ formatCurrency(monthlyTotal) }}
        </p>
        <p class="mt-1 text-xs text-primary-700 dark:text-primary-300">
          {{ monthlyCount }} transaksi
        </p>
      </div>
      <!-- Comparison with last month -->
      <div v-if="comparisonPercentage !== 0" class="mt-3 flex items-center gap-1">
        <UIcon
          :name="comparisonPercentage > 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
          :class="[
            'h-4 w-4',
            comparisonPercentage > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
          ]"
        />
        <span
          :class="[
            'text-xs font-medium',
            comparisonPercentage > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300',
          ]"
        >
          {{ Math.abs(comparisonPercentage) }}% vs bulan lalu
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { formatCurrency } = useFinancial();
  const transactionStore = useTransactionStore();

  // Consume data from store
  const { todayTotal, todayCount, monthlyTotal, monthlyCount } = storeToRefs(transactionStore);

  // Comparison with last month (positive = higher, negative = lower)
  // TODO: Implement last month comparison in future phase
  const comparisonPercentage = ref(0);
</script>
