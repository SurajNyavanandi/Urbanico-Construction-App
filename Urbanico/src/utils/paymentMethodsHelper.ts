import { SavedPaymentMethod } from '../types';
import { safeStorage } from './safeStorage';

const getUserStorageKey = (userPhone?: string): string | null => {
  if (!userPhone) return null;
  const clean = userPhone.replace(/\D/g, '');
  return clean.length >= 6 ? `urbanico_verified_payments_${clean}` : null;
};

export interface PspInfo {
  bankName: string;
  app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'custom';
  title: string;
}

export const NPCI_PSP_REGISTRY: Record<string, PspInfo> = {
  // Google Pay handles
  'okhdfcbank': { bankName: 'HDFC Bank', app: 'gpay', title: 'Google Pay (HDFC)' },
  'okaxis': { bankName: 'Axis Bank', app: 'gpay', title: 'Google Pay (Axis)' },
  'okicici': { bankName: 'ICICI Bank', app: 'gpay', title: 'Google Pay (ICICI)' },
  'oksbi': { bankName: 'State Bank of India', app: 'gpay', title: 'Google Pay (SBI)' },

  // PhonePe handles
  'ybl': { bankName: 'YES Bank', app: 'phonepe', title: 'PhonePe (YES Bank)' },
  'ibl': { bankName: 'ICICI Bank', app: 'phonepe', title: 'PhonePe (ICICI)' },
  'axl': { bankName: 'Axis Bank', app: 'phonepe', title: 'PhonePe (Axis)' },

  // Paytm handles
  'paytm': { bankName: 'Paytm Payments Bank', app: 'paytm', title: 'Paytm UPI' },
  'ptaxis': { bankName: 'Axis Bank', app: 'paytm', title: 'Paytm (Axis Bank)' },
  'pthdfc': { bankName: 'HDFC Bank', app: 'paytm', title: 'Paytm (HDFC Bank)' },
  'ptyes': { bankName: 'YES Bank', app: 'paytm', title: 'Paytm (YES Bank)' },
  'ptsbi': { bankName: 'State Bank of India', app: 'paytm', title: 'Paytm (SBI)' },

  // BHIM & NPCI
  'upi': { bankName: 'NPCI BHIM UPI', app: 'bhim', title: 'BHIM UPI' },

  // Amazon Pay
  'apl': { bankName: 'Axis Bank (Amazon Pay)', app: 'custom', title: 'Amazon Pay UPI' },
  'rapl': { bankName: 'RBL Bank (Amazon Pay)', app: 'custom', title: 'Amazon Pay UPI' },

  // WhatsApp
  'waaxis': { bankName: 'Axis Bank (WhatsApp)', app: 'custom', title: 'WhatsApp Pay' },
  'wahdfcbank': { bankName: 'HDFC Bank (WhatsApp)', app: 'custom', title: 'WhatsApp Pay' },
  'waicici': { bankName: 'ICICI Bank (WhatsApp)', app: 'custom', title: 'WhatsApp Pay' },
  'wasbi': { bankName: 'State Bank of India (WhatsApp)', app: 'custom', title: 'WhatsApp Pay' },

  // Direct Bank Handles
  'sbi': { bankName: 'State Bank of India', app: 'custom', title: 'SBI Yono UPI' },
  'hdfcbank': { bankName: 'HDFC Bank', app: 'custom', title: 'HDFC Bank Mobile UPI' },
  'icici': { bankName: 'ICICI Bank', app: 'custom', title: 'iMobile ICICI UPI' },
  'axisbank': { bankName: 'Axis Bank', app: 'custom', title: 'Axis Mobile UPI' },
  'kotak': { bankName: 'Kotak Mahindra Bank', app: 'custom', title: 'Kotak 811 UPI' },
  'kmbl': { bankName: 'Kotak Mahindra Bank', app: 'custom', title: 'Kotak Mahindra Bank' },
  'indus': { bankName: 'IndusInd Bank', app: 'custom', title: 'IndusInd Bank UPI' },
  'pnb': { bankName: 'Punjab National Bank', app: 'custom', title: 'PNB ONE UPI' },
  'canarabank': { bankName: 'Canara Bank', app: 'custom', title: 'Canara ai1 UPI' },
  'cnrb': { bankName: 'Canara Bank', app: 'custom', title: 'Canara Bank UPI' },
  'barodampay': { bankName: 'Bank of Baroda', app: 'custom', title: 'bob World UPI' },
  'bob': { bankName: 'Bank of Baroda', app: 'custom', title: 'Bank of Baroda UPI' },
  'unionbank': { bankName: 'Union Bank of India', app: 'custom', title: 'Union Vyom UPI' },
  'uboi': { bankName: 'Union Bank of India', app: 'custom', title: 'Union Bank of India' },
  'idfcbank': { bankName: 'IDFC FIRST Bank', app: 'custom', title: 'IDFC FIRST Bank UPI' },
  'federal': { bankName: 'Federal Bank', app: 'custom', title: 'Federal Bank UPI' },
  'fbl': { bankName: 'Federal Bank', app: 'custom', title: 'Federal Bank' },
  'rbl': { bankName: 'RBL Bank', app: 'custom', title: 'RBL MoBank UPI' },
  'aubank': { bankName: 'AU Small Finance Bank', app: 'custom', title: 'AU 0101 UPI' },
  'equitas': { bankName: 'Equitas Small Finance Bank', app: 'custom', title: 'Equitas Bank UPI' },
  'jupiteraxis': { bankName: 'Federal Bank (Jupiter)', app: 'custom', title: 'Jupiter UPI' },
  'axisb': { bankName: 'Axis Bank (CRED)', app: 'custom', title: 'CRED UPI' },
  'yescred': { bankName: 'YES Bank (CRED)', app: 'custom', title: 'CRED UPI' },
  'postbank': { bankName: 'India Post Payments Bank', app: 'custom', title: 'IPPB Mobile UPI' },
};

