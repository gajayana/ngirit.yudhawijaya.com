<template>
  <div class="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
    <!-- Access Denied for non-superadmin -->
    <div v-if="!isSuperadmin" class="flex min-h-[50vh] items-center justify-center">
      <UCard class="max-w-md">
        <div class="space-y-4 text-center">
          <UIcon name="i-heroicons-shield-exclamation" class="mx-auto h-16 w-16 text-red-500" />
          <h2 class="text-xl font-semibold">Akses Ditolak</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Halaman ini hanya dapat diakses oleh superadmin.
          </p>
          <UButton block @click="router.push('/dashboard')"> Kembali ke Dashboard </UButton>
        </div>
      </UCard>
    </div>

    <!-- Import Interface for superadmin -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold sm:text-3xl">Import Transaksi</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Upload file JSON spendings dari Firebase
          </p>
        </div>
        <UButton variant="outline" icon="i-heroicons-arrow-left" @click="router.push('/dashboard')">
          Kembali
        </UButton>
      </div>

      <!-- Upload Card -->
      <UCard>
        <div class="space-y-6">
          <!-- File Upload Area -->
          <div class="space-y-3">
            <label class="block text-sm font-medium">File JSON</label>
            <div
              class="relative rounded-lg border-2 border-dashed border-gray-300 p-6 transition hover:border-primary-500 dark:border-gray-700"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-950': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                @change="handleFileSelect"
              />
              <div class="text-center">
                <UIcon name="i-heroicons-cloud-arrow-up" class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2 text-sm font-medium">Klik atau drag & drop file JSON di sini</p>
                <p class="mt-1 text-xs text-gray-500">Format: spendings.json dari Firebase</p>
              </div>
            </div>

            <!-- Selected File Info -->
            <div
              v-if="selectedFile"
              class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
            >
              <div class="flex items-center space-x-3">
                <UIcon name="i-heroicons-document-text" class="h-5 w-5 text-primary-500" />
                <div>
                  <p class="text-sm font-medium">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ formatFileSize(selectedFile.size) }} • {{ recordCount }} records
                  </p>
                </div>
              </div>
              <UButton
                variant="ghost"
                color="error"
                icon="i-heroicons-x-mark"
                size="sm"
                @click="clearFile"
              />
            </div>
          </div>

          <!-- Import Button -->
          <div class="flex justify-end space-x-3">
            <UButton variant="outline" :disabled="!selectedFile || isImporting" @click="clearFile">
              Batal
            </UButton>
            <UButton
              color="primary"
              :loading="isImporting"
              :disabled="!selectedFile || isImporting"
              @click="importTransactions"
            >
              <UIcon name="i-heroicons-arrow-up-tray" />
              Import Transaksi
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Import Results -->
      <UCard
        v-if="importResult"
        class="border-l-4"
        :class="importResult.success ? 'border-green-500' : 'border-red-500'"
      >
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <UIcon
              :name="importResult.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              class="h-6 w-6"
              :class="importResult.success ? 'text-green-500' : 'text-red-500'"
            />
            <div class="flex-1">
              <h3 class="font-semibold">
                {{ importResult.success ? 'Import Berhasil!' : 'Import Gagal' }}
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ importResult.message }}
              </p>
            </div>
          </div>

          <!-- Summary Stats -->
          <div v-if="importResult.summary" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <p class="text-xs text-gray-500">Total</p>
              <p class="text-2xl font-bold">{{ importResult.summary.total }}</p>
            </div>
            <div class="rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <p class="text-xs text-green-600 dark:text-green-400">Berhasil</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ importResult.summary.inserted }}
              </p>
            </div>
            <div class="rounded-lg bg-red-50 p-3 dark:bg-red-950">
              <p class="text-xs text-red-600 dark:text-red-400">Gagal</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ importResult.summary.failed }}
              </p>
            </div>
            <div class="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
              <p class="text-xs text-yellow-600 dark:text-yellow-400">Dilewati</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ importResult.summary.skipped }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  const router = useRouter();
  const user = useSupabaseUser();
  const authStore = useAuthStore();

  // Check if user is superadmin from auth store
  const isSuperadmin = computed(() => authStore.isSuperAdmin);

  // Redirect to dashboard if not logged in
  watchEffect(() => {
    if (!user.value) {
      router.push('/');
    }
  });

  // File upload state
  const fileInput = ref<HTMLInputElement>();
  const selectedFile = ref<File | null>(null);
  const isDragging = ref(false);
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

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: DragEvent) => {
    isDragging.value = false;
    const file = event.dataTransfer?.files?.[0];
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

    // Read file to get record count
    const reader = new FileReader();
    reader.onload = e => {
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

  const clearFile = () => {
    selectedFile.value = null;
    recordCount.value = 0;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
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

      reader.onload = async e => {
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
            clearFile();
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
        message: 'Terjadi kesalahan saat membaca berkas',
      };
      isImporting.value = false;
    }
  };
</script>
