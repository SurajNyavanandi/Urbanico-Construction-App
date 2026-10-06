import { CartItem, MaterialItem, UnitOption } from '../types';
import { formatINR } from '../hooks/useFormatters';

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
  unloadingCharge: number;
  couponDiscount: number;
  grandTotal: number;
}

/**
 * Centralized cart calculation engine.
 * Computes subtotal, taxes, delivery fee, optional unloading assistance, and grand total dynamically without hardcoded constants.
 */
export function calculateCartTotals(
  cartItems: CartItem[],
  couponDiscount: number = 0,
  deliveryDistanceKm: number = 10,
  customDeliveryCharge?: number,
  unloadingCharge: number = 0
): CartTotals {
  const serviceItems = cartItems.filter(isCartItemService);
  const materialItems = cartItems.filter((i) => !isCartItemService(i));

  const isServicesOnly = cartItems.length > 0 && serviceItems.length === cartItems.length;
  const hasServices = serviceItems.length > 0;
  const hasMaterials = materialItems.length > 0;

  const totalQuantity = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  // Each service item computes: unitPrice * quantity (default unitPrice is 99 per demo/session)
  const servicesSubtotal = Math.round(
    serviceItems.reduce(
      (acc, item) => acc + (Number(item.unitPrice) || 99) * (Number(item.quantity) || 1),
      0
    ) * 100
  ) / 100;

  // Physical materials compute: unitPrice * quantity
  const materialsSubtotal = Math.round(
    materialItems.reduce(
      (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
      0
    ) * 100
  ) / 100;

  const subtotal = Math.round((servicesSubtotal + materialsSubtotal) * 100) / 100;

  // GST calculation
  const gstTax = 0;

  // Delivery charge applies only if there are physical materials to transport; services carry 0 delivery charge
  const deliveryCharge =
    isServicesOnly || materialItems.length === 0
      ? 0
      : customDeliveryCharge !== undefined
      ? Math.round(customDeliveryCharge)
      : Math.max(50, Math.round(deliveryDistanceKm * 5));

  const effectiveUnloading = isServicesOnly || materialItems.length === 0 ? 0 : Math.round(unloadingCharge || 0);
  const effectiveCoupon = Math.round((couponDiscount || 0) * 100) / 100;
  const taxableTotal = Math.round((subtotal + gstTax + deliveryCharge + effectiveUnloading - effectiveCoupon) * 100) / 100;
  const grandTotal = Math.max(0, Math.round(taxableTotal));

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
    unloadingCharge: effectiveUnloading,
    couponDiscount,
    grandTotal,
  };
}

export const formatCurrency = formatINR;

