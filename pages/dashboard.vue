<template>
  <div class="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
    <div v-if="user" class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold sm:text-2xl">
            Dashboard Pengeluaran
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Kelola keuangan Anda dengan mudah
          </p>
        </div>
        <NuxtLink
          to="/profile"
          class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <UIcon name="i-heroicons-user-circle" class="h-6 w-6" />
        </NuxtLink>
      </div>

      <!-- Coming Soon Placeholder -->
      <div
        class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900 sm:p-12"
      >
        <UIcon
          name="i-heroicons-wrench-screwdriver"
          class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
        />
        <h2 class="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
          Dashboard Sedang Dalam Pengembangan
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Fitur-fitur berikut akan segera hadir:
        </p>
        <div class="mx-auto mt-6 max-w-md space-y-3 text-left">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p class="font-medium">Ringkasan Pengeluaran Hari Ini</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Lihat total pengeluaran hari ini dengan detail transaksi
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p class="font-medium">Ringkasan Bulanan</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Lihat pengeluaran bulan ini dikelompokkan per kategori
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p class="font-medium">Tambah Pengeluaran Cepat</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Catat pengeluaran dengan cepat dan mudah
              </p>
            </div>
          </div>
        </div>
        <div class="mt-8">
          <NuxtLink to="/profile">
            <UButton size="lg" color="primary" class="min-h-[48px]">
              <UIcon name="i-heroicons-user-circle" class="h-5 w-5" />
              <span class="ml-2">Lihat Profil</span>
            </UButton>
          </NuxtLink>
        </div>
      </div>
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

  // Redirect to login if not authenticated
  watchEffect(() => {
    if (!user.value) {
      router.push('/');
    }
  });
</script>
