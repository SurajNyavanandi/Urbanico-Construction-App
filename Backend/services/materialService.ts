import { Material, IMaterial } from '../models/Material';
import mongoose from 'mongoose';

export interface CategoryInfo {
  id: string;
  name: string;
  image: string;
  count: string;
  priceLabel: string;
  subcategoriesText: string;
  tag: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  rate: string;
  description: string;
  tag?: string;
}

export interface ProjectBundleInfo {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  itemsSummary: string;
  itemsIncluded: string[];
  savings: string;
  price: number;
  originalPrice: number;
  image: string;
  targetCategory: string;
  bundleItems: Array<{
    itemId: string;
    itemName: string;
    optionLabel: string;
    unitPrice: number;
    quantity: number;
    image: string;
    categoryName: string;
  }>;
}

export const BACKEND_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cement',
    name: 'Cement',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
    count: '7 Top Brands',
    priceLabel: 'From ₹365 / Bag',
    subcategoriesText: 'UltraTech, ACC, Ambuja, Dalmia',
    tag: 'CEMENT',
  },
  {
    id: 'bricks',
    name: 'Bricks & Blocks',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg',
    count: '5 Types',
    priceLabel: 'From ₹6.5 / Brick',
    subcategoriesText: 'Red Clay, AAC Blocks, Fly Ash',
    tag: 'BRICKS',
  },
  {
    id: 'sand',
    name: 'Sand',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
    count: '4 Varieties',
    priceLabel: 'From ₹70 / Bag',
    subcategoriesText: 'Plastering, River, Robo & Filling',
    tag: 'SAND',
  },
  {
    id: 'stone',
    name: 'Stone & Aggregates',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/stones2_i0cjzq.jpg',
    count: '5 Sizes',
    priceLabel: 'From ₹70 / Bag',
    subcategoriesText: '10mm, 20mm, 40mm & Stone Dust',
    tag: 'AGGREGATES',
  },
  {
    id: 'iron_bars',
    name: 'Iron Bars & Steel',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
    count: '5 Rebar Grades',
    priceLabel: 'From ₹380 / Bundle',
    subcategoriesText: 'Tata Tiscon, JSW, Kamdhenu',
    tag: 'STEEL & TMT',
  },
  {
    id: 'centring',
    name: 'Centring & Formwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/centering2_lb7s6n.jpg',
    count: '5 Formwork Types',
    priceLabel: 'From ₹50 / Plank',
    subcategoriesText: 'Steel Sheets, Props & Wood Planks',
    tag: 'FORMWORK',
  },
  {
    id: 'tiles',
    name: 'Tiles & Flooring',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    count: '4 Subcategories',
    priceLabel: 'From ₹42 / Sq.Ft',
    subcategoriesText: 'Vitrified, Ceramic, Matte & Pavers',
    tag: 'TILES',
  },
];

export const BACKEND_SERVICES: ServiceInfo[] = [
  {
    id: 'mason',
    name: 'Mason',
    subtitle: 'Tile & Brickwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg',
    rate: '₹99 Demo Visit',
    description: 'Experienced Masons for bricklaying, plastering, stone masonry, tile fitting & concrete slab laying.',
  },
  {
    id: 'painter',
    name: 'Painter',
    subtitle: 'Interior & Exterior Painting',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/painter_dofdp9.jpg',
    rate: '₹99 Demo Visit',
    description: 'Skilled Painters for putty application, primer coating, texture finishes & exterior weather-proof coating.',
  },
  {
    id: 'fabricator',
    name: 'Fabricator',
    subtitle: 'Steel & Welding Works',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/fabricator_dmfp4t.jpg',
    rate: '₹99 Demo Visit',
    description: 'Heavy and light fabrication specialists for structural trusses, MS gates, railings & safety grills.',
  },
  {
    id: 'electrician',
    name: 'Electrician',
    subtitle: 'Wiring & Panels',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852931/electrician_imidbv.jpg',
    rate: '₹99 Demo Visit',
    description: 'Certified Electricians for conduit piping, MCB panel installation, 3-phase wiring & safety earthing.',
  },
  {
    id: 'plumber',
    name: 'Plumber',
    subtitle: 'Piping & Sanitary Fittings',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/plumber_zxj5ct.jpg',
    rate: '₹99 Demo Visit',
    description: 'CPVC/UPVC water supply line installation, drainage plumbing, bathroom fittings & sump motor connections.',
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    subtitle: 'Woodwork & Formwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/carpenter_pdnvrz.jpg',
    rate: '₹99 Demo Visit',
    description: 'Specialist Carpenters for door frames, wooden centring, modular kitchen carcasses & plywood shuttering.',
  },
];

