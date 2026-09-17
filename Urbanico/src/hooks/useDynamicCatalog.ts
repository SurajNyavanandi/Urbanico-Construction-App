import { useState, useEffect, useCallback, useMemo } from 'react';
import { MaterialItem, MaterialCategory } from '../types';
import { apiService } from '../services/apiService';
import { MATERIAL_ITEMS, CATEGORIES } from '../data/materialsData';
import { safeStorage } from '../utils/safeStorage';

interface DynamicCatalogState {
  materials: MaterialItem[];
  categories: MaterialCategory[];
  services: any[];
  bundles: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
}

const CACHE_KEY_MATERIALS = 'urbanico_dynamic_materials_cache';
const CACHE_KEY_CATEGORIES = 'urbanico_dynamic_categories_cache';

export function useDynamicCatalog(): DynamicCatalogState {
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const cached = safeStorage.getItem(CACHE_KEY_MATERIALS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MATERIAL_ITEMS;
  });

  const [categories, setCategories] = useState<MaterialCategory[]>(CATEGORIES);
  const [services, setServices] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mats, cats, servs, bunds] = await Promise.all([
        apiService.getMaterials().catch(() => []),
        apiService.getCategories().catch(() => []),
        apiService.getServices().catch(() => []),
        apiService.getBundles().catch(() => [])
      ]);

      if (Array.isArray(mats) && mats.length > 0) {
        setMaterials(mats);
        safeStorage.setItem(CACHE_KEY_MATERIALS, JSON.stringify(mats));
      }
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
        safeStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(cats));
      }
      if (Array.isArray(servs) && servs.length > 0) setServices(servs);
      if (Array.isArray(bunds) && bunds.length > 0) setBundles(bunds);

      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('[DynamicCatalog] Fetch notice, retaining cached dataset:', err?.message || err);
      setError(err?.message || 'Failed to sync latest catalog');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return useMemo(
    () => ({
      materials,
      categories,
      services,
      bundles,
      isLoading,
      error,
      lastUpdated,
      refresh: fetchCatalog,
      refreshCatalog: fetchCatalog
    }),
    [materials, categories, services, bundles, isLoading, error, lastUpdated, fetchCatalog]
  );
}
