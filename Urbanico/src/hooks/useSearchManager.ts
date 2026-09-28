import { useState, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { resolveSearchCategory } from '../services/searchService';
import { CategoryId } from '../types';

export interface UseSearchManagerOptions {
  onSearchResolved?: (categoryId: CategoryId | 'all' | 'services') => void;
}

export function useSearchManager(options?: UseSearchManagerOptions) {
  const [searchQuery, setSearchQuery] = useState('');

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem('urbanico_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'UltraTech Cement 53',
      'Plastering Sand',
      'TMT 12mm Rebar',
      'Mason',
    ];
  });

  const selectSearchQuery = useCallback(
    (queryStr: string) => {
      if (!queryStr || !queryStr.trim()) return;
      const cleanQuery = queryStr.trim();
      setSearchQuery(cleanQuery);

      setRecentSearches((prev) => {
        const updated = [
          cleanQuery,
          ...prev.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase()),
        ].slice(0, 8);

        try {
          safeStorage.setItem('urbanico_recent_searches', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const resolution = resolveSearchCategory(cleanQuery);
      const targetCategory =
        resolution.categoryId === 'services-catalog' ? 'services' : resolution.categoryId;

      options?.onSearchResolved?.(targetCategory as any);
    },
    [options]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      safeStorage.removeItem('urbanico_recent_searches');
    } catch {}
  }, []);

  const removeRecentSearch = useCallback((queryStr: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryStr.toLowerCase());
      try {
        safeStorage.setItem('urbanico_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    recentSearches,
    selectSearchQuery,
    clearRecentSearches,
    removeRecentSearch,
  };
}
