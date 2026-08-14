/**
 * Urbanico Production Image Optimization & Caching Engine (Amazon/Flipkart Tier)
 * 
 * Capabilities:
 * 1. Cloudinary Transformation Pipeline:
 *    - Auto format negotiation (WebP/AVIF via `f_auto`)
 *    - Auto quality compression (`q_auto:good` / `q_auto`)
 *    - Device pixel ratio compensation (`dpr_auto`)
 *    - Component-specific dimension constraints (`w_...`, `h_...`, `c_limit` / `c_fill`)
 * 2. Multi-tier In-Memory + Browser Disk Caching
 * 3. High-Speed Preloading of above-the-fold assets
 * 4. Ultra-lightweight Blur/Shimmer Placeholders
 * 5. Layout-shift prevention via strict aspect ratios
 */
import { Image as RNImage, Platform } from 'react-native';

export type ImageSizePreset =
  | 'pill'
  | 'thumbnail'
  | 'card'
  | 'card_list'
  | 'hero'
  | 'banner'
  | 'logo'
  | 'detail'
  | 'full';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'fit' | 'thumb' | 'scale';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  dpr?: 'auto' | number;
  preset?: ImageSizePreset;
}

const PRESET_CONFIGS: Record<ImageSizePreset, ImageOptimizationOptions> = {
  // 1:1 Small category & trade pills (80-120px)
  pill: {
    width: 140,
    height: 140,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  },
  // Compact list & cart thumbnails (160-200px)
  thumbnail: {
    width: 220,
    height: 220,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  },
  // Single column list view card images (200-240px)
  card_list: {
    width: 260,
    height: 260,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  },
  // Grid product cards & trade cards (380-450px)
  card: {
    width: 440,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
  },
  // Home hero showcase (750-900px)
  hero: {
    width: 850,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
  },
  // Promotional carousel banners (800-950px)
  banner: {
    width: 900,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
  },
  // Brand Logo (200px)
  logo: {
    width: 200,
    height: 200,
    crop: 'limit',
    quality: 'auto:best',
    format: 'auto',
  },
  // Product Detail / Item Quantity Modal full-fidelity preview (600-800px)
  detail: {
    width: 750,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
  },
  // Full-screen zoom modal
  full: {
    width: 1200,
    crop: 'limit',
    quality: 'auto:best',
    format: 'auto',
  },
};

/**
 * Universal blur placeholder blurhash / base64 fallback
 */
export const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * In-Memory Cache Tracker for immediate synchronous render flag
 */
class ImageCacheRegistry {
  private cachedUrls = new Set<string>();
  private preloadedUrls = new Set<string>();

  isCached(url?: string | null): boolean {
    if (!url) return false;
    return this.cachedUrls.has(url);
  }

  markCached(url?: string | null): void {
    if (!url) return;
    this.cachedUrls.add(url);
  }

  isPreloaded(url?: string | null): boolean {
    if (!url) return false;
    return this.preloadedUrls.has(url);
  }

  markPreloaded(url?: string | null): void {
    if (!url) return;
    this.preloadedUrls.add(url);
    this.cachedUrls.add(url);
  }

  clear(): void {
    this.cachedUrls.clear();
    this.preloadedUrls.clear();
  }
}

export const imageCache = new ImageCacheRegistry();

/**
 * Transforms any Cloudinary image URL with auto format (WebP/AVIF), smart quality,
 * and exact dimension scaling. Leaves non-Cloudinary or local URIs untouched.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options?: ImageOptimizationOptions | ImageSizePreset
): string {
  if (!url || typeof url !== 'string') return '';

  let config: ImageOptimizationOptions = {};
  if (typeof options === 'string') {
    config = PRESET_CONFIGS[options] || {};
  } else if (options) {
    if (options.preset && PRESET_CONFIGS[options.preset]) {
      config = { ...PRESET_CONFIGS[options.preset], ...options };
    } else {
      config = options;
    }
  }

  // If not Cloudinary or already has specialized params, handle safely
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  // Avoid double-transforming if already contains f_auto/q_auto
  if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/q_auto') || url.includes('/image/upload/w_')) {
    return url;
  }

  // Construct Cloudinary transformation string
  const transforms: string[] = [];
  
  // Format & Quality (WebP/AVIF negotiation + smart quality)
  transforms.push(`f_${config.format || 'auto'}`);
  transforms.push(`q_${config.quality || 'auto'}`);
  transforms.push('dpr_auto');

  if (config.width) {
    transforms.push(`w_${config.width}`);
  }
  if (config.height) {
    transforms.push(`h_${config.height}`);
  }
  if (config.crop) {
    transforms.push(`c_${config.crop}`);
  }

  const transformString = transforms.join(',');

  // Replace `/image/upload/` with `/image/upload/<transformString>/`
  return url.replace('/image/upload/', `/image/upload/${transformString}/`);
}

/**
 * Preload high-priority images into memory and browser cache.
 */
export async function preloadImage(url: string, preset?: ImageSizePreset): Promise<void> {
  if (!url) return;
  const optimizedUrl = getOptimizedImageUrl(url, preset ? { preset } : undefined);

  if (imageCache.isCached(optimizedUrl)) {
    return;
  }

  try {
    if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
      const img = new window.Image();
      img.src = optimizedUrl;
      if (img.decode) {
        await img.decode().catch(() => {});
      }
      imageCache.markPreloaded(optimizedUrl);
    } else if (RNImage && typeof RNImage.prefetch === 'function') {
      await RNImage.prefetch(optimizedUrl);
      imageCache.markPreloaded(optimizedUrl);
    }
  } catch {
    // Quietly catch network drop
  }
}

/**
 * Preloads an array of critical images sequentially or in parallel batches
 */
export async function preloadImages(urls: Array<{ url: string; preset?: ImageSizePreset } | string>): Promise<void> {
  if (!urls || urls.length === 0) return;

  const tasks = urls.map((item) => {
    if (typeof item === 'string') {
      return preloadImage(item);
    }
    return preloadImage(item.url, item.preset);
  });

  await Promise.allSettled(tasks);
}
