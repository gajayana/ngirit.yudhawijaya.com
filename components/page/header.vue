<script setup lang="ts">
  const appName = 'Ngirit';
</script>

<template>
  <header class="w-full py-4 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800">
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center">
        <NuxtLink to="/" class="text-lg font-semibold">
          {{ appName }}
        </NuxtLink>
      </div>

      <div class="flex items-center space-x-4">
        <nav class="hidden md:flex items-center space-x-6">
          <NuxtLink to="/" class="text-sm font-medium hover:text-primary-500 transition">
            Home
          </NuxtLink>
          <NuxtLink to="/dashboard" class="text-sm font-medium hover:text-primary-500 transition">
            Dashboard
          </NuxtLink>
        </nav>

        <div class="flex items-center space-x-3">
          <ThemeSwitch />
          <AuthActionButton />
        </div>
      </div>
    </div>
  </header>
</template>
