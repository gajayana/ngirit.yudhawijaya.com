import { serverSupabaseClient } from '#supabase/server';
import type { CreateAssetPayload } from '~/utils/types/assets';

/**
 * POST /api/assets
 * Create a new asset
 */
export default defineEventHandler(async event => {
  try {
    const userId = await getAuthenticatedUserId(event);
    const supabase = await serverSupabaseClient(event);

    const body = await readBody<CreateAssetPayload>(event);

    // Validate required fields
    if (!body.name || !body.type || !body.currency_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: name, type, currency_id',
      });
    }

    // Verify currency exists and is accessible to user
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

    // Create the asset
    const { data, error } = await supabase
      .from('assets')
      .insert({
        ...body,
        created_by: userId,
        initial_balance: body.initial_balance || body.current_balance,
      })
      .select(
        `
        *,
        currency:currencies(id, code, symbol, name)
      `
      )
      .single();

    if (error) {
      logger.error('Database error creating asset:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create asset',
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    logger.error('Error creating asset:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
