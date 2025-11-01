/**
 * PUT /api/v1/families/:id
 * Update a family
 * Only owners can update the family
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyUpdateInput, FamilyUpdateResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyUpdateResponse> => {
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
  const body = await readBody<FamilyUpdateInput>(event);

  // Validate input
  if (body.name !== undefined) {
    if (!body.name || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Family name cannot be empty',
      });
    }

    if (body.name.trim().length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Family name must be 100 characters or less',
      });
    }
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
        statusMessage: 'Only family owners can update the family',
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    // Update family
    const { data: updatedFamily, error: updateError } = await supabase
      .from('families')
      .update(updateData)
      .eq('id', familyId)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating family:', updateError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update family',
      });
    }

    // Fetch updated family
    const { data: updatedFamilyData, error: fetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (fetchError) {
      logger.error('Error fetching updated family:', fetchError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Family updated but failed to fetch details',
      });
    }

    // Fetch members
    const { data: members } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .is('deleted_at', null);

    // Fetch user data
    const userIds = members?.map(m => m.user_id) || [];
    const { data: usersData } = await supabase
      .from('user_data')
      .select('user_id, email, full_name, role')
      .in('user_id', userIds);

    // Combine data
    const membersWithUserData = members?.map(member => ({
      ...member,
      user_data: usersData?.find(u => u.user_id === member.user_id) || null,
    })) || [];

    return {
      success: true,
      data: {
        ...updatedFamilyData,
        members: membersWithUserData,
      } as any,
    };
  } catch (error) {
    logger.error('Error in family update:', error);

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
