import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';
import type { UserData } from '~/utils/constants/user';

type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

interface TransactionUpdateInput {
  description?: string;
  amount?: number;
  transaction_type?: string;
  category?: string | null;
}

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

  const body = await readBody<TransactionUpdateInput>(event);

  // Validate input
  if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input: amount must be a positive number',
    });
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input: description must be a string',
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
      statusMessage: 'Forbidden: You do not have permission to update this transaction',
    });
  }

  // Build update data
  const updateData: TransactionUpdate = {};

  if (body.description !== undefined) {
    updateData.description = body.description.trim();
  }

  if (body.amount !== undefined) {
    updateData.amount = body.amount;
  }

  if (body.transaction_type !== undefined) {
    updateData.transaction_type = body.transaction_type;
  }

  if (body.category !== undefined) {
    updateData.category = body.category;
  }

  // Update transaction
  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select('*, categories(id, name, icon, color, type)')
    .single();

  if (error) {
    logger.error('Error updating transaction:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update transaction',
    });
  }

  return {
    success: true,
    data,
  };
});
