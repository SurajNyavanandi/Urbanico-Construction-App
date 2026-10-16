import { formatINR, formatWeight, formatCompactINR } from '../hooks/useFormatters';

/**
 * Utility functions for robust currency, GST, and price calculations across Urbanico.
 * Central single-source-of-truth preventing NaN or rounding bugs.
 */

/**
 * Sanitizes and extracts a reliable numeric float/integer from any price string or number.
 * Examples:
 *   "₹1,200/day" -> 1200
 *   "₹4,500/ton" -> 4500
 *   "From ₹6.5 / Brick" -> 6.5
 *   "₹ 365.00" -> 365
 */
export function parseSanitizedPrice(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }

  const str = String(input).trim();
  if (!str) return 0;

  const cleaned = str.replace(/,/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;

  const parsed = parseFloat(match[1]);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number cleanly into Indian Rupee format (e.g. 120000 -> "₹1,20,000").
 */
export const formatInr = formatINR;
export { formatINR, formatWeight, formatCompactINR };

/**
 * Standard GST calculator for materials and services.
 * Defaults to 18% standard construction GST rate.
 */
export function calculateGst(subtotal: number, gstRate: number = 0.18): {
  taxableAmount: number;
  gstAmount: number;
  totalWithTax: number;
  gstPercent: number;
} {
  const safeSubtotal = isNaN(subtotal) ? 0 : Math.max(0, subtotal);
  const safeRate = isNaN(gstRate) ? 0.18 : Math.max(0, gstRate);
  const gstAmount = Math.round(safeSubtotal * safeRate);
  return {
    taxableAmount: safeSubtotal,
    gstAmount,
    totalWithTax: safeSubtotal + gstAmount,
    gstPercent: Math.round(safeRate * 100),
  };
}

/**
 * Computes GST breakdown
 */
export function computeGstBreakdown(taxableAmount: number, rate: number = 0.18) {
  const result = calculateGst(taxableAmount, rate);
  return {
    taxableAmount: result.taxableAmount,
    gst: result.gstAmount,
    totalGst: result.gstAmount,
    grandTotal: result.totalWithTax,
    gstRate: `${result.gstPercent}%`,
  };
}

/**
 * Formats price with optional unit suffix (e.g. "₹385 / 50kg Bag")
 */
export function formatPriceWithUnit(price: number | string, unit?: string): string {
  const formatted = formatINR(price);
  return unit ? `${formatted} / ${unit}` : formatted;
}
