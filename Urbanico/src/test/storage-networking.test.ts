import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { safeStorage } from '../utils/safeStorage';
import { apiService, ApiError } from '../services/apiService';

describe('Storage & Networking Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('SafeStorage Fallbacks & Debouncing', () => {
    it('stores and retrieves items directly using localStorage', () => {
      safeStorage.setItem('test_key_1', 'urbanico_value_1');
      expect(safeStorage.getItem('test_key_1')).toBe('urbanico_value_1');
      expect(localStorage.getItem('test_key_1')).toBe('urbanico_value_1');

      safeStorage.removeItem('test_key_1');
      expect(safeStorage.getItem('test_key_1')).toBeNull();
    });

    it('falls back gracefully to memory map if localStorage throws or is restricted', () => {
      const originalGetItem = localStorage.getItem;
      const originalSetItem = localStorage.setItem;

      // Simulate restricted storage environment (e.g. strict private mode or iframe security policy)
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure.');
      });
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      safeStorage.setItem('restricted_key', 'safe_memory_value');
      expect(safeStorage.getItem('restricted_key')).toBe('safe_memory_value');

      safeStorage.removeItem('restricted_key');
      expect(safeStorage.getItem('restricted_key')).toBeNull();

      localStorage.getItem = originalGetItem;
      localStorage.setItem = originalSetItem;
    });

    it('setDebouncedItem writes immediately to memory cache and flushes to disk upon flushDebounced', () => {
      safeStorage.setDebouncedItem('debounced_key', 'val_fast_1', 1000);

      // Read immediately returns debounced value without waiting for timer
      expect(safeStorage.getItem('debounced_key')).toBe('val_fast_1');
      expect(localStorage.getItem('debounced_key')).toBeNull();

      // Explicit flush commits value to persistent store immediately
      safeStorage.flushDebounced('debounced_key');
      expect(localStorage.getItem('debounced_key')).toBe('val_fast_1');
    });
  });

  describe('Networking: Candidate Failover & Retry Logic for 5xx', () => {
    it('attempts secondary candidate URLs if first candidate returns 500 error', async () => {
      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        callCount++;
        if (callCount === 1) {
          // First candidate endpoint fails with 500
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Database gateway timeout',
          } as any;
        }
        // Second candidate endpoint succeeds
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { status: 'healthy', version: '1.0.0' },
          }),
        } as any;
      });

      const res = await apiService.getHealth();
      expect(callCount).toBeGreaterThan(1);
      expect(res).toBeDefined();
    });
  });

  describe('Networking: Immediate Halts on 401 Unauthorized and 429 Rate Limit', () => {
    it('halts candidate failover immediately on 401 Unauthorized and fires auth-expired notification', async () => {
      let authExpiredFired = false;
      const unsubscribe = apiService.onAuthExpired(() => {
        authExpiredFired = true;
      });

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { message: 'JWT token expired', code: 'UNAUTHORIZED' },
          }),
        } as any;
      });

      // Direct request should throw ApiError with 401 status
      await expect((apiService as any).request('/api/users/profile')).rejects.toThrow(ApiError);

      // Must not flood candidate URLs when credentials are fundamentally unauthorized
      expect(callCount).toBe(1);
      expect(authExpiredFired).toBe(true);

      unsubscribe();
    });

    it('halts candidate failover on 429 Too Many Requests, parses Retry-After header, and notifies listeners', async () => {
      let rateLimitedInfo: any = null;
      const unsubscribe = apiService.onRateLimited((info) => {
        rateLimitedInfo = info;
      });

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '45' }),
          json: async () => ({
            success: false,
            error: { message: 'Too many requests' },
            retryAfterSeconds: 45,
          }),
        } as any;
      });

      // Direct request should throw ApiError with 429 status and retryAfter
      await expect((apiService as any).request('/api/materials')).rejects.toThrow(ApiError);

      // Must stop candidate looping to prevent secondary candidate flooding
      expect(callCount).toBe(1);
      expect(rateLimitedInfo).toBeDefined();
      expect(rateLimitedInfo.retryAfter).toBe(45);

      unsubscribe();
    });
  });

  describe('Networking: Automatic Idempotency-Key Injection', () => {
    it('automatically generates and injects Idempotency-Key on mutation requests (POST)', async () => {
      let capturedHeaders: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, options: any) => {
        capturedHeaders = options?.headers;
        return {
          ok: true,
          json: async () => ({ success: true, data: {} }),
        } as any;
      });

      await apiService.updateUserProfile('9876543210', { name: 'Ananya Rao' });

      expect(capturedHeaders).toBeDefined();
      expect(capturedHeaders['Idempotency-Key']).toBeDefined();
      expect(capturedHeaders['Idempotency-Key']).toMatch(/^(idemp_|[\da-f-]+)/i);
    });

    it('does NOT inject Idempotency-Key on standard GET requests', async () => {
      let capturedHeaders: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, options: any) => {
        capturedHeaders = options?.headers;
        return {
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as any;
      });

      await apiService.getMaterials();

      expect(capturedHeaders).toBeDefined();
      expect(capturedHeaders['Idempotency-Key']).toBeUndefined();
    });
  });
});
