import { defineStore } from 'pinia';
import type { UserRole } from '~/utils/constants/user';
import { USER_ROLE } from '~/utils/constants/user';
import { logger } from '~/utils/logger';

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

  // Realtime subscriptions
  const { subscribe, unsubscribe } = useRealtime();
  let userDataChannelId = '';

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

      userRole.value = data.user.role;
      isBlocked.value = data.user.is_blocked;
      isFetched.value = true;
      return data.user;
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
    cleanupRealtimeSubscription();
  }

  /**
   * Handle user data update from realtime
   */
  function handleUserDataUpdate(payload: { new: { user_id: string; role: UserRole; is_blocked: boolean } }) {
    const userData = payload.new;

    // Only process if it's the current user
    if (userData.user_id !== user.value?.sub) {
      return;
    }

    logger.log('👤 User data changed in realtime:', userData);

    const oldRole = userRole.value;
    const wasBlocked = isBlocked.value;

    // Update local state
    userRole.value = userData.role;
    isBlocked.value = userData.is_blocked;

    // Log significant changes
    if (oldRole !== userData.role) {
      logger.log(`  🔄 Role changed: ${oldRole} → ${userData.role}`);
    }

    if (wasBlocked !== userData.is_blocked) {
      logger.log(`  🔄 Block status changed: ${wasBlocked} → ${userData.is_blocked}`);

      if (userData.is_blocked) {
        logger.warn('  ⚠️  Your account has been blocked');
        // Optionally: Show notification or redirect
      } else {
        logger.log('  ✅ Your account has been unblocked');
      }
    }
  }

  /**
   * Initialize realtime subscription for user data changes
   */
  function initRealtimeSubscription() {
    if (!user.value || userDataChannelId || !import.meta.client) {
      return;
    }

    logger.log('🔄 Subscribing to user_data changes...');

    // Subscribe to user_data table with filter for current user
    userDataChannelId = subscribe({
      table: 'user_data',
      event: 'UPDATE',
      filter: `user_id=eq.${user.value.sub}`,
      onUpdate: (payload) => handleUserDataUpdate(payload as { new: { user_id: string; role: UserRole; is_blocked: boolean } }),
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          logger.log('✅ Subscribed to user_data changes');
        } else if (status === 'CHANNEL_ERROR') {
          logger.warn('⚠️  User data realtime failed');
        }
      },
      debug: true,
    });
  }

  /**
   * Clean up realtime subscription
   */
  function cleanupRealtimeSubscription() {
    if (userDataChannelId) {
      logger.log('🧹 Cleaning up user_data subscription...');
      unsubscribe(userDataChannelId, true);
      userDataChannelId = '';
    }
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
  const userId = computed(() => user.value?.sub || null);
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
      async (newId, oldId) => {
        if (newId && newId !== oldId) {
          isFetched.value = false;
          await fetchUserRole();
          // Initialize realtime subscription after fetching user role
          initRealtimeSubscription();
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
    initRealtimeSubscription,
    cleanupRealtimeSubscription,

    // Computed
    userId,
    isAdmin,
    isSuperAdmin,
  };
});
