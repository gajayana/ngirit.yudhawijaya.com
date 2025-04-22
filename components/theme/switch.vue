<script setup lang="ts">
  // import type { DropdownMenuItem } from '@nuxt/ui';

  const colorMode = useColorMode();

  // const items = ref<DropdownMenuItem[][]>([
  //   [
  //     { value: 'light', label: 'Light', icon: 'i-heroicons-sun' },
  //     { value: 'dark', label: 'Dark', icon: 'i-heroicons-moon' },
  //     { value: 'system', label: 'System', icon: 'i-heroicons-computer-desktop' },
  //   ],
  // ]);

  const isDark = computed({
    get() {
      return colorMode.value === 'dark';
    },
    set(_isDark) {
      colorMode.preference = _isDark ? 'dark' : 'light';
    },
  });
</script>

<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      @click="isDark = !isDark"
    />
  </ClientOnly>
</template>
