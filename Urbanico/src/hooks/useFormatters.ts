import { useMemo } from 'react';

/**
 * Pure helper functions for formatting Indian currency, weights, and numbers.
 * Safe against NaN, null, and undefined values.
 * Beginners can use these directly or via the useFormatters hook.
 */

/**
 * Formats any number or numeric string into Indian Rupee currency format (e.g. ₹1,25,000).
 */
export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '₹0';
  let num: number;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹,\s]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = val;
  }
  if (isNaN(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Formats kilogram weights cleanly into Tons (e.g. 16,000 Kg -> "16.00 Tons" or 500 Kg -> "500 Kg").
 */
export function formatWeight(kg: number | null | undefined): string {
  if (kg === null || kg === undefined || isNaN(kg) || kg <= 0) return '0 Kg';
  if (kg >= 1000) {
    const tons = kg / 1000;
    return `${Number(tons.toFixed(2))} Tons`;
  }
  return `${Math.round(kg)} Kg`;
}

/**
 * Formats large amounts into compact Indian notation (e.g. 25K, 4.5L, 1.2Cr).
 */
export function formatCompactINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

/**
 * Standardized Indian Date & Time format.
 */
export function formatISTDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Reusable formatting hook with memoized helper functions.
 * Using this hook prevents recreating formatter functions on every re-render.
 */
export function useFormatters() {
  return useMemo(
    () => ({
      formatINR,
      formatWeight,
      formatCompactINR,
      formatISTDate,
    }),
    []
  );
}
