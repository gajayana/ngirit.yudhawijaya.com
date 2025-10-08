import { defineStore } from 'pinia';
import type { UserRole } from '~/utils/constants/role';
import { USER_ROLE } from '~/utils/constants/role';

/**
 * Pinia store for user authentication and role management
 * Follows the official Pinia pattern with Nuxt 3 integration
 */
export const useAuthStore = defineStore('auth', () => {
  // Auto-imported from Nuxt
  const user = useSupabaseUser();

  // State
  const userRole = ref<UserRole | null>(null);
  const isBlocked = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const isFetched = ref(false);

  /**
   * Fetch the current user's role from server API
   */
  async function fetchUserRole() {
    // Skip if already fetching or already fetched for current user
    if (isLoading.value || (user.value && isFetched.value)) return null;

    if (!user.value) {
      resetState();
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Use the server API endpoint (POST) instead of direct Supabase call
      const data = await $fetch('/api/v1/user/me', {
        method: 'POST',
        body: {},
      });

      userRole.value = data.role.role;
      isBlocked.value = data.role.is_blocked;
      isFetched.value = true;
      return data.role;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch user role');
      userRole.value = null;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset the store state
   */
  function resetState() {
    userRole.value = null;
    isBlocked.value = false;
    isLoading.value = false;
    isFetched.value = false;
    error.value = null;
  }

  /**
   * Check if the current user has the specified role
   */
  function hasRole(role: UserRole | UserRole[]): boolean {
    if (!userRole.value) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole.value);
    }

    return userRole.value === role;
  }

  /**
   * Sign out the current user
   */
  async function signOut() {
    const client = useSupabaseClient();
    const { error: logoutError } = await client.auth.signOut();
    resetState();
    if (logoutError) throw logoutError;
  }

  // Computed properties
  const isAdmin = computed(() => hasRole([USER_ROLE.SUPERADMIN, USER_ROLE.MANAGER]));
  const isSuperAdmin = computed(() => hasRole(USER_ROLE.SUPERADMIN));

  /**
   * Check if user can access a feature based on required roles
   */
  function canAccess(requiredRoles: UserRole | UserRole[]): boolean {
    // Deny access to blocked users
    if (isBlocked.value) return false;

    // Check if user has the required role(s)
    return hasRole(requiredRoles);
  }

  // Watch for user changes and fetch role when needed
  if (import.meta.client) {
    watch(
      () => user.value?.sub,
      (newId, oldId) => {
        if (newId && newId !== oldId) {
          isFetched.value = false;
          fetchUserRole();
        } else if (!newId) {
          resetState();
        }
      },
      { immediate: true }
    );
  }

  return {
    user,
    userRole,
    isBlocked,
    isLoading,
    error,

    // Actions
    fetchUserRole,
    resetState,
    hasRole,
    signOut,
    canAccess,

    // Computed
    isAdmin,
    isSuperAdmin,
  };
});
