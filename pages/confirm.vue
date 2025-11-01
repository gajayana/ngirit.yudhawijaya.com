<script setup lang="ts">
  import { logger } from '~/utils/logger';
  // This page handles the OAuth callback redirects
  const router = useRouter();
  const supabase = useSupabaseClient();

  // Handle OAuth callback and redirect - simpler approach
  onMounted(async () => {
    try {
      // Small delay to let Supabase process the callback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if we have a session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Session error:', error);
        router.push('/');
        return;
      }

      if (session?.user) {
        // User authenticated successfully, go to dashboard
        logger.log('User authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        // No session found, back to login
        logger.log('No session, redirecting to login');
        router.push('/');
      }
    } catch (err) {
      logger.error('Confirm page error:', err);
      router.push('/');
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
