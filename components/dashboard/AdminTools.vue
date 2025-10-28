<template>
  <div
    v-if="authStore.isSuperAdmin"
    class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
  >
    <h2 class="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Admin Tools</h2>
    <div class="space-y-4">
      <!-- Import File Input -->
      <div class="space-y-2">
        <label class="block text-sm font-medium">Import Transaksi dari Firebase</label>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileSelect"
        />
        <UButton
          block
          variant="outline"
          icon="i-heroicons-arrow-up-tray"
          class="justify-center"
          :loading="isImporting"
          :disabled="isImporting"
          @click="triggerFileInput"
        >
          {{ selectedFile ? selectedFile.name : 'Pilih File JSON' }}
        </UButton>
        <p v-if="selectedFile" class="text-xs text-gray-500">
          {{ recordCount }} records • {{ formatFileSize(selectedFile.size) }}
        </p>
      </div>

      <!-- Import Button -->
      <UButton
        v-if="selectedFile"
        block
        color="primary"
        :loading="isImporting"
        :disabled="isImporting"
        @click="importTransactions"
      >
        Import {{ recordCount }} Transaksi
      </UButton>

      <!-- Import Result -->
      <div
        v-if="importResult"
        class="rounded-lg border-l-4 p-3"
        :class="importResult.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'"
      >
        <div class="flex items-start space-x-2">
          <UIcon
            :name="importResult.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
            class="h-5 w-5 flex-shrink-0"
            :class="importResult.success ? 'text-green-600' : 'text-red-600'"
          />
          <div class="flex-1">
            <p class="text-sm font-medium">{{ importResult.message }}</p>
            <div v-if="importResult.summary" class="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>Berhasil: {{ importResult.summary.inserted }}</div>
              <div>Gagal: {{ importResult.summary.failed }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore();

  // Import functionality
  const fileInput = ref<HTMLInputElement>();
  const selectedFile = ref<File | null>(null);
  const recordCount = ref(0);
  const isImporting = ref(false);
  const importResult = ref<{
    success: boolean;
    message: string;
    summary?: {
      total: number;
      inserted: number;
      failed: number;
      skipped: number;
    };
  } | null>(null);

  const triggerFileInput = () => {
    fileInput.value?.click();
  };

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('File harus berformat JSON');
      return;
    }

    selectedFile.value = file;
    importResult.value = null;

    // Read file to get record count
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          recordCount.value = data.length;
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        recordCount.value = 0;
      }
    };
    reader.readAsText(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const importTransactions = async () => {
    if (!selectedFile.value) return;

    isImporting.value = true;
    importResult.value = null;

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const spendings = JSON.parse(e.target?.result as string);

          const response = await $fetch('/api/v1/transactions/import', {
            method: 'POST',
            body: spendings,
          });

          importResult.value = {
            success: true,
            message: `Berhasil mengimpor ${response.summary.inserted} dari ${response.summary.total} transaksi`,
            summary: response.summary,
          };

          // Clear file after successful import
          setTimeout(() => {
            selectedFile.value = null;
            recordCount.value = 0;
            if (fileInput.value) {
              fileInput.value.value = '';
            }
          }, 5000);
        } catch (error: unknown) {
          const apiError = error as { data?: { message?: string } };
          importResult.value = {
            success: false,
            message: apiError.data?.message || 'Terjadi kesalahan saat mengimpor transaksi',
          };
        } finally {
          isImporting.value = false;
        }
      };

      reader.readAsText(selectedFile.value);
    } catch (error) {
      console.error('Import error:', error);
      importResult.value = {
        success: false,
        message: 'Terjadi kesalahan saat membaca file',
      };
      isImporting.value = false;
    }
  };
</script>
