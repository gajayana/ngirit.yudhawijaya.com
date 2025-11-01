/**
 * Development-only logger utility
 *
 * Provides logging functions that only output in development mode.
 * In production, all logs are silently ignored.
 *
 * Usage:
 * ```typescript
 * import { logger } from '~/utils/logger';
 *
 * logger.log('User logged in');
 * logger.error('Failed to fetch data', error);
 * logger.warn('Deprecated API usage');
 * logger.info('Transaction created');
 * logger.debug('State:', state);
 * ```
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log informational messages (development only)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
