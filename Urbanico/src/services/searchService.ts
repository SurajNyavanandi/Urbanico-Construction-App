import { MATERIAL_ITEMS, CATEGORIES, SERVICES } from '../data/materialsData';
import { CATEGORY_SEARCH_MAP, POPULAR_SEARCH_SUGGESTIONS } from '../constants';
import { CategoryId, MaterialItem } from '../types';

export interface SearchResolutionResult {
  categoryId: CategoryId | 'all' | 'services-catalog';
  matchedItem?: MaterialItem;
  cleanQuery: string;
  normalizedQuery: string;
  wasCorrected: boolean;
}

export interface SearchFilterOptions {
  categoryId?: string;
  brand?: string;
  priceRange?: 'all' | 'under-500' | '500-5000' | 'above-5000';
  fastDispatchOnly?: boolean;
  sortBy?: 'default' | 'price-asc' | 'price-desc' | 'savings';
}

export interface SearchResultItemWithScore {
  item: MaterialItem;
  score: number;
  matchReasons: string[];
}

// 1. Contractor Slang & Common Phonetic Typo Mapping
export const CONTRACTOR_SYNONYMS: Record<string, string> = {
  // Cement typos & regional terms
  cemet: 'cement',
  cemen: 'cement',
  cemnt: 'cement',
  senment: 'cement',
  semant: 'cement',
  // Steel & Rebar regional slang
  saria: 'tmt iron_bars rebar',
  sariya: 'tmt iron_bars rebar',
  sariyah: 'tmt iron_bars rebar',
  loha: 'tmt steel iron_bars',
  rebar: 'iron_bars tmt',
  rod: 'iron_bars',
  // Sand terms
  reti: 'sand',
  balu: 'sand',
  badarpur: 'sand',
  bajri: 'sand',
  ret: 'sand',
  // Bricks & Blocks
  eet: 'bricks',
  it: 'bricks',
  int: 'bricks',
  bhatta: 'bricks',
  mitti: 'clay bricks',
  aac: 'aac blocks bricks',
  // Stone & Aggregates
  rodi: 'stone aggregates',
  gitti: 'stone aggregates',
  kankad: 'stone aggregates',
  kankar: 'stone',
  // Tiles & Flooring
  patthar: 'tiles',
  farsh: 'tiles',
  chabutra: 'tiles',
  floor: 'tiles',
  tile: 'tiles',
  // Skilled Trades
  mistri: 'mason',
  karigar: 'mason',
  rajmistri: 'mason',
  rang: 'painter',
  chuna: 'painter',
  welder: 'fabricator',
  welding: 'fabricator',
  lohar: 'fabricator',
  nal: 'plumber',
  nalwala: 'plumber',
  pipe: 'plumber',
  badhai: 'carpenter',
  lakdi: 'carpenter',
  bijli: 'electrician',
  tarr: 'electrician',
};

// 2. Brand Typo Normalization
export const BRAND_NORMALIZATION: Record<string, string> = {
  ambujaa: 'Ambuja',
  ambuja: 'Ambuja',
  ambja: 'Ambuja',
  ultratech: 'UltraTech',
  ultrateck: 'UltraTech',
  'ultra tech': 'UltraTech',
  ultra: 'UltraTech',
  tatatiscon: 'Tata Tiscon',
  tiscon: 'Tata Tiscon',
  tata: 'Tata Tiscon',
  jsw: 'JSW Steel',
  jswsteel: 'JSW Steel',
  kamdhenu: 'Kamdhenu',
  kamdhenoo: 'Kamdhenu',
  acc: 'ACC Cement',
  acccement: 'ACC Cement',
  coromandel: 'Coromandel',
  coromondal: 'Coromandel',
  dalmia: 'Dalmia',
  dalmiya: 'Dalmia',
  birla: 'Birla A1',
  birlaconcept: 'Birla',
  maha: 'Maha Cement',
  orient: 'Orient',
  kcp: 'KCP Cement',
};

/**
 * Normalizes input query using contractor synonyms and brand spell-correction.
 */
