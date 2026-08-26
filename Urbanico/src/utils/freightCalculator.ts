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
};

export interface VehicleCapacity {
  type: string;
  name: string;
  maxTons: number;
}

export const VEHICLE_FLEET: Record<string, VehicleCapacity> = {
  pickup: {
    type: 'pickup',
    name: 'Tata Ace / Bolero Pickup (1.5 - 2.5 Tons)',
    maxTons: 2.5,
  },
  single_axle: {
    type: 'single_axle',
    name: '6-Wheeler Tipper / Eicher (6 - 10 Tons)',
    maxTons: 10,
  },
  multi_axle: {
    type: 'multi_axle',
    name: '10-Wheeler Heavy Tipper (16 - 25 Tons)',
    maxTons: 25,
  },
  trailer: {
    type: 'trailer',
    name: 'Heavy 14-Wheeler Trailer (35 - 45 Tons)',
    maxTons: 45,
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
  if (totalTons <= 2.5) return VEHICLE_FLEET.pickup;
  if (totalTons <= 10) return VEHICLE_FLEET.single_axle;
  if (totalTons <= 25) return VEHICLE_FLEET.multi_axle;
  return VEHICLE_FLEET.trailer;
}

export function isServiceablePincode(pincode: string): boolean {
  if (!pincode || pincode.length < 6) return false;
  if (PINCODE_REGISTRY[pincode]) {
    return PINCODE_REGISTRY[pincode].serviceable;
  }
  return pincode.startsWith('500') || pincode.startsWith('501') || pincode.startsWith('502');
}

// Flat ₹5 per kilometer distance delivery charge from Hyderabad center
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
  freightCost: number;
  tollFee: number;
  totalFreight: number;
  areaName: string;
  hubName: string;
} {
  let distance = 10.0;
  let areaName = 'Hyderabad Site Area';

  if (customCoords && customCoords.lat && customCoords.lng) {
    const rawDist = calculateHaversineDistanceKm(
      HYDERABAD_CENTER.lat,
      HYDERABAD_CENTER.lng,
      customCoords.lat,
      customCoords.lng
    );
    distance = Math.max(1, rawDist);
    areaName = `Site GPS (${distance} km from Central Hub)`;
  } else if (pincode && PINCODE_REGISTRY[pincode]) {
    distance = PINCODE_REGISTRY[pincode].distanceKm;
    areaName = PINCODE_REGISTRY[pincode].areaName;
  } else if (pincode && pincode.length >= 6) {
    // Estimate based on pincode offset from 500001
    const offset = Math.abs(parseInt(pincode.slice(3), 10) || 50);
    distance = Math.min(30, Math.max(3, Math.round(offset * 0.35 * 10) / 10));
    areaName = `PIN ${pincode} Area`;
  }

  const ratePerKm = PLATFORM_DELIVERY_RATE_PER_KM; // ₹5 per km
  const deliveryCharge = calculateDistanceDeliveryCharge(distance, ratePerKm);
  const vehicle = recommendVehicle(totalTons);

  return {
    distanceKm: distance,
    ratePerKm,
    deliveryCharge,
    vehicle,
    freightCost: deliveryCharge,
    tollFee: 0,
    totalFreight: deliveryCharge,
    areaName,
    hubName: HYDERABAD_CENTER.name,
  };
}
