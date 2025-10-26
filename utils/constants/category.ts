/**
 * Category type constants and interfaces
 */

import type { Database } from './database';

export type CategoryType = Database['public']['Enums']['category_type'];

export const CATEGORY_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const satisfies Record<string, CategoryType>;

/**
 * Interface representing category data from the database
 */
export type CategoryData = Database['public']['Tables']['categories']['Row'];

/**
 * Interface for inserting a new category
 */
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

/**
 * Interface for updating a category
 */
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Helper function to check if a category type is valid
 */
export const isValidCategoryType = (type: string): type is CategoryType => {
  return Object.values(CATEGORY_TYPE).includes(type as CategoryType);
};

/**
 * Helper function to get category type display name
 */
export const getCategoryTypeDisplayName = (type: CategoryType): string => {
  switch (type) {
    case CATEGORY_TYPE.INCOME:
      return 'Income';
    case CATEGORY_TYPE.EXPENSE:
      return 'Expense';
    default:
      return type;
  }
};

/**
 * Helper function to get all category types
 */
export const getAllCategoryTypes = (): CategoryType[] => {
  return Object.values(CATEGORY_TYPE);
};
