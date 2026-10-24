/**
 * Centralized Application Constants
 * Standardized roles, statuses, and system configurations.
 */

export const USER_ROLES = ['contractor', 'engineer', 'supervisor', 'client', 'admin', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  'received',
  'confirmed',
  'processing',
  'dispatched',
  'in_transit',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
  'paid',
  'failed',
  'refunded',
  'credit',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_STATUSES = [
  'loading',
  'dispatched',
  'in_transit',
  'reached_site',
  'unloading',
  'delivered',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const QUOTE_STATUSES = ['pending', 'bidding', 'accepted', 'rejected', 'closed'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const DEFAULT_AVATAR_URL =
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;
