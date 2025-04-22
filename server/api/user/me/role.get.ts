import type { UserRoleData } from '~/utils/constants/role';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

interface ApiError {
  statusCode?: number;
  message?: string;
}

export default defineEventHandler(async event => {
  try {
    // Get the Supabase client using the recommended approach
    const supabase = await serverSupabaseClient(event);

    // Get the user
    const user = await serverSupabaseUser(event);

    // Return unauthorized if no user is authenticated
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    // Query user role from database
    const { data, error: supabaseError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, is_blocked, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (supabaseError) {
      throw createError({
        statusCode: 500,
        message: supabaseError.message,
      });
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'No role found for user',
      });
    }

    return data as UserRoleData;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw createError({
      statusCode: apiError.statusCode || 500,
      message: apiError.message || 'Failed to fetch user role',
    });
  }
});
