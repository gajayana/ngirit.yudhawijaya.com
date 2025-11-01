import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import { logger } from '~/utils/logger';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default defineEventHandler(async event => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);
  logger.log({ userId });

  if (!userId) {
    logger.error('No user or user ID found');
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  logger.log('Fetching transactions for user:', userId);

  // Get query params
  const query = getQuery(event);
  const start = query.start as string | undefined; // ISO 8601 datetime
  const end = query.end as string | undefined; // ISO 8601 datetime
  const includeFamily = query.include_family === 'true' || query.include_family === true;
  const limit = query.limit ? parseInt(query.limit as string) : undefined;
  const offset = query.offset ? parseInt(query.offset as string) : 0;

  logger.log('Query params:', { start, end, includeFamily, limit, offset });

  // Determine which user IDs to query
  let userIds = [userId]; // Default: only current user

  if (includeFamily) {
    // Fetch all family members
    const { data: familyMembers, error: familyError } = await supabase
      .from('family_members')
      .select('family_id, user_id')
      .is('deleted_at', null);

    if (familyError) {
      logger.error('Error fetching family members:', familyError);
    } else if (familyMembers && familyMembers.length > 0) {
      // Find all families the user belongs to
      const userFamilyIds = familyMembers
        .filter(m => m.user_id === userId)
        .map(m => m.family_id);

      // Get all member IDs from those families
      const allFamilyMemberIds = familyMembers
        .filter(m => userFamilyIds.includes(m.family_id))
        .map(m => m.user_id);

      // Use unique user IDs
      userIds = Array.from(new Set(allFamilyMemberIds));
      logger.log('Including family members:', userIds.length, 'users');
    }
  }

  // Build query with category join
  let queryBuilder = supabase
    .from('transactions')
    .select('*, categories(id, name, icon, color, type)')
    .in('created_by', userIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Filter by date range if provided
  if (start && end) {
    queryBuilder = queryBuilder
      .gte('created_at', start)
      .lte('created_at', end);
  }

  // Apply pagination
  if (limit) {
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    logger.error('Error fetching transactions:', error);
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
