<script setup lang="ts">
  // This page handles the OAuth callback redirects
  const user = useSupabaseUser();
  const router = useRouter();

  // Redirect to dashboard once authenticated
  watchEffect(() => {
    if (user.value) {
      router.push('/dashboard');
    }
  });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-xl font-semibold">Mengkonfirmasi autentikasi...</h1>
      <p class="mt-2 text-gray-600">Mohon tunggu sementara kami menyelesaikan login Anda.</p>
    </div>
  </div>
</template>
