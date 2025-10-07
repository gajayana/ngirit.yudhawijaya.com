import type { UserRoleData } from '~/utils/constants/role';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { H3Event } from 'h3';

interface ApiError {
  statusCode?: number;
  message?: string;
}

/**
 * Cached function to fetch user role data from database
 * Cache duration: 5 minutes (300 seconds)
 * Cache key: user:{user_id}:role
 */
const getCachedUserRole = defineCachedFunction(
  async (userId: string, event: H3Event) => {
    const supabase = await serverSupabaseClient(event);

    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, is_blocked, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'No role found for user',
      });
    }

    return data as UserRoleData;
  },
  {
    maxAge: 1000 * 60 * 5, // 5 minutes
    name: 'userRole',
    getKey: (userId: string) => `user:${userId}:role`,
    swr: true, // Enable stale-while-revalidate
  }
);

/**
 * GET /api/user/me
 * Get current user information with role data
 * Implements caching for user role data to improve performance
 */
export default defineEventHandler(async event => {
  try {
    // Get the user from Supabase
    const user = await serverSupabaseUser(event);

    // Return unauthorized if no user is authenticated
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    // Get cached user role data
    const roleData = await getCachedUserRole(user.id, event);

    return {
      ...user,
      role: roleData,
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw createError({
      statusCode: apiError.statusCode || 500,
      message: apiError.message || 'Failed to fetch user role',
    });
  }
});
