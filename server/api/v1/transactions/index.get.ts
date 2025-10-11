import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/utils/constants/database';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default defineEventHandler(async event => {
  const supabase = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user || !user.id) {
    console.error('No user or user ID found');
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  console.log('Fetching transactions for user:', user.id);

  // Get query params
  const query = getQuery(event);
  const date = query.date as string | undefined; // YYYY-MM-DD format
  const month = query.month as string | undefined; // YYYY-MM format
  const limit = query.limit ? parseInt(query.limit as string) : undefined;
  const offset = query.offset ? parseInt(query.offset as string) : 0;

  console.log('Query params:', { date, month, limit, offset });

  // Build query
  let queryBuilder = supabase
    .from('transactions')
    .select('*')
    .eq('created_by', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Filter by specific date (today's transactions)
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    queryBuilder = queryBuilder
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }
  // Filter by month (YYYY-MM)
  else if (month) {
    const [year, monthNum] = month.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);

    queryBuilder = queryBuilder
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());
  }

  // Apply pagination
  if (limit) {
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching transactions:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions',
    });
  }

  return {
    success: true,
    data: data as Transaction[],
    count: count || data?.length || 0,
  };
});
