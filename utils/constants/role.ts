/**
 * User role types and interfaces
 */

import type { Database } from './database';

export type UserRole = Database['public']['Enums']['user_role'];
export const USER_ROLE = {
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  USER: 'user',
} as const satisfies Record<string, UserRole>;

/**
 * Interface representing user role data from the database
 */
export type UserRoleData = Database['public']['Tables']['user_data']['Row'];

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
  fetchUserRole: () => Promise<UserRoleData | null>;
}
