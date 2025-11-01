import { serverSupabaseClient } from '#supabase/server';

/**
 * GET /api/v1/assets
 * Retrieve user assets with optional filtering
 */
export default defineEventHandler(async event => {
  try {
    const userId = await getAuthenticatedUserId(event);
    const query = getQuery(event);
    const supabase = await serverSupabaseClient(event);

    // Build the query with filters
    let queryBuilder = supabase
      .from('assets')
      .select(`
        *,
        currency:currencies(id, code, symbol, name)
      `)
      .eq('created_by', userId)
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
      // Sanitize ILIKE pattern to prevent SQL injection
      const sanitized = (query.institution_name as string)
        .replace(/\\/g, '\\\\')  // Escape backslash
        .replace(/%/g, '\\%')    // Escape percent
        .replace(/_/g, '\\_');   // Escape underscore
      queryBuilder = queryBuilder.ilike('institution_name', `%${sanitized}%`);
    }

    if (query.balance_min) {
      const balanceMin = parseFloat(query.balance_min as string);
      if (isNaN(balanceMin) || balanceMin < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid balance_min' });
      }
      queryBuilder = queryBuilder.gte('current_balance', balanceMin);
    }

    if (query.balance_max) {
      const balanceMax = parseFloat(query.balance_max as string);
      if (isNaN(balanceMax) || balanceMax < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid balance_max' });
      }
      queryBuilder = queryBuilder.lte('current_balance', balanceMax);
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

    // Pagination with validation
    if (query.limit) {
      const limit = parseInt(query.limit as string);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid limit (1-100)' });
      }
      queryBuilder = queryBuilder.limit(limit);
    }

    if (query.offset) {
      const offset = parseInt(query.offset as string);
      if (isNaN(offset) || offset < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid offset (must be >= 0)' });
      }
      const limit = parseInt(query.limit as string) || 50;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);
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
    logger.error('Error fetching assets:', error);
    const err = error as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal server error',
    });
  }
});