export const BACKEND_PROJECT_BUNDLES: ProjectBundleInfo[] = [
  {
    id: 'bundle-masonry-plaster',
    title: 'Masonry & Plastering Starter Combo',
    subtitle: 'Bricks + Sand + Cement (1:4 Mortar Ratio)',
    tag: 'MOST ORDERED • 1:4 RATIO',
    description: 'The exact civil construction ratio for 100 sq.ft of brickwork plus 2-sided plastering. Perfectly bundles 1,000 Kiln Red Bricks with 1 Auto of washed Plastering Sand and 10 Bags of UltraTech PPC Cement to prevent mortar dry cracks.',
    itemsSummary: '1,000 Red Clay Bricks + 1 Auto Plastering Sand + 10 Bags UltraTech PPC',
    itemsIncluded: [
      '1,000 Red Clay Bricks (Kiln-Fired 1st Class)',
      '1 Auto Plastering Sand (~1 Ton Washed)',
      '10 Bags UltraTech Super PPC (500 KG)',
    ],
    savings: 'Save ₹450 / combo',
    price: 14080,
    originalPrice: 14530,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931567/Red_Bricks_paggbp.png',
    targetCategory: 'bricks',
    bundleItems: [
      {
        itemId: 'red-bricks',
        itemName: 'Red Clay Bricks',
        optionLabel: 'Batch of 1000 Bricks',
        unitPrice: 8500,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931567/Red_Bricks_paggbp.png',
        categoryName: 'bricks',
      },
      {
        itemId: 'p-sand-plastering',
        itemName: 'Plastering Sand',
        optionLabel: 'Auto Load (~1 Ton)',
        unitPrice: 1930,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931576/Plastering_Sand_mvhxto.png',
        categoryName: 'sand',
      },
      {
        itemId: 'ultratech-ppc',
        itemName: 'UltraTech Super PPC',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3650,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        categoryName: 'cement',
      },
    ],
  },
  {
    id: 'bundle-rcc-slab-pour',
    title: 'RCC Slab & Column Reinforcement Pack',
    subtitle: '12mm TMT Steel + 20mm Stone + 53 Cement',
    tag: 'STRUCTURAL STRENGTH M25',
    description: 'Engineered structural combination for 150 sq.ft of M25 grade RCC roof slab or column beam pouring. Combines primary Fe550D 12mm rebar bundle with 3 Tons of hard 20mm crushed stone and 10 Bags of UltraTech 53 Grade OPC for high early compressive strength.',
    itemsSummary: '1 Bundle 12mm TMT (5 Rods) + 1 Tractor 20mm Stone + 10 Bags UltraTech 53',
    itemsIncluded: [
      '1 Bundle 12mm TMT Steel (5 Rods - 12m length)',
      '1 Tractor 20mm Stone Aggregate (~3 Tons Full Level)',
      '10 Bags UltraTech 53 Grade OPC (500 KG)',
    ],
    savings: 'Save ₹500 / combo',
    price: 9130,
    originalPrice: 9630,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png',
    targetCategory: 'iron_bars',
    bundleItems: [
      {
        itemId: 'tmt-12mm',
        itemName: 'Iron Bar 12mm',
        optionLabel: '1 Bundle (5 Rods - 12m)',
        unitPrice: 2800,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
        categoryName: 'iron_bars',
      },
      {
        itemId: 'stone-20mm',
        itemName: 'Stone 20mm',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2700,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png',
        categoryName: 'stone',
      },
      {
        itemId: 'ultratech-53',
        itemName: 'UltraTech Cement',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3750,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
        categoryName: 'cement',
      },
    ],
  },
  {
    id: 'bundle-foundation-footing',
    title: 'Foundation & Footing Substructure Pack',
    subtitle: '40mm Stone + M-Sand + Ambuja Cement',
    tag: 'SUB-BASE PCC & FOOTING',
    description: 'Designed for solid sub-base PCC leveling and deep column footing. Combines heavy 40mm angular aggregate with silt-free manufactured sand and waterproof Ambuja Kawach cement to shield reinforcement from ground moisture.',
    itemsSummary: '1 Tractor 40mm Stone + 1 Tractor M-Sand + 10 Bags Ambuja Kawach',
    itemsIncluded: [
      '1 Tractor Stone 40mm (~3 Tons Full Level)',
      '1 Tractor Regular M-Sand (~3 Tons Full Level)',
      '10 Bags Ambuja Kawach Waterproof (500 KG)',
    ],
    savings: 'Save ₹350 / combo',
    price: 8880,
    originalPrice: 9230,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931569/Stone_40mm_gze9gj.png',
    targetCategory: 'stone',
    bundleItems: [
      {
        itemId: 'stone-40mm',
        itemName: 'Stone 40mm',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2600,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931569/Stone_40mm_gze9gj.png',
        categoryName: 'stone',
      },
      {
        itemId: 'm-sand-concrete',
        itemName: 'Regular Sand',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2400,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931585/Regular_Sand_ajv0wc.png',
        categoryName: 'sand',
      },
      {
        itemId: 'ambuja-kawach',
        itemName: 'Ambuja Cement',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3880,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        categoryName: 'cement',
      },
    ],
  },
];

