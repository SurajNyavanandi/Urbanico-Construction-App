import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USER } from '../data/materialsData';
import { safeStorage } from '../utils/safeStorage';
import { apiService } from '../services/apiService';

export interface UseAuthSessionResult {
  user: UserProfile;
  isLoggedIn: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (phoneNum: string) => UserProfile;
  logout: () => void;
  updateUser: (updatedData: Partial<UserProfile>) => void;
}

export function useAuthSession(options?: {
  onLogoutCleanup?: () => void;
}): UseAuthSessionResult {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const phone = parsed.phone || '';
        // Only load profile if user is explicitly authenticated
        if (parsed.isLoggedIn && phone) {
          const savedProfile = safeStorage.getItem(`urbanico_user_profile_${phone}`);
          if (savedProfile) {
            return {
              ...INITIAL_USER,
              ...JSON.parse(savedProfile),
              phone,
              isVerified: true,
            };
          }
          return {
            ...INITIAL_USER,
            phone,
            isVerified: true,
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      ...INITIAL_USER,
      isVerified: false,
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed.isLoggedIn;
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Sync profile with backend API when logged in
  useEffect(() => {
    if (isLoggedIn && user.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        apiService
          .getUserProfile(cleanPhone)
          .then((serverUser) => {
            if (serverUser) {
              setUser((prev) => ({
                ...prev,
                name: serverUser.name || prev.name,
                email: serverUser.email || prev.email,
                companyName: serverUser.companyName || prev.companyName,
                gstin: serverUser.gstin || prev.gstin,
                siteLocation: serverUser.siteLocation || prev.siteLocation,
                avatarUrl:
                  prev.avatarUrl ||
                  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [isLoggedIn, user.phone]);

  const login = useCallback((phoneNum: string): UserProfile => {
    const validPhone = (phoneNum || '').trim();
    setIsLoggedIn(true);

    let loadedProfile: UserProfile = {
      ...INITIAL_USER,
      phone: validPhone,
      isVerified: true,
      avatarUrl:
        'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
    };

    try {
      const savedProf = safeStorage.getItem(`urbanico_user_profile_${validPhone}`);
      if (savedProf) {
        loadedProfile = {
          ...loadedProfile,
          ...JSON.parse(savedProf),
          avatarUrl:
            'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
        };
      }
      safeStorage.setItem(
        'urbanico_auth_session',
        JSON.stringify({ isLoggedIn: true, phone: validPhone })
      );
    } catch {
      // ignore
    }

    setUser(loadedProfile);

    const cleanPhone = validPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      apiService
        .getUserProfile(cleanPhone)
        .then((serverUser) => {
          if (serverUser) {
            setUser((prev) => ({
              ...prev,
              name: serverUser.name || prev.name,
              email: serverUser.email || prev.email,
              companyName: serverUser.companyName || prev.companyName,
              gstin: serverUser.gstin || prev.gstin,
              siteLocation: serverUser.siteLocation || prev.siteLocation,
              avatarUrl:
                'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            }));
          }
        })
        .catch(() => {});
    }

    return loadedProfile;
  }, []);

  const updateUser = useCallback((updatedData: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      try {
        if (updated.phone) {
          safeStorage.setItem(
            `urbanico_user_profile_${updated.phone}`,
            JSON.stringify(updated)
          );
        }
      } catch {
        // ignore
      }

      const targetPhone = updatedData.phone || updated.phone;
      if (targetPhone) {
        const clean = targetPhone.replace(/[^0-9]/g, '');
        if (clean) {
          apiService.updateUserProfile(clean, updatedData).catch(() => {});
        }
      }

      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(INITIAL_USER);
    try {
      apiService.clearAuthSession();
      safeStorage.removeItem('urbanico_auth_session');
      safeStorage.removeItem('urbanico_orders');
      safeStorage.removeItem('urbanico_active_deliveries');
      safeStorage.removeItem('urbanico_deliveries_cache');
      safeStorage.removeItem('urbanico_cart_guest');
      safeStorage.removeItem('urbanico_favorite_ids_guest');
    } catch {
      // ignore
    }
    options?.onLogoutCleanup?.();
  }, [options]);

  return {
    user,
    isLoggedIn,
    setUser,
    setIsLoggedIn,
    login,
    logout,
    updateUser,
  };
}
