import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { UserData } from '~/utils/constants/user';

export default defineEventHandler(async event => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);

  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Transaction ID is required',
    });
  }

  // Check if transaction exists and get owner
  const { data: existingTransaction, error: fetchError } = await supabase
    .from('transactions')
    .select('id, created_by')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingTransaction) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transaction not found',
    });
  }

  // Get user role
  const { data: userData } = await supabase
    .from('user_data')
    .select('role')
    .eq('user_id', userId)
    .single();

  const userRole = (userData as UserData)?.role || 'user';

  // Check permissions
  const isOwner = existingTransaction.created_by === userId;
  const isManager = userRole === 'manager' || userRole === 'superadmin';

  if (!isOwner && !isManager) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You do not have permission to delete this transaction',
    });
  }

  // Soft delete transaction
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error('Error deleting transaction:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete transaction',
    });
  }

  return {
    success: true,
    message: 'Transaction deleted successfully',
  };
});
