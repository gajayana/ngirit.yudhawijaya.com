import { serverSupabaseClient } from '#supabase/server';

/**
 * GET /api/assets/[id]
 * Get a single asset by ID
 */
export default defineEventHandler(async event => {
  try {
    const userId = await getAuthenticatedUserId(event);
    const supabase = await serverSupabaseClient(event);

    const assetId = getRouterParam(event, 'id');

    if (!assetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Asset ID is required',
      });
    }

    const { data, error } = await supabase
      .from('assets')
      .select(
        `
        *,
        currency:currencies(id, code, symbol, name)
      `
      )
      .eq('id', assetId)
      .eq('created_by', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Asset not found',
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch asset',
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error('Error fetching asset:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
