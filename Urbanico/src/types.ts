export type ScreenType =
  | 'home'
  | 'category'
  | 'basket'
  | 'favorites'
  | 'profile'
  | 'settings'
  | 'activity'
  | 'auth_mobile'
  | 'auth_otp';

export type CategoryId =
  | 'sand'
  | 'bricks'
  | 'cement'
  | 'stone'
  | 'iron_bars'
  | 'centring'
  | 'services'
  | 'services-catalog'
  | 'mason'
  | 'fabricator'
  | 'painter'
  | 'electrician'
  | 'plumber'
  | 'carpenter';

export interface MaterialCategory {
  id: CategoryId;
  name: string;
  image: string;
  count?: string;
  priceLabel?: string;
  highlighted?: boolean;
}

export interface UnitOption {
  id: string;
  label: string;
  price: number;
  type: 'stepper' | 'radio';
}

export interface MaterialItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  subtitle?: string;
  image: string;
  galleryImages?: string[];
  specs?: { label: string; value: string }[];
  actionType: 'add_to_cart' | 'get_quote';
  defaultPrice?: number;
  options: UnitOption[];
}

export interface CartItem {
  id: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  selectedOptionLabel: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  role: string;
  companyName?: string;
  gstin?: string;
  siteLocation: string;
  avatarUrl: string;
  isVerified: boolean;
  verificationBadgeId?: string;
  creditLimit: number;
  usedCredit: number;
  rewardPoints: number;
  activeOrdersCount: number;
}

export interface ActivityDelivery {
  id: string;
  orderNumber: string;
  materialName: string;
  quantity: string;
  driverName: string;
  vehicleType: string;
  vehicleNumber: string;
  estimatedArrival: string;
  status: 'Placed' | 'Dispatched' | 'En Route' | 'Delivered';
  siteAddress: string;
  timestamp: string;
  totalAmount: number;
}
