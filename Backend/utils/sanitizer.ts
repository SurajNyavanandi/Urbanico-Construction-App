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

export function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

export function sanitizeText(input: unknown, maxLength = 255): string {
  const raw = stripHtml(input);
  const withoutControls = stripControlChars(raw);
  return withoutControls.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function sanitizeName(input: unknown, maxLength = 60): string {
  const clean = sanitizeText(input, maxLength);
  const nameCharsOnly = clean.replace(/[^a-zA-Z\s.\-']/g, '');
  return nameCharsOnly.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function sanitizePhone(input: unknown): string {
  if (!input) return '';
  let digits = String(input).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function sanitizeEmail(input: unknown, maxLength = 100): string {
  const clean = sanitizeText(input, maxLength).toLowerCase();
  return clean.replace(/\s+/g, '').slice(0, maxLength);
}

export function sanitizeGstin(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
}

export function sanitizeAddressField(input: unknown, maxLength = 150): string {
  const clean = sanitizeText(input, maxLength);
  const addressSafe = clean.replace(/[^a-zA-Z0-9\s,.\-/#&():;]/g, '');
  return addressSafe.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function validateBackendProfile(data: any): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: any;
} {
  const errors: Record<string, string> = {};
  const sanitized: any = {};

  if (data.name !== undefined) {
    const cleanName = sanitizeName(data.name, 60);
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else {
      sanitized.name = cleanName;
    }
  }

  if (data.phone !== undefined) {
    const cleanPhone = sanitizePhone(data.phone);
    if (cleanPhone && (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone))) {
      errors.phone = 'Valid 10-digit Indian phone number starting with 6-9 is required';
    } else if (cleanPhone) {
      sanitized.phone = `+91${cleanPhone}`;
    }
  }

  if (data.email !== undefined && String(data.email).trim()) {
    const cleanEmail = sanitizeEmail(data.email, 100);
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Invalid email address format';
    } else {
      sanitized.email = cleanEmail;
      sanitized.isEmailVerified = Boolean(data.isEmailVerified);
    }
  } else if (data.email === '') {
    sanitized.email = '';
    sanitized.isEmailVerified = false;
  }

  if (data.companyName !== undefined) {
    sanitized.companyName = sanitizeAddressField(data.companyName, 100);
  }

  if (data.gstin !== undefined && String(data.gstin).trim()) {
    const cleanGst = sanitizeGstin(data.gstin);
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      errors.gstin = 'Invalid 15-digit GSTIN format';
    } else {
      sanitized.gstin = cleanGst;
    }
  } else if (data.gstin === '') {
    sanitized.gstin = '';
  }

  if (data.siteLocation !== undefined) {
    sanitized.siteLocation = sanitizeAddressField(data.siteLocation, 255);
  }

  if (data.billingAddress && typeof data.billingAddress === 'object') {
    sanitized.billingAddress = {
      street: sanitizeAddressField(data.billingAddress.street, 150),
      city: sanitizeName(data.billingAddress.city, 50),
      state: sanitizeAddressField(data.billingAddress.state, 50),
      pincode: sanitizePhone(data.billingAddress.pincode).slice(0, 6),
    };
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
