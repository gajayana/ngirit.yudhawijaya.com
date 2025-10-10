/**
 * User data types and interfaces
 */

import type { Database } from './database';

// ============================================================================
// User Role Types
// ============================================================================

export type UserRole = Database['public']['Enums']['user_role'];
export const USER_ROLE = {
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  USER: 'user',
} as const satisfies Record<string, UserRole>;

// ============================================================================
// User Data Types (from database)
// ============================================================================

/**
 * User data row from database (complete record)
 */
export type UserData = Database['public']['Tables']['user_data']['Row'];

/**
 * User data for inserting new records
 */
export type UserDataInsert = Database['public']['Tables']['user_data']['Insert'];

/**
 * User data for updating existing records
 */
export type UserDataUpdate = Database['public']['Tables']['user_data']['Update'];

/**
 * @deprecated Use UserData instead
 * Legacy alias for backward compatibility
 */
export type UserRoleData = UserData;

// ============================================================================
// User Role State Interface
// ============================================================================

/**
 * Interface for the user role state context
 */
export interface UserRoleState {
  userRole: Ref<UserRole | null>;
  isBlocked: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  isFetched: Ref<boolean>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: ComputedRef<boolean>;
  isSuperAdmin: ComputedRef<boolean>;
  fetchUserRole: () => Promise<UserData | null>;
}
