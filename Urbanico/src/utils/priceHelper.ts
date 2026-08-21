/**
 * Utility functions for robust currency and price parsing across the Urbanico application.
 * Prevents NaN or truncation bugs when parsing strings with commas, currency symbols, or unit suffixes.
 */

/**
 * Sanitizes and extracts a reliable numeric float/integer from any price string or number.
 * Examples:
 *   "₹1,200/day" -> 1200
 *   "₹4,500/ton" -> 4500
 *   "From ₹6.5 / Brick" -> 6.5
 *   "₹ 365.00" -> 365
 *   1200 -> 1200
 */
export function parseSanitizedPrice(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }

  const str = String(input).trim();
  if (!str) return 0;

  // Remove commas, currency symbols (₹, $, etc.), and extract the first valid numeric group (including decimal)
  const cleaned = str.replace(/,/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;

  const parsed = parseFloat(match[1]);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number cleanly into Indian Rupee format.
 * Example: 120000 -> "₹1,20,000"
 */
export function formatInr(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : Math.round(amount);
  return `₹${safeAmount.toLocaleString('en-IN')}`;
}

/**
 * Computes GST bifurcation (9% CGST + 9% SGST for intrastate supply in Telangana code 36)
 */
export function computeGstBreakdown(taxableAmount: number) {
  const safeTaxable = isNaN(taxableAmount) ? 0 : Math.max(0, taxableAmount);
  const cgst = Math.round(safeTaxable * 0.09);
  const sgst = Math.round(safeTaxable * 0.09);
  const totalGst = cgst + sgst;
  const grandTotal = safeTaxable + totalGst;

  return {
    taxableAmount: safeTaxable,
    cgst,
    sgst,
    totalGst,
    grandTotal,
    cgstRate: '9%',
    sgstRate: '9%',
    igstRate: '18%',
  };
}
