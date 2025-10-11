<template>
  <div class="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
    <div v-if="user" class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold sm:text-2xl">Dashboard Pengeluaran</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Kelola keuangan Anda dengan mudah
          </p>
        </div>
        <NuxtLink to="/profile" class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <UIcon name="i-heroicons-user-circle" class="h-6 w-6" />
        </NuxtLink>
      </div>

      <!-- Expense Summary Cards -->
      <DashboardExpenseSummaryCard />

      <!-- Today's Expenses Widget -->
      <DashboardTodayExpensesWidget />

      <!-- Monthly Summary Widget -->
      <DashboardMonthlySummaryWidget />

      <!-- Floating Quick Add Button -->
      <DashboardQuickAddWidget />
    </div>

    <div v-else class="flex min-h-[50vh] items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 animate-spin text-primary-500" />
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Mengalihkan ke halaman masuk...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const user = useSupabaseUser();
  const router = useRouter();
  const transactionStore = useTransactionStore();

  // Redirect to login if not authenticated
  watchEffect(() => {
    if (!user.value) {
      router.push('/');
    }
  });

  // Fetch current month's transactions and start realtime subscription
  onMounted(async () => {
    if (user.value) {
      console.log('Dashboard mounted - user:', user.value.id);
      await transactionStore.fetchCurrentMonth();

      // Re-enable realtime subscription
      console.log('Initializing realtime subscription...');
      transactionStore.initRealtimeSubscription();
    }
  });

  // Clean up realtime subscription on unmount
  onUnmounted(() => {
    console.log('Dashboard unmounted - cleaning up subscription');
    transactionStore.cleanupRealtimeSubscription();
  });
</script>
