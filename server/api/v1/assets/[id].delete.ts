import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

/**
 * DELETE /api/assets/[id]
 * Soft delete an asset by ID
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

    const assetId = getRouterParam(event, 'id');

    if (!assetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Asset ID is required',
      });
    }

    // Soft delete the asset (triggers will handle the actual deletion logic)
    const { data, error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)
      .eq('created_by', user.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Asset not found or already deleted',
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete asset',
      });
    }

    return {
      success: true,
      message: 'Asset deleted successfully',
      data,
    };
  } catch (error: unknown) {
    console.error('Error deleting asset:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
