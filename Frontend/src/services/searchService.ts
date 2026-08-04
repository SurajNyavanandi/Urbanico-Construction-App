import { MATERIAL_ITEMS, CATEGORIES, SERVICES } from '../data/materialsData';
import { CATEGORY_SEARCH_MAP } from '../constants';
import { CategoryId, MaterialItem } from '../types';

export interface SearchResolutionResult {
  categoryId: CategoryId | 'all' | 'services-catalog';
  matchedItem?: MaterialItem;
  cleanQuery: string;
}

export function resolveSearchCategory(queryStr: string): SearchResolutionResult {
  if (!queryStr || !queryStr.trim()) {
    return { categoryId: 'all', cleanQuery: '' };
  }

  const cleanQuery = queryStr.trim();
  const lower = cleanQuery.toLowerCase();

  // 1. Check if exact or close match for a material product item
  const matchedItem = MATERIAL_ITEMS.find((item) => {
    const itemNameLower = item.name.toLowerCase();
    const itemSubLower = item.subtitle ? item.subtitle.toLowerCase() : '';
    return (
      itemNameLower === lower ||
      itemNameLower.includes(lower) ||
      lower.includes(itemNameLower) ||
      (itemSubLower && itemSubLower.includes(lower))
    );
  });

  if (matchedItem) {
    return {
      categoryId: matchedItem.categoryId as CategoryId,
      matchedItem,
      cleanQuery,
    };
  }

  // 2. Check if direct match for a material category name
  const matchedCategory = CATEGORIES.find(
    (c) => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower || lower.includes(c.id.toLowerCase())
  );

  if (matchedCategory) {
    return {
      categoryId: matchedCategory.id,
      cleanQuery,
    };
  }

  // 3. Check if direct match for a service trade name
  const matchedService = SERVICES.find(
    (s) => s.name.toLowerCase() === lower || s.id.toLowerCase() === lower || lower.includes(s.name.toLowerCase())
  );

  if (matchedService) {
    return {
      categoryId: 'services-catalog',
      cleanQuery,
    };
  }

  // 4. Keyword map lookup
  for (const [keyword, catId] of Object.entries(CATEGORY_SEARCH_MAP)) {
    if (lower.includes(keyword)) {
      return {
        categoryId: catId as CategoryId | 'services-catalog',
        cleanQuery,
      };
    }
  }

  // 5. Default fallback to main catalog
  return {
    categoryId: 'all',
    cleanQuery,
  };
}
