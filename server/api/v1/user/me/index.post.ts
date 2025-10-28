import type { UserData } from '~/utils/constants/user';
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

    // Fetch user data from database
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    if (!userData) {
      throw createError({
        statusCode: 404,
        message: 'No user data found',
      });
    }

    return {
      user: userData as UserData,
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
