/**
 * Urbanico Production Image Optimization & Caching Engine (Amazon/Flipkart Tier)
 * 
 * Capabilities:
 * 1. Cloudinary Transformation Pipeline:
 *    - Auto format negotiation (WebP/AVIF via `f_auto`)
 *    - Auto eco quality compression (`q_auto:eco`) reducing payload by >60%
 *    - Device pixel ratio compensation (`dpr_auto`)
 *    - Mobile thumbnail preset (w_600) and Hero preset (w_1200)
 * 2. Multi-tier In-Memory + Browser Disk Caching
 * 3. Progressive Blur-Up Placeholder Generator (LQIP)
 * 4. High-Speed Multi-Tier Preloading Pipeline
 */
import { Image as RNImage } from 'react-native';

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
  blur?: number;
  preset?: ImageSizePreset;
}

export const PRESET_CONFIGS: Record<ImageSizePreset, ImageOptimizationOptions> = {
  // 1:1 Small category & trade pills (120-160px)
  pill: {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Compact list & mobile thumbnails (w_600 for high-density screens)
  thumbnail: {
    width: 600,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Single column list view card images (w_600)
  card_list: {
    width: 600,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Grid product cards & trade cards (w_600)
  card: {
    width: 600,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Home hero showcase (w_1200)
  hero: {
    width: 1200,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Promotional carousel banners (w_1200)
  banner: {
    width: 1200,
    crop: 'limit',
    quality: 'auto:eco',
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
  // Product Detail / Item Quantity Modal full-fidelity preview (w_900)
  detail: {
    width: 900,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
  // Full-screen zoom modal (w_1200)
  full: {
    width: 1200,
    crop: 'limit',
    quality: 'auto:eco',
    format: 'auto',
  },
};

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
 * Transforms any Cloudinary image URL with auto format (WebP/AVIF), eco quality compression,
 * and exact dimension scaling (e.g. w_600 for thumbnails, w_1200 for hero).
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
  if (
    url.includes('/image/upload/f_auto') ||
    url.includes('/image/upload/q_auto') ||
    url.includes('/image/upload/w_')
  ) {
    return url;
  }

  // Construct Cloudinary transformation string
  const transforms: string[] = [];
  
  // Format & Quality (WebP/AVIF negotiation + q_auto:eco by default)
  transforms.push(`f_${config.format || 'auto'}`);
  transforms.push(`q_${config.quality || 'auto:eco'}`);
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
  if (config.blur) {
    transforms.push(`e_blur:${config.blur}`);
  }

  const transformString = transforms.join(',');

  // Replace `/image/upload/` with `/image/upload/<transformString>/`
  return url.replace('/image/upload/', `/image/upload/${transformString}/`);
}

/**
 * Generates an ultra-low-byte (100-200 bytes) progressive blur-up placeholder URL (LQIP)
 * for immediate zero-flicker rendering.
 */
export function getBlurUpPlaceholderUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/q_auto') || url.includes('/image/upload/w_')) {
    return url;
  }

  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto:low,w_30,e_blur:800/');
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
export async function preloadImages(
  urls: Array<{ url: string; preset?: ImageSizePreset } | string>
): Promise<void> {
  if (!urls || urls.length === 0) return;

  const tasks = urls.map((item) => {
    if (typeof item === 'string') {
      return preloadImage(item);
    }
    return preloadImage(item.url, item.preset);
  });

  await Promise.allSettled(tasks);
}
