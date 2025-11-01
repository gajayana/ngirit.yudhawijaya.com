import { serverSupabaseClient } from '#supabase/server';
import type { UserData } from '~/utils/constants/user';

interface FirebaseSpending {
  id: string;
  label: string;
  value: number;
  user?: string; // Optional, from Firestore records
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
    // Check if user is superadmin
    await checkUserRole(event, ['superadmin']);

    // Get Supabase client for database operations
    const supabase = await serverSupabaseClient(event);

    // Get request body (array of Firebase spendings)
    const spendings = await readBody<FirebaseSpending[]>(event);

    // Fetch user mappings from user_data table
    // Map: semboyan35@gmail.com and natalia.wiworo@gmail.com
    const { data: users, error: usersError } = await supabase
      .from('user_data')
      .select('user_id, email')
      .in('email', ['semboyan35@gmail.com', 'natalia.wiworo@gmail.com'])
      .is('deleted_at', null);

    if (usersError || !users || users.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch user mappings from database',
      });
    }

    // Type-cast to UserData
    const userDataList = users as Pick<UserData, 'user_id' | 'email'>[];

    // Create user mapping: email -> user_id
    const userMap = new Map<string, string>();
    userDataList.forEach(u => {
      userMap.set(u.email, u.user_id);
    });

    // Get user IDs for the two target users
    const semboyonUserId = userMap.get('semboyan35@gmail.com');
    const nataliaUserId = userMap.get('natalia.wiworo@gmail.com');

    if (!semboyonUserId || !nataliaUserId) {
      throw createError({
        statusCode: 500,
        message: 'Required users not found in database (semboyan35@gmail.com or natalia.wiworo@gmail.com)',
      });
    }

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
        logger.warn(
          `Skipping transaction with invalid amount: ${spending.label} (${spending.value})`
        );
        skippedCount++;
        continue;
      }

      // Convert Unix timestamp (seconds) to ISO 8601 string in UTC
      const createdAt = new Date(spending.created_at * 1000).toISOString();
      const updatedAt = new Date(spending.updated_at * 1000).toISOString();

      // Determine created_by based on user field or ID prefix
      let createdBy: string;
      if (spending.user === 'QkOsyli6oHg3FuRNNqTCEkvdpPx1' || spending.id.startsWith('mysql_')) {
        // Semboyan's Firebase UID or MySQL records -> semboyan35@gmail.com
        createdBy = semboyonUserId;
      } else {
        // All other records (including Natalia's Firebase UID) -> natalia.wiworo@gmail.com
        createdBy = nataliaUserId;
      }

      transactionsToInsert.push({
        description: spending.label && spending.label.trim() ? spending.label : '-',
        amount: spending.value,
        transaction_type: 'expense',
        category: null, // All imported transactions are uncategorized
        created_by: createdBy,
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
        logger.error(`❌ Batch ${i / batchSize + 1} failed:`, {
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
        logger.log(`✅ Batch ${i / batchSize + 1} inserted: ${batch.length} records`);
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
