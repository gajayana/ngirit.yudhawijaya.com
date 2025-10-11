import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/utils/constants/database';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

interface TransactionInput {
  description: string;
  amount: number;
  transaction_type: string;
  category?: string | null;
}

export default defineEventHandler(async event => {
  const supabase = await serverSupabaseClient<Database>(event);
  const userId = await getAuthenticatedUserId(event);

  console.log('POST /api/v1/transactions - User:', userId);

  if (!userId) {
    console.error('No user found in session');
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody<{ transactions: TransactionInput[] }>(event);

  // Validate input
  if (!body.transactions || !Array.isArray(body.transactions) || body.transactions.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input: transactions array is required',
    });
  }

  // Validate each transaction
  for (const tx of body.transactions) {
    if (!tx.description || typeof tx.description !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input: description is required for each transaction',
      });
    }

    if (typeof tx.amount !== 'number' || tx.amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input: amount must be a positive number',
      });
    }

    if (!tx.transaction_type || typeof tx.transaction_type !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input: transaction_type is required',
      });
    }
  }

  // Build insert data
  const transactionsToInsert: TransactionInsert[] = body.transactions.map(tx => ({
    description: tx.description.trim(),
    amount: tx.amount,
    transaction_type: tx.transaction_type,
    category: tx.category || null,
    created_by: userId,
  }));

  // Insert transactions
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionsToInsert)
    .select('*, categories(id, name, icon, color, type)');

  if (error) {
    console.error('Error inserting transactions:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create transactions',
    });
  }

  return {
    success: true,
    data,
    count: data?.length || 0,
  };
});
