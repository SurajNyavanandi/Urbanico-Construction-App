/**
 * Freight and Axle-load transport calculator for heavy construction materials
 */

export interface PincodeDistanceInfo {
  pincode: string;
  areaName: string;
  distanceKm: number;
  tollFee: number;
  nightEntryRestricted: boolean;
  nightEntryHours?: string;
  serviceable: boolean;
}

// Distance lookup from Miyapur Central Yard (Hyderabad)
export const PINCODE_REGISTRY: Record<string, PincodeDistanceInfo> = {
  '500081': { pincode: '500081', areaName: 'HITEC City / Madhapur', distanceKm: 14.5, tollFee: 65, nightEntryRestricted: true, nightEntryHours: '10:00 PM – 07:00 AM', serviceable: true },
  '500032': { pincode: '500032', areaName: 'Gachibowli / Financial District', distanceKm: 16.2, tollFee: 65, nightEntryRestricted: false, serviceable: true },
  '500049': { pincode: '500049', areaName: 'Miyapur / Chandanagar', distanceKm: 4.8, tollFee: 0, nightEntryRestricted: false, serviceable: true },
  '500072': { pincode: '500072', areaName: 'Kukatpally / KPHB Colony', distanceKm: 8.5, tollFee: 0, nightEntryRestricted: true, nightEntryHours: '10:00 PM – 06:30 AM', serviceable: true },
  '500033': { pincode: '500033', areaName: 'Jubilee Hills / Banjara Hills', distanceKm: 18.0, tollFee: 90, nightEntryRestricted: true, nightEntryHours: '11:00 PM – 06:00 AM', serviceable: true },
  '500084': { pincode: '500084', areaName: 'Kondapur / Hafeezpet', distanceKm: 10.1, tollFee: 0, nightEntryRestricted: false, serviceable: true },
  '500090': { pincode: '500090', areaName: 'Nizampet / Pragathi Nagar', distanceKm: 6.7, tollFee: 0, nightEntryRestricted: false, serviceable: true },
  '500018': { pincode: '500018', areaName: 'Sanath Nagar / Erragadda', distanceKm: 15.4, tollFee: 50, nightEntryRestricted: true, nightEntryHours: '10:00 PM – 07:00 AM', serviceable: true },
};

export interface VehicleCapacity {
  type: string;
  name: string;
  maxTons: number;
  baseRatePerKm: number;
  minFreight: number;
  unloadingCharge: number;
}

export const VEHICLE_FLEET: Record<string, VehicleCapacity> = {
  pickup: {
    type: 'pickup',
    name: 'Tata Ace / Bolero Pickup (1.5 - 2.5 Tons)',
    maxTons: 2.5,
    baseRatePerKm: 32,
    minFreight: 650,
    unloadingCharge: 350,
  },
  single_axle: {
    type: 'single_axle',
    name: '6-Wheeler Tipper / Eicher (6 - 10 Tons)',
    maxTons: 10,
    baseRatePerKm: 55,
    minFreight: 1400,
    unloadingCharge: 800,
  },
  multi_axle: {
    type: 'multi_axle',
    name: '10-Wheeler Heavy Tipper (16 - 25 Tons)',
    maxTons: 25,
    baseRatePerKm: 85,
    minFreight: 2200,
    unloadingCharge: 1500,
  },
  trailer: {
    type: 'trailer',
    name: 'Heavy 14-Wheeler Trailer (35 - 45 Tons)',
    maxTons: 45,
    baseRatePerKm: 120,
    minFreight: 3800,
    unloadingCharge: 2500,
  },
};

/**
 * Estimate material weight in metric tons from cart items
 */
export function estimateTotalWeightTons(cartItems: { itemName: string; selectedOptionLabel: string; quantity: number }[]): number {
  let totalTons = 0;

  for (const item of cartItems) {
    const text = `${item.itemName} ${item.selectedOptionLabel}`.toLowerCase();
    const qty = item.quantity;

    if (text.includes('bag') || text.includes('50kg')) {
      // 50 kg cement/lime bag = 0.05 tons
      totalTons += qty * 0.05;
    } else if (text.includes('ton')) {
      // Direct ton mention
      const tonMatch = text.match(/([0-9.]+)\s*ton/);
      if (tonMatch) {
        totalTons += parseFloat(tonMatch[1]) * qty;
      } else {
        totalTons += qty * 1.0;
      }
    } else if (text.includes('brass')) {
      // 1 brass aggregate/sand ≈ 4.5 tons
      totalTons += qty * 4.5;
    } else if (text.includes('cft') || text.includes('cu.ft')) {
      // 100 cft ≈ 4.5 tons (1 cft ≈ 0.045 tons)
      totalTons += qty * 0.045;
    } else if (text.includes('brick') || text.includes('block')) {
      // 1000 bricks ≈ 3.2 tons
      if (text.includes('1000') || text.includes('k')) {
        totalTons += qty * 3.2;
      } else if (text.includes('500')) {
        totalTons += qty * 1.6;
      } else {
        totalTons += qty * 0.0032;
      }
    } else {
      // Default fallback per unit item ≈ 0.05 tons
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
  // If registered explicitly
  if (PINCODE_REGISTRY[pincode]) {
    return PINCODE_REGISTRY[pincode].serviceable;
  }
  // Standard Telangana/Hyderabad pincodes start with 500xxx, 501xxx, 502xxx
  return pincode.startsWith('500') || pincode.startsWith('501') || pincode.startsWith('502');
}

export const PLATFORM_DELIVERY_RATE_PER_KM = 25; // Rs 25 per km distance delivery charge

export function calculateDistanceDeliveryCharge(
  distanceKm: number,
  ratePerKm: number = PLATFORM_DELIVERY_RATE_PER_KM
): number {
  const effectiveDistance = Math.max(1, distanceKm);
  return Math.round(effectiveDistance * ratePerKm);
}

export function calculateDynamicFreight(
  pincode: string,
  totalTons: number
): {
  distanceKm: number;
  ratePerKm: number;
  deliveryCharge: number;
  vehicle: VehicleCapacity;
  freightCost: number;
  tollFee: number;
  unloadingCharge: number;
  totalFreight: number;
  areaName: string;
  nightRestricted: boolean;
  nightHours?: string;
  isOverloaded: boolean;
} {
  const pinInfo = PINCODE_REGISTRY[pincode] || {
    pincode,
    areaName: 'Hyderabad Metro Site Area',
    distanceKm: 12.0,
    tollFee: 0,
    nightEntryRestricted: false,
    serviceable: true,
  };

  const vehicle = recommendVehicle(totalTons);
  const distance = Math.max(3, pinInfo.distanceKm);
  const ratePerKm = PLATFORM_DELIVERY_RATE_PER_KM;
  const deliveryCharge = calculateDistanceDeliveryCharge(distance, ratePerKm);

  // Freight calculation: distance charge based on per-km rate
  const freightCost = deliveryCharge;
  const tollFee = pinInfo.tollFee;
  const unloadingCharge = vehicle.unloadingCharge;

  const totalFreight = deliveryCharge;

  return {
    distanceKm: distance,
    ratePerKm,
    deliveryCharge,
    vehicle,
    freightCost,
    tollFee,
    unloadingCharge,
    totalFreight,
    areaName: pinInfo.areaName,
    nightRestricted: pinInfo.nightEntryRestricted,
    nightHours: pinInfo.nightEntryHours,
    isOverloaded: totalTons > 45,
  };
}
