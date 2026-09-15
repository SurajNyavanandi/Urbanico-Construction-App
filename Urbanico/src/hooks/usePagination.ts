import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions<T> {
  items: T[];
  initialPage?: number;
  pageSize?: number;
  initialSortField?: keyof T;
  initialSortOrder?: 'asc' | 'desc';
  searchPredicate?: (item: T, query: string) => boolean;
}

/**
 * usePagination
 * A comprehensive, reusable hook for searching, sorting, and paginating arrays.
 * Teaches fundamental list processing algorithms (Filter -> Sort -> Slice).
 * 
 * @example
 * const {
 *   paginatedItems,
 *   currentPage,
 *   totalPages,
 *   nextPage,
 *   prevPage,
 *   searchQuery,
 *   setSearchQuery
 * } = usePagination({ items: orders, pageSize: 10 });
 */
export function usePagination<T>({
  items,
  initialPage = 1,
  pageSize = 10,
  initialSortField,
  initialSortOrder = 'desc',
  searchPredicate,
}: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof T | undefined>(initialSortField);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  // Step 1: Filter Algorithm
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim() || !searchPredicate) {
      return items;
    }
    const clean = searchQuery.trim().toLowerCase();
    return items.filter((item) => searchPredicate(item, clean));
  }, [items, searchQuery, searchPredicate]);

  // Step 2: Sort Algorithm
  const sortedItems = useMemo(() => {
    if (!sortField) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const factor = sortOrder === 'asc' ? 1 : -1;
      return valA < valB ? -1 * factor : 1 * factor;
    });
  }, [filteredItems, sortField, sortOrder]);

  // Step 3: Pagination Calculations
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Safe page index within bounds
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Step 4: Slice Algorithm (Windowing)
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, safeCurrentPage, pageSize]);

  // Navigation handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const toggleSort = useCallback((field: keyof T) => {
    setSortField(field);
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  return {
    // Current slice
    paginatedItems,
    filteredItems,
    totalItems,
    // Page state
    currentPage: safeCurrentPage,
    totalPages,
    pageSize,
    canPrev: safeCurrentPage > 1,
    canNext: safeCurrentPage < totalPages,
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    // Search
    searchQuery,
    setSearchQuery,
    // Sort
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    toggleSort,
  };
}
