import { useState, useCallback } from 'react';
import { resolveSearchCategory, SearchResolutionResult } from '../services/searchService';
import { CategoryId } from '../types';

export function useSearch(initialRecent: string[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(initialRecent);

  const executeSearch = useCallback((queryStr: string): SearchResolutionResult => {
    const resolution = resolveSearchCategory(queryStr);
    if (resolution.cleanQuery) {
      setSearchQuery(resolution.cleanQuery);
      setRecentSearches((prev) => [
        resolution.cleanQuery,
        ...prev.filter((q) => q.toLowerCase() !== resolution.cleanQuery.toLowerCase()),
      ].slice(0, 6));
    }
    return resolution;
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => prev.filter((q) => q.toLowerCase() !== term.toLowerCase()));
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    recentSearches,
    executeSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
