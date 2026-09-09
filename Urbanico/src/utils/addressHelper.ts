import { IndianDeliveryAddress } from '../types';
import { INDIAN_STATES, ADDRESS_TYPE_OPTIONS } from '../constants';
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

export { INDIAN_STATES, ADDRESS_TYPE_OPTIONS };

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
 * Maps known Telugu geographical and administrative terms to clean English
 */
const TELUGU_TO_ENGLISH_MAP: Record<string, string> = {
  'హైదరాబాద్': 'Hyderabad',
  'తెలంగాణ': 'Telangana',
  'ఆంధ్రప్రదేశ్': 'Andhra Pradesh',
  'మాదాపూర్': 'Madhapur',
  'గచ్చిబౌలి': 'Gachibowli',
  'రాయదుర్గం': 'Raidurgam',
  'కొండాపూర్': 'Kondapur',
  'కూకట్‌పల్లి': 'Kukatpally',
  'మియాపూర్': 'Miyapur',
  'బంజారా హిల్స్': 'Banjara Hills',
  'జూబ్లీ హిల్స్': 'Jubilee Hills',
  'సికింద్రాబాద్': 'Secunderabad',
  'బేగంపేట్': 'Begumpet',
  'భారతదేశం': 'India',
  'మేడ్చల్': 'Medchal',
  'రంగారెడ్డి': 'Ranga Reddy',
  'సైబరాబాద్': 'Cyberabad',
  'హైటెక్ సిటీ': 'HITEC City',
  'షాబాద్': 'Shahbad',
  'సంగారెడ్డి': 'Sangareddy',
  'నిజాంపేట్': 'Nizampet',
  'మణికొండ': 'Manikonda',
  'శేరిలింగంపల్లి': 'Serilingampally',
};

/**
 * Strips and translates Telugu characters to ensure clean, professional English text across all address fields.
 */
export function sanitizeAddressToEnglish(rawText?: string): string {
  if (!rawText) return '';
  let text = String(rawText);

  // Replace known Telugu place names
  for (const [te, en] of Object.entries(TELUGU_TO_ENGLISH_MAP)) {
    text = text.split(te).join(en);
  }

  // Remove any remaining Telugu unicode characters range: \u0C00 - \u0C7F
  text = text.replace(/[\u0C00-\u0C7F]+/g, '');

  // Clean up duplicate commas, spaces, or stray punctuation
  text = text
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s-]+/, '')
    .replace(/[,.\s-]+$/, '')
    .trim();

  return text;
}

/**
 * Normalizes and corrects detected Indian pincodes, fixing common OCR/IP geolocation anomalies.
 * For instance, when geolocation mistakenly returns 800081 (Bihar IP) or swaps 5 with 8,
 * if context is Hyderabad/Telangana or 800081, it resolves directly to 500081.
 */
export function normalizeDetectedPincode(
  rawPincode?: string,
  lat?: number,
  lng?: number,
  cityOrState?: string
): string {
  if (!rawPincode) return '500081';
  let pin = rawPincode.replace(/\D/g, '').slice(0, 6);

  // Specific user bug: 500081 detected as 800081
  if (pin === '800081' || pin.startsWith('800081')) {
    return '500081';
  }

  // If in Greater Hyderabad GPS boundaries (approx 17.0°N to 17.7°N, 78.0°E to 78.8°E)
  const isHyderabadCoords =
    lat !== undefined &&
    lng !== undefined &&
    lat >= 17.0 &&
    lat <= 17.7 &&
    lng >= 78.0 &&
    lng <= 78.8;

  const isTelanganaContext =
    (cityOrState && /hyderabad|telangana|secunderabad|rangareddy/i.test(cityOrState)) ||
    isHyderabadCoords;

  if (isTelanganaContext) {
    // If a pincode starts with 800xxx (like 800081 from an out-of-state ISP IP), fix to 500xxx
    if (pin.startsWith('800')) {
      return `500${pin.slice(3)}`;
    }
    // If non-Telangana pincode was detected while coordinates are in Hyderabad, default to HITEC City
    if (!pin.startsWith('50')) {
      return '500081';
    }
  }

  // If valid 6-digit pin
  if (pin.length === 6) {
    return pin;
  }

  return '500081';
}

/**
 * Formats a rich Indian address object into a single concise string for storage
 */
export function formatIndianAddressSummary(addr: Partial<IndianDeliveryAddress>): string {
  const parts: string[] = [];

  const building = sanitizeAddressToEnglish(sanitizeAddressField(addr.flatBuilding, 120));
  const area = sanitizeAddressToEnglish(sanitizeAddressField(addr.areaStreet, 150));
  const landmark = sanitizeAddressToEnglish(sanitizeAddressField(addr.landmark, 100));
  const city = sanitizeAddressToEnglish(sanitizeName(addr.city, 50));
  const state = sanitizeAddressToEnglish(sanitizeAddressField(addr.state, 50));
  const pin = normalizeDetectedPincode(sanitizePincode(addr.pincode), undefined, undefined, `${city} ${state}`);

  if (building) parts.push(building);
  if (area) parts.push(area);
  if (landmark) parts.push(`Near ${landmark}`);
  if (city) parts.push(city);
  if (state && pin) parts.push(`${state} - ${pin}`);
  else if (pin) parts.push(`PIN ${pin}`);

  return parts.join(', ');
}

