/**
 * DELETE /api/v1/families/:id/members/:userId
 * Remove a member from a family (soft delete)
 * Owners and admins can remove members
 * Members can remove themselves (leave family)
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { RemoveFamilyMemberResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<RemoveFamilyMemberResponse> => {
  const supabase = await serverSupabaseClient<Database>(event);
  const currentUserId = await getAuthenticatedUserId(event);
  const familyId = getRouterParam(event, 'id');
  const targetUserId = getRouterParam(event, 'userId');

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Family ID is required',
    });
  }

  if (!targetUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    // Check current user's role
    const { data: currentMember, error: currentMemberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', currentUserId)
      .is('deleted_at', null)
      .single();

    if (currentMemberError || !currentMember) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a member of this family',
      });
    }

    // Check if target member exists
    const { data: targetMember, error: targetMemberError } = await supabase
      .from('family_members')
      .select('id, role, user_id')
      .eq('family_id', familyId)
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .single();

    if (targetMemberError || !targetMember) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found',
      });
    }

    // Permission check
    const isSelfRemoval = currentUserId === targetUserId;
    const isOwnerOrAdmin = currentMember.role === 'owner' || currentMember.role === 'admin';

    if (!isSelfRemoval && !isOwnerOrAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to remove this member',
      });
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { data: ownerCount, error: ownerCountError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('role', 'owner')
        .is('deleted_at', null);

      if (ownerCountError) {
        console.error('Error counting owners:', ownerCountError);
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to verify ownership',
        });
      }

      if (ownerCount && ownerCount.length === 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot remove the last owner. Transfer ownership first or delete the family.',
        });
      }
    }

    // Soft delete member
    const { error: deleteError } = await supabase
      .from('family_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', targetMember.id);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove member',
      });
    }

    return {
      success: true,
      message: isSelfRemoval ? 'You have left the family' : 'Member removed successfully',
    };
  } catch (error) {
    console.error('Error in remove member:', error);

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
