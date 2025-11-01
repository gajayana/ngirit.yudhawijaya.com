<template>
  <div v-if="hasFamilyMembers" class="flex items-center gap-2">
    <button
      type="button"
      :class="[
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        includeFamily ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      ]"
      role="switch"
      :aria-checked="includeFamily"
      @click="handleToggle"
    >
      <span
        :class="[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          includeFamily ? 'translate-x-5' : 'translate-x-0'
        ]"
      />
    </button>
    <span class="text-sm text-gray-700 dark:text-gray-300">Keluarga</span>
  </div>
</template>

<script setup lang="ts">
  import { logger } from '~/utils/logger';
const transactionStore = useTransactionStore();
const { includeFamily, hasFamilyMembers } = storeToRefs(transactionStore);

// Handle toggle change
async function handleToggle() {
  includeFamily.value = !includeFamily.value;
  logger.log('Family toggle changed:', includeFamily.value);
  await transactionStore.fetchCurrentMonth();
}
</script>

