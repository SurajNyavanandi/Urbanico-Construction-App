/**
 * Freight and transport calculator for construction materials.
 * Configured with a central Hyderabad dispatch reference hub and flat ₹5 per km distance delivery charge.
 */

export interface PincodeDistanceInfo {
  pincode: string;
  areaName: string;
  distanceKm: number;
  tollFee: number;
  serviceable: boolean;
}

// Hyderabad Central Reference Hub (Abids / Nampally / Central Metro)
export const HYDERABAD_CENTER = {
  name: 'Hyderabad Central Hub (Abids)',
  lat: 17.3924,
  lng: 78.4738,
};

// Distance lookup measured from Hyderabad Central Hub (in km)
export const PINCODE_REGISTRY: Record<string, PincodeDistanceInfo> = {
  '500001': { pincode: '500001', areaName: 'Abids / Koti / Central', distanceKm: 2.0, tollFee: 0, serviceable: true },
  '500004': { pincode: '500004', areaName: 'Nampally / Asif Nagar', distanceKm: 2.5, tollFee: 0, serviceable: true },
  '500003': { pincode: '500003', areaName: 'Secunderabad / Paradise', distanceKm: 7.8, tollFee: 0, serviceable: true },
  '500034': { pincode: '500034', areaName: 'Banjara Hills / Punjagutta', distanceKm: 6.5, tollFee: 0, serviceable: true },
  '500033': { pincode: '500033', areaName: 'Jubilee Hills / Film Nagar', distanceKm: 9.8, tollFee: 0, serviceable: true },
  '500081': { pincode: '500081', areaName: 'HITEC City / Madhapur', distanceKm: 14.0, tollFee: 0, serviceable: true },
  '500032': { pincode: '500032', areaName: 'Gachibowli / Financial District', distanceKm: 16.0, tollFee: 0, serviceable: true },
  '500084': { pincode: '500084', areaName: 'Kondapur / Hafeezpet', distanceKm: 15.0, tollFee: 0, serviceable: true },
  '500072': { pincode: '500072', areaName: 'Kukatpally / KPHB Colony', distanceKm: 13.0, tollFee: 0, serviceable: true },
  '500049': { pincode: '500049', areaName: 'Miyapur / Chandanagar', distanceKm: 18.0, tollFee: 0, serviceable: true },
  '500090': { pincode: '500090', areaName: 'Nizampet / Pragathi Nagar', distanceKm: 16.5, tollFee: 0, serviceable: true },
  '500018': { pincode: '500018', areaName: 'Sanath Nagar / Erragadda', distanceKm: 9.5, tollFee: 0, serviceable: true },
  '501301': { pincode: '501301', areaName: 'Ghatkesar / ORR East Exit', distanceKm: 28.0, tollFee: 40, serviceable: true },
  '501505': { pincode: '501505', areaName: 'Shamshabad / Airport Zone', distanceKm: 24.0, tollFee: 50, serviceable: true },
  '502032': { pincode: '502032', areaName: 'Patancheru / Industrial Corridor', distanceKm: 32.0, tollFee: 40, serviceable: true },
  '509216': { pincode: '509216', areaName: 'Shadnagar / Industrial South Hub', distanceKm: 48.0, tollFee: 80, serviceable: true },
};

export interface VehicleCapacity {
  type: string;
  name: string;
  maxTons: number;
  baseFee: number;
  ratePerKm: number;
}

export const VEHICLE_FLEET: Record<string, VehicleCapacity> = {
  micro_cargo: {
    type: 'micro_cargo',
    name: 'Compact Delivery Van / Cargo Tempo (Up to 150 kg)',
    maxTons: 0.15,
    baseFee: 49,
    ratePerKm: 3,
  },
  small_pickup: {
    type: 'small_pickup',
    name: 'Tata Ace / 3-Wheeler Cargo (Up to 1.5 Tons)',
    maxTons: 1.5,
    baseFee: 149,
    ratePerKm: 5,
  },
  medium_pickup: {
    type: 'medium_pickup',
    name: 'Mahindra Bolero Maxi Truck (1.5 - 3.5 Tons)',
    maxTons: 3.5,
    baseFee: 349,
    ratePerKm: 8,
  },
  single_axle: {
    type: 'single_axle',
    name: '6-Wheeler Medium Tipper / 407 (3.5 - 10 Tons)',
    maxTons: 10,
    baseFee: 699,
    ratePerKm: 12,
  },
  multi_axle: {
    type: 'multi_axle',
    name: '10-Wheeler Heavy Tipper (10 - 25 Tons)',
    maxTons: 25,
    baseFee: 1299,
    ratePerKm: 16,
  },
  trailer: {
    type: 'trailer',
    name: '14-Wheeler Heavy Industrial Trailer (25 - 45 Tons)',
    maxTons: 45,
    baseFee: 2199,
    ratePerKm: 22,
  },
};

