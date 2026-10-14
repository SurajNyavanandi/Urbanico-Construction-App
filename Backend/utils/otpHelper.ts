/**
 * Real random OTP generation and validation utility for Urbanico Logistics & Orders.
 * Generates non-deterministic 6-digit verification codes while maintaining
 * universal test support for dev OTP (123456).
 */

export function generateRandomOtp(digits: number = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export function isDevOtp(otp: string): boolean {
  return String(otp || '').trim() === '123456';
}
