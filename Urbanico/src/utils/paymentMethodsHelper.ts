import { SavedPaymentMethod } from '../types';
import { safeStorage } from './safeStorage';

const getUserStorageKey = (userPhone?: string): string | null => {
  if (!userPhone) return null;
  const clean = userPhone.replace(/\D/g, '');
  return clean.length >= 6 ? `urbanico_verified_payments_${clean}` : null;
};

const isDummyPaymentMethod = (m: SavedPaymentMethod): boolean => {
  if (!m) return true;
  const sub = (m.subtitle || '').toLowerCase();
  const det = (m.details || '').toLowerCase();
  return (
    sub.includes('9876543210') ||
    det.includes('9876543210') ||
    sub.includes('2411') ||
    det.includes('4111 2222 3333 2411') ||
    sub.includes('9821')
  );
};

export function getSavedPaymentMethods(userPhone?: string): SavedPaymentMethod[] {
  const key = getUserStorageKey(userPhone);
  if (!key) {
    // Unauthenticated or guest user: NEVER return saved payment methods
    return [];
  }

  try {
    const raw = safeStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Only return verified methods and purge any dummy items
        return parsed.filter((m) => m && m.isVerified && !isDummyPaymentMethod(m));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export function savePaymentMethods(methods: SavedPaymentMethod[], userPhone?: string): void {
  const key = getUserStorageKey(userPhone);
  if (!key) return;

  try {
    const cleanMethods = methods.filter((m) => m && m.isVerified && !isDummyPaymentMethod(m));
    safeStorage.setItem(key, JSON.stringify(cleanMethods));
  } catch {
    // ignore
  }
}

export function setDefaultSavedPaymentMethod(id: string, userPhone?: string): SavedPaymentMethod[] {
  const current = getSavedPaymentMethods(userPhone);
  const updated = current.map((m) => ({
    ...m,
    isDefault: m.id === id,
  }));
  savePaymentMethods(updated, userPhone);
  return updated;
}

export function addSavedPaymentMethod(method: SavedPaymentMethod, userPhone?: string): SavedPaymentMethod[] {
  if (!method.isVerified) {
    throw new Error('Cannot save unverified payment method.');
  }
  const current = getSavedPaymentMethods(userPhone);
  
  // Prevent duplicates by VPA / Details
  const isDuplicate = current.some(
    (m) => m.details.toLowerCase().trim() === method.details.toLowerCase().trim()
  );
  if (isDuplicate) {
    throw new Error('This payment method is already saved in your account.');
  }

  // If this is the first method or marked default, update others
  const shouldBeDefault = method.isDefault || current.length === 0;
  const updated = shouldBeDefault
    ? current.map((m) => ({ ...m, isDefault: false }))
    : [...current];

  const nextList = [{ ...method, isDefault: shouldBeDefault }, ...updated];
  savePaymentMethods(nextList, userPhone);
  return nextList;
}

export function deleteSavedPaymentMethod(id: string, userPhone?: string): SavedPaymentMethod[] {
  const current = getSavedPaymentMethods(userPhone);
  const filtered = current.filter((m) => m.id !== id);
  // If deleted method was default and others exist, set first as default
  if (filtered.length > 0 && !filtered.some((m) => m.isDefault)) {
    filtered[0].isDefault = true;
  }
  savePaymentMethods(filtered, userPhone);
  return filtered;
}

/**
 * Validates UPI ID syntax (e.g., username@bankhandle)
 */
export function validateUPIId(upiId: string): { valid: boolean; message?: string } {
  const trimmed = upiId.trim();
  if (!trimmed) {
    return { valid: false, message: 'Please enter your UPI ID or VPA.' };
  }
  if (!trimmed.includes('@')) {
    return { valid: false, message: 'UPI ID must contain "@" (e.g. 9848012345@okhdfcbank).' };
  }
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid UPI format with multiple "@" symbols.' };
  }
  const [handle, psp] = parts;
  if (!handle || handle.length < 2) {
    return { valid: false, message: 'UPI username or phone is too short.' };
  }
  if (!psp || psp.length < 2) {
    return { valid: false, message: 'UPI bank handle is invalid (e.g. @okhdfcbank, @ybl).' };
  }
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return { valid: false, message: 'Invalid characters in UPI ID.' };
  }
  return { valid: true };
}

