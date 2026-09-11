export type ScreenType =
  | 'home'
  | 'shop'
  | 'category'
  | 'basket'
  | 'favorites'
  | 'profile'
  | 'settings'
  | 'activity'
  | 'auth_mobile'
  | 'auth_otp';

export type CategoryId =
  | 'materials'
  | 'tiles'
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
  subcategoriesText?: string;
  tag?: string;
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
  isCodeCompliance?: string;
  labCertificateNo?: string;
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
  siteSupervisorName?: string;
  siteSupervisorPhone?: string;
  siteLocation: string;
  avatarUrl: string;
  isVerified: boolean;
  verificationBadgeId?: string;
  isEmailVerified?: boolean;
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
  driverPhone?: string;
  vehicleType: string;
  vehicleNumber: string;
  estimatedArrival: string;
  status: 'Placed' | 'Dispatched' | 'En Route' | 'Delivered' | 'Cancelled';
  siteAddress: string;
  siteSupervisorName?: string;
  siteSupervisorPhone?: string;
  timestamp: string;
  totalAmount: number;
  deliveryOtp?: string;
  ewayBillNumber?: string;
  weighmentSlipId?: string;
  splitPayment?: {
    advancePaid: number;
    balanceDue: number;
    paymentMode: '100_percent' | '50_split';
  };
  cancelReason?: string;
  cartItemsSnapshot?: CartItem[];
  unloadingCharges?: number;
  laborAssistanceOpted?: boolean;
  laborAssistanceDetails?: string;
  recommendedVehicle?: string;
  gstin?: string;
  businessName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceEmailStatus?: 'sent' | 'pending' | 'failed';
  invoiceEmailedTo?: string;
  invoiceEmailedAt?: string;
}

export interface IndianDeliveryAddress {
  id?: string;
  fullName?: string;
  mobileNumber?: string;
  pincode: string;
  flatBuilding: string;
  areaStreet: string;
  landmark?: string;
  city: string;
  state: string;
  alternatePhone?: string;
  addressType?: 'Site' | 'Home' | 'Office' | 'Warehouse';
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking';
  title: string;
  subtitle: string;
  details?: string;
  isDefault?: boolean;
  isVerified?: boolean;
  verifiedAccountName?: string;
  upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'cred' | 'bhim' | 'custom';
  cardLast4?: string;
  cardExpiry?: string;
  cardHolder?: string;
  cardBrand?: 'visa' | 'mastercard' | 'rupay' | 'card';
  bankName?: string;
}
