/**
 * POST /api/v1/families
 * Create a new family
 * The creator is automatically added as owner via database trigger
 */

import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { FamilyInput, FamilyCreateResponse } from '~/utils/constants/family';

export default defineEventHandler(async (event): Promise<FamilyCreateResponse> => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);

  // Parse request body
  const body = await readBody<FamilyInput>(event);

  // Validate input
  if (!body.name || body.name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Family name is required',
    });
  }

  if (body.name.trim().length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Family name must be 100 characters or less',
    });
  }

  try {
    // Create family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (familyError || !family) {
      console.error('Error creating family:', familyError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create family',
      });
    }

    // Fetch the created family
    const { data: createdFamily, error: familyFetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', family.id)
      .single();

    if (familyFetchError || !createdFamily) {
      console.error('Error fetching created family:', familyFetchError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Family created but failed to fetch details',
      });
    }

    // Fetch family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', family.id)
      .is('deleted_at', null);

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      throw createError({
        statusCode: 500,
        statusMessage: 'Family created but failed to fetch members',
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

    // Combine members with user data
    const membersWithUserData = members?.map(member => ({
      ...member,
      user_data: usersData?.find(u => u.user_id === member.user_id) || null,
    })) || [];

    return {
      success: true,
      data: {
        ...createdFamily,
        members: membersWithUserData,
      } as any,
    };
  } catch (error) {
    console.error('Error in family creation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});
