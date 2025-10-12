<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
  >
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-user-group" class="h-5 w-5 text-primary-500" />
        <h2 class="text-base font-semibold sm:text-lg">Keluarga Saya</h2>
      </div>
      <UButton
        icon="i-heroicons-plus"
        size="sm"
        color="primary"
        @click="openCreateDialog"
      >
        Buat Keluarga
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 text-center">
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 animate-spin text-primary-500" />
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Memuat data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="families.length === 0" class="py-8 text-center">
      <UIcon name="i-heroicons-user-group" class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Anda belum memiliki keluarga
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
        Buat keluarga untuk berbagi tracking pengeluaran
      </p>
    </div>

    <!-- Family List -->
    <div v-else class="space-y-3">
      <div
        v-for="family in families"
        :key="family.id"
        class="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
      >
        <!-- Family Header -->
        <div class="mb-3 flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <h3 class="truncate font-medium">{{ family.name }}</h3>
            <p v-if="family.description" class="mt-0.5 text-xs text-gray-500">
              {{ family.description }}
            </p>
            <p class="mt-1 text-xs text-gray-400">
              {{ family.members?.length || 0 }} anggota
            </p>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              v-if="isOwner(family)"
              icon="i-heroicons-pencil"
              size="xs"
              color="primary"
              variant="ghost"
              square
              @click="openEditDialog(family)"
            />
            <UButton
              v-if="isOwner(family)"
              icon="i-heroicons-trash"
              size="xs"
              color="error"
              variant="ghost"
              square
              @click="openDeleteDialog(family)"
            />
          </div>
        </div>

        <!-- Members List -->
        <div class="space-y-2">
          <div
            v-for="member in family.members"
            :key="member.id"
            class="flex items-center justify-between rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-800/50"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ member.user_data?.full_name || 'User' }}</p>
              <p class="truncate text-gray-500">{{ member.user_data?.email }}</p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                v-if="canRemoveMember(family, member)"
                icon="i-heroicons-x-mark"
                size="xs"
                color="error"
                variant="ghost"
                square
                @click="openRemoveMemberDialog(family, member)"
              />
            </div>
          </div>
        </div>

        <!-- Add Member Button -->
        <div v-if="canAddMember(family)" class="mt-3">
          <UButton
            icon="i-heroicons-plus"
            size="sm"
            variant="soft"
            block
            @click="openAddMemberDialog(family)"
          >
            Tambah Anggota
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create/Edit Family Dialog -->
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
          v-if="isFamilyDialogOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="closeFamilyDialog"
        >
          <Transition
            enter-active-class="transition-transform duration-300"
            enter-from-class="scale-95"
            enter-to-class="scale-100"
            leave-active-class="transition-transform duration-300"
            leave-from-class="scale-100"
            leave-to-class="scale-95"
          >
            <div
              v-if="isFamilyDialogOpen"
              class="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900"
            >
              <h2 class="mb-4 text-lg font-semibold">
                {{ isEditMode ? 'Edit Keluarga' : 'Buat Keluarga Baru' }}
              </h2>

              <form @submit.prevent="handleFamilySubmit">
                <!-- Name -->
                <div class="mb-4">
                  <label for="family-name" class="mb-2 block text-sm font-medium">Nama Keluarga</label>
                  <input
                    id="family-name"
                    v-model="familyForm.name"
                    type="text"
                    placeholder="Contoh: Keluarga Budi"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    :disabled="isSaving"
                    required
                  />
                </div>

                <!-- Description -->
                <div class="mb-6">
                  <label for="family-description" class="mb-2 block text-sm font-medium">
                    Deskripsi <span class="text-xs text-gray-400">(opsional)</span>
                  </label>
                  <textarea
                    id="family-description"
                    v-model="familyForm.description"
                    rows="3"
                    placeholder="Deskripsi keluarga (opsional)"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    :disabled="isSaving"
                  />
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                  <UButton
                    type="button"
                    variant="soft"
                    color="neutral"
                    size="lg"
                    class="min-h-[52px] flex-1"
                    :disabled="isSaving"
                    @click="closeFamilyDialog"
                  >
                    Batal
                  </UButton>
                  <UButton
                    type="submit"
                    color="primary"
                    size="lg"
                    class="min-h-[52px] flex-1"
                    :disabled="isSaving"
                    :loading="isSaving"
                  >
                    {{ isEditMode ? 'Simpan' : 'Buat' }}
                  </UButton>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Member Dialog -->
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
          v-if="isAddMemberDialogOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="closeAddMemberDialog"
        >
          <Transition
            enter-active-class="transition-transform duration-300"
            enter-from-class="scale-95"
            enter-to-class="scale-100"
            leave-active-class="transition-transform duration-300"
            leave-from-class="scale-100"
            leave-to-class="scale-95"
          >
            <div
              v-if="isAddMemberDialogOpen"
              class="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900"
            >
              <h2 class="mb-4 text-lg font-semibold">Tambah Anggota</h2>

              <form @submit.prevent="handleAddMember">
                <!-- Email -->
                <div class="mb-6">
                  <label for="member-email" class="mb-2 block text-sm font-medium">Email</label>
                  <input
                    id="member-email"
                    v-model="memberForm.email"
                    type="email"
                    placeholder="email@example.com"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    :disabled="isSaving"
                    required
                  />
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                  <UButton
                    type="button"
                    variant="soft"
                    color="neutral"
                    size="lg"
                    class="min-h-[52px] flex-1"
                    :disabled="isSaving"
                    @click="closeAddMemberDialog"
                  >
                    Batal
                  </UButton>
                  <UButton
                    type="submit"
                    color="primary"
                    size="lg"
                    class="min-h-[52px] flex-1"
                    :disabled="isSaving"
                    :loading="isSaving"
                  >
                    Tambah
                  </UButton>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Family Confirmation -->
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
          v-if="isDeleteDialogOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="closeDeleteDialog"
        >
          <Transition
            enter-active-class="transition-transform duration-300"
            enter-from-class="scale-95"
            enter-to-class="scale-100"
            leave-active-class="transition-transform duration-300"
            leave-from-class="scale-100"
            leave-to-class="scale-95"
          >
            <div
              v-if="isDeleteDialogOpen"
              class="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900"
            >
              <div class="flex justify-center">
                <div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                  <UIcon name="i-heroicons-exclamation-triangle" class="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div class="mt-4 text-center">
                <h2 class="text-lg font-semibold">Hapus Keluarga?</h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin menghapus keluarga "{{ selectedFamily?.name }}"?
                </p>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div class="mt-6 flex gap-3">
                <UButton
                  type="button"
                  variant="soft"
                  color="neutral"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isSaving"
                  @click="closeDeleteDialog"
                >
                  Batal
                </UButton>
                <UButton
                  type="button"
                  color="error"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isSaving"
                  :loading="isSaving"
                  @click="handleDeleteFamily"
                >
                  Hapus
                </UButton>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Remove Member Confirmation -->
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
          v-if="isRemoveMemberDialogOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="closeRemoveMemberDialog"
        >
          <Transition
            enter-active-class="transition-transform duration-300"
            enter-from-class="scale-95"
            enter-to-class="scale-100"
            leave-active-class="transition-transform duration-300"
            leave-from-class="scale-100"
            leave-to-class="scale-95"
          >
            <div
              v-if="isRemoveMemberDialogOpen"
              class="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900"
            >
              <div class="flex justify-center">
                <div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                  <UIcon name="i-heroicons-user-minus" class="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div class="mt-4 text-center">
                <h2 class="text-lg font-semibold">Hapus Anggota?</h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin mengeluarkan {{ selectedMember?.user_data?.full_name }} dari keluarga?
                </p>
              </div>

              <div class="mt-6 flex gap-3">
                <UButton
                  type="button"
                  variant="soft"
                  color="neutral"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isSaving"
                  @click="closeRemoveMemberDialog"
                >
                  Batal
                </UButton>
                <UButton
                  type="button"
                  color="error"
                  size="lg"
                  class="min-h-[52px] flex-1"
                  :disabled="isSaving"
                  :loading="isSaving"
                  @click="handleRemoveMember"
                >
                  Hapus
                </UButton>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import type {
    FamilyWithMembers,
    FamilyMember,
    FamilyMemberWithUser,
    FamilyListResponse,
    AddFamilyMemberResponse,
    RemoveFamilyMemberResponse,
  } from '~/utils/constants/family';

  const toast = useToast();
  const authStore = useAuthStore();
  const { userId } = storeToRefs(authStore);

  // State
  const families = ref<FamilyWithMembers[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);

  // Dialog states
  const isFamilyDialogOpen = ref(false);
  const isAddMemberDialogOpen = ref(false);
  const isDeleteDialogOpen = ref(false);
  const isRemoveMemberDialogOpen = ref(false);

  const isEditMode = ref(false);
  const selectedFamily = ref<FamilyWithMembers | null>(null);
  const selectedMember = ref<FamilyMemberWithUser | null>(null);

  // Form states
  const familyForm = ref({
    name: '',
    description: '',
  });

  const memberForm = ref({
    email: '',
  });

  // Load families on mount
  onMounted(() => {
    fetchFamilies();
  });

  // Watch for userId changes and log for debugging
  watch(userId, (newUserId) => {
    console.log('User ID changed:', newUserId);
  }, { immediate: true });

  // Fetch families
  async function fetchFamilies() {
    isLoading.value = true;
    try {
      const response = await $fetch<FamilyListResponse>('/api/v1/families', {
        method: 'GET',
        credentials: 'include',
      });

      families.value = response.data;
    } catch (error) {
      console.error('Error fetching families:', error);
      toast.add({
        title: 'Error',
        description: 'Gagal memuat data keluarga',
        color: 'error',
      });
    } finally {
      isLoading.value = false;
    }
  }

  // Permission helpers
  function isOwner(family: FamilyWithMembers): boolean {
    if (!userId.value) return false;
    return family.created_by === userId.value;
  }

  function canAddMember(family: FamilyWithMembers): boolean {
    // Only owner can add members
    return isOwner(family);
  }

  function canRemoveMember(family: FamilyWithMembers, member: Pick<FamilyMember, 'user_id'>): boolean {
    const isSelf = member.user_id === userId.value;
    const isOwnerUser = isOwner(family);

    // Members can leave (remove themselves)
    if (isSelf) return true;

    // Only owner can remove others
    return isOwnerUser;
  }

  // Dialog handlers - Create Family
  function openCreateDialog() {
    isEditMode.value = false;
    selectedFamily.value = null;
    familyForm.value = {
      name: '',
      description: '',
    };
    isFamilyDialogOpen.value = true;
  }

  function openEditDialog(family: FamilyWithMembers) {
    isEditMode.value = true;
    selectedFamily.value = family;
    familyForm.value = {
      name: family.name,
      description: family.description || '',
    };
    isFamilyDialogOpen.value = true;
  }

  function closeFamilyDialog() {
    if (isSaving.value) return;
    isFamilyDialogOpen.value = false;
  }

  async function handleFamilySubmit() {
    if (!familyForm.value.name.trim()) return;

    isSaving.value = true;

    try {
      if (isEditMode.value && selectedFamily.value) {
        // Update family
        await $fetch(`/api/v1/families/${selectedFamily.value.id}`, {
          method: 'PUT',
          body: {
            name: familyForm.value.name.trim(),
            description: familyForm.value.description.trim() || null,
          },
          credentials: 'include',
        });

        toast.add({
          title: 'Berhasil!',
          description: 'Keluarga berhasil diperbarui',
          color: 'success',
        });
      } else {
        // Create family
        await $fetch('/api/v1/families', {
          method: 'POST',
          body: {
            name: familyForm.value.name.trim(),
            description: familyForm.value.description.trim() || null,
          },
          credentials: 'include',
        });

        toast.add({
          title: 'Berhasil!',
          description: 'Keluarga berhasil dibuat',
          color: 'success',
        });
      }

      isSaving.value = false;
      closeFamilyDialog();
      fetchFamilies();
    } catch (error) {
      console.error('Error saving family:', error);
      toast.add({
        title: 'Error',
        description: 'Gagal menyimpan keluarga',
        color: 'error',
      });
      isSaving.value = false;
    }
  }

  // Dialog handlers - Delete Family
  function openDeleteDialog(family: FamilyWithMembers) {
    selectedFamily.value = family;
    isDeleteDialogOpen.value = true;
  }

  function closeDeleteDialog() {
    if (isSaving.value) return;
    isDeleteDialogOpen.value = false;
  }

  async function handleDeleteFamily() {
    if (!selectedFamily.value) return;

    isSaving.value = true;

    try {
      await $fetch(`/api/v1/families/${selectedFamily.value.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      toast.add({
        title: 'Berhasil!',
        description: 'Keluarga berhasil dihapus',
        color: 'success',
      });

      isSaving.value = false;
      closeDeleteDialog();
      fetchFamilies();
    } catch (error) {
      console.error('Error deleting family:', error);
      toast.add({
        title: 'Error',
        description: 'Gagal menghapus keluarga',
        color: 'error',
      });
      isSaving.value = false;
    }
  }

  // Dialog handlers - Add Member
  function openAddMemberDialog(family: FamilyWithMembers) {
    selectedFamily.value = family;
    memberForm.value = {
      email: '',
    };
    isAddMemberDialogOpen.value = true;
  }

  function closeAddMemberDialog() {
    if (isSaving.value) return;
    isAddMemberDialogOpen.value = false;
  }

  async function handleAddMember() {
    if (!selectedFamily.value || !memberForm.value.email.trim()) return;

    isSaving.value = true;

    try {
      const response = await $fetch<AddFamilyMemberResponse>(`/api/v1/families/${selectedFamily.value.id}/members`, {
        method: 'POST',
        body: {
          email: memberForm.value.email.trim(),
        },
        credentials: 'include',
      });

      console.log('Add member response:', response);

      toast.add({
        title: 'Berhasil!',
        description: 'Anggota berhasil ditambahkan',
        color: 'success',
      });

      isSaving.value = false;
      closeAddMemberDialog();
      fetchFamilies();
    } catch (error) {
      console.error('Error adding member:', error);

      const errorMessage = error && typeof error === 'object' && 'data' in error && error.data &&
        typeof error.data === 'object' && 'statusMessage' in error.data
        ? String(error.data.statusMessage)
        : 'Gagal menambahkan anggota';

      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error',
      });
      isSaving.value = false;
    }
  }

  // Dialog handlers - Remove Member
  function openRemoveMemberDialog(family: FamilyWithMembers, member: FamilyMemberWithUser) {
    selectedMember.value = member;
    selectedFamily.value = family;
    isRemoveMemberDialogOpen.value = true;
  }

  function closeRemoveMemberDialog() {
    if (isSaving.value) return;
    isRemoveMemberDialogOpen.value = false;
  }

  async function handleRemoveMember() {
    if (!selectedFamily.value || !selectedMember.value) return;

    isSaving.value = true;

    try {
      await $fetch<RemoveFamilyMemberResponse>(`/api/v1/families/${selectedFamily.value.id}/members/${selectedMember.value.user_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const isSelf = selectedMember.value.user_id === userId.value;

      toast.add({
        title: 'Berhasil!',
        description: isSelf ? 'Anda telah keluar dari keluarga' : 'Anggota berhasil dihapus',
        color: 'success',
      });

      isSaving.value = false;
      closeRemoveMemberDialog();
      fetchFamilies();
    } catch (error) {
      console.error('Error removing member:', error);

      const errorMessage = error && typeof error === 'object' && 'data' in error && error.data &&
        typeof error.data === 'object' && 'message' in error.data
        ? String(error.data.message)
        : 'Gagal menghapus anggota';

      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error',
      });
      isSaving.value = false;
    }
  }
</script>
