/**
 * Financial calculations composable using Decimal.js
 *
 * This composable provides utilities for accurate financial calculations
 * avoiding floating-point precision errors.
 *
 * CRITICAL: Always use these utilities for money calculations.
 * Never use native JavaScript arithmetic operators (+, -, *, /) directly.
 *
 * Example:
 * ```typescript
 * const { add, subtract, multiply, divide, sum, format } = useFinancial();
 *
 * // ✅ CORRECT
 * const total = add(100.10, 200.20); // 300.30
 * const average = divide(sum([10, 20, 30]), 3); // 20.00
 *
 * // ❌ WRONG - floating-point errors
 * const total = 100.10 + 200.20; // might give 300.30000000000007
 * ```
 */

import Decimal from 'decimal.js';

export const useFinancial = () => {
  /**
   * Configure Decimal.js for financial calculations
   * - 2 decimal places for currency
   * - ROUND_HALF_UP rounding mode (standard rounding)
   */
  Decimal.set({
    precision: 20, // High precision for intermediate calculations
    rounding: Decimal.ROUND_HALF_UP, // 0.5 rounds up
    toExpNeg: -7,
    toExpPos: 21,
  });

  /**
   * Add two or more numbers with precision
   * @param amounts - Numbers to add
   * @returns Sum rounded to 2 decimal places
   */
  const add = (...amounts: (number | string)[]): number => {
    let result = new Decimal(0);
    for (const amount of amounts) {
      result = result.plus(new Decimal(amount));
    }
    return result.toDecimalPlaces(2).toNumber();
  };

  /**
   * Subtract one number from another
   * @param a - Number to subtract from
   * @param b - Number to subtract
   * @returns Difference rounded to 2 decimal places
   */
  const subtract = (a: number | string, b: number | string): number => {
    return new Decimal(a).minus(new Decimal(b)).toDecimalPlaces(2).toNumber();
  };

  /**
   * Multiply two numbers
   * @param a - First number
   * @param b - Second number
   * @returns Product rounded to 2 decimal places
   */
  const multiply = (a: number | string, b: number | string): number => {
    return new Decimal(a).times(new Decimal(b)).toDecimalPlaces(2).toNumber();
  };

  /**
   * Divide one number by another
   * @param a - Dividend
   * @param b - Divisor
   * @returns Quotient rounded to 2 decimal places
   */
  const divide = (a: number | string, b: number | string): number => {
    if (Number(b) === 0) {
      throw new Error('Division by zero');
    }
    return new Decimal(a).div(new Decimal(b)).toDecimalPlaces(2).toNumber();
  };

  /**
   * Calculate sum of array of numbers
   * @param amounts - Array of numbers to sum
   * @returns Sum rounded to 2 decimal places
   */
  const sum = (amounts: (number | string)[]): number => {
    return add(...amounts);
  };

  /**
   * Calculate average of array of numbers
   * @param amounts - Array of numbers
   * @returns Average rounded to 2 decimal places
   */
  const average = (amounts: (number | string)[]): number => {
    if (amounts.length === 0) return 0;
    return divide(sum(amounts), amounts.length);
  };

  /**
   * Calculate percentage
   * @param value - The value
   * @param total - The total
   * @returns Percentage rounded to 2 decimal places
   */
  const percentage = (value: number | string, total: number | string): number => {
    if (Number(total) === 0) return 0;
    return multiply(divide(value, total), 100);
  };

  /**
   * Format number as Indonesian Rupiah currency
   * @param amount - Amount to format
   * @param options - Formatting options
   * @returns Formatted currency string
   */
  const formatCurrency = (
    amount: number | string,
    options: {
      showSymbol?: boolean;
      showDecimals?: boolean;
    } = {}
  ): string => {
    const { showSymbol = true, showDecimals = false } = options;
    const value = new Decimal(amount).toDecimalPlaces(2).toNumber();

    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(value);

    return showSymbol ? `Rp ${formatted}` : formatted;
  };

  /**
   * Parse string to number, handling various formats
   * @param value - String value to parse
   * @returns Parsed number or 0 if invalid
   */
  const parseAmount = (value: string): number => {
    try {
      // Remove common currency symbols and separators
      const cleaned = value
        .replace(/[Rp\s]/gi, '') // Remove Rp and spaces
        .replace(/\./g, '') // Remove thousand separators
        .replace(/,/g, '.'); // Replace comma with dot for decimals

      const parsed = new Decimal(cleaned).toDecimalPlaces(2).toNumber();
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  /**
   * Validate if a value is a valid monetary amount
   * @param value - Value to validate
   * @returns True if valid amount
   */
  const isValidAmount = (value: number | string): boolean => {
    try {
      const decimal = new Decimal(value);
      return decimal.isFinite() && decimal.greaterThanOrEqualTo(0);
    } catch {
      return false;
    }
  };

  /**
   * Compare two amounts
   * @param a - First amount
   * @param b - Second amount
   * @returns -1 if a < b, 0 if a === b, 1 if a > b
   */
  const compare = (a: number | string, b: number | string): -1 | 0 | 1 => {
    return new Decimal(a).comparedTo(new Decimal(b));
  };

  /**
   * Check if amount is zero
   * @param value - Value to check
   * @returns True if zero
   */
  const isZero = (value: number | string): boolean => {
    return new Decimal(value).isZero();
  };

  /**
   * Check if amount is positive
   * @param value - Value to check
   * @returns True if positive
   */
  const isPositive = (value: number | string): boolean => {
    return new Decimal(value).greaterThan(0);
  };

  /**
   * Check if amount is negative
   * @param value - Value to check
   * @returns True if negative
   */
  const isNegative = (value: number | string): boolean => {
    return new Decimal(value).lessThan(0);
  };

  /**
   * Get absolute value
   * @param value - Value
   * @returns Absolute value rounded to 2 decimal places
   */
  const abs = (value: number | string): number => {
    return new Decimal(value).abs().toDecimalPlaces(2).toNumber();
  };

  /**
   * Round amount to specified decimal places
   * @param value - Value to round
   * @param decimals - Number of decimal places (default: 2)
   * @returns Rounded number
   */
  const round = (value: number | string, decimals: number = 2): number => {
    return new Decimal(value).toDecimalPlaces(decimals).toNumber();
  };

  return {
    // Arithmetic operations
    add,
    subtract,
    multiply,
    divide,
    sum,
    average,
    percentage,

    // Formatting
    formatCurrency,
    parseAmount,

    // Validation
    isValidAmount,
    compare,
    isZero,
    isPositive,
    isNegative,

    // Utilities
    abs,
    round,
  };
};
