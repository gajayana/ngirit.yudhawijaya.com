/**
 * DELETE /api/v1/families/:id
 * Delete a family (soft delete)
 * Only owners can delete the family
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyDeleteResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyDeleteResponse> => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);
  const familyId = getRouterParam(event, 'id');

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Family ID is required',
    });
  }

  try {
    // Check if user is owner
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (memberError || !member || member.role !== 'owner') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only family owners can delete the family',
      });
    }

    // Soft delete family
    const { error: deleteError } = await supabase
      .from('families')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', familyId)
      .is('deleted_at', null);

    if (deleteError) {
      logger.error('Error deleting family:', deleteError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete family',
      });
    }

    // Soft delete all family members
    const { error: membersDeleteError } = await supabase
      .from('family_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('family_id', familyId)
      .is('deleted_at', null);

    if (membersDeleteError) {
      logger.error('Error deleting family members:', membersDeleteError);
      // Continue anyway, family is already deleted
    }

    return {
      success: true,
      message: 'Family deleted successfully',
    };
  } catch (error) {
    logger.error('Error in family deletion:', error);

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
