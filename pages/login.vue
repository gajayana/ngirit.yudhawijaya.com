<script setup lang="ts">
  const config = useRuntimeConfig();
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();

  // If user is already logged in, redirect to home page
  watchEffect(() => {
    console.log({ user: user.value });
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
  <div class="flex min-h-screen items-center justify-center">
    <div class="w-full max-w-md rounded-lg border p-8 shadow-md">
      <h1 class="mb-6 text-center text-2xl font-bold">Welcome</h1>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        @click="signIn"
      >
        <span>Continue with Google</span>
      </button>
    </div>
  </div>
</template>
