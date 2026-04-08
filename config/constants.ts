/**
 * Centralized application constants.
 */

export const API_KEY_PREFIX = 'adb_sk_';
export const API_KEY_BYTES = 20; // 40 hex chars after prefix

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
  SEARCH_LIMIT: 20,
  MAX_SEARCH_LIMIT: 100,
} as const;

export const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },       // 5 req / 15min
  VERIFY: { limit: 10, windowMs: 15 * 60 * 1000 },    // 10 req / 15min
  MCP: { limit: 100, windowMs: 60 * 1000 },            // 100 req / 1min
} as const;

export const SLUG_SUFFIX_LENGTH = 4;
