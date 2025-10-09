import type { UserRoleData } from '~/utils/constants/role';
import { serverSupabaseClient } from '#supabase/server';

interface ApiError {
  statusCode?: number;
  message?: string;
}

/**
 * POST /api/v1/user/me
 * Get user information with role data by UUID
 * Accepts: { uuid: string }
 */
export default defineEventHandler(async event => {
  try {
    const userId = await getAuthenticatedUserId(event);
    const supabase = await serverSupabaseClient(event);

    // Fetch user role data from database
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, is_blocked, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    console.log({ roleData });

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    if (!roleData) {
      throw createError({
        statusCode: 404,
        message: 'No role found for user',
      });
    }

    return {
      role: roleData as UserRoleData,
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;

    // Log error for debugging
    console.error('User API Error:', {
      statusCode: apiError.statusCode,
      message: apiError.message,
      error,
    });

    throw createError({
      statusCode: apiError.statusCode || 500,
      message: apiError.message || 'Failed to fetch user role',
    });
  }
});
