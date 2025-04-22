<template>
  <div class="container mx-auto p-4">
    <div v-if="user" class="rounded-lg border p-8">
      <h1 class="mb-4 text-xl font-bold">Welcome {{ user.email }}</h1>
      <pre class="mb-4 rounded bg-gray-100 p-4 text-xs">{{ JSON.stringify(user, null, 2) }}</pre>
      <button
        class="rounded-md bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200"
        @click="logout"
      >
        Logout
      </button>
    </div>
    <div v-else class="text-center">
      <p>You are not logged in.</p>
      <NuxtLink
        to="/login"
        class="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
      >
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
</script>
