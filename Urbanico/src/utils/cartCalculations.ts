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

/**
 * Returns statutory Indian GST rate based on material/service category:
 * - Cement: 28%
 * - Sand, Bricks, AAC Blocks, Aggregates: 5%
 * - TMT Steel, Centring, Hardware, Services & General: 18%
 */
export function getStatutoryGstRateForItem(item: {
  categoryName?: string;
  categoryId?: string;
  itemName?: string;
  name?: string;
}): number {
  if (isCartItemService(item as any)) return 0.18;

  const cat = (item.categoryName || item.categoryId || '').toLowerCase();
  const name = (item.itemName || item.name || '').toLowerCase();

  if (cat === 'cement' || name.includes('cement')) {
    return 0.28;
  }

  if (
    cat === 'sand' ||
    cat === 'bricks' ||
    cat === 'stone' ||
    name.includes('sand') ||
    name.includes('brick') ||
    name.includes('aac block') ||
    name.includes('aggregate') ||
    name.includes('gravel') ||
    name.includes('quarry dust')
  ) {
    return 0.05;
  }

  if (
    cat === 'iron_bars' ||
    cat === 'centring' ||
    name.includes('tmt') ||
    name.includes('steel') ||
    name.includes('rebar') ||
    name.includes('iron')
  ) {
    return 0.18;
  }

  return 0.18;
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
 * Computes subtotal, statutory GST taxes, delivery fee, material unloading assistance, and grand total.
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

  const roundMoney = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

  const totalQuantity = cartItems.reduce((acc, item) => acc + (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1), 0);

  // Each service item computes: roundMoney(unitPrice * quantity)
  const servicesSubtotal = roundMoney(
    serviceItems.reduce(
      (acc, item) => {
        const qty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
        const itemLineTotal = roundMoney((Number(item.unitPrice) || 99) * qty);
        return acc + itemLineTotal;
      },
      0
    )
  );

  // Physical materials compute: roundMoney(unitPrice * quantity) for fractional units and metric tons
  const materialsSubtotal = roundMoney(
    materialItems.reduce(
      (acc, item) => {
        const qty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
        const itemLineTotal = roundMoney((Number(item.unitPrice) || 0) * qty);
        return acc + itemLineTotal;
      },
      0
    )
  );

  const subtotal = roundMoney(servicesSubtotal + materialsSubtotal);

  // Itemized Statutory GST calculation across materials and services
  const gstTax = roundMoney(
    cartItems.reduce((acc, item) => {
      const qty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
      const rate = getStatutoryGstRateForItem(item);
      const lineSubtotal = roundMoney((Number(item.unitPrice) || 0) * qty);
      return acc + roundMoney(lineSubtotal * rate);
    }, 0)
  );

  // Delivery charge applies only if there are physical materials to transport; services carry 0 delivery charge
  const deliveryCharge =
    isServicesOnly || materialItems.length === 0
      ? 0
      : customDeliveryCharge !== undefined
      ? Math.round(customDeliveryCharge)
      : Math.max(50, Math.round(deliveryDistanceKm * 5));

  // Unloading assistance applies strictly to physical heavy materials, isolated from contractor services
  const effectiveUnloading = isServicesOnly || materialItems.length === 0 ? 0 : roundMoney(unloadingCharge || 0);
  const effectiveCoupon = roundMoney(couponDiscount || 0);
  const taxableTotal = roundMoney(subtotal + gstTax + deliveryCharge + effectiveUnloading - effectiveCoupon);
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
