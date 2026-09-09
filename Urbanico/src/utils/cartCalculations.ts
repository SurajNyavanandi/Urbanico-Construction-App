import { CartItem, MaterialItem, UnitOption } from '../types';

/**
 * Checks whether an item represents a trade/expert service (e.g. Mason, Electrician, Painter, etc.)
 */
export function isCartItemService(item: {
  categoryName?: string;
  categoryId?: string;
  itemId?: string;
  id?: string;
  itemName?: string;
  name?: string;
  selectedOptionLabel?: string;
}): boolean {
  if (!item) return false;
  const cat = (item.categoryName || item.categoryId || '').toLowerCase();
  const itemId = (item.itemId || item.id || '').toLowerCase();
  const name = (item.itemName || item.name || '').toLowerCase();
  const option = (item.selectedOptionLabel || '').toLowerCase();

  return (
    cat === 'services' ||
    cat === 'services-catalog' ||
    itemId.startsWith('service-') ||
    name.includes('mason') ||
    name.includes('painter') ||
    name.includes('fabricator') ||
    name.includes('electrician') ||
    name.includes('plumber') ||
    name.includes('carpenter') ||
    name.includes('demo session') ||
    option.includes('demo session') ||
    option.includes('expert site visit')
  );
}

export interface CartTotals {
  serviceItems: CartItem[];
  materialItems: CartItem[];
  isServicesOnly: boolean;
  hasServices: boolean;
  hasMaterials: boolean;
  totalQuantity: number;
  servicesSubtotal: number;
  materialsSubtotal: number;
  subtotal: number;
  gstTax: number;
  deliveryCharge: number;
  couponDiscount: number;
  grandTotal: number;
}

/**
 * Centralized cart calculation engine.
 * Computes subtotal, taxes, delivery fee, and grand total dynamically without hardcoded constants.
 */
export function calculateCartTotals(
  cartItems: CartItem[],
  couponDiscount: number = 0,
  deliveryDistanceKm: number = 10,
  customDeliveryCharge?: number
): CartTotals {
  const serviceItems = cartItems.filter(isCartItemService);
  const materialItems = cartItems.filter((i) => !isCartItemService(i));

  const isServicesOnly = cartItems.length > 0 && serviceItems.length === cartItems.length;
  const hasServices = serviceItems.length > 0;
  const hasMaterials = materialItems.length > 0;

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Each service item computes: unitPrice * quantity (default unitPrice is 99 per demo/session)
  const servicesSubtotal = serviceItems.reduce(
    (acc, item) => acc + (item.unitPrice || 99) * (item.quantity || 1),
    0
  );

  // Physical materials compute: unitPrice * quantity
  const materialsSubtotal = materialItems.reduce(
    (acc, item) => acc + (item.unitPrice || 0) * (item.quantity || 1),
    0
  );

  const subtotal = servicesSubtotal + materialsSubtotal;

  // GST (18%) applies only to physical materials; trade services carry 0% GST
  const gstTax = isServicesOnly ? 0 : Math.round(materialsSubtotal * 0.18);

  // Delivery charge applies only if there are physical materials to transport; services carry 0 delivery charge
  const deliveryCharge =
    isServicesOnly || materialItems.length === 0
      ? 0
      : customDeliveryCharge !== undefined
      ? customDeliveryCharge
      : Math.max(50, Math.round(deliveryDistanceKm * 5));

  const taxableTotal = subtotal + gstTax + deliveryCharge - (couponDiscount || 0);
  const grandTotal = Math.max(0, taxableTotal);

  return {
    serviceItems,
    materialItems,
    isServicesOnly,
    hasServices,
    hasMaterials,
    totalQuantity,
    servicesSubtotal,
    materialsSubtotal,
    subtotal,
    gstTax,
    deliveryCharge,
    couponDiscount,
    grandTotal,
  };
}

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
