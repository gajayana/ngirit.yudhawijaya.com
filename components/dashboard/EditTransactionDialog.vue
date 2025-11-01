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
              <h2 class="text-lg font-semibold">Edit Transaksi</h2>
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

            <!-- Form -->
            <form v-else class="flex flex-col p-4 sm:p-6" @submit.prevent="handleSubmit">
              <!-- Description -->
              <div class="mb-4">
                <label for="description" class="mb-2 block text-sm font-medium">Deskripsi</label>
                <input
                  id="description"
                  v-model="form.description"
                  type="text"
                  placeholder="Contoh: Makan siang"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  :disabled="isSaving"
                  required
                />
              </div>

              <!-- Amount -->
              <div class="mb-4">
                <label for="amount" class="mb-2 block text-sm font-medium">Jumlah (Rp)</label>
                <input
                  id="amount"
                  v-model="form.amount"
                  type="text"
                  inputmode="numeric"
                  placeholder="Contoh: 50000"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  :disabled="isSaving"
                  required
                />
                <p v-if="parsedAmount" class="mt-1 text-xs text-gray-500">
                  = {{ formatCurrency(parsedAmount) }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <UButton
                  type="button"
                  variant="soft"
                  color="neutral"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isSaving"
                  @click="closeDialog"
                >
                  Batal
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="!isValid || isSaving"
                  :loading="isSaving"
                >
                  Simpan
                </UButton>
              </div>
            </form>
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
    updated: [];
  }>();

  const { formatCurrency, parseAmount, isValidAmount } = useFinancial();
  const transactionStore = useTransactionStore();

  // Local state
  const isOpen = computed({
    get: () => props.open,
    set: value => emit('update:open', value),
  });

  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const transaction = ref<TransactionWithCategory | null>(null);

  // Form state
  const form = ref({
    description: '',
    amount: '',
  });

  // Parsed amount
  const parsedAmount = computed(() => {
    if (!form.value.amount) return 0;
    return parseAmount(form.value.amount);
  });

  // Form validation
  const isValid = computed(() => {
    return (
      form.value.description.trim().length > 0 &&
      form.value.amount.trim().length > 0 &&
      isValidAmount(parsedAmount.value)
    );
  });

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

      // Populate form
      form.value = {
        description: tx.description,
        amount: tx.amount.toString(),
      };
    } catch (err) {
      console.error('Error loading transaction:', err);
      error.value = 'Gagal memuat data. Coba tutup dan buka lagi';
    } finally {
      isLoading.value = false;
    }
  }

  // Handle form submit
  async function handleSubmit() {
    if (!isValid.value || !props.transactionId) return;

    isSaving.value = true;

    try {
      await transactionStore.updateTransaction(props.transactionId, {
        description: form.value.description.trim(),
        amount: parsedAmount.value,
      });

      // Reset saving state before closing (important for closeDialog check)
      isSaving.value = false;

      emit('updated');
      closeDialog();
    } catch (err) {
      console.error('Error updating transaction:', err);
      error.value = 'Gagal menyimpan perubahan';
      isSaving.value = false;
    }
  }

  // Close dialog
  function closeDialog() {
    if (isSaving.value) return;
    isOpen.value = false;
    // Reset form after animation
    setTimeout(() => {
      form.value = {
        description: '',
        amount: '',
      };
      error.value = null;
      transaction.value = null;
    }, 300);
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