export function normalizeSearchQuery(rawQuery: string): {
  normalizedQuery: string;
  cleanQuery: string;
  wasCorrected: boolean;
  correctionNotice?: string;
} {
  if (!rawQuery || !rawQuery.trim()) {
    return { normalizedQuery: '', cleanQuery: '', wasCorrected: false };
  }

  const cleanQuery = rawQuery.trim();
  const lower = cleanQuery.toLowerCase();
  let normalized = lower;
  let wasCorrected = false;

  // Direct word or brand dictionary check
  if (CONTRACTOR_SYNONYMS[lower]) {
    normalized = CONTRACTOR_SYNONYMS[lower];
    wasCorrected = true;
  } else if (BRAND_NORMALIZATION[lower]) {
    normalized = BRAND_NORMALIZATION[lower].toLowerCase();
    wasCorrected = true;
  } else {
    // Multi-word replacement
    const words = lower.split(/\s+/);
    let replacedAny = false;
    const replacedWords = words.map((w) => {
      if (CONTRACTOR_SYNONYMS[w]) {
        replacedAny = true;
        return CONTRACTOR_SYNONYMS[w];
      }
      if (BRAND_NORMALIZATION[w]) {
        replacedAny = true;
        return BRAND_NORMALIZATION[w].toLowerCase();
      }
      return w;
    });

    if (replacedAny) {
      normalized = replacedWords.join(' ');
      wasCorrected = true;
    }
  }

  return {
    normalizedQuery: normalized,
    cleanQuery,
    wasCorrected,
    correctionNotice: wasCorrected
      ? `Showing results for "${normalized}" (searched "${cleanQuery}")`
      : undefined,
  };
}

/**
 * Extract known brand from a material item
 */
export function extractBrandFromItem(item: MaterialItem): string {
  const name = item.name.toLowerCase();
  if (name.includes('ultratech')) return 'UltraTech';
  if (name.includes('tata')) return 'Tata Tiscon';
  if (name.includes('acc')) return 'ACC';
  if (name.includes('ambuja')) return 'Ambuja';
  if (name.includes('jsw')) return 'JSW';
  if (name.includes('dalmia')) return 'Dalmia';
  if (name.includes('coromandel')) return 'Coromandel';
  if (name.includes('kamdhenu')) return 'Kamdhenu';
  if (name.includes('birla')) return 'Birla A1';
  if (name.includes('maha')) return 'Maha Cement';
  if (name.includes('penna')) return 'Penna';
  if (name.includes('orient')) return 'Orient';
  if (name.includes('red clay')) return 'Standard Kiln';
  if (name.includes('aac')) return 'EcoBlock AAC';
  if (name.includes('fly ash')) return 'NTPC Certified';
  if (name.includes('vitrified')) return 'Premium Ceramics';
  if (name.includes('centring')) return 'Standard Formwork';
  return 'Yard Verified';
}

/**
 * Extracts searchable text index from a product:
 * Combines title, subtitle, specs (labels & values), IS codes, and unit options.
 */
