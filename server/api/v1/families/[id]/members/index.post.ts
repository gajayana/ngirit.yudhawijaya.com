/**
 * POST /api/v1/families/:id/members
 * Add a member to a family by email
 * Only owners and admins can add members
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { AddFamilyMemberInput, AddFamilyMemberResponse } from '~/utils/constants/family';
import { FAMILY_MEMBER_ROLE } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<AddFamilyMemberResponse> => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);
  const familyId = getRouterParam(event, 'id');

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Family ID is required',
    });
  }

  // Parse request body
  const body = await readBody<AddFamilyMemberInput>(event);

  // Validate email
  if (!body.email || !body.email.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    });
  }

  const email = body.email.trim().toLowerCase();

  // Validate role
  const role = body.role || FAMILY_MEMBER_ROLE.MEMBER;
  if (!Object.values(FAMILY_MEMBER_ROLE).includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role',
    });
  }

  try {
    // Check if current user is owner or admin
    const { data: currentMember, error: currentMemberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (currentMemberError || !currentMember) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a member of this family',
      });
    }

    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only owners and admins can add members',
      });
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase
      .from('user_data')
      .select('user_id, email, full_name')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (userError || !targetUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found with this email',
      });
    }

    // Check if user is already a member
    const { data: existingMembers } = await supabase
      .from('family_members')
      .select('id, deleted_at')
      .eq('family_id', familyId)
      .eq('user_id', targetUser.user_id);

    const existingMember = existingMembers?.[0] || null;

    if (existingMember && existingMember.deleted_at === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User is already a member of this family',
      });
    }

    // If member was previously removed, restore them
    if (existingMember && existingMember.deleted_at !== null) {
      const { data: restoredMember, error: restoreError } = await supabase
        .from('family_members')
        .update({
          role,
          deleted_at: null,
          joined_at: new Date().toISOString(),
        })
        .eq('id', existingMember.id)
        .select('*')
        .single();

      if (restoreError) {
        console.error('Error restoring member:', restoreError);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to restore member',
        });
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from('user_data')
        .select('user_id, email, full_name, role')
        .eq('user_id', restoredMember.user_id)
        .single();

      return {
        success: true,
        data: {
          ...restoredMember,
          user_data: userData || null,
        } as any,
        message: 'Member restored successfully',
      };
    }

    // Add new member
    const { data: newMember, error: addError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyId,
        user_id: targetUser.user_id,
        role,
      })
      .select('*')
      .single();

    if (addError) {
      console.error('Error adding member:', addError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add member',
      });
    }

    // Fetch user data
    const { data: userData } = await supabase
      .from('user_data')
      .select('user_id, email, full_name, role')
      .eq('user_id', newMember.user_id)
      .single();

    return {
      success: true,
      data: {
        ...newMember,
        user_data: userData || null,
      } as any,
      message: 'Member added successfully',
    };
  } catch (error) {
    console.error('Error in add member:', error);

    // Re-throw createError instances
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
