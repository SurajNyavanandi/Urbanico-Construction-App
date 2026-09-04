/**
 * Urbanico Core API Service
 * Centralized, production-ready backend communication layer.
 * Communicates directly with /api endpoints for realtime orders, materials, deliveries, and user profiles.
 */

import { ActivityDelivery, UserProfile, MaterialItem } from '../types';
import { Platform, NativeModules } from 'react-native';
import { safeStorage } from '../utils/safeStorage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

export function getBaseApiUrls(): string[] {
  const urls: string[] = [];

  // 1. Explicit env variable (EXPO_PUBLIC_API_URL or VITE_API_URL)
  const envUrl =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL)) ||
    '';
  if (envUrl && envUrl.trim()) {
    urls.push(envUrl.trim().replace(/\/+$/, ''));
  }

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isLocalhost =
    isWeb &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.endsWith('.local'));

  // 2. Web runtime: relative /api or LAN host port 3000
  if (isWeb) {
    if (
      window.location.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      (window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.') ||
        window.location.hostname.endsWith('.local'))
    ) {
      urls.push(`http://${window.location.hostname}:3000/api`);
      urls.push(`http://${window.location.hostname}:3000`);
    }
    urls.push('/api');
    urls.push('');
  }

  // 3. Mobile device running on Expo Go -> Metro Host IP (e.g. http://192.168.1.245:3000)
  if (Platform.OS !== 'web') {
    try {
      const scriptURL = (NativeModules as any)?.SourceCode?.scriptURL;
      if (scriptURL) {
        const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
        if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
          urls.push(`http://${match[1]}:3000/api`);
          urls.push(`http://${match[1]}:3000`);
        }
      }
    } catch {
      // Safe fallback
    }
  }

  // 4. Localhost fallback - strictly ONLY when running on a local development machine
  if (isLocalhost || Platform.OS !== 'web') {
    urls.push('http://localhost:3000/api');
    urls.push('http://localhost:3000');
  }

  // 5. Remote Render backend fallback (only if explicitly set or testing on render)
  if (envUrl && envUrl.includes('onrender.com')) {
    urls.push('https://urbanico-construction-app.onrender.com/api');
    urls.push('https://urbanico-construction-app.onrender.com');
  }

  return Array.from(new Set(urls.filter(Boolean)));
}

// Minimalistic runtime log for port and API URL verification
if (typeof window !== 'undefined' && window.location) {
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const targetApi = getBaseApiUrls()[0] || '/api';
  console.log(`[Frontend] Port: ${currentPort} | URL: ${window.location.origin} | API: ${targetApi}`);
}

class ApiService {
  private activeBaseUrl: string | null = null;

  /**
   * Safe fetch with JSON parsing and standardized error handling across candidate endpoints
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const candidateBases = this.activeBaseUrl ? [this.activeBaseUrl, ...getBaseApiUrls()] : getBaseApiUrls();

    let lastError: any = null;

    for (const base of candidateBases) {
      const formattedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      const finalUrl = formattedBase.endsWith('/api') && cleanEndpoint.startsWith('/api')
        ? `${formattedBase}${cleanEndpoint.replace(/^\/api/, '')}`
        : `${formattedBase}${cleanEndpoint}`;

      try {
        const response = await fetch(finalUrl, {
          ...options,
          headers,
        });

        if (response.ok) {
          this.activeBaseUrl = formattedBase;
          const data = await response.json().catch(() => ({ success: true }));
          return data;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Network request failed for ${endpoint}`);
  }

  // ==================== MATERIALS ====================

  /**
   * Fetch live materials catalogue from the backend
   */
  public async getMaterials(params: { category?: string; search?: string } = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);

