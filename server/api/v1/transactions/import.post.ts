import { serverSupabaseClient } from '#supabase/server';

interface FirebaseSpending {
  id: string;
  label: string;
  value: number;
  user: string;
  created_at: number; // Unix timestamp in seconds
  updated_at: number; // Unix timestamp in seconds
}

const MAX_IMPORT_SIZE = 10000; // Maximum 10k transactions per import

/**
 * POST /api/v1/transactions/import
 * Import transactions from Firebase spendings JSON file
 * Only accessible by superadmin
 */
export default defineEventHandler(async event => {
  try {
    // Check if user is superadmin and get userId
    const { userId } = await checkUserRole(event, ['superadmin']);
    const supabase = await serverSupabaseClient(event);

    // Get request body (array of Firebase spendings)
    const spendings = await readBody<FirebaseSpending[]>(event);

    if (!Array.isArray(spendings) || spendings.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body: Expected non-empty array of spendings',
      });
    }

    // Validate import size limit
    if (spendings.length > MAX_IMPORT_SIZE) {
      throw createError({
        statusCode: 413,
        message: `Import size exceeds limit (max ${MAX_IMPORT_SIZE} transactions, got ${spendings.length})`,
      });
    }

    // Process and insert transactions
    const transactionsToInsert = [];
    let skippedCount = 0;

    for (const spending of spendings) {
      // Skip transactions with invalid amounts (0 or negative)
      if (!spending.value || spending.value <= 0) {
        console.warn(
          `Skipping transaction with invalid amount: ${spending.label} (${spending.value})`
        );
        skippedCount++;
        continue;
      }

      // Convert Unix timestamp (seconds) to ISO 8601 string in UTC
      const createdAt = new Date(spending.created_at * 1000).toISOString();
      const updatedAt = new Date(spending.updated_at * 1000).toISOString();

      transactionsToInsert.push({
        description: spending.label && spending.label.trim() ? spending.label : '-',
        amount: spending.value,
        transaction_type: 'expense',
        category: null, // All imported transactions are uncategorized
        created_by: userId, // Use current user's ID
        created_at: createdAt,
        updated_at: updatedAt,
      });
    }

    // Insert in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
      const batch = transactionsToInsert.slice(i, i + batchSize);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await supabase.from('transactions').insert(batch as any);

      if (insertError) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          batchSize: batch.length,
          firstItem: batch[0],
        });
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Batch ${i / batchSize + 1} inserted: ${batch.length} records`);
      }
    }

    return {
      success: true,
      summary: {
        total: spendings.length,
        inserted: successCount,
        failed: errorCount,
        skipped: skippedCount,
      },
    };
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: apiError.statusCode || 500,
      message: apiError.message || 'Failed to import transactions',
    });
  }
});
