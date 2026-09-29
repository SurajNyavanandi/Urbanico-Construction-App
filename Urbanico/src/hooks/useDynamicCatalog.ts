import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MaterialItem, MaterialCategory } from '../types';
import { apiService } from '../services/apiService';
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
const CACHE_KEY_SERVICES = 'urbanico_dynamic_services_cache';

export const INITIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'cement', name: 'Cement & Binding', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-cement_pwrzsr.jpg', count: '12 Brands', priceLabel: 'From ₹340/bag', subcategoriesText: 'OPC, PPC, Slag', tag: 'BESTSELLER' },
  { id: 'bricks', name: 'Bricks & AAC Blocks', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-bricks_bbywkp.jpg', count: '8 Types', priceLabel: 'From ₹9/pc', subcategoriesText: 'Red Clay, AAC, Fly Ash', tag: 'POPULAR' },
  { id: 'sand', name: 'River & Robo Sand', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-sand_qmbdo6.jpg', count: '6 Grades', priceLabel: 'From ₹1,400/ton', subcategoriesText: 'Zone II, Plastering, Robo', tag: 'BULK SUPPLY' },
  { id: 'stone', name: 'Aggregates & Gravel', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-stones_oqaced.jpg', count: '5 Sizes', priceLabel: 'From ₹1,200/ton', subcategoriesText: '10mm, 20mm, 40mm, GSB', tag: 'QUARRY DIRECT' },
  { id: 'iron_bars', name: 'TMT Steel Rebars', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-ironbars_ayo0id.jpg', count: '9 Gauges', priceLabel: 'From ₹54,000/ton', subcategoriesText: 'Fe550D, Fe500, Ring wire', tag: 'TEST CERTIFIED' },
  { id: 'centring', name: 'Centring & Shuttering', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-centering_nikj90.jpg', count: '14 Items', priceLabel: 'Rental / Purchase', subcategoriesText: 'Plywood, Props, Spans', tag: 'RENTAL' },
  { id: 'tiles', name: 'Tiles & Flooring', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg', count: '24 Designs', priceLabel: 'From ₹38/sqft', subcategoriesText: 'Vitrified, Ceramic, Parking', tag: 'PREMIUM' },
  { id: 'services-catalog', name: 'Contractors & Services', image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg', count: '6 Services', priceLabel: 'Daily / Sqft', subcategoriesText: 'Mason, Steel, Paint, Tile', tag: 'SERVICES' },
];

export function useDynamicCatalog(): DynamicCatalogState {
  // Synchronous cache hydration for instant zero-wait first paint
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const cached = safeStorage.getItem(CACHE_KEY_MATERIALS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [categories, setCategories] = useState<MaterialCategory[]>(() => {
    try {
      const cached = safeStorage.getItem(CACHE_KEY_CATEGORIES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [services, setServices] = useState<any[]>(() => {
    try {
      const cached = safeStorage.getItem(CACHE_KEY_SERVICES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [bundles, setBundles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Background Stale-While-Revalidate fetch
  const fetchCatalog = useCallback(async () => {
    // Only flag loading if we have zero items to avoid blocking UI
    setIsLoading(materials.length === 0);
    setError(null);

    try {
      const [mats, cats, servs, bunds] = await Promise.all([
        apiService.getMaterials().catch(() => []),
        apiService.getCategories().catch(() => []),
        apiService.getServices().catch(() => []),
        apiService.getBundles().catch(() => [])
      ]);

      if (!isMountedRef.current) return;

      if (Array.isArray(mats) && mats.length > 0) {
        setMaterials(mats);
        safeStorage.setItem(CACHE_KEY_MATERIALS, JSON.stringify(mats));
      }
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
        safeStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(cats));
      }
      if (Array.isArray(servs) && servs.length > 0) {
        setServices(servs);
        safeStorage.setItem(CACHE_KEY_SERVICES, JSON.stringify(servs));
      }
      if (Array.isArray(bunds) && bunds.length > 0) {
        setBundles(bunds);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('[DynamicCatalog] Background refresh note:', err?.message || err);
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to sync latest catalog');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [materials.length]);

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
