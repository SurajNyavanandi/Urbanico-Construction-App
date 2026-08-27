import { IndianDeliveryAddress } from '../types';

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
  const pin = pincode.trim().slice(0, 3);
  if (!pin || pin.length < 3) return {};

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

  return prefixMap[pin] || {};
}

/**
 * Validate minimal mandatory address fields
 */
export function validateIndianAddress(addr: Partial<IndianDeliveryAddress>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const cleanPin = (addr.pincode || '').replace(/\D/g, '');
  if (!cleanPin) {
    errors.pincode = '6-digit pincode is required';
  } else if (cleanPin.length !== 6) {
    errors.pincode = 'Pincode must be exactly 6 digits';
  }

  if (!addr.flatBuilding?.trim()) {
    errors.flatBuilding = 'Flat / House / Building / Plot name is required';
  }

  if (!addr.areaStreet?.trim()) {
    errors.areaStreet = 'Area, Street or Village is required';
  }

  if (!addr.city?.trim()) {
    errors.city = 'Town / City is required';
  }

  if (!addr.state?.trim()) {
    errors.state = 'State is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Formats a rich Indian address object into a single concise string for storage
 */
export function formatIndianAddressSummary(addr: IndianDeliveryAddress): string {
  const parts: string[] = [];

  const building = addr.flatBuilding?.trim();
  const area = addr.areaStreet?.trim();
  const landmark = addr.landmark?.trim();
  const city = addr.city?.trim();
  const state = addr.state?.trim();
  const pin = addr.pincode?.trim();

  if (building) parts.push(building);
  if (area) parts.push(area);
  if (landmark) parts.push(`Near ${landmark}`);
  if (city) parts.push(city);
  if (state && pin) parts.push(`${state} - ${pin}`);
  else if (pin) parts.push(`PIN ${pin}`);

  return parts.join(', ');
}
