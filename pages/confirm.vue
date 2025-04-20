<script setup lang="ts">
  // This page handles the OAuth callback redirects
  const user = useSupabaseUser();
  const router = useRouter();

  // Redirect to home page once authenticated
  watchEffect(() => {
    if (user.value) {
      router.push('/');
    }
  });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-xl font-semibold">Confirming authentication...</h1>
      <p class="mt-2 text-gray-600">Please wait while we complete your login.</p>
    </div>
  </div>
</template>