/**
 * Calculate straight-line Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimate material weight in metric tons from cart items
 */
export function estimateTotalWeightTons(cartItems: { itemName: string; selectedOptionLabel: string; quantity: number }[]): number {
  let totalTons = 0;

  for (const item of cartItems) {
    const text = `${item.itemName} ${item.selectedOptionLabel}`.toLowerCase();
    const qty = item.quantity;

    if (text.includes('bag') || text.includes('50kg')) {
      totalTons += qty * 0.05;
    } else if (text.includes('ton')) {
      const tonMatch = text.match(/([0-9.]+)\s*ton/);
      if (tonMatch) {
        totalTons += parseFloat(tonMatch[1]) * qty;
      } else {
        totalTons += qty * 1.0;
      }
    } else if (text.includes('brass')) {
      totalTons += qty * 4.5;
    } else if (text.includes('cft') || text.includes('cu.ft')) {
      totalTons += qty * 0.045;
    } else if (text.includes('brick') || text.includes('block')) {
      if (text.includes('1000') || text.includes('k')) {
        totalTons += qty * 3.2;
      } else if (text.includes('500')) {
        totalTons += qty * 1.6;
      } else {
        totalTons += qty * 0.0032;
      }
    } else {
      totalTons += qty * 0.05;
    }
  }

  return Math.round(totalTons * 100) / 100;
}

export function recommendVehicle(totalTons: number): VehicleCapacity {
  if (totalTons <= 0.15) return VEHICLE_FLEET.micro_cargo;
  if (totalTons <= 1.5) return VEHICLE_FLEET.small_pickup;
  if (totalTons <= 3.5) return VEHICLE_FLEET.medium_pickup;
  if (totalTons <= 10) return VEHICLE_FLEET.single_axle;
  if (totalTons <= 25) return VEHICLE_FLEET.multi_axle;
  return VEHICLE_FLEET.trailer;
}

export function isServiceablePincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.trim().replace(/\D/g, '');
  return clean.length === 6;
}

// Platform delivery rate per kilometer
export const PLATFORM_DELIVERY_RATE_PER_KM = 5;

export function calculateDistanceDeliveryCharge(
  distanceKm: number,
  ratePerKm: number = PLATFORM_DELIVERY_RATE_PER_KM
): number {
  const effectiveDistance = Math.max(1, distanceKm);
  return Math.round(effectiveDistance * ratePerKm);
}

export function calculateDynamicFreight(
  pincode: string,
  totalTons: number = 0,
  customCoords?: { lat: number; lng: number }
): {
  distanceKm: number;
  ratePerKm: number;
  deliveryCharge: number;
  vehicle: VehicleCapacity;
  tripsCount: number;
  freightCost: number;
  tollFee: number;
  totalFreight: number;
  areaName: string;
  hubName: string;
} {
  let distance = 10.0;
  let areaName = 'Local Site Delivery';

  if (customCoords && customCoords.lat && customCoords.lng) {
    const rawDist = calculateHaversineDistanceKm(
      HYDERABAD_CENTER.lat,
      HYDERABAD_CENTER.lng,
      customCoords.lat,
      customCoords.lng
    );
    distance = Math.max(1, rawDist);
    areaName = `Site GPS (${distance} km from Hub)`;
  } else if (pincode && PINCODE_REGISTRY[pincode]) {
    distance = PINCODE_REGISTRY[pincode].distanceKm;
    areaName = PINCODE_REGISTRY[pincode].areaName;
  } else if (pincode && pincode.length >= 6) {
    const offset = Math.abs(parseInt(pincode.slice(3), 10) || 50);
    distance = Math.min(45, Math.max(4, Math.round(offset * 0.35 * 10) / 10));
    areaName = `PIN ${pincode} Delivery Zone`;
  }

  const vehicle = recommendVehicle(totalTons);
  const ratePerKm = vehicle.ratePerKm;
  // Multi-trip calculation if order exceeds single vehicle payload
  const tripsCount = totalTons > 0 ? Math.max(1, Math.ceil(totalTons / vehicle.maxTons)) : 1;
  const singleTripCharge = vehicle.baseFee + Math.round(distance * ratePerKm);
  const deliveryCharge = Math.max(49, singleTripCharge * tripsCount);

  return {
    distanceKm: distance,
    ratePerKm,
    deliveryCharge,
    vehicle,
    tripsCount,
    freightCost: deliveryCharge,
    tollFee: 0,
    totalFreight: deliveryCharge,
    areaName,
    hubName: HYDERABAD_CENTER.name,
  };
}
