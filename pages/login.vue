<script setup lang="ts">
  const config = useRuntimeConfig();
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();

  // If user is already logged in, redirect to home page
  watchEffect(() => {
    if (user.value) {
      router.push('/');
    }
  });

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${config.public.host}/`,
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
  <div class="flex grow h-full items-center justify-center w-full">
    <UCard>
      <UButton variant="outline" @click="signIn">
        <UIcon name="i-logos-google-icon" class="mr-2 h-5 w-5" />
        Continue with Google
      </UButton>
    </UCard>
  </div>
</template>
