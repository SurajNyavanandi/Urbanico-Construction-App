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

export const CATEGORIES: MaterialCategory[] = [];
export const SERVICES_CATEGORY: MaterialCategory = {
  id: 'services-catalog',
  name: 'Contractors & Services',
  image: '',
  count: '0 Services',
  priceLabel: '',
  subcategoriesText: 'Services',
  tag: 'SERVICES'
};
export const ALL_CATEGORIES_WITH_SERVICES: MaterialCategory[] = [];
export const SERVICES: ServiceItem[] = [];
export const MATERIAL_ITEMS: MaterialItem[] = [];
export const INITIAL_USER: UserProfile = {
  name: '',
  phone: '',
  email: '',
  role: 'customer',
  siteLocation: '',
  avatarUrl: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
  isVerified: false,
  creditLimit: 0,
  usedCredit: 0,
  rewardPoints: 0,
  activeOrdersCount: 0
};
export const INITIAL_DELIVERIES: ActivityDelivery[] = [];
export const SAVED_LOCATIONS: string[] = [];
