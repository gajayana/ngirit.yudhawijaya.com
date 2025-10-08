import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

interface FirebaseSpending {
  id: string;
  label: string;
  value: number;
  user: string;
  created_at: number; // Unix timestamp in seconds
  updated_at: number; // Unix timestamp in seconds
}

interface UserMapping {
  firebaseId: string;
  email: string;
}

const USER_MAPPINGS: UserMapping[] = [
  {
    firebaseId: 'QkOsyli6oHg3FuRNNqTCEkvdpPx1',
    email: 'semboyan35@gmail.com',
  },
  {
    firebaseId: 'ANpAPOanXzZkaQDvfYWN83WmMW52',
    email: 'natalia.wiworo@gmail.com',
  },
];

/**
 * POST /api/v1/transactions/import
 * Import transactions from Firebase spendings JSON file
 * Only accessible by superadmin
 */
export default defineEventHandler(async event => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    const supabase = await serverSupabaseClient(event);

    // Check if user is superadmin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select<'role', { role: string }>('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || (userRole as { role: string })?.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: Only superadmin can import transactions',
      });
    }

    // Get request body (array of Firebase spendings)
    const spendings = await readBody<FirebaseSpending[]>(event);

    if (!Array.isArray(spendings) || spendings.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body: Expected non-empty array of spendings',
      });
    }

    // Step 1: Map Firebase user IDs to Supabase user IDs
    const userIdMap = new Map<string, string>();

    for (const mapping of USER_MAPPINGS) {
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select<'id, email', { id: string; email: string }>('id, email')
        .eq('email', mapping.email)
        .single();

      if (userError || !dbUser) {
        throw createError({
          statusCode: 404,
          message: `User with email ${mapping.email} not found`,
        });
      }

      userIdMap.set(mapping.firebaseId, (dbUser as { id: string }).id);
    }

    // Step 2: Fetch "Tak Terkategori" categories for each user
    const categoryMap = new Map<string, string>();

    for (const [, supabaseUserId] of userIdMap) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select<'id', { id: string }>('id')
        .eq('name', 'Tak Terkategori')
        .eq('type', 'expense')
        .eq('created_by', supabaseUserId)
        .is('deleted_at', null)
        .single();

      if (categoryError || !category) {
        throw createError({
          statusCode: 404,
          message: `Category "Tak Terkategori" not found for user ${supabaseUserId}`,
        });
      }

      categoryMap.set(supabaseUserId, (category as { id: string }).id);
    }

    // Step 3: Process and insert transactions
    const transactionsToInsert = [];
    let skippedCount = 0;

    for (const spending of spendings) {
      const supabaseUserId = userIdMap.get(spending.user);

      if (!supabaseUserId) {
        skippedCount++;
        continue;
      }

      const categoryId = categoryMap.get(supabaseUserId);

      if (!categoryId) {
        skippedCount++;
        continue;
      }

      // Convert Unix timestamp (seconds) to ISO 8601 string in UTC
      const createdAt = new Date(spending.created_at * 1000).toISOString();
      const updatedAt = new Date(spending.updated_at * 1000).toISOString();

      transactionsToInsert.push({
        description: spending.label,
        amount: spending.value,
        transaction_type: 'expense',
        category: categoryId,
        created_by: supabaseUserId,
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

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(batch as any);

      if (insertError) {
        console.error(`Batch ${i / batchSize + 1} failed:`, insertError);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
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
