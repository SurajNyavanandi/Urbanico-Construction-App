import { IndianDeliveryAddress } from '../types';
import {
  sanitizeAddressField,
  sanitizePincode,
  sanitizeName,
  validatePincode,
  validateFlatBuilding,
  validateAreaStreet,
  validateCity,
  validateState,
} from './sanitizationHelper';

export const INDIAN_STATES = [
  'Telangana',
  'Andhra Pradesh',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Delhi NCR',
  'Gujarat',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Kerala',
  'Madhya Pradesh',
  'Haryana',
  'Punjab',
  'Bihar',
  'Odisha',
  'Assam',
  'Goa',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Chandigarh',
  'Puducherry',
  'Jammu & Kashmir',
] as const;

export const ADDRESS_TYPE_OPTIONS = [
  { id: 'Site', label: 'Site / Project', icon: 'Building2' },
  { id: 'Home', label: 'Home', icon: 'Home' },
  { id: 'Office', label: 'Office', icon: 'Briefcase' },
  { id: 'Warehouse', label: 'Warehouse / Yard', icon: 'Warehouse' },
] as const;

/**
 * Pincode prefix auto-lookup for Indian major regions
 */
export function lookupCityStateFromPincode(pincode: string): { city?: string; state?: string } {
  const clean = sanitizePincode(pincode).slice(0, 3);
  if (!clean || clean.length < 3) return {};

  const prefixMap: Record<string, { city: string; state: string }> = {
    // Telangana
    '500': { city: 'Hyderabad', state: 'Telangana' },
    '501': { city: 'Ranga Reddy', state: 'Telangana' },
    '502': { city: 'Medak / Sangareddy', state: 'Telangana' },
    '503': { city: 'Nizamabad', state: 'Telangana' },
    '504': { city: 'Adilabad', state: 'Telangana' },
    '505': { city: 'Karimnagar', state: 'Telangana' },
    '506': { city: 'Warangal', state: 'Telangana' },
    '507': { city: 'Khammam', state: 'Telangana' },
    '508': { city: 'Nalgonda', state: 'Telangana' },
    '509': { city: 'Mahabubnagar', state: 'Telangana' },

    // Andhra Pradesh
    '515': { city: 'Anantapur', state: 'Andhra Pradesh' },
    '516': { city: 'Kadapa', state: 'Andhra Pradesh' },
    '517': { city: 'Tirupati / Chittoor', state: 'Andhra Pradesh' },
    '518': { city: 'Kurnool', state: 'Andhra Pradesh' },
    '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
    '521': { city: 'Krishna', state: 'Andhra Pradesh' },
    '522': { city: 'Guntur', state: 'Andhra Pradesh' },
    '524': { city: 'Nellore', state: 'Andhra Pradesh' },
    '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    '533': { city: 'Kakinada / East Godavari', state: 'Andhra Pradesh' },
    '534': { city: 'Eluru / West Godavari', state: 'Andhra Pradesh' },

    // Karnataka
    '560': { city: 'Bengaluru', state: 'Karnataka' },
    '562': { city: 'Bengaluru Rural', state: 'Karnataka' },
    '570': { city: 'Mysuru', state: 'Karnataka' },
    '575': { city: 'Mangaluru', state: 'Karnataka' },
    '580': { city: 'Hubballi-Dharwad', state: 'Karnataka' },

    // Maharashtra
    '400': { city: 'Mumbai', state: 'Maharashtra' },
    '401': { city: 'Thane / Palghar', state: 'Maharashtra' },
    '411': { city: 'Pune', state: 'Maharashtra' },
    '422': { city: 'Nashik', state: 'Maharashtra' },
    '440': { city: 'Nagpur', state: 'Maharashtra' },

    // Delhi NCR & North
    '110': { city: 'New Delhi', state: 'Delhi NCR' },
    '122': { city: 'Gurugram', state: 'Haryana' },
    '201': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh' },
    '160': { city: 'Chandigarh', state: 'Chandigarh' },
    '302': { city: 'Jaipur', state: 'Rajasthan' },
    '380': { city: 'Ahmedabad', state: 'Gujarat' },
    '600': { city: 'Chennai', state: 'Tamil Nadu' },
    '682': { city: 'Kochi', state: 'Kerala' },
    '700': { city: 'Kolkata', state: 'West Bengal' },
  };

  return prefixMap[clean] || {};
}

/**
 * Validate minimal mandatory address fields with complete sanitization
 */
export function validateIndianAddress(addr: Partial<IndianDeliveryAddress>): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: IndianDeliveryAddress;
} {
  const errors: Record<string, string> = {};

  const pinRes = validatePincode(addr.pincode);
  if (!pinRes.isValid) errors.pincode = pinRes.error!;

  const flatRes = validateFlatBuilding(addr.flatBuilding);
  if (!flatRes.isValid) errors.flatBuilding = flatRes.error!;

  const areaRes = validateAreaStreet(addr.areaStreet);
  if (!areaRes.isValid) errors.areaStreet = areaRes.error!;

  const cityRes = validateCity(addr.city);
  if (!cityRes.isValid) errors.city = cityRes.error!;

  const stateRes = validateState(addr.state);
  if (!stateRes.isValid) errors.state = stateRes.error!;

  const landmark = sanitizeAddressField(addr.landmark, 100);
  const fullName = sanitizeName(addr.fullName, 60);
  const mobileNumber = sanitizePincode(addr.mobileNumber).slice(0, 10);
  const alternatePhone = sanitizePincode(addr.alternatePhone).slice(0, 10);
  const deliveryInstructions = sanitizeAddressField(addr.deliveryInstructions, 200);

  const sanitized: IndianDeliveryAddress = {
    id: addr.id,
    pincode: pinRes.sanitized,
    flatBuilding: flatRes.sanitized,
    areaStreet: areaRes.sanitized,
    landmark,
    city: cityRes.sanitized,
    state: stateRes.sanitized,
    fullName: fullName || undefined,
    mobileNumber: mobileNumber || undefined,
    alternatePhone: alternatePhone || undefined,
    addressType: addr.addressType || 'Site',
    deliveryInstructions: deliveryInstructions || undefined,
    isDefault: Boolean(addr.isDefault),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Formats a rich Indian address object into a single concise string for storage
 */
export function formatIndianAddressSummary(addr: Partial<IndianDeliveryAddress>): string {
  const parts: string[] = [];

  const building = sanitizeAddressField(addr.flatBuilding, 120);
  const area = sanitizeAddressField(addr.areaStreet, 150);
  const landmark = sanitizeAddressField(addr.landmark, 100);
  const city = sanitizeName(addr.city, 50);
  const state = sanitizeAddressField(addr.state, 50);
  const pin = sanitizePincode(addr.pincode);

  if (building) parts.push(building);
  if (area) parts.push(area);
  if (landmark) parts.push(`Near ${landmark}`);
  if (city) parts.push(city);
  if (state && pin) parts.push(`${state} - ${pin}`);
  else if (pin) parts.push(`PIN ${pin}`);

  return parts.join(', ');
}

