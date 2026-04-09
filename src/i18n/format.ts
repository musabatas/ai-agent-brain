import i18n from 'i18next';

// Default currency, but you can make this dynamic as well.
const DEFAULT_CURRENCY = 'USD';

/**
 * Get the current locale from i18n.
 * @returns Current locale string (e.g., 'en-US').
 */
const getCurrentLocale = (): string => {
  return i18n.language || 'en-US'; // Fallback to 'en-US' if locale is not set
};

/**
 * Format a date to "Dec 7, 2024" format.
 */
export const formatDate = (date: Date | string): string => {
  const locale = getCurrentLocale();
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
};

/**
 * Format a date and time to "Dec 7, 2024, 11:41 PM" format.
 */
export const formatDateTime = (date: Date | string): string => {
  const locale = getCurrentLocale();
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(parsedDate);
};

/**
 * Format time to "11:41 PM" format.
 */
export const formatTime = (date: Date | string): string => {
  const locale = getCurrentLocale();
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(parsedDate);
};

/**
 * Format money to a localized currency string.
 */
export const formatMoney = (
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string => {
  const locale = getCurrentLocale();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
