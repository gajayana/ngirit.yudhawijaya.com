<template>
  <div>
    <!-- Floating Action Button -->
    <button
      class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-primary-600 active:scale-95 sm:h-16 sm:w-16"
      aria-label="Tambah Pengeluaran"
      @click="openDialog"
    >
      <UIcon name="i-heroicons-plus" class="h-7 w-7 sm:h-8 sm:w-8" />
    </button>

    <!-- Fullscreen Dialog -->
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
              :class="isFullscreen ? 'h-screen sm:h-auto' : ''"
            >
              <!-- Header -->
              <div
                class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800"
              >
                <h2 class="text-lg font-semibold">Tambah Pengeluaran</h2>
                <button
                  class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Tutup"
                  @click="closeDialog"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
                </button>
              </div>

              <!-- Form Content -->
              <form class="flex flex-col p-4 sm:p-6" @submit.prevent="handleSubmit">
                <!-- Textarea for quick input -->
                <div class="mb-4">
                  <label
                    for="quick-input"
                    class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Deskripsi & Jumlah
                  </label>
                  <textarea
                    id="quick-input"
                    ref="textareaRef"
                    v-model="form.quickInput"
                    placeholder="Contoh: Makan siang 35000&#10;Bensin 50rb&#10;Parkir 5k"
                    rows="4"
                    class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                    autofocus
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tulis deskripsi dan jumlah (dipisah spasi atau baris baru)
                  </p>
                </div>

                <!-- Parsed Preview -->
                <div
                  v-if="parsedExpenses.length > 0"
                  class="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <p class="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Preview ({{ parsedExpenses.length }} transaksi):
                  </p>
                  <div class="space-y-2">
                    <div
                      v-for="(expense, index) in parsedExpenses"
                      :key="index"
                      class="flex items-center justify-between"
                    >
                      <span class="text-sm">{{ expense.description || 'Deskripsi belum diisi' }}</span>
                      <span class="text-base font-semibold text-primary-600 dark:text-primary-400">
                        {{ expense.amount > 0 ? formatCurrency(expense.amount) : '-' }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {{ formatCurrency(totalAmount) }}
                    </span>
                  </div>
                </div>

                <!-- Category Select (Optional) -->
                <div class="mb-6">
                  <label
                    for="category"
                    class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Kategori (Opsional)
                  </label>
                  <select
                    id="category"
                    v-model="form.category"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih kategori...</option>
                    <option value="food">🍔 Makanan & Minuman</option>
                    <option value="transport">🚗 Transportasi</option>
                    <option value="shopping">🛒 Belanja</option>
                    <option value="entertainment">🎬 Hiburan</option>
                    <option value="bills">💡 Tagihan</option>
                    <option value="other">📦 Lainnya</option>
                  </select>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3">
                  <UButton
                    type="button"
                    variant="soft"
                    color="neutral"
                    size="lg"
                    class="flex-1 min-h-[52px]"
                    :disabled="isSubmitting"
                    @click="closeDialog"
                  >
                    Batal
                  </UButton>
                  <UButton
                    type="submit"
                    color="primary"
                    size="lg"
                    class="flex-1 min-h-[52px]"
                    :disabled="!isValid || isSubmitting"
                    :loading="isSubmitting"
                  >
                    <UIcon v-if="!isSubmitting" name="i-heroicons-check" class="h-5 w-5" />
                    <span class="ml-2">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</span>
                  </UButton>
                </div>
              </form>

              <!-- Success Toast (inside dialog) -->
              <Transition
                enter-active-class="transition-all duration-300"
                enter-from-class="opacity-0 translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-300"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-4"
              >
                <div
                  v-if="showSuccess"
                  class="absolute bottom-4 left-4 right-4 rounded-lg bg-green-500 p-4 text-white shadow-lg"
                >
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-check-circle" class="h-5 w-5" />
                    <span class="font-medium">
                      {{ parsedExpenses.length > 1 ? `${parsedExpenses.length} pengeluaran` : 'Pengeluaran' }} berhasil ditambahkan!
                    </span>
                  </div>
                </div>
              </Transition>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  const { formatCurrency, isValidAmount, sum } = useFinancial();

  // Dialog state
  const isOpen = ref(false);
  const isFullscreen = ref(true); // Fullscreen on mobile
  const textareaRef = ref<HTMLTextAreaElement | null>(null);

  // Form state
  const form = ref({
    quickInput: '',
    category: '',
  });

  const isSubmitting = ref(false);
  const showSuccess = ref(false);

  // Parse each line to extract description and amount
  const parsedExpenses = computed(() => {
    const input = form.value.quickInput.trim();
    if (!input) return [];

    // Split by newlines and process each line
    const lines = input.split('\n').filter(line => line.trim());

    return lines.map(line => {
      const trimmedLine = line.trim();

      // Try to extract number from line (supports various formats: 35000, 50rb, 5k)
      const numberMatch = trimmedLine.match(/(\d+(?:[.,]\d+)?)\s*(rb|k|ribu|rp)?/i);

      if (numberMatch && numberMatch[1]) {
        let amount = parseFloat(numberMatch[1].replace(',', '.'));

        // Handle rb, k, ribu abbreviations
        const suffix = (numberMatch[2] || '').toLowerCase();
        if (suffix === 'rb' || suffix === 'ribu') {
          amount *= 1000;
        } else if (suffix === 'k') {
          amount *= 1000;
        }

        // Get description (everything except the number and suffix)
        const description = trimmedLine.replace(numberMatch[0] || '', '').trim();

        return {
          description: description || 'Pengeluaran',
          amount: amount,
        };
      }

      // If no number found, treat entire line as description
      return {
        description: trimmedLine,
        amount: 0,
      };
    });
  });

  // Calculate total amount
  const totalAmount = computed(() => {
    return sum(parsedExpenses.value.map(e => e.amount));
  });

  // Validate form
  const isValid = computed(() => {
    // Check if we have at least one expense with valid amount
    return (
      parsedExpenses.value.length > 0 &&
      parsedExpenses.value.some(e => e.description.length > 0 && isValidAmount(e.amount) && e.amount > 0)
    );
  });

  // Open dialog
  const openDialog = () => {
    isOpen.value = true;
    // Auto-focus textarea after dialog opens
    nextTick(() => {
      textareaRef.value?.focus();
    });
  };

  // Close dialog
  const closeDialog = () => {
    if (isSubmitting.value) return;
    isOpen.value = false;
    // Reset form after animation
    setTimeout(() => {
      form.value.quickInput = '';
      form.value.category = '';
      showSuccess.value = false;
    }, 300);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid.value) return;

    isSubmitting.value = true;

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter out expenses with zero amount
      const validExpenses = parsedExpenses.value.filter(e => e.amount > 0);

      console.log(`Submitting ${validExpenses.length} expense(s):`, {
        expenses: validExpenses.map(e => ({
          description: e.description,
          amount: e.amount,
          category: form.value.category || null,
        })),
        total: totalAmount.value,
      });

      // Show success message
      showSuccess.value = true;

      // Close dialog after delay
      setTimeout(() => {
        closeDialog();
      }, 1500);
    } catch (error) {
      console.error('Failed to add expense:', error);
    } finally {
      isSubmitting.value = false;
    }
  };

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
