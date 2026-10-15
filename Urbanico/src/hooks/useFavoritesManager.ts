import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { syncManager } from '../utils/syncManager';
import { useToast } from '../context/ToastContext';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { soundService } from '../utils/soundHelper';

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
    let initialIds: string[] = [];
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;
      const key =
        isAuth && cleanPhone
          ? `urbanico_favorite_ids_${cleanPhone}`
          : 'urbanico_favorite_ids_guest';
      const favSaved = safeStorage.getItem(key) || safeStorage.getItem('urbanico_favorite_ids');
      if (favSaved) {
        const parsed = JSON.parse(favSaved);
        if (Array.isArray(parsed)) initialIds = parsed;
      }

      // One-time migration: merge any legacy "Saved for Later" items into unified Favorites
      const legacySavedLater = safeStorage.getItem('urbanico_saved_for_later');
      if (legacySavedLater) {
        try {
          const parsed = JSON.parse(legacySavedLater);
          if (Array.isArray(parsed)) {
            parsed.forEach((it: any) => {
              const id = it.itemId || it.id;
              if (id && !initialIds.includes(id)) {
                initialIds.push(id);
              }
            });
          }
        } catch {}
        // Remove legacy storage key to clean up disk space
        safeStorage.removeItem('urbanico_saved_for_later');
      }
    } catch {
      // ignore
    }
    return initialIds;
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

      // Also ensure legacy key is cleaned up
      safeStorage.removeItem('urbanico_saved_for_later');

      // Multi-tab broadcast
      syncManager.broadcast('FAVORITES_UPDATED', { favoriteIds });
    } catch {
      // ignore
    }
  }, [favoriteIds, isLoggedIn, userPhone]);

  const saveToFavorites = useCallback(
    (itemId: string, customName?: string) => {
      soundService.playFavorite();
      setFavoriteIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      const item = materials.find((m) => m.id === itemId) || MATERIAL_ITEMS.find((m) => m.id === itemId);
      const itemName = customName || (item ? item.name : 'Item');
      showToast(`Saved "${itemName}" to Favorites`, 'success');
    },
    [materials, showToast]
  );

  const removeFromFavorites = useCallback(
    (itemId: string, customName?: string) => {
      soundService.playTap();
      setFavoriteIds((prev) => prev.filter((id) => id !== itemId));
      const item = materials.find((m) => m.id === itemId) || MATERIAL_ITEMS.find((m) => m.id === itemId);
      const itemName = customName || (item ? item.name : 'Item');
      showToast(`Removed "${itemName}" from Favorites`, 'info');
    },
    [materials, showToast]
  );

  const toggleFavorite = useCallback(
    (itemId: string, customName?: string) => {
      const isFavNow = !favoriteIds.includes(itemId);
      soundService.playFavorite();
      setFavoriteIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
      const item = materials.find((m) => m.id === itemId) || MATERIAL_ITEMS.find((m) => m.id === itemId);
      const itemName = customName || (item ? item.name : 'Item');
      showToast(
        isFavNow ? `Saved "${itemName}" to Favorites` : `Removed "${itemName}" from Favorites`,
        isFavNow ? 'success' : 'info'
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
        safeStorage.removeItem('urbanico_saved_for_later');
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
    saveToFavorites,
    removeFromFavorites,
    isFavorite,
    mergeFavoritesOnLogin,
    resetFavorites,
    favoriteCount: favoriteIds.length,
  };
}
