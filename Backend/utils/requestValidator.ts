import { sanitizePhone, sanitizeGstin } from './sanitizer';

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized?: T;
}

/**
 * Validates and sanitizes order creation payload
 */
export function validateOrderPayload(body: any): ValidationResult {
  const errors: Record<string, string> = {};
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: { body: 'Request body must be a JSON object' },
    };
  }

  // 1. Customer Phone (Required, valid Indian mobile number)
  const rawPhone = body.customerPhone || body.phone;
  const cleanPhone = sanitizePhone(rawPhone);
  if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.customerPhone = 'Valid 10-digit customer mobile number starting with 6-9 is required';
  }

  // 2. Customer Name (Required, at least 2 chars)
  const rawName = String(body.customerName || body.name || '').trim();
  if (!rawName || rawName.length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters long';
  }

  // 3. Items (Required, non-empty array)
  const items = body.items || body.cartItems || body.cart;
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'Order must contain at least one item';
  } else {
    items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors[`items[${idx}]`] = 'Item must be a valid object';
        return;
      }
      const itemName = String(item.name || item.title || '').trim();
      if (!itemName) {
        errors[`items[${idx}].name`] = 'Item name is required';
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty < 1) {
        errors[`items[${idx}].quantity`] = 'Item quantity must be a positive number (minimum 1)';
      }
      const price = Number(item.unitPrice ?? item.price);
      if (isNaN(price) || price < 0) {
        errors[`items[${idx}].unitPrice`] = 'Item unit price must be a valid non-negative number';
      }
    });
  }

  // 4. Site Address (Required street and 6-digit pincode)
  const siteAddress = body.siteAddress;
  if (!siteAddress || typeof siteAddress !== 'object') {
    errors.siteAddress = 'Site delivery address is required';
  } else {
    const street = String(siteAddress.street || siteAddress.address || '').trim();
    if (!street || street.length < 3) {
      errors['siteAddress.street'] = 'Site delivery street address is required';
    }
    const pincode = String(siteAddress.pincode || '').replace(/\D/g, '');
    if (!pincode || pincode.length !== 6) {
      errors['siteAddress.pincode'] = 'Valid 6-digit delivery pincode is required';
    }
  }

  // 5. GSTIN (Optional, but if provided must match 15-char regex)
  if (body.gstin && String(body.gstin).trim()) {
    const cleanGst = sanitizeGstin(body.gstin);
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      errors.gstin = 'Invalid 15-digit GSTIN tax identifier';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates and sanitizes catalog material payload
 */
export function validateMaterialPayload(body: any): ValidationResult {
  const errors: Record<string, string> = {};
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: { body: 'Invalid payload' } };
  }

  const name = String(body.name || '').trim();
  if (!name || name.length < 2) {
    errors.name = 'Material name is required (minimum 2 characters)';
  }

  const price = Number(body.defaultPrice ?? body.basePrice);
  if (isNaN(price) || price < 0) {
    errors.defaultPrice = 'Price must be a valid non-negative number';
  }

  if (body.stockQuantity !== undefined) {
    const stock = Number(body.stockQuantity);
    if (isNaN(stock) || stock < 0) {
      errors.stockQuantity = 'Stock quantity cannot be negative';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates and sanitizes trade service payload
 */
export function validateServicePayload(body: any): ValidationResult {
  const errors: Record<string, string> = {};
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: { body: 'Invalid payload' } };
  }

  const name = String(body.name || '').trim();
  if (!name || name.length < 2) {
    errors.name = 'Service name is required (minimum 2 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