export const POPULAR_UPI_HANDLES = [
  '@okhdfcbank',
  '@okaxis',
  '@ybl',
  '@paytm',
  '@oksbi',
  '@upi',
  '@apl',
  '@icici',
];

const isDummyPaymentMethod = (m: SavedPaymentMethod): boolean => {
  if (!m) return true;
  const id = (m.id || '').toLowerCase();
  const title = (m.title || '').toLowerCase();
  const sub = (m.subtitle || '').toLowerCase();
  const det = (m.details || '').toLowerCase();
  return (
    id.includes('card_token_hdfc_4321') ||
    sub.includes('9876543210') ||
    det.includes('9876543210') ||
    sub.includes('2411') ||
    det.includes('4111 2222 3333 2411') ||
    sub.includes('4321') ||
    sub.includes('9821') ||
    title.includes('demo')
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

export const MAX_SAVED_PAYMENT_METHODS = 7;

export function addSavedPaymentMethod(method: SavedPaymentMethod, userPhone?: string): SavedPaymentMethod[] {
  if (!method.isVerified) {
    throw new Error('Cannot save unverified payment method.');
  }
  const current = getSavedPaymentMethods(userPhone);

  if (current.length >= MAX_SAVED_PAYMENT_METHODS) {
    throw new Error(`Maximum limit reached (${MAX_SAVED_PAYMENT_METHODS} payment methods). Please remove an existing method to add a new one.`);
  }
  
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
 * Validates UPI ID syntax and verifies bank handle against the NPCI PSP registry
 */
export function validateUPIId(upiId: string): { valid: boolean; pspInfo?: PspInfo; message?: string } {
  const trimmed = (upiId || '').trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, message: 'Please enter your UPI ID (VPA).' };
  }

  // Common user mistake: entered email address instead of UPI ID
  if (
    trimmed.endsWith('@gmail.com') ||
    trimmed.endsWith('@yahoo.com') ||
    trimmed.endsWith('@outlook.com') ||
    trimmed.endsWith('@hotmail.com') ||
    trimmed.endsWith('@rediffmail.com')
  ) {
    return {
      valid: false,
      message: 'Email addresses are not UPI IDs. Please enter a valid UPI VPA (e.g. 9848012345@okhdfcbank or yourname@ybl).',
    };
  }

  if (!trimmed.includes('@')) {
    return {
      valid: false,
      message: 'UPI ID must contain "@" followed by a valid bank handle (e.g. 9848012345@okhdfcbank).',
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid UPI format: multiple "@" characters detected.' };
  }

  const [username, psp] = parts;
  if (!username) {
    return { valid: false, message: 'Please enter the username or phone number before "@".' };
  }
  if (!psp) {
    return { valid: false, message: 'Please specify the bank handle after "@" (e.g. @okhdfcbank, @ybl).' };
  }

  // Validate username part
  // If digits only: must be a valid 10-digit Indian mobile number starting with 6,7,8,9
  if (/^\d+$/.test(username)) {
    if (username.length !== 10) {
      return {
        valid: false,
        message: `Phone number UPI must be exactly 10 digits (entered ${username.length} digits).`,
      };
    }
    if (!/^[6-9]\d{9}$/.test(username)) {
      return {
        valid: false,
        message: 'Mobile number must be a valid Indian mobile number starting with 6, 7, 8, or 9.',
      };
    }
    // Check for repetitive fake numbers like 0000000000, 1111111111, 9999999999
    if (/^(\d)\1{9}$/.test(username)) {
      return {
        valid: false,
        message: 'Invalid mobile number. Repetitive digit patterns are not valid UPI handles.',
      };
    }
  } else {
    // Alphanumeric handle validation
    if (username.length < 3) {
      return {
        valid: false,
        message: 'UPI username is too short (minimum 3 characters).',
      };
    }
    if (username.length > 50) {
      return {
        valid: false,
        message: 'UPI username is too long (maximum 50 characters).',
      };
    }
    if (!/^[a-zA-Z0-9.\-_]+$/.test(username)) {
      return {
        valid: false,
        message: 'UPI ID can only contain letters, numbers, dots (.), underscores (_), or hyphens (-).',
      };
    }
    if (/^[.\-_]|[.\-_]$/.test(username)) {
      return {
        valid: false,
        message: 'UPI handle cannot start or end with a special character (. - _).',
      };
    }
    if (username.includes('..') || username.includes('--')) {
      return {
        valid: false,
        message: 'UPI handle cannot contain consecutive dots or hyphens.',
      };
    }
  }

  // Validate PSP handle against official NPCI PSP registry
  const pspInfo = NPCI_PSP_REGISTRY[psp];
  if (!pspInfo) {
    return {
      valid: false,
      message: `Unrecognized bank handle '@${psp}'. Supported handles include @okhdfcbank, @okaxis, @ybl, @paytm, @oksbi, @upi, @apl.`,
    };
  }

  return { valid: true, pspInfo };
}

/**
 * Simulates online verification with NPCI banking directory
 */
export async function verifyUPIIdOnline(
  upiId: string,
  userName?: string,
  userPhone?: string
): Promise<{
  success: boolean;
  accountName?: string;
  bankName?: string;
  upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'custom';
  title?: string;
  error?: string;
}> {
  const check = validateUPIId(upiId);
  if (!check.valid || !check.pspInfo) {
    return { success: false, error: check.message };
  }

  const trimmed = upiId.trim().toLowerCase();
  const [username] = trimmed.split('@');

  // Detect test / fake / placeholder handles and reject them
  const dummyKeywords = [
    'test',
    'dummy',
    'fake',
    'invalid',
    'sample',
    'random',
    'asdf',
    'qwerty',
    'abc',
    'xyz',
    'foo',
    'bar',
    'temp',
    '12345',
    '9999999999',
    '1111111111',
  ];
  if (dummyKeywords.some((kw) => username === kw || username.startsWith(`${kw}_`) || username.endsWith(`_${kw}`))) {
    // Simulate real network lookup delay before returning NPCI rejection
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      success: false,
      error: `NPCI Error: VPA '${trimmed}' is inactive or not registered with ${check.pspInfo.bankName}.`,
    };
  }

  // Simulate network roundtrip to NPCI banking directory (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Resolve realistic verified account holder name
  let resolvedName = '';
  if (userName && userName.trim()) {
    resolvedName = userName.trim().toUpperCase();
  } else if (userPhone && username === userPhone.replace(/\D/g, '')) {
    resolvedName = 'VERIFIED ACCOUNT HOLDER';
  } else {
    // Clean formatted name from handle
    resolvedName = username
      .replace(/[._\-]/g, ' ')
      .replace(/\d+/g, '')
      .trim()
      .toUpperCase();
    if (!resolvedName || resolvedName.length < 3) {
      resolvedName = 'AUTHORIZED ACCOUNT HOLDER';
    }
  }

  return {
    success: true,
    accountName: resolvedName,
    bankName: check.pspInfo.bankName,
    upiApp: check.pspInfo.app,
    title: check.pspInfo.title,
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
    return { valid: false, brand, message: 'Card number must be exactly 16 digits.' };
  }

  // Reject all repetitive or obvious fake card numbers
  if (/^(\d)\1{15}$/.test(cleanNum)) {
    return { valid: false, brand, message: 'Invalid card number. Repetitive digits are not allowed.' };
  }

  // Strict Luhn checksum verification
  if (!checkLuhn(cleanNum)) {
    return { valid: false, brand, message: 'Invalid card number checksum (Luhn check failed).' };
  }

  const cleanHolder = cardHolder.trim();
  if (!cleanHolder || cleanHolder.length < 3) {
    return { valid: false, brand, message: 'Cardholder name is required (at least 3 characters).' };
  }

  // Holder name must contain valid alphabetic characters and not dummy words
  if (!/^[a-zA-Z\s.\-']+$/.test(cleanHolder)) {
    return { valid: false, brand, message: 'Cardholder name contains invalid characters.' };
  }
  const lowerHolder = cleanHolder.toLowerCase();
  const dummyNames = ['test', 'dummy', 'fake', 'sample', 'asdf', 'qwerty', 'card holder'];
  if (dummyNames.some((d) => lowerHolder === d || lowerHolder.startsWith(`${d} `) || lowerHolder.endsWith(` ${d}`))) {
    return { valid: false, brand, message: 'Please enter a valid cardholder name as printed on the card.' };
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
