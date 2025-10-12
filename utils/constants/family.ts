/**
 * Family types and interfaces
 */

import type { Database } from './database';

// ============================================================================
// Family Types (from database)
// ============================================================================

/**
 * Family row from database (complete record)
 */
export type Family = Database['public']['Tables']['families']['Row'];

/**
 * Family for inserting new records
 */
export type FamilyInsert = Database['public']['Tables']['families']['Insert'];

/**
 * Family for updating existing records
 */
export type FamilyUpdate = Database['public']['Tables']['families']['Update'];

// ============================================================================
// Family Member Types (from database)
// ============================================================================

/**
 * FamilyMember row from database (complete record)
 */
export type FamilyMember = Database['public']['Tables']['family_members']['Row'];

/**
 * FamilyMember for inserting new records
 */
export type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];

/**
 * FamilyMember for updating existing records
 */
export type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update'];

// ============================================================================
// Family Member Role
// ============================================================================

/**
 * Family member role type
 * - owner: Full control over family (can delete, manage members, edit settings)
 * - admin: Can manage members and view all data
 * - member: Can only view shared data
 */
export type FamilyMemberRole = 'owner' | 'admin' | 'member';

export const FAMILY_MEMBER_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const satisfies Record<string, FamilyMemberRole>;

// ============================================================================
// Extended Family Types (with joined data)
// ============================================================================

/**
 * Family member with user details
 * Used when fetching family members with joined user data
 */
export interface FamilyMemberWithUser extends FamilyMember {
  user_data: {
    email: string;
    full_name: string;
    role: string;
  } | null;
}

/**
 * Family with full member details
 * Used when fetching a family with all its members
 */
export interface FamilyWithMembers extends Family {
  members: FamilyMemberWithUser[];
}

// ============================================================================
// Family Input Types
// ============================================================================

/**
 * Input for creating a family (client-side)
 */
export interface FamilyInput {
  name: string;
  description?: string | null;
}

/**
 * Input for updating a family (partial update)
 */
export interface FamilyUpdateInput {
  name?: string;
  description?: string | null;
}

/**
 * Input for adding a member to a family
 */
export interface AddFamilyMemberInput {
  email: string;
  role?: FamilyMemberRole;
}

/**
 * Input for updating a family member
 */
export interface UpdateFamilyMemberInput {
  role?: FamilyMemberRole;
}

// ============================================================================
// Family Response Types
// ============================================================================

/**
 * Response from GET /api/v1/families
 */
export interface FamilyListResponse {
  success: boolean;
  data: FamilyWithMembers[];
  count: number;
}

/**
 * Response from POST /api/v1/families
 */
export interface FamilyCreateResponse {
  success: boolean;
  data: FamilyWithMembers;
}

/**
 * Response from GET /api/v1/families/:id
 */
export interface FamilyDetailResponse {
  success: boolean;
  data: FamilyWithMembers;
}

/**
 * Response from PUT /api/v1/families/:id
 */
export interface FamilyUpdateResponse {
  success: boolean;
  data: FamilyWithMembers;
}

/**
 * Response from DELETE /api/v1/families/:id
 */
export interface FamilyDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Response from GET /api/v1/families/:id/members
 */
export interface FamilyMembersResponse {
  success: boolean;
  data: FamilyMemberWithUser[];
  count: number;
}

/**
 * Response from POST /api/v1/families/:id/members
 */
export interface AddFamilyMemberResponse {
  success: boolean;
  data: FamilyMemberWithUser;
  message: string;
}

/**
 * Response from DELETE /api/v1/families/:id/members/:userId
 */
export interface RemoveFamilyMemberResponse {
  success: boolean;
  message: string;
}
