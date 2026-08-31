/**
 * Urbanico Core API Service
 * Centralized, production-ready backend communication layer.
 * Communicates directly with /api endpoints for realtime orders, materials, deliveries, and user profiles.
 */

import { ActivityDelivery, UserProfile, MaterialItem } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL)) ||
  (typeof window !== 'undefined' ? '' : 'http://localhost:3000');

class ApiService {
  /**
   * Safe fetch with JSON parsing and standardized error handling
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({ success: response.ok }));
      return data;
    } catch (err: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err?.message || err);
      throw err;
    }
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

  /**
   * Place a real order into the backend database
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
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to connect to backend order service' };
    }
  }

  /**
   * Fetch all orders from the backend database (optionally filtered by phone/status)
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
      return [];
    } catch (err) {
      return [];
    }
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
      return null;
    } catch (err) {
      return null;
    }
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
   * Fetch user profile from backend
   */
  public async getUserProfile(phone: string = '+919666635009'): Promise<any | null> {
    try {
      const res = await this.request<{ success: boolean; user: any }>(`/api/users/profile?phone=${encodeURIComponent(phone)}`);
      if (res && res.success) {
        return res.user;
      }
      return null;
    } catch (err) {
      return null;
    }
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