export const BACKEND_MATERIAL_ITEMS: any[] = [
  // TILES
  {
    id: 'vitrified-double-charge',
    categoryId: 'tiles',
    category: 'Tiles',
    name: 'Vitrified Double Charge Tiles',
    subtitle: '600x600 mm (2x2 ft) Premium Gloss',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 58,
    unit: 'Sq.Ft',
    inStock: true,
    stockQuantity: 8500,
    hsnCode: '69072100',
    gstRate: 18,
    fastDispatch: true,
    tag: 'TILES',
    options: [
      { id: 'v-box-4', label: '1 Box (4 Tiles / 15.5 Sq.Ft)', price: 899, type: 'radio' },
      { id: 'v-pallet', label: 'Pallet Bundle (~1,500 Sq.Ft)', price: 81000, type: 'radio' },
    ],
    specifications: {
      fineness: 'Water absorption < 0.05%',
      compressiveStrength: '> 35 N/mm²',
      grade: 'Grade 1 Double Charge',
    },
  },
  {
    id: 'ceramic-designer-wall',
    categoryId: 'tiles',
    category: 'Tiles',
    name: 'Ceramic Designer Wall Tiles',
    subtitle: '300x450 mm (1x1.5 ft) Kitchen & Bath',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 42,
    unit: 'Sq.Ft',
    inStock: true,
    stockQuantity: 6200,
    hsnCode: '69072200',
    gstRate: 18,
    fastDispatch: true,
    tag: 'TILES',
    options: [
      { id: 'w-box-6', label: '1 Box (6 Tiles / 9 Sq.Ft)', price: 380, type: 'radio' },
      { id: 'w-pallet', label: 'Pallet Bundle (~900 Sq.Ft)', price: 35000, type: 'radio' },
    ],
  },
  {
    id: 'antiskid-floor-tiles',
    categoryId: 'tiles',
    category: 'Tiles',
    name: 'Anti-Skid Matte Floor Tiles',
    subtitle: '300x300 mm (1x1 ft) Wet Area & Balcony',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 48,
    unit: 'Sq.Ft',
    inStock: true,
    stockQuantity: 4100,
    hsnCode: '69072300',
    gstRate: 18,
    fastDispatch: true,
    tag: 'TILES',
    options: [
      { id: 'f-box-9', label: '1 Box (9 Tiles / 9 Sq.Ft)', price: 430, type: 'radio' },
      { id: 'f-pallet', label: 'Pallet Bundle (~900 Sq.Ft)', price: 39000, type: 'radio' },
    ],
  },
  {
    id: 'heavy-duty-paver-tiles',
    categoryId: 'tiles',
    category: 'Tiles',
    name: 'Heavy Duty Parking & Paver Tiles',
    subtitle: '400x400 mm (16x16 inch) 12mm Outdoor Grade',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 65,
    unit: 'Sq.Ft',
    inStock: true,
    stockQuantity: 5300,
    hsnCode: '68101910',
    gstRate: 18,
    fastDispatch: true,
    tag: 'TILES',
    options: [
      { id: 'p-box-5', label: '1 Box (5 Tiles / 8.6 Sq.Ft)', price: 560, type: 'radio' },
      { id: 'p-pallet', label: 'Pallet Bundle (~860 Sq.Ft)', price: 51000, type: 'radio' },
    ],
  },
  // CEMENT
  {
    id: 'ultratech-53',
    categoryId: 'cement',
    category: 'Cement',
    name: 'UltraTech Cement',
    subtitle: '53 Grade OPC (50kg Bag)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 380,
    unit: 'Bag (50kg)',
    inStock: true,
    stockQuantity: 4500,
    hsnCode: '25232910',
    gstRate: 28,
    fastDispatch: true,
    tag: 'CEMENT',
    options: [
      { id: 'ut-1bag', label: '1 Bag (50 KG)', price: 380, type: 'radio' },
      { id: 'ut-50bag', label: 'Pallet Bundle (50 Bags / 2.5 Tons)', price: 18500, type: 'radio' },
    ],
    specifications: {
      fineness: '310 m²/kg (Blaine)',
      soundness: '1.2 mm (Le Chatelier)',
      settingTime: 'Initial: 110 min, Final: 215 min',
      compressiveStrength: '53.8 MPa (28 Days)',
      grade: '53 Grade OPC',
    },
  },
  {
    id: 'ultratech-ppc',
    categoryId: 'cement',
    category: 'Cement',
    name: 'UltraTech Super',
    subtitle: 'PPC Weather Shield (50kg Bag)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 365,
    unit: 'Bag (50kg)',
    inStock: true,
    stockQuantity: 3800,
    hsnCode: '25232930',
    gstRate: 28,
    fastDispatch: true,
    tag: 'CEMENT',
    options: [
      { id: 'utppc-1bag', label: '1 Bag (50 KG)', price: 365, type: 'radio' },
      { id: 'utppc-50bag', label: 'Pallet Bundle (50 Bags / 2.5 Tons)', price: 17800, type: 'radio' },
    ],
  },
  {
    id: 'ambuja-kawach',
    categoryId: 'cement',
    category: 'Cement',
    name: 'Ambuja Cement',
    subtitle: 'Kawach Waterproof (50kg Bag)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 395,
    unit: 'Bag (50kg)',
    inStock: true,
    stockQuantity: 2900,
    hsnCode: '25232910',
    gstRate: 28,
    fastDispatch: true,
    tag: 'CEMENT',
    options: [
      { id: 'amb-1bag', label: '1 Bag (50 KG)', price: 395, type: 'radio' },
      { id: 'amb-50bag', label: 'Pallet Bundle (50 Bags / 2.5 Tons)', price: 19200, type: 'radio' },
    ],
  },
  {
    id: 'acc-gold',
    categoryId: 'cement',
    category: 'Cement',
    name: 'ACC Cement',
    subtitle: 'Gold Water Shield (50kg Bag)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_acowooacowooacow_vt85zm.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 385,
    unit: 'Bag (50kg)',
    inStock: true,
    stockQuantity: 2200,
    hsnCode: '25232910',
    gstRate: 28,
    fastDispatch: true,
    tag: 'CEMENT',
    options: [
      { id: 'acc-1bag', label: '1 Bag (50 KG)', price: 385, type: 'radio' },
      { id: 'acc-50bag', label: 'Pallet Bundle (50 Bags / 2.5 Tons)', price: 18800, type: 'radio' },
    ],
  },
  {
    id: 'dalmia-dsp',
    categoryId: 'cement',
    category: 'Cement',
    name: 'Dalmia DSP Cement',
    subtitle: 'High Performance Slag / OPC',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 375,
    unit: 'Bag (50kg)',
    inStock: true,
    stockQuantity: 1950,
    hsnCode: '25232920',
    gstRate: 28,
    fastDispatch: true,
    tag: 'CEMENT',
    options: [
      { id: 'dl-1bag', label: '1 Bag (50 KG)', price: 375, type: 'radio' },
      { id: 'dl-50bag', label: 'Pallet Bundle (50 Bags / 2.5 Tons)', price: 18200, type: 'radio' },
    ],
  },
  // SAND
  {
    id: 'm-sand-concrete',
    categoryId: 'sand',
    category: 'Sand',
    name: 'Regular Sand',
    subtitle: 'Zone II (Concrete Grade)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931585/Regular_Sand_ajv0wc.png',
    actionType: 'add_to_cart',
    defaultPrice: 70,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 1200,
    hsnCode: '25051011',
    gstRate: 5,
    fastDispatch: true,
    tag: 'SAND',
    options: [
      { id: 'msand-1bag', label: '1 Bag (50 KG)', price: 70, type: 'radio' },
      { id: 'msand-1ton', label: '1 Ton (Direct Quarry)', price: 1650, type: 'radio' },
      { id: 'msand-trac', label: 'Tractor Full level (~3 Tons)', price: 2400, type: 'radio' },
      { id: 'msand-tipp', label: 'Tipper Full (~10 Tons)', price: 7500, type: 'radio' },
    ],
    specifications: {
      siltContent: '0.8% (IS limit < 3%)',
      zone: 'Zone II (0-4.75mm)',
      bulkDensity: '1.68 Tons/m³',
    },
  },
  {
    id: 'p-sand-plastering',
    categoryId: 'sand',
    category: 'Sand',
    name: 'Plastering Sand',
    subtitle: 'Ultra Fine (Zone IV)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931576/Plastering_Sand_mvhxto.png',
    actionType: 'add_to_cart',
    defaultPrice: 75,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 950,
    hsnCode: '25051012',
    gstRate: 5,
    fastDispatch: true,
    tag: 'SAND',
    options: [
      { id: 'psand-1bag', label: '1 Bag (50 KG)', price: 75, type: 'radio' },
      { id: 'psand-1ton', label: '1 Ton (Triple-Washed)', price: 1750, type: 'radio' },
      { id: 'psand-auto', label: 'Auto Load (~1 Ton)', price: 1930, type: 'radio' },
      { id: 'psand-trac', label: 'Tractor Full level (~3 Tons)', price: 2600, type: 'radio' },
      { id: 'psand-tipp', label: 'Tipper Full (~10 Tons)', price: 8200, type: 'radio' },
    ],
  },
  {
    id: 'river-sand-natural',
    categoryId: 'sand',
    category: 'Sand',
    name: 'River Sand',
    subtitle: 'Natural River Bed Grade',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931585/Regular_Sand_ajv0wc.png',
    actionType: 'add_to_cart',
    defaultPrice: 90,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 600,
    hsnCode: '25051019',
    gstRate: 5,
    fastDispatch: true,
    tag: 'SAND',
    options: [
      { id: 'rs-1bag', label: '1 Bag (50 KG)', price: 90, type: 'radio' },
      { id: 'rs-trac', label: 'Tractor Full level (~3 Tons)', price: 3400, type: 'radio' },
      { id: 'rs-tipp', label: 'Tipper Full (~10 Tons)', price: 11000, type: 'radio' },
    ],
  },
  // STONE & AGGREGATES
  {
    id: 'stone-20mm',
    categoryId: 'stone',
    category: 'Stone',
    name: 'Stone 20mm',
    subtitle: 'Blue Metal Granite (RCC Mix)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png',
    actionType: 'add_to_cart',
    defaultPrice: 70,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 2500,
    hsnCode: '25171010',
    gstRate: 5,
    fastDispatch: true,
    tag: 'AGGREGATES',
    options: [
      { id: 'st20-1bag', label: '1 Bag (50 KG)', price: 70, type: 'radio' },
      { id: 'st20-1ton', label: '1 Ton (Direct Yard Crushed)', price: 1450, type: 'radio' },
      { id: 'st20-trac', label: 'Tractor Full level (~3 Tons)', price: 2700, type: 'radio' },
      { id: 'st20-tipp', label: 'Tipper Full (~10 Tons)', price: 8400, type: 'radio' },
    ],
    specifications: {
      compressiveStrength: '> 120 MPa Crushing Value',
      grade: '20mm Angular Blue Granite',
    },
  },
  {
    id: 'stone-10mm',
    categoryId: 'stone',
    category: 'Stone',
    name: 'Stone 10mm',
    subtitle: 'Fine Granite Aggregate',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931576/Stone_10mm_kvfjbe.png',
    actionType: 'add_to_cart',
    defaultPrice: 75,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 1800,
    hsnCode: '25171010',
    gstRate: 5,
    fastDispatch: true,
    tag: 'AGGREGATES',
    options: [
      { id: 'st10-1bag', label: '1 Bag (50 KG)', price: 75, type: 'radio' },
      { id: 'st10-1ton', label: '1 Ton (Fine Blue Crushed)', price: 1520, type: 'radio' },
      { id: 'st10-trac', label: 'Tractor Full level (~3 Tons)', price: 2800, type: 'radio' },
      { id: 'st10-tipp', label: 'Tipper Full (~10 Tons)', price: 8600, type: 'radio' },
    ],
  },
  {
    id: 'stone-40mm',
    categoryId: 'stone',
    category: 'Stone',
    name: 'Stone 40mm',
    subtitle: 'Base Concrete & Road Metal',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931569/Stone_40mm_gze9gj.png',
    actionType: 'add_to_cart',
    defaultPrice: 65,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 2100,
    hsnCode: '25171010',
    gstRate: 5,
    fastDispatch: true,
    tag: 'AGGREGATES',
    options: [
      { id: 'st40-1bag', label: '1 Bag (50 KG)', price: 65, type: 'radio' },
      { id: 'st40-1ton', label: '1 Ton (Base Subgrade)', price: 1380, type: 'radio' },
      { id: 'st40-trac', label: 'Tractor Full level (~3 Tons)', price: 2600, type: 'radio' },
      { id: 'st40-tipp', label: 'Tipper Full (~10 Tons)', price: 7900, type: 'radio' },
    ],
  },
  // BRICKS & BLOCKS
  {
    id: 'red-bricks',
    categoryId: 'bricks',
    category: 'Bricks',
    name: 'Red Clay Bricks',
    subtitle: 'Kiln Fired 1st Class (9x4x3 inch)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931567/Red_Bricks_paggbp.png',
    actionType: 'add_to_cart',
    defaultPrice: 9.5,
    unit: 'Piece',
    inStock: true,
    stockQuantity: 65000,
    hsnCode: '69041000',
    gstRate: 12,
    fastDispatch: true,
    tag: 'BRICKS',
    options: [
      { id: 'rb-batch', label: 'Batch of 1000 Bricks', price: 8500, type: 'radio' },
      { id: 'rb-tractor', label: 'Tractor Full (~2500 Bricks)', price: 21000, type: 'radio' },
      { id: 'rb-truck', label: 'Truck Load (~5000 Bricks)', price: 41000, type: 'radio' },
    ],
    specifications: {
      compressiveStrength: '> 10.5 N/mm²',
      grade: 'Class 1 Kiln Burnt',
    },
  },
  {
    id: 'aac-blocks-4inch',
    categoryId: 'bricks',
    category: 'Bricks',
    name: 'AAC Blocks 4 Inch',
    subtitle: '600 x 200 x 100 mm (Precision)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931560/ACC_Blocks_skzqyb.png',
    actionType: 'add_to_cart',
    defaultPrice: 52,
    unit: 'Piece',
    inStock: true,
    stockQuantity: 14000,
    hsnCode: '68101110',
    gstRate: 12,
    fastDispatch: true,
    tag: 'BRICKS',
    options: [
      { id: 'aac4-100', label: 'Pack of 100 Blocks', price: 5200, type: 'radio' },
      { id: 'aac4-truck', label: 'Full Truck Load (800 Blocks)', price: 39500, type: 'radio' },
    ],
  },
  {
    id: 'aac-blocks-6inch',
    categoryId: 'bricks',
    category: 'Bricks',
    name: 'AAC Blocks 6 Inch',
    subtitle: '600 x 200 x 150 mm (Heavy Duty)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931577/Concrete_Blocks_ywqgc3.png',
    actionType: 'add_to_cart',
    defaultPrice: 62,
    unit: 'Piece',
    inStock: true,
    stockQuantity: 18000,
    hsnCode: '68101110',
    gstRate: 12,
    fastDispatch: true,
    tag: 'BRICKS',
    options: [
      { id: 'aac6-100', label: 'Pack of 100 Blocks', price: 6200, type: 'radio' },
      { id: 'aac6-truck', label: 'Full Truck Load (600 Blocks)', price: 36000, type: 'radio' },
    ],
  },
  // STEEL & REBARS
  {
    id: 'tmt-8mm',
    categoryId: 'iron_bars',
    category: 'Steel',
    name: 'Iron Bar 8mm',
    subtitle: 'Fe 550D High Ductility (Stirrups)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
    actionType: 'add_to_cart',
    defaultPrice: 380,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 95,
    hsnCode: '72142090',
    gstRate: 18,
    fastDispatch: true,
    tag: 'STEEL & TMT',
    options: [
      { id: 'tmt8-1rod', label: '1 Bundle (10 Rods - 12m length)', price: 3800, type: 'radio' },
      { id: 'tmt8-ton', label: '1 Ton (~210 Rods)', price: 62500, type: 'radio' },
    ],
    specifications: {
      compressiveStrength: 'Fe 550D (550 MPa Yield)',
      grade: 'Fe 550D Super Ductile',
    },
  },
  {
    id: 'tmt-10mm',
    categoryId: 'iron_bars',
    category: 'Steel',
    name: 'Iron Bar 10mm',
    subtitle: 'Fe 550D High Tensile (Slab/Beam)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
    actionType: 'add_to_cart',
    defaultPrice: 580,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 120,
    hsnCode: '72142090',
    gstRate: 18,
    fastDispatch: true,
    tag: 'STEEL & TMT',
    options: [
      { id: 'tmt10-1rod', label: '1 Bundle (7 Rods - 12m length)', price: 4100, type: 'radio' },
      { id: 'tmt10-ton', label: '1 Ton (~135 Rods)', price: 62500, type: 'radio' },
    ],
  },
  {
    id: 'tmt-12mm',
    categoryId: 'iron_bars',
    category: 'Steel',
    name: 'Iron Bar 12mm',
    subtitle: 'Fe 550D Primary Mill (Column & Beam)',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
    actionType: 'add_to_cart',
    defaultPrice: 830,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 140,
    hsnCode: '72142090',
    gstRate: 18,
    fastDispatch: true,
    tag: 'STEEL & TMT',
    options: [
      { id: 'tmt12-1rod', label: '1 Bundle (5 Rods - 12m length)', price: 2800, type: 'radio' },
      { id: 'tmt12-ton', label: '1 Ton (~94 Rods)', price: 62500, type: 'radio' },
    ],
  },
  {
    id: 'tmt-16mm',
    categoryId: 'iron_bars',
    category: 'Steel',
    name: 'Iron Bar 16mm',
    subtitle: 'Fe 550D Structural Column Grade',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
    actionType: 'add_to_cart',
    defaultPrice: 1480,
    unit: 'Ton',
    inStock: true,
    stockQuantity: 80,
    hsnCode: '72142090',
    gstRate: 18,
    fastDispatch: true,
    tag: 'STEEL & TMT',
    options: [
      { id: 'tmt16-1rod', label: '1 Bundle (3 Rods - 12m length)', price: 4400, type: 'radio' },
      { id: 'tmt16-ton', label: '1 Ton (~53 Rods)', price: 62200, type: 'radio' },
    ],
  },
  // CENTRING & FORMWORK
  {
    id: 'steel-centring-sheets',
    categoryId: 'centring',
    category: 'Centring',
    name: 'Steel Sheets',
    subtitle: 'Heavy Gauge Slab Formwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931558/Centering_Plywood_zoikgt.png',
    actionType: 'add_to_cart',
    defaultPrice: 160,
    unit: 'Sheet',
    inStock: true,
    stockQuantity: 3200,
    hsnCode: '73089090',
    gstRate: 18,
    fastDispatch: true,
    tag: 'FORMWORK',
    options: [
      { id: 'sheet-3x2', label: '3 x 2 Feet Sheet (14 Gauge)', price: 160, type: 'stepper' },
      { id: 'sheet-4x2', label: '4 x 2 Feet Sheet (14 Gauge)', price: 210, type: 'stepper' },
    ],
  },
  {
    id: 'adjustable-steel-props',
    categoryId: 'centring',
    category: 'Centring',
    name: 'Steel Props',
    subtitle: 'Adjustable Jack Poles',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Steel_Props_de7tta.png',
    actionType: 'add_to_cart',
    defaultPrice: 680,
    unit: 'Piece',
    inStock: true,
    stockQuantity: 1500,
    hsnCode: '73084000',
    gstRate: 18,
    fastDispatch: true,
    tag: 'FORMWORK',
    options: [
      { id: 'prop-2m', label: '2 Meter Adjustable Prop Jack', price: 680, type: 'stepper' },
      { id: 'prop-3.8m', label: '3.8 Meter Heavy Duty Prop Jack', price: 920, type: 'stepper' },
    ],
  },
  // SERVICES (Direct booking items)
  {
    id: 'service-mason',
    categoryId: 'services',
    category: 'Services',
    name: 'Mason',
    subtitle: 'Tile & Brickwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
  {
    id: 'service-painter',
    categoryId: 'services',
    category: 'Services',
    name: 'Painter',
    subtitle: 'Wall Painting',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/painter_dofdp9.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
  {
    id: 'service-fabricator',
    categoryId: 'services',
    category: 'Services',
    name: 'Fabricator',
    subtitle: 'Steel & Welding',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/fabricator_dmfp4t.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
  {
    id: 'service-electrician',
    categoryId: 'services',
    category: 'Services',
    name: 'Electrician',
    subtitle: 'Wiring & Panels',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852931/electrician_imidbv.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
  {
    id: 'service-plumber',
    categoryId: 'services',
    category: 'Services',
    name: 'Plumber',
    subtitle: 'Piping & Sanitary',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/plumber_zxj5ct.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
  {
    id: 'service-carpenter',
    categoryId: 'services',
    category: 'Services',
    name: 'Carpenter',
    subtitle: 'Woodwork & Doors',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/carpenter_pdnvrz.jpg',
    actionType: 'add_to_cart',
    defaultPrice: 99,
    unit: 'Visit',
    inStock: true,
    stockQuantity: 100,
    tag: 'SERVICES',
    options: [
      { id: 'demo-session', label: '1x Expert Site Visit Demo Session', price: 99, type: 'radio' },
    ],
  },
];

let inMemoryCategories = [...BACKEND_CATEGORIES];
let inMemoryServices = [...BACKEND_SERVICES];
let inMemoryBundles = [...BACKEND_PROJECT_BUNDLES];
let inMemoryMaterials = [...BACKEND_MATERIAL_ITEMS];

export function getDefaultImageForCategory(categoryId: string, name: string = ''): string {
  const cat = (categoryId || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (cat.includes('cement') || n.includes('cement')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg';
  }
  if (cat.includes('brick') || n.includes('brick') || n.includes('aac') || n.includes('block')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg';
  }
  if (cat.includes('sand') || n.includes('sand') || n.includes('m-sand') || n.includes('p-sand')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg';
  }
  if (cat.includes('stone') || cat.includes('aggregate') || n.includes('aggregate') || n.includes('granite') || n.includes('gravel')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/stones2_i0cjzq.jpg';
  }
  if (cat.includes('iron') || cat.includes('steel') || n.includes('tmt') || n.includes('rebar') || n.includes('steel')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg';
  }
  if (cat.includes('centring') || cat.includes('formwork') || n.includes('scaffolding') || n.includes('plank')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/centering2_lb7s6n.jpg';
  }
  if (cat.includes('tile') || cat.includes('floor') || n.includes('tile') || n.includes('granite slab') || n.includes('marble')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg';
  }
  if (cat.includes('service') || n.includes('mason') || n.includes('painter') || n.includes('electrician') || n.includes('plumber')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg';
  }
  return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
}

export class MaterialService {
  public static async getAllMaterials(filter: { category?: string; search?: string } = {}) {
    try {
      if (mongoose.connection.readyState === 1) {
        const query: Record<string, any> = {};
        if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
          query.$or = [
            { categoryId: filter.category.toLowerCase() },
            { category: { $regex: filter.category, $options: 'i' } },
          ];
        }
        if (filter.search) {
          query.$or = [
            { name: { $regex: filter.search, $options: 'i' } },
            { subtitle: { $regex: filter.search, $options: 'i' } },
            { description: { $regex: filter.search, $options: 'i' } },
          ];
        }

        let materials = await Material.find(query).sort({ createdAt: -1 }).lean().exec();

        // Auto-seed default materials if collection is completely empty
        if (materials.length === 0 && !filter.search && (!filter.category || filter.category === 'All' || filter.category === 'all')) {
          await this.seedDefaultMaterials();
          materials = await Material.find(query).sort({ createdAt: -1 }).lean().exec();
        }

        if (materials && materials.length > 0) {
          return materials;
        }
      }
    } catch (err) {
      console.warn('Using in-memory dynamic materials catalogue:', err);
    }

    // Filter in-memory dynamic catalogue
    return inMemoryMaterials.filter((m) => {
      if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
        const cat = filter.category.toLowerCase();
        const matchesCategory =
          (m.categoryId && m.categoryId.toLowerCase() === cat) ||
          (m.category && m.category.toLowerCase() === cat);
        if (!matchesCategory) return false;
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matchesSearch =
          (m.name && m.name.toLowerCase().includes(s)) ||
          (m.subtitle && m.subtitle.toLowerCase().includes(s)) ||
          (m.description && m.description.toLowerCase().includes(s));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }

  public static async getMaterialById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const material = await Material.findOne({ $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] }).lean().exec();
        if (material) return material;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryMaterials.find((m: any) => m.id === id || m._id === id || m.name === id) || null;
  }

  // --- CATEGORIES CRUD ---
  public static getCategories() {
    return inMemoryCategories;
  }

  public static getCategoryById(id: string) {
    return inMemoryCategories.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static createCategory(data: Partial<CategoryInfo>) {
    const rawId = (data.id || data.name || `cat_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCategory: CategoryInfo = {
      id: rawId,
      name: data.name || 'New Category',
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory(rawId, data.name),
      count: data.count || '1 Product',
      priceLabel: data.priceLabel || 'From ₹99',
      subcategoriesText: data.subcategoriesText || '',
      tag: data.tag || data.name?.toUpperCase() || 'GENERAL',
    };
    inMemoryCategories.push(newCategory);
    return newCategory;
  }

  public static updateCategory(id: string, data: Partial<CategoryInfo>) {
    const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...data };
      return inMemoryCategories[idx];
    }
    return null;
  }

  public static deleteCategory(id: string) {
    const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryCategories.splice(idx, 1);
      return removed;
    }
    return null;
  }

  // --- SERVICES CRUD ---
  public static getServices() {
    return inMemoryServices;
  }

  public static getServiceById(id: string) {
    return inMemoryServices.find((s) => s.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static createService(data: Partial<ServiceInfo>) {
    const rawId = (data.id || data.name || `srv_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newService: ServiceInfo = {
      id: rawId,
      name: data.name || 'New Service',
      subtitle: data.subtitle || 'Certified Trade Expert',
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory('services', data.name),
      rate: data.rate || '₹99 Demo Visit',
      description: data.description || 'Experienced certified construction trade professional for site works.',
      tag: data.tag || 'SERVICES',
    };
    inMemoryServices.push(newService);
    return newService;
  }

  public static updateService(id: string, data: Partial<ServiceInfo>) {
    const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryServices[idx] = { ...inMemoryServices[idx], ...data };
      return inMemoryServices[idx];
    }
    return null;
  }

  public static deleteService(id: string) {
    const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryServices.splice(idx, 1);
      return removed;
    }
    return null;
  }

  // --- PROJECT BUNDLES CRUD ---
  public static getProjectBundles() {
    return inMemoryBundles;
  }

  public static getProjectBundleById(id: string) {
    return inMemoryBundles.find((b) => b.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static createProjectBundle(data: Partial<ProjectBundleInfo>) {
    const rawId = (data.id || data.title || `bnd_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newBundle: ProjectBundleInfo = {
      id: rawId,
      title: data.title || 'Project Starter Combo',
      subtitle: data.subtitle || 'All-in-one Construction Package',
      tag: data.tag || 'POPULAR COMBO',
      description: data.description || 'Pre-engineered package combo with bundled savings.',
      itemsSummary: data.itemsSummary || 'Multiple Items Included',
      itemsIncluded: data.itemsIncluded || ['Cement', 'Sand', 'Aggregates'],
      savings: data.savings || 'Save 10%',
      price: Number(data.price) || 5000,
      originalPrice: Number(data.originalPrice) || 5500,
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory('cement', data.title),
      targetCategory: data.targetCategory || 'cement',
      bundleItems: data.bundleItems || [],
    };
    inMemoryBundles.push(newBundle);
    return newBundle;
  }

  public static updateProjectBundle(id: string, data: Partial<ProjectBundleInfo>) {
    const idx = inMemoryBundles.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryBundles[idx] = { ...inMemoryBundles[idx], ...data };
      return inMemoryBundles[idx];
    }
    return null;
  }

  public static deleteProjectBundle(id: string) {
    const idx = inMemoryBundles.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryBundles.splice(idx, 1);
      return removed;
    }
    return null;
  }

  // --- MATERIALS CRUD ---
  public static async createMaterial(data: Partial<IMaterial> | any) {
    const categoryId = (data.categoryId || data.category || 'cement').toLowerCase();
    const resolvedImage =
      data.image && typeof data.image === 'string' && data.image.startsWith('http')
        ? data.image
        : getDefaultImageForCategory(categoryId, data.name);

    const itemData = {
      id: data.id || `mat_${Date.now()}`,
      categoryId,
      category: data.category || 'General',
      subCategory: data.subCategory || '',
      name: data.name || 'New Material',
      subtitle: data.subtitle || 'Direct Quarry & Plant Supply',
      description: data.description || 'Premium quality verified construction material.',
      image: resolvedImage,
      actionType: data.actionType || 'configure',
      defaultPrice: Number(data.defaultPrice) || 100,
      unit: data.unit || 'Unit',
      hsnCode: data.hsnCode || '252329',
      gstRate: Number(data.gstRate) || 18,
      inStock: data.inStock ?? true,
      stockQuantity: Number(data.stockQuantity) || 1000,
      rating: Number(data.rating) || 4.8,
      reviewsCount: Number(data.reviewsCount) || 24,
      tag: data.tag || 'VERIFIED',
      unitOptions: data.unitOptions || [
        {
          id: 'standard-unit',
          name: 'Standard Unit',
          unitLabel: data.unit || 'Unit',
          price: Number(data.defaultPrice) || 100,
          description: 'Standard wholesale volume',
          moq: 1,
          isDefault: true,
        },
      ],
      specifications: data.specifications || {},
      originYard: data.originYard || 'Urbanico Central Yard, Hyderabad',
      ...data,
    };

    // Ensure image is clean
    itemData.image = resolvedImage;

    try {
      if (mongoose.connection.readyState === 1) {
        const material = new Material(itemData);
        await material.save();
        return material.toObject();
      }
    } catch (err) {
      // fallback
    }

    inMemoryMaterials.unshift(itemData);
    return itemData;
  }

  public static async updateMaterial(id: string, data: Partial<IMaterial> | any) {
    if (data.image && typeof data.image === 'string' && !data.image.startsWith('http')) {
      delete data.image;
    }

    try {
      if (mongoose.connection.readyState === 1) {
        const updated = await Material.findOneAndUpdate(
          { $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] },
          { $set: data },
          { new: true }
        ).lean().exec();
        if (updated) return updated;
      }
    } catch (err) {}

    const idx = inMemoryMaterials.findIndex((m) => m.id === id || m._id === id);
    if (idx !== -1) {
      inMemoryMaterials[idx] = { ...inMemoryMaterials[idx], ...data };
      return inMemoryMaterials[idx];
    }
    return null;
  }

  public static async deleteMaterial(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const deleted = await Material.findOneAndDelete({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (deleted) return deleted;
      }
    } catch (err) {}

    const idx = inMemoryMaterials.findIndex((m) => m.id === id || m._id === id);
    if (idx !== -1) {
      const [removed] = inMemoryMaterials.splice(idx, 1);
      return removed;
    }
    return null;
  }

  public static async seedDefaultMaterials() {
    try {
      if (mongoose.connection.readyState === 1) {
        const count = await Material.countDocuments().exec();
        if (count === 0) {
          await Material.insertMany(BACKEND_MATERIAL_ITEMS);
          console.log('🌱 Seeded default Urbanico construction materials successfully.');
        }
      }
    } catch (err: any) {
      console.error('Error seeding default materials:', err.message);
    }
  }
}