      const qs = queryParams.toString();
      const res = await this.request<{ success: boolean; materials: any[] }>(`/api/materials${qs ? `?${qs}` : ''}`);
      if (res && res.success && Array.isArray(res.materials)) {
        return res.materials;
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  // ==================== ORDERS ====================

  // Local persistence helpers for seamless offline / static Vercel runtime
  private saveLocalOrder(order: any): void {
    try {
      const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
      const key = cleanPhone ? `urbanico_user_orders_${cleanPhone}` : 'urbanico_orders';
      const existingRaw = safeStorage.getItem(key) || safeStorage.getItem('urbanico_orders');
      const list: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [order, ...list.filter((o) => o.orderNumber !== order.orderNumber)];
      safeStorage.setItem(key, JSON.stringify(updated));
      safeStorage.setItem('urbanico_orders', JSON.stringify(updated));
    } catch {}
  }

  private getLocalOrders(phone?: string): any[] {
    try {
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      const key = cleanPhone ? `urbanico_user_orders_${cleanPhone}` : 'urbanico_orders';
      const raw = safeStorage.getItem(key) || safeStorage.getItem('urbanico_orders');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Place a real order into the backend database with local persistence fallback
   */
  public async createOrder(orderPayload: {
    orderNumber?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    gstin?: string;
    siteAddress: {
      siteName: string;
      street: string;
      city?: string;
      state?: string;
      pincode: string;
    };
    items: Array<{
      name: string;
      category: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      gstAmount?: number;
    }>;
    subtotal: number;
    taxAmount?: number;
    deliveryCharges?: number;
    unloadingCharges?: number;
    totalAmount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentDetails?: any;
    eWayBillNo?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
  }): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const res = await this.request<{ success: boolean; order: any; error?: string }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      if (res && res.success && res.order) {
        this.saveLocalOrder(res.order);
      }
      return res;
    } catch {
      // Offline / serverless static fallback (e.g. Vercel static deployment)
      const localOrder = {
        ...orderPayload,
        _id: `ord_${Date.now()}`,
        createdAt: new Date().toISOString(),
        orderStatus: 'confirmed',
      };
      this.saveLocalOrder(localOrder);
      return { success: true, order: localOrder };
    }
  }

  /**
   * Fetch all orders from backend with local cache fallback
   */
  public async getOrders(params: { phone?: string; status?: string; search?: string } = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.phone) queryParams.append('phone', params.phone);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const qs = queryParams.toString();
      const res = await this.request<{ success: boolean; orders: any[] }>(`/api/orders${qs ? `?${qs}` : ''}`);
      if (res && res.success && Array.isArray(res.orders)) {
        return res.orders;
      }
    } catch {
      // Backend not running / Vercel static fallback
    }
    return this.getLocalOrders(params.phone);
  }

  /**
   * Get specific order details by orderNumber
   */
  public async getOrderByNumber(orderNumber: string): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; order: any }>(`/api/orders/number/${orderNumber}`);
      if (res && res.success) {
        return res.order;
      }
    } catch {
      // Local fallback
    }
    const local = this.getLocalOrders();
    return local.find((o) => o.orderNumber === orderNumber) || null;
  }

  // ==================== DELIVERIES & GPS TRACKING ====================

  /**
   * Fetch live delivery tracking details for an order
   */
  public async getDeliveryByOrder(orderNumber: string): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; delivery: any }>(`/api/deliveries/${orderNumber}`);
      if (res && res.success) {
        return res.delivery;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch all deliveries from the backend
   */
  public async getAllDeliveries(): Promise<any[]> {
    try {
      const res = await this.request<{ success: boolean; deliveries: any[] }>('/api/deliveries');
      if (res && res.success && Array.isArray(res.deliveries)) {
        return res.deliveries;
      }
      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Verify on-site 6-digit delivery OTP code
   */
  public async verifyDeliveryOtp(orderNumber: string, otp: string): Promise<{ success: boolean; message?: string; delivery?: any }> {
    try {
      const res = await this.request<{ success: boolean; message?: string; delivery?: any }>(`/api/deliveries/${orderNumber}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
      });
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to verify OTP' };
    }
  }

  /**
   * Update real-time GPS location of a delivery truck
   */
  public async updateDeliveryLocation(
    deliveryId: string,
    location: { latitude: number; longitude: number; speedKmH?: number }
  ): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; delivery: any }>(`/api/deliveries/${deliveryId}/location`, {
        method: 'PATCH',
        body: JSON.stringify(location),
      });
      if (res && res.success) {
        return res.delivery;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // ==================== USER PROFILE ====================

  /**
   * Fetch user profile from backend with local storage fallback
   */
  public async getUserProfile(phone: string = '+919876543210'): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; user: any }>(`/api/users/profile?phone=${encodeURIComponent(phone)}`);
      if (res && res.success && res.user) {
        return res.user;
      }
    } catch {
      // Offline / Vercel fallback
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const saved =
      (cleanPhone && safeStorage.getItem(`urbanico_user_profile_${cleanPhone}`)) ||
      safeStorage.getItem('urbanico_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  }

  /**
   * Update user profile on backend
   */
  public async updateUserProfile(idOrPhone: string, userData: Partial<UserProfile> | any): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; user: any }>(`/api/users/profile/${encodeURIComponent(idOrPhone)}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      if (res && res.success) {
        return res.user;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  // ==================== SYSTEM HEALTH ====================

  public async getHealth(): Promise<{ status: string; database?: any }> {
    try {
      return await this.request('/api/health');
    } catch (err) {
      return { status: 'offline' };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
