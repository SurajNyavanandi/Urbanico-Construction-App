import { useState, useMemo, useCallback } from 'react';
import { MaterialItem, CategoryId } from '../types';
import { ProjectBundle, PROJECT_BUNDLES } from '../components/HomeScreen';
import { MATERIAL_ITEMS } from '../data/materialsData';

export interface UseHomeFeedOptions {
  materials?: MaterialItem[];
  bundles?: ProjectBundle[];
  searchQuery?: string;
}

export function useHomeFeed({
  materials = MATERIAL_ITEMS,
  bundles = PROJECT_BUNDLES,
  searchQuery = '',
}: UseHomeFeedOptions) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase().trim();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.categoryId.toLowerCase().includes(q) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(q))
    );
  }, [materials, searchQuery]);

  const trendingMaterials = useMemo(() => {
    return materials.slice(0, 8);
  }, [materials]);

  const onRefresh = useCallback(async (refetchCatalog?: () => Promise<any>) => {
    setIsRefreshing(true);
    try {
      if (refetchCatalog) {
        await refetchCatalog();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  return {
    activeBannerIndex,
    setActiveBannerIndex,
    isRefreshing,
    onRefresh,
    filteredMaterials,
    trendingMaterials,
    bundles: bundles && bundles.length > 0 ? bundles : PROJECT_BUNDLES,
  };
}
