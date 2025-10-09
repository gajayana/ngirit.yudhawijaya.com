import { serverSupabaseClient } from '#supabase/server';
import type { UpdateAssetPayload } from '~/utils/types/assets';

/**
 * PUT /api/assets/[id]
 * Update an asset by ID
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

    const body = await readBody<UpdateAssetPayload>(event);

    // Verify currency exists if currency_id is being updated
    if (body.currency_id) {
      const { data: currency, error: currencyError } = await supabase
        .from('currencies')
        .select('id')
        .eq('id', body.currency_id)
        .is('deleted_at', null)
        .single();

      if (currencyError || !currency) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid currency_id',
        });
      }
    }

    // Update the asset
    const { data, error } = await supabase
      .from('assets')
      .update(body)
      .eq('id', assetId)
      .eq('created_by', userId)
      .is('deleted_at', null)
      .select(
        `
        *,
        currency:currencies(id, code, symbol, name)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Asset not found or not accessible',
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update asset',
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error('Error updating asset:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
