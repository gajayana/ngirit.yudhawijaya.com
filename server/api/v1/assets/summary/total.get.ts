import { serverSupabaseClient } from '#supabase/server';

/**
 * GET /api/assets/summary/total
 * Get user's total assets by currency
 */
export default defineEventHandler(async event => {
  try {
    const userId = await getAuthenticatedUserId(event);
    const query = getQuery(event);
    const supabase = await serverSupabaseClient(event);

    const currencyCode = query.currency_code as string | undefined;

    // Call the database function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc('get_user_total_assets', {
      user_uuid: userId,
      filter_currency_code: currencyCode || null,
    } as any);

    if (error) {
      console.error('Database error fetching total assets:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch total assets',
      });
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error: unknown) {
    console.error('Error fetching total assets:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
