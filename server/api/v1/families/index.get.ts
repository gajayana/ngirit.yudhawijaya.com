/**
 * GET /api/v1/families
 * List all families that the authenticated user belongs to
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyListResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyListResponse> => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);

  try {
    // Fetch families where user is a member
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (membersError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch family memberships',
      });
    }

    if (!familyMembers || familyMembers.length === 0) {
      return {
        success: true,
        data: [],
        count: 0,
      };
    }

    const familyIds = familyMembers.map(m => m.family_id);

    // Fetch families
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .in('id', familyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (familiesError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch families',
      });
    }

    // Fetch all members for these families
    const { data: allMembers, error: allMembersError } = await supabase
      .from('family_members')
      .select('*')
      .in('family_id', familyIds)
      .is('deleted_at', null);

    if (allMembersError) {
      console.error('Error fetching members:', allMembersError);
    }

    // Fetch user data for all members
    const userIds = allMembers?.map(m => m.user_id) || [];
    const { data: usersData, error: usersError } = await supabase
      .from('user_data')
      .select('user_id, email, full_name, role')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching user data:', usersError);
    }

    // Combine data
    const familiesWithMembers = families.map(family => ({
      ...family,
      members: allMembers
        ?.filter(m => m.family_id === family.id)
        .map(member => ({
          ...member,
          user_data: usersData?.find(u => u.user_id === member.user_id) || null,
        })) || [],
    }));

    return {
      success: true,
      data: familiesWithMembers as any,
      count: familiesWithMembers.length,
    };
  } catch (error) {
    console.error('Error fetching families:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
