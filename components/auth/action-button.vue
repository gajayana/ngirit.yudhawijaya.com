<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  const authStore = useAuthStore();
  const user = computed(() => authStore.user);
  const router = useRouter();

  const signOut = async () => {
    try {
      await authStore.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const dropdownItems = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: user.value?.user_metadata?.full_name || user.value?.email?.split('@')[0] || 'User',
        avatar: user.value?.user_metadata?.avatar_url
          ? { src: user.value.user_metadata.avatar_url }
          : undefined,
        type: 'label',
        provider: 'ipx',
      },
    ],
    [
      {
        label: 'Profile',
        icon: 'i-heroicons-user',
        to: '/profile',
      },
      {
        label: 'Dashboard',
        icon: 'i-heroicons-chart-bar',
        to: '/dashboard',
      },
    ],
    [
      {
        label: 'Sign Out',
        icon: 'i-heroicons-arrow-left-on-rectangle',
        class: 'text-red-500 hover:text-red-600',
        onSelect: signOut,
      },
    ],
  ]);
</script>

<template>
  <div>
    <UButton v-if="!user" to="/login" variant="outline" size="md">
      <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-1 h-4 w-4" />
      Sign In
    </UButton>

    <UDropdownMenu v-else :items="dropdownItems" :ui="{ content: 'w-48' }">
      <UButton variant="ghost" size="md" class="flex items-center">
        <UAvatar
          v-if="user.user_metadata?.avatar_url"
          :src="user.user_metadata?.avatar_url"
          size="xs"
          class="mr-2"
          :alt="user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'"
          provider="ipx"
        />

        <span
          v-else
          class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center mr-2"
        >
          {{ user.email?.[0].toUpperCase() || 'U' }}
        </span>

        <span class="hidden sm:inline text-sm truncate max-w-[100px]">
          {{ user.user_metadata?.full_name || user.email?.split('@')[0] || 'User' }}
        </span>
      </UButton>
    </UDropdownMenu>
  </div>
</template>
