import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

/**
 * GET /api/assets/summary/by-type
 * Get user's assets summary grouped by type
 */
export default defineEventHandler(async event => {
  try {
    const supabase = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Call the database function
    const { data, error } = await supabase.rpc('get_user_assets_by_type', {
      user_uuid: user.id,
    });

    if (error) {
      console.error('Database error fetching assets by type:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch assets by type',
      });
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error: unknown) {
    console.error('Error fetching assets by type:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
