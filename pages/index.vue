<script setup lang="ts">
  const config = useRuntimeConfig();
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  watchEffect(() => {
    if (user.value) {
      router.push('/dashboard');
    }
  });

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${config.public.host}/confirm`,
        },
      });

      if (error) {
        console.error('Authentication error:', error);
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };
</script>

<template>
  <div class="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-8 sm:px-6 sm:py-12">
    <div class="w-full max-w-md space-y-6 sm:space-y-8">
      <!-- Logo/Brand -->
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Ngirit</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:mt-3 sm:text-base">
          Biar dompet gak nangis di akhir bulan 💸
        </p>
      </div>

      <!-- Login Card -->
      <UCard class="mt-6 sm:mt-8">
        <div class="space-y-5 p-5 sm:space-y-6 sm:p-6">
          <div class="space-y-1.5 text-center sm:space-y-2">
            <h2 class="text-xl font-semibold sm:text-2xl">Selamat Datang</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Masuk untuk mulai kelola keuangan Anda
            </p>
          </div>

          <!-- Google Sign In Button - Touch optimized -->
          <UButton
            block
            size="xl"
            variant="outline"
            class="justify-center min-h-[48px] sm:min-h-[52px]"
            @click="signIn"
          >
            <UIcon name="i-logos-google-icon" class="h-5 w-5 sm:h-6 sm:w-6" />
            <span class="ml-2.5 text-sm font-medium sm:ml-3 sm:text-base">Lanjutkan dengan Google</span>
          </UButton>

          <!-- Privacy Notice -->
          <p class="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-500 sm:text-xs">
            Dengan masuk, berarti Anda setuju dengan Syarat Layanan & Kebijakan Privasi kami
          </p>
        </div>
      </UCard>

      <!-- Features - Mobile optimized -->
      <div class="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6">
        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 sm:border-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:h-14 sm:w-14">
            <UIcon name="i-heroicons-chart-bar" class="h-6 w-6 text-primary-600 dark:text-primary-400 sm:h-7 sm:w-7" />
          </div>
          <h3 class="mt-3 text-sm font-semibold sm:font-medium">Lacak Pengeluaran</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:mt-1">
            Catat setiap pengeluaran, tahu kemana uang Anda pergi
          </p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 sm:border-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:h-14 sm:w-14">
            <UIcon name="i-heroicons-currency-dollar" class="h-6 w-6 text-primary-600 dark:text-primary-400 sm:h-7 sm:w-7" />
          </div>
          <h3 class="mt-3 text-sm font-semibold sm:font-medium">Kelola Aset</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:mt-1">
            Pantau tabungan dan investasi dalam satu tempat
          </p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 sm:border-0 sm:bg-transparent sm:p-0 sm:dark:bg-transparent">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:h-14 sm:w-14">
            <UIcon name="i-heroicons-shield-check" class="h-6 w-6 text-primary-600 dark:text-primary-400 sm:h-7 sm:w-7" />
          </div>
          <h3 class="mt-3 text-sm font-semibold sm:font-medium">Data Aman</h3>
          <p class="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:mt-1">
            Privasi terjaga dengan enkripsi bank-level
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
