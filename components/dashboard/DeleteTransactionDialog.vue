<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center"
        @click.self="closeDialog"
      >
        <!-- Dialog Content -->
        <Transition
          enter-active-class="transition-transform duration-300"
          enter-from-class="translate-y-full sm:translate-y-0 sm:scale-95"
          enter-to-class="translate-y-0 sm:scale-100"
          leave-active-class="transition-transform duration-300"
          leave-from-class="translate-y-0 sm:scale-100"
          leave-to-class="translate-y-full sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="isOpen"
            class="w-full bg-white dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 class="text-lg font-semibold">Hapus Transaksi</h2>
              <button
                class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Tutup"
                @click="closeDialog"
              >
                <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="py-12 text-center">
              <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 animate-spin text-primary-500" />
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Memuat data...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="py-12 text-center">
              <UIcon name="i-heroicons-exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
              <p class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              <UButton class="mt-4" color="neutral" variant="soft" @click="closeDialog">
                Tutup
              </UButton>
            </div>

            <!-- Confirmation -->
            <div v-else class="flex flex-col p-4 sm:p-6">
              <!-- Warning Icon -->
              <div class="flex justify-center">
                <div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                  <UIcon name="i-heroicons-exclamation-triangle" class="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <!-- Message -->
              <div class="mt-4 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin menghapus transaksi ini?
                </p>
                <div
                  v-if="transaction"
                  class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <p class="font-medium">{{ transaction.description }}</p>
                  <p class="mt-2 text-base text-red-600 dark:text-red-400">
                    {{ formatCurrency(transaction.amount) }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500">
                    {{ formatDate(transaction.created_at) }}
                  </p>
                </div>
                <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex gap-3">
                <UButton
                  type="button"
                  variant="soft"
                  color="neutral"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isDeleting"
                  @click="closeDialog"
                >
                  Batal
                </UButton>
                <UButton
                  type="button"
                  color="error"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isDeleting"
                  :loading="isDeleting"
                  @click="handleDelete"
                >
                  Hapus
                </UButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import type { TransactionWithCategory } from '~/utils/constants/transaction';

  const props = defineProps<{
    open: boolean;
    transactionId: string | null;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    deleted: [];
  }>();

  const { formatCurrency } = useFinancial();
  const transactionStore = useTransactionStore();

  // Local state
  const isOpen = computed({
    get: () => props.open,
    set: value => emit('update:open', value),
  });

  const isLoading = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);
  const transaction = ref<TransactionWithCategory | null>(null);

  // Watch for dialog open state
  watch(
    () => props.open,
    async isOpen => {
      if (isOpen && props.transactionId) {
        await loadTransaction(props.transactionId);
      }
    }
  );

  // Load transaction data
  async function loadTransaction(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      // Find transaction in store
      const tx = transactionStore.transactions.find(t => t.id === id);

      if (!tx) {
        error.value = 'Transaksi tidak ditemukan. Mungkin sudah dihapus?';
        return;
      }

      transaction.value = tx;
    } catch (err) {
      console.error('Error loading transaction:', err);
      error.value = 'Gagal memuat data. Coba tutup dan buka lagi';
    } finally {
      isLoading.value = false;
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!props.transactionId) return;

    isDeleting.value = true;

    try {
      await transactionStore.deleteTransaction(props.transactionId);

      // Reset deleting state before closing (important for closeDialog check)
      isDeleting.value = false;

      emit('deleted');
      closeDialog();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      error.value = 'Gagal menghapus transaksi';
      isDeleting.value = false;
    }
  }

  // Close dialog
  function closeDialog() {
    if (isDeleting.value) return;
    isOpen.value = false;
    // Reset state after animation
    setTimeout(() => {
      error.value = null;
      transaction.value = null;
    }, 300);
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Close on Escape key
  onMounted(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen.value) {
        closeDialog();
      }
    };
    window.addEventListener('keydown', handleEscape);
    onUnmounted(() => {
      window.removeEventListener('keydown', handleEscape);
    });
  });
</script>
