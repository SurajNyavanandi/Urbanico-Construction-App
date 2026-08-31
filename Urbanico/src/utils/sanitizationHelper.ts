import { IndianDeliveryAddress, UserProfile } from '../types';
import { INDIAN_STATES } from './addressHelper';
import { validateGSTIN } from './gstinValidator';

/**
 * Basic HTML tag and script stripper to prevent XSS / injection attacks
 */
export function stripHtml(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Strips ASCII & Unicode non-printable control characters
 */
export function stripControlChars(input: string): string {
  // Removes control chars 0x00-0x1F and 0x7F-0x9F except standard newlines/tabs if needed
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

/**
 * General sanitized text helper with whitespace normalization
 */
export function sanitizeText(input: unknown, maxLength = 255): string {
  const raw = stripHtml(input);
  const withoutControls = stripControlChars(raw);
  // Normalize internal whitespace (convert multiple spaces/tabs/newlines to single space)
  const normalized = withoutControls.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, maxLength);
}

/**
 * Sanitize human names (allows letters, spaces, dots, hyphens, single quotes)
 */
export function sanitizeName(input: unknown, maxLength = 60): string {
  const clean = sanitizeText(input, maxLength);
  // Keep only alphabetic chars, spaces, dots, hyphens, and apostrophes
  const nameCharsOnly = clean.replace(/[^a-zA-Z\s.\-']/g, '');
  return nameCharsOnly.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Sanitize 10-digit Indian Mobile Numbers
 */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string' && typeof input !== 'number') return '';
  let digits = String(input).replace(/\D/g, '');
  
  // If user included +91 or 91 prefix with 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If user included leading 0 with 11 digits, strip leading zero
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  return digits.slice(0, 10);
}

/**
 * Sanitize Email Address
 */
export function sanitizeEmail(input: unknown, maxLength = 100): string {
  const clean = sanitizeText(input, maxLength).toLowerCase();
  // Remove all whitespace
  return clean.replace(/\s+/g, '').slice(0, maxLength);
}

/**
 * Sanitize 6-digit Indian Pincode
 */
export function sanitizePincode(input: unknown): string {
  if (typeof input !== 'string' && typeof input !== 'number') return '';
  return String(input).replace(/\D/g, '').slice(0, 6);
}

/**
 * Sanitize 15-character GSTIN
 */
export function sanitizeGstin(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
}

/**
 * Sanitize Address String fields
 */
export function sanitizeAddressField(input: unknown, maxLength = 150): string {
  const clean = sanitizeText(input, maxLength);
  // Allow alphanumeric, spaces, and standard address punctuation: , . - / # & ( ) : ;
  const addressSafe = clean.replace(/[^a-zA-Z0-9\s,.\-/#&():;]/g, '');
  return addressSafe.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  sanitized: string;
}

/**
 * Validate full name
 */
export function validateName(name: unknown, fieldLabel = 'Full Name'): FieldValidationResult {
  const sanitized = sanitizeName(name);
  if (!sanitized) {
    return { isValid: false, error: `${fieldLabel} is required`, sanitized: '' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters`, sanitized };
  }
  if (sanitized.length > 60) {
    return { isValid: false, error: `${fieldLabel} cannot exceed 60 characters`, sanitized };
  }
  // Must have at least 2 letters
  const letterCount = (sanitized.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: `${fieldLabel} must contain valid letters`, sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate 10-digit Indian Mobile Number (starts with 6, 7, 8, or 9)
 */
export function validatePhone(phone: unknown, fieldLabel = 'Mobile Number'): FieldValidationResult {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) {
    return { isValid: false, error: `${fieldLabel} is required`, sanitized: '' };
  }
  if (sanitized.length !== 10) {
    return { isValid: false, error: `${fieldLabel} must be exactly 10 digits`, sanitized };
  }
  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(sanitized)) {
    return { isValid: false, error: `${fieldLabel} must be a valid 10-digit Indian number starting with 6, 7, 8, or 9`, sanitized };
  }
  // Disallow obvious repetitive placeholder sequences like 0000000000, 1111111111
  if (/^(\d)\1{9}$/.test(sanitized)) {
    return { isValid: false, error: `Please enter a valid active ${fieldLabel}`, sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Alternate Mobile Number (Optional)
 */
export function validateAlternatePhone(altPhone: unknown, primaryPhone?: unknown): FieldValidationResult {
  if (!altPhone || !String(altPhone).trim()) {
    return { isValid: true, sanitized: '' };
  }
  const sanitized = sanitizePhone(altPhone);
  if (sanitized.length !== 10 || !/^[6-9]\d{9}$/.test(sanitized)) {
    return { isValid: false, error: 'Alternate phone must be a valid 10-digit Indian number', sanitized };
  }
  if (primaryPhone) {
    const cleanPrimary = sanitizePhone(primaryPhone);
    if (cleanPrimary && cleanPrimary === sanitized) {
      return { isValid: false, error: 'Alternate phone cannot be identical to primary mobile number', sanitized };
    }
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Email Address (Optional or Required)
 */
export function validateEmail(email: unknown, isRequired = false): FieldValidationResult {
  const sanitized = sanitizeEmail(email);
  if (!sanitized) {
    if (isRequired) {
      return { isValid: false, error: 'Email address is required', sanitized: '' };
    }
    return { isValid: true, sanitized: '' };
  }
  // Strict standard email regex RFC 5322 approximation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(sanitized) || sanitized.length > 100) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com)', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate 6-digit Indian Postal PIN code
 */
export function validatePincode(pincode: unknown): FieldValidationResult {
  const sanitized = sanitizePincode(pincode);
  if (!sanitized) {
    return { isValid: false, error: '6-digit postal pincode is required', sanitized: '' };
  }
  if (sanitized.length !== 6) {
    return { isValid: false, error: 'Pincode must be exactly 6 digits', sanitized };
  }
  // Indian PIN codes start with digits 1 through 8 (range 110001 to 855117)
  if (!/^[1-8][0-9]{5}$/.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid Indian postal pincode (starts with 1-8)', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Flat / House / Building / Site Name
 */
export function validateFlatBuilding(building: unknown): FieldValidationResult {
  const sanitized = sanitizeAddressField(building, 120);
  if (!sanitized) {
    return { isValid: false, error: 'Flat, House No., Building or Plot name is required', sanitized: '' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Building / Plot name must be at least 2 characters', sanitized };
  }
  if (sanitized.length > 120) {
    return { isValid: false, error: 'Building / Plot name cannot exceed 120 characters', sanitized };
  }
  // Must contain alphanumeric characters
  if (!/[a-zA-Z0-9]/.test(sanitized)) {
    return { isValid: false, error: 'Building name must contain letters or numbers', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Area / Street / Village
 */
export function validateAreaStreet(street: unknown): FieldValidationResult {
  const sanitized = sanitizeAddressField(street, 150);
  if (!sanitized) {
    return { isValid: false, error: 'Area, Street, Village or Colony is required', sanitized: '' };
  }
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Area / Street must be at least 3 characters', sanitized };
  }
  if (sanitized.length > 150) {
    return { isValid: false, error: 'Area / Street cannot exceed 150 characters', sanitized };
  }
  if (!/[a-zA-Z0-9]/.test(sanitized)) {
    return { isValid: false, error: 'Area / Street must contain valid text', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Town / City
 */
export function validateCity(city: unknown): FieldValidationResult {
  const sanitized = sanitizeName(city, 50);
  if (!sanitized) {
    return { isValid: false, error: 'Town / City is required', sanitized: '' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters', sanitized };
  }
  if (sanitized.length > 50) {
    return { isValid: false, error: 'City name cannot exceed 50 characters', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate State / UT
 */
export function validateState(state: unknown): FieldValidationResult {
  const sanitized = sanitizeText(state, 50);
  if (!sanitized) {
    return { isValid: false, error: 'State is required', sanitized: '' };
  }
  const isRecognized = (INDIAN_STATES as readonly string[]).includes(sanitized) || sanitized.length >= 2;
  if (!isRecognized) {
    return { isValid: false, error: 'Please select a valid Indian State / UT', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate Company / Firm Name (Optional)
 */
export function validateCompanyName(company: unknown): FieldValidationResult {
  if (!company || !String(company).trim()) {
    return { isValid: true, sanitized: '' };
  }
  const sanitized = sanitizeAddressField(company, 100);
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Company name must be at least 2 characters', sanitized };
  }
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Company name cannot exceed 100 characters', sanitized };
  }
  return { isValid: true, sanitized };
}

/**
 * Validate GSTIN (Optional, but if provided must follow Indian format)
 */
export function validateGstinField(gstin: unknown): FieldValidationResult {
  if (!gstin || !String(gstin).trim()) {
    return { isValid: true, sanitized: '' };
  }
  const sanitized = sanitizeGstin(gstin);
  const result = validateGSTIN(sanitized);
  if (!result.isValid) {
    return { isValid: false, error: result.errorMessage || 'Invalid 15-digit GSTIN structure (e.g. 36AAACU9812A1Z4)', sanitized };
  }
  return { isValid: true, sanitized: result.formattedGSTIN || sanitized };
}

// ==========================================
// COMPREHENSIVE FORM SANITIZATION & VALIDATION
// ==========================================

export interface SanitizedAddressFormResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: IndianDeliveryAddress;
}

export function validateAndSanitizeAddressForm(raw: Partial<IndianDeliveryAddress> & {
  fullName?: string;
  mobileNumber?: string;
  alternatePhone?: string;
  deliveryInstructions?: string;
}): SanitizedAddressFormResult {
  const errors: Record<string, string> = {};

  // 1. Pincode
  const pinRes = validatePincode(raw.pincode);
  if (!pinRes.isValid) errors.pincode = pinRes.error!;

  // 2. Flat / Building
  const flatRes = validateFlatBuilding(raw.flatBuilding);
  if (!flatRes.isValid) errors.flatBuilding = flatRes.error!;

  // 3. Area / Street
  const areaRes = validateAreaStreet(raw.areaStreet);
  if (!areaRes.isValid) errors.areaStreet = areaRes.error!;

  // 4. City
  const cityRes = validateCity(raw.city);
  if (!cityRes.isValid) errors.city = cityRes.error!;

  // 5. State
  const stateRes = validateState(raw.state);
  if (!stateRes.isValid) errors.state = stateRes.error!;

  // 6. Optional Landmark
  const landmarkSanitized = sanitizeAddressField(raw.landmark, 100);

  // 7. Full Name (if provided in address form)
  let nameSanitized = '';
  if (raw.fullName !== undefined) {
    const nameRes = validateName(raw.fullName, 'Receiver / Contractor Name');
    if (!nameRes.isValid) errors.fullName = nameRes.error!;
    nameSanitized = nameRes.sanitized;
  }

  // 8. Mobile Number (if provided in address form)
  let mobileSanitized = '';
  if (raw.mobileNumber !== undefined) {
    const mobRes = validatePhone(raw.mobileNumber, 'Contact Phone Number');
    if (!mobRes.isValid) errors.mobileNumber = mobRes.error!;
    mobileSanitized = mobRes.sanitized;
  }

  // 9. Alternate Phone (optional)
  let altSanitized = '';
  if (raw.alternatePhone) {
    const altRes = validateAlternatePhone(raw.alternatePhone, raw.mobileNumber);
    if (!altRes.isValid) errors.alternatePhone = altRes.error!;
    altSanitized = altRes.sanitized;
  }

  // 10. Address Type
  const validTypes = ['Site', 'Home', 'Office', 'Warehouse'] as const;
  const addressType = validTypes.includes(raw.addressType as any)
    ? (raw.addressType as 'Site' | 'Home' | 'Office' | 'Warehouse')
    : 'Site';

  // 11. Delivery Instructions
  const instructionsSanitized = sanitizeAddressField(raw.deliveryInstructions, 200);

  const sanitized: IndianDeliveryAddress = {
    id: raw.id || `addr_${Date.now()}`,
    pincode: pinRes.sanitized,
    flatBuilding: flatRes.sanitized,
    areaStreet: areaRes.sanitized,
    landmark: landmarkSanitized,
    city: cityRes.sanitized,
    state: stateRes.sanitized,
    fullName: nameSanitized || undefined,
    mobileNumber: mobileSanitized || undefined,
    alternatePhone: altSanitized || undefined,
    addressType,
    deliveryInstructions: instructionsSanitized || undefined,
    isDefault: Boolean(raw.isDefault),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

export interface SanitizedProfileFormResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: Partial<UserProfile>;
}

export function validateAndSanitizeProfileForm(raw: {
  name: unknown;
  phone?: unknown;
  email?: unknown;
  companyName?: unknown;
  gstin?: unknown;
  isEmailVerified?: boolean;
}): SanitizedProfileFormResult {
  const errors: Record<string, string> = {};

  // 1. Name
  const nameRes = validateName(raw.name, 'Full Name');
  if (!nameRes.isValid) errors.name = nameRes.error!;

  // 2. Phone (if provided)
  let phoneSanitized = '';
  if (raw.phone !== undefined) {
    const phoneRes = validatePhone(raw.phone, 'Phone Number');
    if (!phoneRes.isValid) errors.phone = phoneRes.error!;
    phoneSanitized = phoneRes.sanitized;
  }

  // 3. Email (optional)
  let emailSanitized = '';
  if (raw.email !== undefined && String(raw.email).trim() !== '') {
    const emailRes = validateEmail(raw.email, false);
    if (!emailRes.isValid) errors.email = emailRes.error!;
    emailSanitized = emailRes.sanitized;
  }

  // 4. Company Name (optional)
  let companySanitized = '';
  if (raw.companyName !== undefined && String(raw.companyName).trim() !== '') {
    const compRes = validateCompanyName(raw.companyName);
    if (!compRes.isValid) errors.companyName = compRes.error!;
    companySanitized = compRes.sanitized;
  }

  // 5. GSTIN (optional)
  let gstinSanitized = '';
  if (raw.gstin !== undefined && String(raw.gstin).trim() !== '') {
    const gstRes = validateGstinField(raw.gstin);
    if (!gstRes.isValid) errors.gstin = gstRes.error!;
    gstinSanitized = gstRes.sanitized;
  }

  const sanitized: Partial<UserProfile> = {
    name: nameRes.sanitized,
    phone: phoneSanitized || undefined,
    email: emailSanitized,
    companyName: companySanitized,
    gstin: gstinSanitized,
    isEmailVerified: Boolean(raw.isEmailVerified && emailSanitized),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
