import { useCallback, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';

export interface UseFavoritesActionsProps {
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

/**
 * Lightweight, memoized actions adapter for components that toggle favorites.
 */
export function useFavoritesActions(props?: UseFavoritesActionsProps) {
  const { showToast } = useToast();

  const favoriteSet = useMemo(() => {
    return new Set(props?.favoriteIds || []);
  }, [props?.favoriteIds]);

  const isFavorite = useCallback(
    (id: string) => favoriteSet.has(id),
    [favoriteSet]
  );

  const toggleFavorite = useCallback(
    (id: string, itemName?: string) => {
      if (!props?.onToggleFavorite) return;
      const currentlyFav = favoriteSet.has(id);
      soundService.playFavorite();
      props.onToggleFavorite(id);

      if (itemName) {
        showToast(
          currentlyFav ? `Removed "${itemName}" from Favorites` : `Saved "${itemName}" to Favorites`,
          currentlyFav ? 'info' : 'success'
        );
      }
    },
    [props?.onToggleFavorite, favoriteSet, showToast]
  );

  return {
    isFavorite,
    toggleFavorite,
    favoriteIds: props?.favoriteIds || [],
  };
}

export default useFavoritesActions;
