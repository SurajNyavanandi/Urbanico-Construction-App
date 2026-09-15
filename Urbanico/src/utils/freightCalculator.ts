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
  shortName: string;
  maxTons: number;
  baseFee: number;
  ratePerKm: number;
  unloadingMechanism: string;
  iconKey: 'auto' | 'mini_truck' | 'maxi_truck' | 'tipper_6w' | 'tipper_10w' | 'trailer';
  recommendedFor: string;
}

export const VEHICLE_FLEET: Record<string, VehicleCapacity> = {
  micro_cargo: {
    type: 'micro_cargo',
    name: '3-Wheeler Cargo Auto / Compact Tempo (Up to 250 kg)',
    shortName: 'Cargo Auto (3-Wheeler)',
    maxTons: 0.25,
    baseFee: 49,
    ratePerKm: 3,
    unloadingMechanism: 'Hand Offloading / Tailgate Access',
    iconKey: 'auto',
    recommendedFor: 'Small quantities, retail bags, fittings & tools',
  },
  small_pickup: {
    type: 'small_pickup',
    name: 'Tata Ace / 1.5 Ton Mini Truck (Up to 1.5 Tons)',
    shortName: 'Tata Ace Mini Truck',
    maxTons: 1.5,
    baseFee: 149,
    ratePerKm: 5,
    unloadingMechanism: 'Manual Offloading / Pallet Stacking',
    iconKey: 'mini_truck',
    recommendedFor: 'Cement bags (up to 30), tiles, paints & plumbing supplies',
  },
  medium_pickup: {
    type: 'medium_pickup',
    name: 'Mahindra Bolero Maxi Truck (1.5 - 3.5 Tons)',
    shortName: 'Bolero Maxi Truck',
    maxTons: 3.5,
    baseFee: 349,
    ratePerKm: 8,
    unloadingMechanism: 'Extended Deck Offloading / Forklift Compatible',
    iconKey: 'maxi_truck',
    recommendedFor: 'Structural steel bars, AAC blocks, brick crates & intermediate loads',
  },
  single_axle: {
    type: 'single_axle',
    name: '6-Wheeler Medium Tipper / 407 (3.5 - 10 Tons)',
    shortName: '6-Wheeler Tipper Dumper',
    maxTons: 10,
    baseFee: 699,
    ratePerKm: 12,
    unloadingMechanism: 'Hydraulic Bed Tipping / Direct Chute Discharge',
    iconKey: 'tipper_6w',
    recommendedFor: 'Medium bulk sand, 10mm/20mm gravel & crushed stone for residential sites',
  },
  multi_axle: {
    type: 'multi_axle',
    name: '10-Wheeler Heavy Hydraulic Tipper (10 - 25 Tons)',
    shortName: '10-Wheeler Heavy Tipper',
    maxTons: 25,
    baseFee: 1299,
    ratePerKm: 16,
    unloadingMechanism: 'High-Angle Hydraulic Dumper (Fast Chute Ejection)',
    iconKey: 'tipper_10w',
    recommendedFor: 'Bulk River Sand, Robo Sand, coarse aggregates & large pour concrete jobs',
  },
  trailer: {
    type: 'trailer',
    name: '14-Wheeler Heavy Industrial Trailer (25 - 45 Tons)',
    shortName: '14-Wheeler Trailer',
    maxTons: 45,
    baseFee: 2199,
    ratePerKm: 22,
    unloadingMechanism: 'Crane / Heavy Equipment Rigging Offload',
    iconKey: 'trailer',
    recommendedFor: 'Full commercial infrastructure orders, wholesale steel coils & large project tonnage',
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
  if (totalTons <= 0.25) return VEHICLE_FLEET.micro_cargo;
  if (totalTons <= 1.5) return VEHICLE_FLEET.small_pickup;
  if (totalTons <= 3.5) return VEHICLE_FLEET.medium_pickup;
  if (totalTons <= 10) return VEHICLE_FLEET.single_axle;
  if (totalTons <= 25) return VEHICLE_FLEET.multi_axle;
  return VEHICLE_FLEET.trailer;
}

export interface SmartVehicleRecommendation {
  vehicle: VehicleCapacity;
  badge: string;
  reason: string;
  materialTypeClassification: 'bulk_aggregates' | 'heavy_structural' | 'packaged_bags' | 'lightweight_retail';
  isBulkSandOrGravel: boolean;
  totalWeightTons: number;
  totalWeightKg: number;
  unloadingAssistance: {
    fee: number;
    laborCount: number;
    label: string;
    description: string;
  };
}

/**
 * Smart recommendation engine evaluating BOTH material quantity AND material type.
 * Examples:
 * - Small orders (< 250 kg) -> 3-Wheeler Cargo Auto for narrow streets & low cost
 * - Bulk Sand / Robo Sand / Gravel -> 10-Wheeler or 6-Wheeler Hydraulic Tipper for automated chute dumping
 * - Palletized Cement Bags -> Tata Ace Mini Truck for low-height offloading
 * - Steel Bundles / Bricks -> Bolero Maxi Truck with 9ft extended cargo bed
 */
export function evaluateSmartVehicleRecommendation(
  cartItems: { itemName: string; selectedOptionLabel: string; quantity: number }[],
  totalWeightTons: number
): SmartVehicleRecommendation {
  const totalWeightKg = Math.round(totalWeightTons * 1000);

  let hasSandOrAggregates = false;
  let hasCementBags = false;
  let hasSteelOrBricks = false;
  let totalUnits = 0;

  for (const item of cartItems) {
    const text = `${item.itemName} ${item.selectedOptionLabel}`.toLowerCase();
    totalUnits += item.quantity || 1;
    if (
      text.includes('sand') ||
      text.includes('robo') ||
      text.includes('gravel') ||
      text.includes('aggregate') ||
      text.includes('crusher') ||
      text.includes('stone') ||
      text.includes('grit') ||
      text.includes('ballast')
    ) {
      hasSandOrAggregates = true;
    }
    if (text.includes('cement') || text.includes('putty') || text.includes('bag')) {
      hasCementBags = true;
    }
    if (
      text.includes('steel') ||
      text.includes('tmt') ||
      text.includes('rebar') ||
      text.includes('brick') ||
      text.includes('block')
    ) {
      hasSteelOrBricks = true;
    }
  }

  let chosenVehicle: VehicleCapacity;
  let badge = 'Smart Vehicle Match';
  let reason = '';
  let classification: SmartVehicleRecommendation['materialTypeClassification'] = 'packaged_bags';

  // Rule 1: Bulk Sand & Aggregates
  if (hasSandOrAggregates && totalWeightTons >= 0.5) {
    classification = 'bulk_aggregates';
    if (totalWeightTons >= 8.0) {
      chosenVehicle = VEHICLE_FLEET.multi_axle;
      badge = '10-Wheeler Tipper';
      reason = `Hydraulic tipper for direct site chute dumping (${totalWeightTons} MT).`;
    } else if (totalWeightTons >= 2.5) {
      chosenVehicle = VEHICLE_FLEET.single_axle;
      badge = '6-Wheeler Tipper';
      reason = `Hydraulic tipper for fast unloading and colony access (${totalWeightTons} MT).`;
    } else {
      chosenVehicle = VEHICLE_FLEET.medium_pickup;
      badge = 'Maxi Truck';
      reason = `Covered cargo bed for secure aggregate transport (${totalWeightTons} MT).`;
    }
  }
  // Rule 2: Small Retail / Light Orders
  else if (totalWeightTons <= 0.25 || (totalUnits <= 3 && totalWeightTons <= 0.35)) {
    classification = 'lightweight_retail';
    chosenVehicle = VEHICLE_FLEET.micro_cargo;
    badge = '3-Wheeler Auto';
    reason = `Compact cargo auto for quick local dispatch (${totalWeightKg > 0 ? totalWeightKg : 60} kg).`;
  }
  // Rule 3: Heavy Structural Steel or Masonry Blocks
  else if (hasSteelOrBricks && totalWeightTons > 1.5) {
    classification = 'heavy_structural';
    if (totalWeightTons > 10) {
      chosenVehicle = VEHICLE_FLEET.multi_axle;
      badge = 'Multi-Axle Truck';
      reason = `Multi-axle transport for heavy structural loads (${totalWeightTons} MT).`;
    } else if (totalWeightTons > 3.5) {
      chosenVehicle = VEHICLE_FLEET.single_axle;
      badge = '6-Wheeler Truck';
      reason = `Commercial flatbed for rebar and masonry blocks (${totalWeightTons} MT).`;
    } else {
      chosenVehicle = VEHICLE_FLEET.medium_pickup;
      badge = 'Maxi Truck';
      reason = `Extended deck for steel bundles and masonry (${totalWeightTons} MT).`;
    }
  }
  // Rule 4: Packaged Cement Bags & Medium Batches
  else if (totalWeightTons <= 1.5) {
    classification = 'packaged_bags';
    chosenVehicle = VEHICLE_FLEET.small_pickup;
    badge = 'Mini Truck';
    reason = `Low bed height for easy ground unloading (${totalWeightTons} MT).`;
  } else if (totalWeightTons <= 3.5) {
    classification = 'packaged_bags';
    chosenVehicle = VEHICLE_FLEET.medium_pickup;
    badge = 'Maxi Truck';
    reason = `Stable transport for bagged materials and tiles (${totalWeightTons} MT).`;
  } else if (totalWeightTons <= 10) {
    classification = 'heavy_structural';
    chosenVehicle = VEHICLE_FLEET.single_axle;
    badge = '6-Wheeler Tipper';
    reason = `Commercial tipper for site delivery (${totalWeightTons} MT).`;
  } else if (totalWeightTons <= 25) {
    classification = 'heavy_structural';
    chosenVehicle = VEHICLE_FLEET.multi_axle;
    badge = '10-Wheeler Tipper';
    reason = `Heavy tipper for bulk delivery (${totalWeightTons} MT).`;
  } else {
    classification = 'heavy_structural';
    chosenVehicle = VEHICLE_FLEET.trailer;
    badge = 'Industrial Trailer';
    reason = `Heavy trailer for industrial volume (${totalWeightTons} MT).`;
  }

  // Labor Assistance calculation
  let fee = 0;
  let laborCount = 0;
  let label = 'Self-Unloading / Site Team';
  let description = 'Customer site team will handle manual offloading.';

  if (hasSandOrAggregates && (chosenVehicle.type === 'single_axle' || chosenVehicle.type === 'multi_axle')) {
    fee = 199;
    laborCount = 1;
    label = '1 Chute Spotter';
    description = 'Guides hydraulic dumper chute and levels material pile.';
  } else if (totalWeightTons <= 0.25) {
    fee = 149;
    laborCount = 1;
    label = '1 Delivery Porter';
    description = 'Direct doorstep and ground-floor offloading.';
  } else if (totalWeightTons <= 1.5) {
    fee = 349;
    laborCount = 2;
    label = '2 Site Loaders';
    description = 'Ground-floor offloading and neat stacking.';
  } else if (totalWeightTons <= 5.0) {
    fee = 649;
    laborCount = 3;
    label = '3 Stacking Loaders';
    description = 'Offloading and stacking of heavy materials.';
  } else {
    fee = 999;
    laborCount = 4;
    label = '4-Person Labor Crew';
    description = 'Offloading and organized stacking crew.';
  }

  return {
    vehicle: chosenVehicle,
    badge,
    reason,
    materialTypeClassification: classification,
    isBulkSandOrGravel: hasSandOrAggregates,
    totalWeightTons,
    totalWeightKg,
    unloadingAssistance: {
      fee,
      laborCount,
      label,
      description,
    },
  };
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
  // Multi-trip calculation if order exceeds single vehicle capacity
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
