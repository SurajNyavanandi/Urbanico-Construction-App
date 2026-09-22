import { useCallback, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';

export interface UseFavoritesActionsProps {
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

/**
 * Reusable hook for handling favorites logic, sound feedback, and toasts across all cards & screens.
 * Features O(1) Set-based lookups and memoized handlers to minimize re-renders.
 */
export function useFavoritesActions(props?: UseFavoritesActionsProps) {
  const { showToast } = useToast();

  const favoriteSet = useMemo(() => {
    return new Set(props?.favoriteIds || []);
  }, [props?.favoriteIds]);

  const isFavorite = useCallback(
    (id: string) => {
      return favoriteSet.has(id);
    },
    [favoriteSet]
  );

  const toggleFavorite = useCallback(
    (id: string, itemName?: string) => {
      if (!props?.onToggleFavorite) return;
      
      const currentlyFav = favoriteSet.has(id);
      soundService.playFavorite();
      props.onToggleFavorite(id);

      if (itemName) {
        if (!currentlyFav) {
          showToast(`Saved "${itemName}" to Favourites`, 'success');
        } else {
          showToast(`Removed "${itemName}" from Favourites`, 'info');
        }
      }
    },
    [props?.onToggleFavorite, favoriteSet, showToast]
  );

  return {
    isFavorite,
    toggleFavorite,
    favoriteIds: props?.favoriteIds || [],
    favoriteCount: props?.favoriteIds ? props.favoriteIds.length : 0,
    favoriteSet,
  };
}
