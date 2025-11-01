/**
 * GET /api/v1/families/:id/members
 * List all members of a family
 * User must be a member of the family
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyMembersResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyMembersResponse> => {
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
    // Check if user is a member
    const { data: userMembership, error: membershipError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (membershipError || !userMembership) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a member of this family',
      });
    }

    // Fetch all members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .is('deleted_at', null)
      .order('joined_at', { ascending: true });

    if (membersError) {
      logger.error('Error fetching family members:', membersError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch family members',
      });
    }

    // Fetch user data for all members
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
      data: membersWithUserData as any,
      count: membersWithUserData.length,
    };
  } catch (error) {
    logger.error('Error in members list:', error);

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
