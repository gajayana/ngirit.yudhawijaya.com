/**
 * Transaction types and interfaces
 */

import type { Database } from './database';

// ============================================================================
// Transaction Types (from database)
// ============================================================================

/**
 * Transaction row from database (complete record)
 */
export type Transaction = Database['public']['Tables']['transactions']['Row'];

/**
 * Transaction for inserting new records
 */
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

/**
 * Transaction for updating existing records
 */
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// ============================================================================
// Transaction with Category (joined data)
// ============================================================================

/**
 * Transaction with full category details
 * Used when fetching transactions with joined category data
 */
export interface TransactionWithCategory extends Omit<Transaction, 'category'> {
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  } | null;
}

// ============================================================================
// Transaction Input Types
// ============================================================================

/**
 * Input for creating a single transaction (client-side)
 */
export interface TransactionInput {
  description: string;
  amount: number;
  transaction_type: string;
  category?: string | null;
}

/**
 * Input for creating multiple transactions (bulk insert)
 */
export interface TransactionBulkInput {
  transactions: TransactionInput[];
}

/**
 * Input for updating a transaction (partial update)
 */
export interface TransactionUpdateInput {
  description?: string;
  amount?: number;
  transaction_type?: string;
  category?: string | null;
}

// ============================================================================
// Transaction Response Types
// ============================================================================

/**
 * Response from GET /api/v1/transactions
 */
export interface TransactionListResponse {
  success: boolean;
  data: TransactionWithCategory[];
  count: number;
}

/**
 * Response from POST /api/v1/transactions
 */
export interface TransactionCreateResponse {
  success: boolean;
  data: TransactionWithCategory[];
  count: number;
}

/**
 * Response from PUT /api/v1/transactions/:id
 */
export interface TransactionUpdateResponse {
  success: boolean;
  data: TransactionWithCategory;
}

/**
 * Response from DELETE /api/v1/transactions/:id
 */
export interface TransactionDeleteResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Transaction Query Parameters
// ============================================================================

/**
 * Query parameters for GET /api/v1/transactions
 */
export interface TransactionQueryParams {
  /** Filter by specific date (YYYY-MM-DD format) */
  date?: string;
  /** Filter by month (YYYY-MM format) */
  month?: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ============================================================================
// Transaction Type Constants
// ============================================================================

/**
 * Transaction type enum values
 * Based on common transaction types
 */
export const TRANSACTION_TYPE = {
  EXPENSE: 'expense',
  INCOME: 'income',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