/**
 * Simulates online verification with NPCI banking directory
 */
export async function verifyUPIIdOnline(
  upiId: string,
  userName?: string
): Promise<{ success: boolean; accountName?: string; bankName?: string; error?: string }> {
  const check = validateUPIId(upiId);
  if (!check.valid) {
    return { success: false, error: check.message };
  }

  // Simulate network roundtrip to banking directory (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  const trimmed = upiId.trim().toLowerCase();
  const [, psp] = trimmed.split('@');

  let bank = 'HDFC Bank';
  if (psp.includes('axis') || psp === 'okaxis') bank = 'Axis Bank';
  else if (psp.includes('icici') || psp === 'okicici') bank = 'ICICI Bank';
  else if (psp.includes('sbi') || psp === 'oksbi') bank = 'State Bank of India';
  else if (psp === 'ybl' || psp === 'ibl') bank = 'Yes Bank';
  else if (psp.includes('paytm')) bank = 'Paytm Payments Bank';

  const defaultHolder = userName ? userName.toUpperCase() : 'KUMAR INFRA ENTERPRISES';
  return {
    success: true,
    accountName: defaultHolder,
    bankName: bank,
  };
}

/**
 * Luhn algorithm check for card numbers
 */
function checkLuhn(cardNum: string): boolean {
  const digits = cardNum.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'rupay' | 'card' {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^(60|65|81|82|508)/.test(clean)) return 'rupay';
  return 'card';
}

/**
 * Validates Card details before verification
 */
export function validateCard(
  cardNumber: string,
  cardHolder: string,
  expiry: string,
  cvv: string
): { valid: boolean; brand: 'visa' | 'mastercard' | 'rupay' | 'card'; message?: string } {
  const cleanNum = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(cleanNum);

  if (cleanNum.length !== 16) {
    return { valid: false, brand, message: 'Card number must be 16 digits.' };
  }

  // Accept test cards or check Luhn
  if (!checkLuhn(cleanNum) && !cleanNum.startsWith('4111') && !cleanNum.startsWith('5555')) {
    return { valid: false, brand, message: 'Invalid card number checksum.' };
  }

  if (!cardHolder.trim() || cardHolder.trim().length < 3) {
    return { valid: false, brand, message: 'Please enter cardholder name.' };
  }

  const expiryClean = expiry.replace(/\D/g, '');
  if (expiryClean.length !== 4) {
    return { valid: false, brand, message: 'Expiry must be in MM/YY format.' };
  }
  const month = parseInt(expiryClean.slice(0, 2), 10);
  const year = parseInt(expiryClean.slice(2, 4), 10);
  if (month < 1 || month > 12) {
    return { valid: false, brand, message: 'Invalid expiry month (01-12).' };
  }
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, brand, message: 'Card has already expired.' };
  }

  const cleanCvv = cvv.replace(/\D/g, '');
  if (cleanCvv.length < 3 || cleanCvv.length > 4) {
    return { valid: false, brand, message: 'CVV must be 3 or 4 digits.' };
  }

  return { valid: true, brand };
}

/**
 * Simulates online verification with Card Payment Gateway / Network
 */
export async function verifyCardOnline(
  cardNumber: string,
  cardHolder: string,
  expiry: string,
  cvv: string
): Promise<{ success: boolean; brand?: 'visa' | 'mastercard' | 'rupay' | 'card'; last4?: string; token?: string; error?: string }> {
  const check = validateCard(cardNumber, cardHolder, expiry, cvv);
  if (!check.valid) {
    return { success: false, error: check.message };
  }

  // Simulate network verification handshake
  await new Promise((resolve) => setTimeout(resolve, 750));

  const cleanNum = cardNumber.replace(/\D/g, '');
  const last4 = cleanNum.slice(-4);
  const token = `tok_${check.brand}_${Math.random().toString(36).substring(2, 10)}`;

  return {
    success: true,
    brand: check.brand,
    last4,
    token,
  };
}
