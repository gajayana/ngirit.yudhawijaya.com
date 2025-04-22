/**
 * User role types and interfaces
 */

// Define user role type based on the enum in the database
export type UserRole = 'superadmin' | 'manager' | 'user';

/**
 * Interface representing user role data from the database
 */
export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

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

/**
 * Role constants for use throughout the application
 */
export const ROLE = {
  SUPERADMIN: 'superadmin' as const,
  MANAGER: 'manager' as const,
  USER: 'user' as const,
};

export type Role = (typeof ROLE)[keyof typeof ROLE];

export default ROLE;
