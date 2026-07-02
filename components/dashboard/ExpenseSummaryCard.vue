<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <!-- Loading Skeleton -->
    <template v-if="isLoading">
      <div
        v-for="i in 2"
        :key="i"
        class="rounded-lg border border-gray-200 p-5 dark:border-gray-800"
      >
        <div class="flex items-center gap-2">
          <USkeleton class="h-9 w-9 rounded-full" />
          <USkeleton class="h-4 w-16" />
        </div>
        <div class="mt-3 space-y-2">
          <USkeleton class="h-7 w-32" />
          <USkeleton class="h-3 w-20" />
        </div>
      </div>
    </template>

    <!-- Today's Total -->
    <div
      v-else
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
      v-if="!isLoading"
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
      <!-- Last Input Info -->
      <p class="mt-2 text-xs text-primary-700 dark:text-primary-300">
        {{ lastInputLabel }}
      </p>
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
          {{ Math.abs(comparisonPercentage) }}% dari bulan lalu
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import { id } from 'date-fns/locale';

  const { formatCurrency } = useFinancial();
  const transactionStore = useTransactionStore();

  // Consume data from store
  const { todayTotal, todayCount, monthlyTotal, monthlyCount, lastInputAt, isLoading } =
    storeToRefs(transactionStore);

  // Comparison with last month (positive = higher, negative = lower)
  // TODO: Implement last month comparison in future phase
  const comparisonPercentage = ref(0);

  // Label for when the user last recorded a transaction this month
  const lastInputLabel = computed(() => {
    if (!lastInputAt.value) return 'Anda belum mencatat apa pun bulan ini';

    const relative = formatDistanceToNow(new Date(lastInputAt.value), {
      addSuffix: true,
      locale: id,
    });
    return `Terakhir input ${relative}`;
  });
</script>
