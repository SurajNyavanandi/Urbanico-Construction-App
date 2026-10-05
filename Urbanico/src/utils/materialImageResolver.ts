/**
 * Smart Material & Service Image Resolver for Urbanico
 * Accurately maps products and line items to their exact Cloudinary high-res images
 * based on item name, category, or explicit URL.
 */

export const MASTER_CATEGORY_IMAGES: Record<string, string> = {
  cement: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
  bricks: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg',
  sand: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
  stone: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/stones2_i0cjzq.jpg',
  iron_bars: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
  steel: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
  centring: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/centering2_lb7s6n.jpg',
  tiles: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
  mason: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg',
  painter: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/painter_dofdp9.jpg',
  fabricator: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/fabricator_dmfp4t.jpg',
  electrician: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852931/electrician_imidbv.jpg',
  plumber: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/plumber_zxj5ct.jpg',
  carpenter: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/carpenter_pdnvrz.jpg',
  services: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg',
};

const DEFAULT_FALLBACK_IMAGE = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg';

export interface ResolveImageInput {
  name?: string;
  category?: string;
  image?: string;
}

/**
 * Resolves the real high-definition image for any line item or ordered material.
 * If an image is provided and doesn't mismatch the category/name, it is preserved.
 * Otherwise, resolves dynamically by analyzing product name and category keywords.
 */
export function resolveMaterialImage(item: ResolveImageInput | string | null | undefined): string {
  if (!item) return DEFAULT_FALLBACK_IMAGE;

  let explicitImage: string | undefined;
  let name = '';
  let category = '';

  if (typeof item === 'string') {
    name = item;
  } else {
    explicitImage = item.image;
    name = item.name || '';
    category = item.category || '';
  }

  const n = name.toLowerCase().trim();
  const c = category.toLowerCase().trim();

  // If explicit image is present and is NOT a mismatched default cement placeholder for a non-cement item
  if (explicitImage && explicitImage.trim().length > 0) {
    const isCementImage = explicitImage.includes('cement2_s1pf60');
    const isActuallyCement = n.includes('cement') || c.includes('cement') || n.includes('ultratech') || n.includes('acc') || n.includes('ambuja') || n.includes('birla');
    
    // If it's not falsely assigned the default cement image, use the explicit image
    if (!isCementImage || isActuallyCement) {
      return explicitImage;
    }
  }

  // 1. Name-based Keyword Matching (Highest Priority)
  if (n.includes('sand') || n.includes('m-sand') || n.includes('robo') || n.includes('p-sand') || n.includes('plastering sand')) {
    return MASTER_CATEGORY_IMAGES.sand;
  }
  if (n.includes('brick') || n.includes('aac') || n.includes('clay') || n.includes('block') || n.includes('fly ash')) {
    return MASTER_CATEGORY_IMAGES.bricks;
  }
  if (n.includes('stone') || n.includes('aggregate') || n.includes('gravel') || n.includes('granite') || n.includes('blue metal') || n.includes('20mm') || n.includes('10mm') || n.includes('40mm') || n.includes('gsb')) {
    return MASTER_CATEGORY_IMAGES.stone;
  }
  if (n.includes('steel') || n.includes('tmt') || n.includes('rebar') || n.includes('iron') || n.includes('fe-550') || n.includes('fe-500') || n.includes('binding wire') || n.includes('ring')) {
    return MASTER_CATEGORY_IMAGES.iron_bars;
  }
  if (n.includes('tile') || n.includes('vitrified') || n.includes('flooring') || n.includes('ceramic') || n.includes('parking tile')) {
    return MASTER_CATEGORY_IMAGES.tiles;
  }
  if (n.includes('centring') || n.includes('centering') || n.includes('shuttering') || n.includes('plywood') || n.includes('scaffolding') || n.includes('span') || n.includes('prop')) {
    return MASTER_CATEGORY_IMAGES.centring;
  }
  if (n.includes('paint') || n.includes('putty') || n.includes('primer') || n.includes('emulsion') || n.includes('weather')) {
    return MASTER_CATEGORY_IMAGES.painter;
  }
  if (n.includes('mason') || n.includes('masonry') || n.includes('brickwork') || n.includes('plastering service')) {
    return MASTER_CATEGORY_IMAGES.mason;
  }
  if (n.includes('electrician') || n.includes('wiring') || n.includes('conduit') || n.includes('electrical')) {
    return MASTER_CATEGORY_IMAGES.electrician;
  }
  if (n.includes('plumber') || n.includes('plumbing') || n.includes('pipe') || n.includes('sanitary') || n.includes('cpvc')) {
    return MASTER_CATEGORY_IMAGES.plumber;
  }
  if (n.includes('fabricator') || n.includes('welder') || n.includes('welding') || n.includes('grill') || n.includes('truss')) {
    return MASTER_CATEGORY_IMAGES.fabricator;
  }
  if (n.includes('carpenter') || n.includes('wood') || n.includes('door frame') || n.includes('timber')) {
    return MASTER_CATEGORY_IMAGES.carpenter;
  }
  if (n.includes('cement') || n.includes('ultratech') || n.includes('acc') || n.includes('ambuja') || n.includes('birla') || n.includes('dalmia') || n.includes('jsw')) {
    return MASTER_CATEGORY_IMAGES.cement;
  }

  // 2. Category-based Matching
  if (c.includes('sand')) return MASTER_CATEGORY_IMAGES.sand;
  if (c.includes('brick') || c.includes('block')) return MASTER_CATEGORY_IMAGES.bricks;
  if (c.includes('stone') || c.includes('aggregate')) return MASTER_CATEGORY_IMAGES.stone;
  if (c.includes('steel') || c.includes('iron') || c.includes('iron_bars') || c.includes('rebar')) return MASTER_CATEGORY_IMAGES.iron_bars;
  if (c.includes('tile') || c.includes('flooring')) return MASTER_CATEGORY_IMAGES.tiles;
  if (c.includes('centring') || c.includes('centering') || c.includes('formwork')) return MASTER_CATEGORY_IMAGES.centring;
  if (c.includes('service') || c.includes('contractor')) return MASTER_CATEGORY_IMAGES.mason;
  if (c.includes('cement')) return MASTER_CATEGORY_IMAGES.cement;

  // 3. Fallback
  return explicitImage || DEFAULT_FALLBACK_IMAGE;
}
