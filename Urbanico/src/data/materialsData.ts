import masterCatalog from '../../../Backend/data/urbanico_master_catalog.json';
import { MaterialCategory, MaterialItem, UserProfile, ActivityDelivery } from '../types';

export interface ServiceItem {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  rate: string;
  description: string;
  tag?: string;
}

export const CATEGORIES: MaterialCategory[] = (masterCatalog.categories || []).map((c: any) => ({
  id: c.id,
  name: c.name,
  image: c.image,
  count: c.count,
  priceLabel: c.priceLabel,
  subcategoriesText: c.subcategoriesText,
  tag: c.tag,
}));

export const SERVICES_CATEGORY: MaterialCategory = {
  id: 'services',
  name: 'Services',
  image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533919/mason_ipgxhc.jpg',
  count: '6 Skilled Trades',
  priceLabel: 'Demo @ ₹99',
  subcategoriesText: 'Mason, Painter, Fabricator, Electrician, Plumber, Carpenter',
  tag: 'SERVICES'
};

export const ALL_CATEGORIES_WITH_SERVICES: MaterialCategory[] = CATEGORIES;
export const SERVICES: ServiceItem[] = (masterCatalog.services || []) as ServiceItem[];
export const MATERIAL_ITEMS: MaterialItem[] = (masterCatalog.materials || []) as unknown as MaterialItem[];
export const BUNDLES: any[] = masterCatalog.bundles || [];

export const INITIAL_USER: UserProfile = {
  name: 'Valued Client',
  phone: '+919876543210',
  email: 'client@urbanico.in',
  role: 'customer',
  siteLocation: 'Hyderabad Hub',
  avatarUrl: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
  isVerified: true,
  creditLimit: 500000,
  usedCredit: 0,
  rewardPoints: 1250,
  activeOrdersCount: 0
};
export const INITIAL_DELIVERIES: ActivityDelivery[] = [];
export const SAVED_LOCATIONS: string[] = ['Site 1 - Jubilee Hills', 'Site 2 - Gachibowli'];
