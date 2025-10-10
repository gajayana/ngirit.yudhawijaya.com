<template>
  <div class="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
    <div v-if="user" class="space-y-6">
      <!-- Welcome Header - Mobile optimized -->
      <div
        class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
      >
        <h1 class="text-lg font-bold sm:text-xl">
          Profil Saya 👤
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Kelola informasi akun dan pengaturan Anda
        </p>
      </div>

      <!-- User Info Card - Mobile optimized -->
      <div
        class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
      >
        <h2 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Info Akun</h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Nama:</span>
            <span class="font-medium">{{ user.user_metadata?.full_name || '-' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Email:</span>
            <span class="font-medium">{{ user.email }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Role:</span>
            <span class="font-medium">{{ authStore.userRole || 'user' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Status:</span>
            <span
              class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              Aktif
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">User ID:</span>
            <span class="truncate font-mono text-xs">{{ user.id }}</span>
          </div>
        </div>
      </div>

      <!-- Superadmin Actions - Only visible for superadmin -->
      <DashboardAdminTools />

      <!-- Debug Info - Collapsible on mobile -->
      <details
        class="group rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <summary class="cursor-pointer p-5 font-semibold text-gray-700 dark:text-gray-300 sm:p-6">
          <span class="text-sm sm:text-base">Debug Info (Tap untuk expand)</span>
        </summary>
        <div class="border-t border-gray-200 p-5 dark:border-gray-800 sm:p-6">
          <pre class="overflow-x-auto rounded bg-gray-100 p-4 text-xs dark:bg-gray-950">{{
            JSON.stringify(user, null, 2)
          }}</pre>
        </div>
      </details>

      <!-- Logout Button - Touch optimized -->
      <UButton
        block
        size="lg"
        color="error"
        variant="soft"
        class="min-h-[48px] sm:min-h-[52px]"
        @click="logout"
      >
        <UIcon name="i-heroicons-arrow-left-on-rectangle" class="h-5 w-5" />
        <span class="ml-2">Keluar dari Akun</span>
      </UButton>
    </div>

    <div v-else class="flex min-h-[50vh] items-center justify-center">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="mx-auto h-8 w-8 animate-spin text-primary-500"
        />
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Mengalihkan ke halaman masuk...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const user = useSupabaseUser();
  const router = useRouter();
  const authStore = useAuthStore();

  // Redirect to login if not authenticated
  watchEffect(() => {
    if (!user.value) {
      router.push('/');
    }
  });

  const logout = async () => {
    await authStore.signOut();
    router.push('/');
  };
</script>
