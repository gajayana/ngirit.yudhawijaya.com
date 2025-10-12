/**
 * GET /api/v1/families/:id
 * Get a specific family by ID
 * User must be a member of the family
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyDetailResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyDetailResponse> => {
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
    // Fetch family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .is('deleted_at', null)
      .single();

    if (familyError || !family) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Family not found',
      });
    }

    // Fetch family members
    const { data: members, error: membersFetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .is('deleted_at', null);

    if (membersFetchError) {
      console.error('Error fetching members:', membersFetchError);
    }

    // Check if user is a member
    const isMember = members?.some(m => m.user_id === userId) || false;
    if (!isMember) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a member of this family',
      });
    }

    // Fetch user data for all members
    const userIds = members?.map(m => m.user_id) || [];
    const { data: usersData, error: usersError } = await supabase
      .from('user_data')
      .select('user_id, email, full_name, role')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching user data:', usersError);
    }

    // Combine data
    const membersWithUserData = members?.map(member => ({
      ...member,
      user_data: usersData?.find(u => u.user_id === member.user_id) || null,
    })) || [];

    return {
      success: true,
      data: {
        ...family,
        members: membersWithUserData,
      } as any,
    };
  } catch (error) {
    console.error('Error fetching family:', error);

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
