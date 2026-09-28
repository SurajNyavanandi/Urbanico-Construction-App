import { useState, useMemo, useCallback } from 'react';
import { MaterialItem, CategoryId, MaterialCategory } from '../types';
import { MATERIAL_ITEMS, CATEGORIES } from '../data/materialsData';

export interface UseCatalogFilterOptions {
  materials?: MaterialItem[];
  categories?: MaterialCategory[];
  initialCategory?: CategoryId | 'all';
  searchQuery?: string;
}

export function useCatalogFilter({
  materials = MATERIAL_ITEMS,
  categories = CATEGORIES,
  initialCategory = 'all',
  searchQuery = '',
}: UseCatalogFilterOptions = {}) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(initialCategory);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low_high' | 'price_high_low'>('recommended');

  const filteredItems = useMemo(() => {
    let list = [...materials];

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryId.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_low_high') {
      list.sort((a, b) => (a.defaultPrice || 0) - (b.defaultPrice || 0));
    } else if (sortBy === 'price_high_low') {
      list.sort((a, b) => (b.defaultPrice || 0) - (a.defaultPrice || 0));
    }

    return list;
  }, [materials, selectedCategory, searchQuery, sortBy]);

  return {
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    filteredItems,
    categories,
    totalCount: filteredItems.length,
  };
}
