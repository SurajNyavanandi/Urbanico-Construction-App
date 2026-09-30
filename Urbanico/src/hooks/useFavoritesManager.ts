import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { useToast } from '../context/ToastContext';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';

export interface UseFavoritesManagerOptions {
  isLoggedIn: boolean;
  userPhone?: string;
  onRequireAuth?: (itemId: string) => void;
  materials?: MaterialItem[];
}

export function useFavoritesManager({
  isLoggedIn,
  userPhone,
  onRequireAuth,
  materials = MATERIAL_ITEMS,
}: UseFavoritesManagerOptions) {
  const { showToast } = useToast();

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key =
        isAuth && phone
          ? `urbanico_favorite_ids_${phone}`
          : 'urbanico_favorite_ids_guest';
      const favSaved = safeStorage.getItem(key) || safeStorage.getItem('urbanico_favorite_ids');
      if (favSaved) {
        const parsed = JSON.parse(favSaved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync favorites with storage whenever changed
  useEffect(() => {
    try {
      const cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : null;
      const key =
        isLoggedIn && cleanPhone
          ? `urbanico_favorite_ids_${cleanPhone}`
          : 'urbanico_favorite_ids_guest';
      safeStorage.setItem(key, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds, isLoggedIn, userPhone]);

  const toggleFavorite = useCallback(
    (itemId: string) => {
      const isFavNow = !favoriteIds.includes(itemId);
      setFavoriteIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
      const item = materials.find((m) => m.id === itemId) || MATERIAL_ITEMS.find((m) => m.id === itemId);
      const itemName = item ? item.name : 'Item';
      showToast(
        isFavNow ? `Saved "${itemName}" to Favourites` : `Removed "${itemName}" from Favourites`,
        'info'
      );
    },
    [favoriteIds, materials, showToast]
  );

  const mergeFavoritesOnLogin = useCallback((phone: string) => {
    try {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (!cleanPhone) return;

      const userKey = `urbanico_favorite_ids_${cleanPhone}`;
      const guestKey = 'urbanico_favorite_ids_guest';

      const userSavedFavsRaw = safeStorage.getItem(userKey);
      let userSavedFavs: string[] = [];
      if (userSavedFavsRaw) {
        try {
          const parsed = JSON.parse(userSavedFavsRaw);
          if (Array.isArray(parsed)) userSavedFavs = parsed;
        } catch {}
      }

      const guestFavsRaw = safeStorage.getItem(guestKey);
      let guestFavs: string[] = [];
      if (guestFavsRaw) {
        try {
          const parsed = JSON.parse(guestFavsRaw);
          if (Array.isArray(parsed)) guestFavs = parsed;
        } catch {}
      }

      setFavoriteIds((prev) => {
        const merged = Array.from(new Set([...userSavedFavs, ...prev, ...guestFavs]));
        safeStorage.setItem(userKey, JSON.stringify(merged));
        safeStorage.removeItem(guestKey);
        return merged;
      });
    } catch {
      // ignore
    }
  }, []);

  const resetFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.includes(itemId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    setFavoriteIds,
    toggleFavorite,
    isFavorite,
    mergeFavoritesOnLogin,
    resetFavorites,
    favoriteCount: favoriteIds.length,
  };
}
