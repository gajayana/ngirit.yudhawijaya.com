import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

/**
 * GET /api/assets
 * Retrieve user assets with optional filtering
 */
export default defineEventHandler(async event => {
  try {
    const query = getQuery(event);
    const supabase = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Build the query with filters
    let queryBuilder = supabase
      .from('assets')
      .select(
        `
        *,
        currency:currencies(id, code, symbol, name)
      `
      )
      .eq('created_by', user.id)
      .is('deleted_at', null);

    // Apply filters
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      queryBuilder = queryBuilder.in('type', types);
    }

    if (query.currency_id) {
      const currencies = Array.isArray(query.currency_id) ? query.currency_id : [query.currency_id];
      queryBuilder = queryBuilder.in('currency_id', currencies);
    }

    if (query.is_liquid !== undefined) {
      queryBuilder = queryBuilder.eq('is_liquid', query.is_liquid === 'true');
    }

    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.is_active === 'true');
    }

    if (query.risk_level) {
      const riskLevels = Array.isArray(query.risk_level) ? query.risk_level : [query.risk_level];
      queryBuilder = queryBuilder.in('risk_level', riskLevels);
    }

    if (query.institution_name) {
      queryBuilder = queryBuilder.ilike('institution_name', `%${query.institution_name}%`);
    }

    if (query.balance_min) {
      queryBuilder = queryBuilder.gte('current_balance', parseFloat(query.balance_min as string));
    }

    if (query.balance_max) {
      queryBuilder = queryBuilder.lte('current_balance', parseFloat(query.balance_max as string));
    }

    if (query.maturity_date_from) {
      queryBuilder = queryBuilder.gte('maturity_date', query.maturity_date_from);
    }

    if (query.maturity_date_to) {
      queryBuilder = queryBuilder.lte('maturity_date', query.maturity_date_to);
    }

    // Order by created_at desc by default
    const orderBy = (query.order_by as string) || 'created_at';
    const orderDirection = (query.order_direction as 'asc' | 'desc') || 'desc';
    queryBuilder = queryBuilder.order(orderBy, { ascending: orderDirection === 'asc' });

    // Pagination
    if (query.limit) {
      queryBuilder = queryBuilder.limit(parseInt(query.limit as string));
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(
        parseInt(query.offset as string),
        parseInt(query.offset as string) + (parseInt(query.limit as string) || 50) - 1
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch assets',
        data: error,
      });
    }

    return {
      success: true,
      data: data || [],
      count: data?.length || 0,
    };
  } catch (error: unknown) {
    console.error('Error fetching assets:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
