import { SavedPaymentMethod } from '../types';
import { safeStorage } from './safeStorage';

const STORAGE_KEY = 'urbanico_saved_payment_methods';

export const DEFAULT_SAVED_PAYMENT_METHODS: SavedPaymentMethod[] = [
  {
    id: 'saved_gpay',
    type: 'upi',
    title: 'Google Pay',
    subtitle: '9876543210@okhdfcbank',
    details: '9876543210@okhdfcbank',
    isDefault: true,
    upiApp: 'gpay',
  },
  {
    id: 'saved_phonepe',
    type: 'upi',
    title: 'PhonePe',
    subtitle: '9876543210@ybl',
    details: '9876543210@ybl',
    isDefault: false,
    upiApp: 'phonepe',
  },
  {
    id: 'saved_visa',
    type: 'card',
    title: 'Visa Debit',
    subtitle: '•••• 2411 • Expires 08/28',
    details: '4111 2222 3333 2411',
    cardLast4: '2411',
    cardExpiry: '08/28',
    isDefault: false,
  },
  {
    id: 'saved_hdfc',
    type: 'netbanking',
    title: 'HDFC Bank',
    subtitle: 'Account ending in •••• 9821',
    details: 'HDFC Bank Corporate NetBanking',
    bankName: 'HDFC Bank',
    isDefault: false,
  },
];

export function getSavedPaymentMethods(userPhone?: string): SavedPaymentMethod[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to defaults
  }

  // Personalize with user's phone if provided
  if (userPhone && userPhone.length >= 10) {
    const cleanPhone = userPhone.replace(/\D/g, '').slice(-10);
    return DEFAULT_SAVED_PAYMENT_METHODS.map((method) => {
      if (method.id === 'saved_gpay') {
        return {
          ...method,
          subtitle: `${cleanPhone}@okhdfcbank`,
          details: `${cleanPhone}@okhdfcbank`,
        };
      }
      if (method.id === 'saved_phonepe') {
        return {
          ...method,
          subtitle: `${cleanPhone}@ybl`,
          details: `${cleanPhone}@ybl`,
        };
      }
      return method;
    });
  }

  return DEFAULT_SAVED_PAYMENT_METHODS;
}

export function savePaymentMethods(methods: SavedPaymentMethod[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
  } catch {
    // ignore
  }
}

export function setDefaultSavedPaymentMethod(id: string): SavedPaymentMethod[] {
  const current = getSavedPaymentMethods();
  const updated = current.map((m) => ({
    ...m,
    isDefault: m.id === id,
  }));
  savePaymentMethods(updated);
  return updated;
}
