import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { sendOtp, verifyOtp, isValidIndianMobile, sanitizePhoneNumber } from '../services/otpService';
import { useAuthSession } from '../hooks/useAuthSession';
import { useUserProfile } from '../hooks/useUserProfile';
import { ToastProvider } from '../context/ToastContext';
import { safeStorage } from '../utils/safeStorage';
import { apiService } from '../services/apiService';
import { UserProfile } from '../types';

describe('Authentication & Profile Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Phone Validation & Sanitization', () => {
    it('sanitizes mobile numbers with prefixes or spaces to 10 digits', () => {
      expect(sanitizePhoneNumber('+91 98765 43210')).toBe('9876543210');
      expect(sanitizePhoneNumber('09876543210')).toBe('9876543210');
      expect(sanitizePhoneNumber('9876543210')).toBe('9876543210');
    });

    it('validates Indian mobile numbers correctly', () => {
      expect(isValidIndianMobile('9876543210')).toBe(true);
      expect(isValidIndianMobile('8123456789')).toBe(true);
      expect(isValidIndianMobile('7012345678')).toBe(true);
      expect(isValidIndianMobile('6301234567')).toBe(true);

      // Invalid cases: starts with < 6, repeated digits, too short
      expect(isValidIndianMobile('5123456789')).toBe(false);
      expect(isValidIndianMobile('1234567890')).toBe(false);
      expect(isValidIndianMobile('9999999999')).toBe(false); // repeated digits
      expect(isValidIndianMobile('98765')).toBe(false);
    });
  });

  describe('OTP Service Flows', () => {
    it('sendOtp rejects invalid phone numbers without making network calls', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const res = await sendOtp('12345');
      expect(res.success).toBe(false);
      expect(res.error).toBe('INVALID_PHONE_NUMBER');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('sendOtp calls backend endpoint with sanitized phone number', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'OTP sent successfully',
          requestId: 'req_otp_abc',
        }),
      } as any);

      const res = await sendOtp('9876543210');
      expect(res.success).toBe(true);
      expect(res.requestId).toBe('req_otp_abc');
    });

    it('verifyOtp accepts valid 6-digit code, caches auth token & session to safeStorage', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            token: 'jwt_verified_user_token',
            user: {
              id: 'usr_123',
              phone: '9876543210',
              role: 'contractor',
              name: 'Vikram Singh',
            },
            message: 'Authenticated successfully',
          },
        }),
      } as any);

      const res = await verifyOtp('9876543210', '123456');

      expect(res.success).toBe(true);
      expect(res.verified).toBe(true);
      expect(res.token).toBe('jwt_verified_user_token');

      // Verify token and session were persisted to storage
      expect(safeStorage.getItem('urbanico_auth_token')).toBe('jwt_verified_user_token');
      const session = JSON.parse(safeStorage.getItem('urbanico_auth_session') || '{}');
      expect(session.name).toBe('Vikram Singh');
    });

    it('verifyOtp rejects empty or invalid length OTP codes before network request', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const emptyRes = await verifyOtp('9876543210', '');
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toBe('EMPTY_OTP');

      const shortRes = await verifyOtp('9876543210', '123');
      expect(shortRes.success).toBe(false);
      expect(shortRes.error).toBe('INVALID_OTP_LENGTH');

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('useAuthSession Hook', () => {
    it('logs in user, saves session, and merges guest location data', () => {
      safeStorage.setItem(
        'urbanico_saved_locations_guest',
        JSON.stringify(['Site A, Gachibowli', 'Site B, Madhapur'])
      );

      const { result } = renderHook(() => useAuthSession());

      expect(result.current.isLoggedIn).toBe(false);

      act(() => {
        result.current.login('9876543210');
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user.phone).toBe('9876543210');

      // Check session was persisted
      const savedSession = JSON.parse(safeStorage.getItem('urbanico_auth_session') || '{}');
      expect(savedSession.isLoggedIn).toBe(true);
      expect(savedSession.phone).toBe('9876543210');

      // Check guest locations were merged
      const mergedUserLocations = JSON.parse(
        safeStorage.getItem('urbanico_saved_locations_9876543210') || '[]'
      );
      expect(mergedUserLocations).toContain('Site A, Gachibowli');
      expect(safeStorage.getItem('urbanico_saved_locations_guest')).toBeNull();
    });

    it('updates user profile in local state and safeStorage', () => {
      const { result } = renderHook(() => useAuthSession());

      act(() => {
        result.current.login('9876543210');
      });

      act(() => {
        result.current.updateUser({
          name: 'Rajesh Sharma',
          companyName: 'Sharma Constructions Ltd',
          gstin: '36AAAAA0000A1Z5',
        });
      });

      expect(result.current.user.name).toBe('Rajesh Sharma');
      expect(result.current.user.companyName).toBe('Sharma Constructions Ltd');

      // Verify cached in profile storage
      const cachedProfile = JSON.parse(
        safeStorage.getItem('urbanico_user_profile_9876543210') || '{}'
      );
      expect(cachedProfile.name).toBe('Rajesh Sharma');
    });

    it('logout resets state, clears session, and invalidates all cached storage keys', () => {
      const cleanupMock = vi.fn();
      const { result } = renderHook(() =>
        useAuthSession({ onLogoutCleanup: cleanupMock })
      );

      act(() => {
        result.current.login('9876543210');
      });
      expect(result.current.isLoggedIn).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(safeStorage.getItem('urbanico_auth_session')).toBeNull();
      expect(safeStorage.getItem('urbanico_auth_token')).toBeNull();
      expect(cleanupMock).toHaveBeenCalled();
    });
  });

  describe('useUserProfile Hook & Profile Editing', () => {
    const mockUser: UserProfile = {
      name: 'Ramesh Gupta',
      phone: '9876543210',
      email: 'ramesh@gupta.com',
      role: 'contractor',
      companyName: 'Gupta Builders',
      gstin: '36AABCU9603R1ZM',
      siteLocation: 'Hyderabad',
      avatarUrl: '',
      isVerified: true,
      activeOrdersCount: 0,
      creditLimit: 500000,
      usedCredit: 0,
      rewardPoints: 250,
    };

    const toastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    it('edits and validates profile information', () => {
      const onUpdateMock = vi.fn();
      const onLogoutMock = vi.fn();

      const { result } = renderHook(
        () =>
          useUserProfile({
            user: mockUser,
            onUpdateUser: onUpdateMock,
            onLogout: onLogoutMock,
          }),
        { wrapper: toastWrapper }
      );

      expect(result.current.formData.name).toBe('Ramesh Gupta');
      expect(result.current.isEditing).toBe(false);

      act(() => {
        result.current.setIsEditing(true);
        result.current.setFormData({
          ...result.current.formData,
          name: 'Ramesh K. Gupta',
          companyName: 'Gupta Infra Pvt Ltd',
        });
      });

      act(() => {
        result.current.handleSaveProfile();
      });

      expect(onUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ramesh K. Gupta',
          companyName: 'Gupta Infra Pvt Ltd',
        })
      );
      expect(result.current.isEditing).toBe(false);
    });

    it('rejects empty name during profile update', () => {
      const onUpdateMock = vi.fn();
      const { result } = renderHook(
        () =>
          useUserProfile({
            user: mockUser,
            onUpdateUser: onUpdateMock,
            onLogout: vi.fn(),
          }),
        { wrapper: toastWrapper }
      );

      act(() => {
        result.current.setIsEditing(true);
        result.current.setFormData({
          ...result.current.formData,
          name: '   ', // whitespace only
        });
      });

      act(() => {
        result.current.handleSaveProfile();
      });

      expect(onUpdateMock).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(true);
    });
  });
});