function getProductSearchCorpus(item: MaterialItem): string {
  const parts: string[] = [
    item.name,
    item.subtitle || '',
    item.categoryId,
    item.isCodeCompliance || '',
    item.labCertificateNo || '',
  ];

  if (item.specs && item.specs.length > 0) {
    for (const spec of item.specs) {
      parts.push(spec.label);
      parts.push(spec.value);
    }
  }

  if (item.options && item.options.length > 0) {
    for (const opt of item.options) {
      parts.push(opt.label);
    }
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Filter and rank products using multi-word tokenization and deep specs indexing.
 * Ensures that all query tokens match regardless of order (e.g. "tmt 12mm rebar" == "12mm rebar tmt").
 */
export function searchAndRankMaterials(
  items: MaterialItem[],
  queryStr: string,
  options: SearchFilterOptions = {}
): MaterialItem[] {
  const { categoryId, brand, priceRange, fastDispatchOnly } = options;

  let candidateList = items;

  // 1. Category Filter (unless 'all' or global search active)
  if (categoryId && categoryId !== 'all') {
    if (categoryId === 'services' || categoryId === 'services-catalog') {
      candidateList = candidateList.filter(
        (i) => i.categoryId === 'services' || i.categoryId === 'services-catalog'
      );
    } else {
      candidateList = candidateList.filter((i) => i.categoryId === categoryId);
    }
  }

  // 2. Brand Filter
  if (brand && brand !== 'all') {
    candidateList = candidateList.filter((i) => extractBrandFromItem(i).toLowerCase() === brand.toLowerCase());
  }

  // 3. Fast Dispatch Filter
  if (fastDispatchOnly) {
    candidateList = candidateList.filter(
      (i) => i.actionType === 'add_to_cart'
    );
  }

  // 4. Price Range Filter
  if (priceRange && priceRange !== 'all') {
    candidateList = candidateList.filter((item) => {
      const price = item.defaultPrice || item.options[0]?.price || 0;
      if (priceRange === 'under-500') return price < 500;
      if (priceRange === '500-5000') return price >= 500 && price <= 5000;
      if (priceRange === 'above-5000') return price > 5000;
      return true;
    });
  }

  // If query is empty, return filtered candidates
  if (!queryStr || !queryStr.trim()) {
    return candidateList;
  }

  const { normalizedQuery } = normalizeSearchQuery(queryStr);
  const searchTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);

  if (searchTokens.length === 0) {
    return candidateList;
  }

  const scored: SearchResultItemWithScore[] = [];

  for (const item of candidateList) {
    const itemNameLower = item.name.toLowerCase();
    const itemSubLower = (item.subtitle || '').toLowerCase();
    const corpus = getProductSearchCorpus(item);

    // Multi-word Tokenization Requirement:
    // ALL tokens must be found somewhere in the item corpus (or matching category)
    const matchesAllTokens = searchTokens.every(
      (tok) => corpus.includes(tok) || item.categoryId.toLowerCase().includes(tok)
    );

    if (!matchesAllTokens) {
      continue;
    }

    // Scoring heuristics:
    let score = 0;
    const matchReasons: string[] = [];

    // Exact name match
    if (itemNameLower === normalizedQuery) {
      score += 100;
      matchReasons.push('Exact Name Match');
    } else if (itemNameLower.startsWith(normalizedQuery)) {
      score += 70;
      matchReasons.push('Title Starts With');
    } else if (itemNameLower.includes(normalizedQuery)) {
      score += 50;
      matchReasons.push('Title Match');
    }

    // Individual token presence in title
    const tokensInTitle = searchTokens.filter((tok) => itemNameLower.includes(tok)).length;
    score += tokensInTitle * 15;

    // Tokens in subtitle
    const tokensInSubtitle = searchTokens.filter((tok) => itemSubLower.includes(tok)).length;
    score += tokensInSubtitle * 8;

    // Specs match (e.g. 53 Grade, Fe 550D, 12mm)
    if (item.specs) {
      for (const sp of item.specs) {
        const specStr = `${sp.label} ${sp.value}`.toLowerCase();
        for (const tok of searchTokens) {
          if (specStr.includes(tok)) {
            score += 10;
            matchReasons.push(`Spec: ${sp.label} ${sp.value}`);
          }
        }
      }
    }

    // Unit options match (e.g. 50kg bag, 1 ton)
    if (item.options) {
      for (const opt of item.options) {
        const optStr = opt.label.toLowerCase();
        for (const tok of searchTokens) {
          if (optStr.includes(tok)) {
            score += 5;
          }
        }
      }
    }

    scored.push({ item, score, matchReasons });
  }

  // Sort by requested option or score descending
  if (options.sortBy === 'price-asc') {
    scored.sort((a, b) => {
      const pA = a.item.defaultPrice || a.item.options?.[0]?.price || 0;
      const pB = b.item.defaultPrice || b.item.options?.[0]?.price || 0;
      return pA - pB;
    });
  } else if (options.sortBy === 'price-desc') {
    scored.sort((a, b) => {
      const pA = a.item.defaultPrice || a.item.options?.[0]?.price || 0;
      const pB = b.item.defaultPrice || b.item.options?.[0]?.price || 0;
      return pB - pA;
    });
  } else if (options.sortBy === 'savings') {
    scored.sort((a, b) => (b.item.options?.length || 0) - (a.item.options?.length || 0));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.map((s) => s.item);
}

/**
 * Autocompletion / Predictive Search Suggestions (Amazon / Flipkart Style)
 * Produces instant matching text chips as user types.
 */
export function getSearchAutocompletions(queryStr: string, limit = 6): string[] {
  if (!queryStr || !queryStr.trim()) {
    return POPULAR_SEARCH_SUGGESTIONS.slice(0, limit);
  }

  const { normalizedQuery } = normalizeSearchQuery(queryStr);
  const q = normalizedQuery.toLowerCase();
  const candidates: string[] = [];

  // 1. From item names and specifications
  for (const item of MATERIAL_ITEMS) {
    if (item.name.toLowerCase().includes(q)) {
      candidates.push(item.name);
    }
    if (item.subtitle && item.subtitle.toLowerCase().includes(q)) {
      candidates.push(`${item.name} (${item.subtitle})`);
    }
    if (item.specs) {
      for (const sp of item.specs) {
        if (sp.value.toLowerCase().includes(q)) {
          candidates.push(`${item.name} • ${sp.value}`);
        }
      }
    }
  }

  // 2. From services
  for (const s of SERVICES) {
    if (s.name.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)) {
      candidates.push(`${s.name} Service`);
    }
  }

  // 3. From categories
  for (const c of CATEGORIES) {
    if (c.name.toLowerCase().includes(q) || c.subcategoriesText?.toLowerCase().includes(q)) {
      candidates.push(`${c.name} Materials`);
    }
  }

  // Deduplicate and filter
  const unique = Array.from(new Set(candidates));
  return unique.slice(0, limit);
}

/**
 * Fallback "Did You Mean?" generator when search yields 0 items
 */
export function getDidYouMeanSuggestion(queryStr: string): string | null {
  if (!queryStr || !queryStr.trim()) return null;
  const clean = queryStr.trim().toLowerCase();

  // Known target phrases
  const targets = [
    'UltraTech Cement 53 Grade',
    'Tata Tiscon 12mm Rebar',
    'Plastering Sand (Fine M-Sand)',
    'Vitrified Double Charge Tiles',
    'Red Clay Kiln Bricks',
    'Stone 20mm Aggregates',
    'Ambuja Cement',
    'ACC Cement',
    'JSW Steel Fe 550D',
    'Mason Trade Service',
    'Painter Trade Service',
    'Steel Fabricator Service',
    'Plumber Trade Service',
  ];

  for (const target of targets) {
    const tLower = target.toLowerCase();
    // Prefix or partial contains
    if (tLower.includes(clean) || clean.includes(tLower)) {
      return target;
    }
    // Simple character similarity
    let commonChars = 0;
    for (const char of clean) {
      if (tLower.includes(char)) commonChars++;
    }
    if (clean.length > 3 && commonChars / clean.length > 0.8) {
      return target;
    }
  }

  return 'UltraTech Cement 53 Grade';
}

/**
 * Resolves search category and matches
 */
export function resolveSearchCategory(queryStr: string): SearchResolutionResult {
  if (!queryStr || !queryStr.trim()) {
    return { categoryId: 'all', cleanQuery: '', normalizedQuery: '', wasCorrected: false };
  }

  const { cleanQuery, normalizedQuery, wasCorrected } = normalizeSearchQuery(queryStr);
  const lower = normalizedQuery.toLowerCase();

  // 1. Direct match for a material product item
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
      normalizedQuery,
      wasCorrected,
    };
  }

  // 2. Direct match for a material category name
  const matchedCategory = CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id.toLowerCase() === lower ||
      lower.includes(c.id.toLowerCase())
  );

  if (matchedCategory) {
    return {
      categoryId: matchedCategory.id,
      cleanQuery,
      normalizedQuery,
      wasCorrected,
    };
  }

  // 3. Direct match for a service trade name
  const matchedService = SERVICES.find(
    (s) =>
      s.name.toLowerCase() === lower ||
      s.id.toLowerCase() === lower ||
      lower.includes(s.name.toLowerCase())
  );

  if (matchedService) {
    return {
      categoryId: 'services-catalog',
      cleanQuery,
      normalizedQuery,
      wasCorrected,
    };
  }

  // 4. Keyword map lookup
  for (const [keyword, catId] of Object.entries(CATEGORY_SEARCH_MAP)) {
    if (lower.includes(keyword)) {
      return {
        categoryId: catId as CategoryId | 'services-catalog',
        cleanQuery,
        normalizedQuery,
        wasCorrected,
      };
    }
  }

  // 5. Default fallback to all materials
  return {
    categoryId: 'all',
    cleanQuery,
    normalizedQuery,
    wasCorrected,
  };
}

/**
 * Text Match Highlighting Helper
 * Splices string into segments with `highlight: boolean` flag for React rendering.
 */
export function getHighlightedSegments(
  text: string,
  searchQuery: string
): Array<{ text: string; isMatch: boolean }> {
  if (!searchQuery || !searchQuery.trim() || !text) {
    return [{ text, isMatch: false }];
  }

  const { normalizedQuery } = normalizeSearchQuery(searchQuery);
  const words = normalizedQuery
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (words.length === 0) {
    return [{ text, isMatch: false }];
  }

  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: regex.test(part),
    }));
}
