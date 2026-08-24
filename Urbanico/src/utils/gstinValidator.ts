/**
 * Indian GSTIN Modulo-36 Checksum Validation Algorithm
 * Format: 2 digits (State Code) + 10 chars (PAN) + 1 char (Entity code) + 'Z' (Default) + 1 char (Checksum)
 */

const CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface GstinValidationResult {
  isValid: boolean;
  stateCode?: string;
  pan?: string;
  errorMessage?: string;
}

export function validateGSTIN(gstin: string): GstinValidationResult {
  if (!gstin) {
    return { isValid: false, errorMessage: 'GSTIN cannot be empty' };
  }

  const clean = gstin.trim().toUpperCase();

  if (clean.length !== 15) {
    return { isValid: false, errorMessage: 'GSTIN must be exactly 15 characters' };
  }

  // Regex format check
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return { isValid: false, errorMessage: 'Invalid GSTIN structure or PAN format' };
  }

  const stateCode = clean.substring(0, 2);
  const stateNum = parseInt(stateCode, 10);
  if (stateNum < 1 || stateNum > 38) {
    return { isValid: false, errorMessage: 'Invalid State Code in GSTIN' };
  }

  const pan = clean.substring(2, 12);

  // Modulo-36 Checksum calculation
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = clean[i];
    let codePoint = CHAR_SET.indexOf(char);
    if (codePoint === -1) {
      return { isValid: false, errorMessage: 'Invalid characters in GSTIN' };
    }

    // Multiply by 1 for even index (0-indexed) and 2 for odd index
    const factor = (i % 2 === 0) ? 1 : 2;
    let product = codePoint * factor;

    // Sum of quotient and remainder when divided by 36
    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += (quotient + remainder);
  }

  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  const calculatedChecksumChar = CHAR_SET[checkCodePoint];
  const actualChecksumChar = clean[14];

  if (calculatedChecksumChar !== actualChecksumChar) {
    return {
      isValid: false,
      stateCode,
      pan,
      errorMessage: `GSTIN checksum mismatch (expected ${calculatedChecksumChar}, found ${actualChecksumChar})`,
    };
  }

  return {
    isValid: true,
    stateCode,
    pan,
  };
}
