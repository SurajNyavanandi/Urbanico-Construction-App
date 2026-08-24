/**
 * Live Commodity Spot Rates & Index for Hyderabad / Telangana Construction Markets
 */

export interface CommodityRate {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  dailyRange: { low: number; high: number };
  sevenDayTrend: number[];
  recommendation: string;
}

export const COMMODITY_SPOT_RATES: CommodityRate[] = [
  {
    id: 'tmt-fe550d',
    name: 'TMT Rebar Fe-550D (Primary)',
    category: 'Steel',
    unit: 'Ton',
    currentPrice: 52400,
    previousClose: 52900,
    change: -500,
    changePercent: -0.95,
    lastUpdated: 'Today, 9:00 AM IST',
    marketTrend: 'bearish',
    dailyRange: { low: 52100, high: 53200 },
    sevenDayTrend: [53800, 53500, 53200, 53000, 52900, 52600, 52400],
    recommendation: 'Good buying window. Raw billet imports have stabilized steel mills.',
  },
  {
    id: 'cement-opc53',
    name: 'OPC 53 Grade Cement (UltraTech/ACC)',
    category: 'Cement',
    unit: '50kg Bag',
    currentPrice: 385,
    previousClose: 380,
    change: 5,
    changePercent: 1.31,
    lastUpdated: 'Today, 9:00 AM IST',
    marketTrend: 'bullish',
    dailyRange: { low: 380, high: 390 },
    sevenDayTrend: [375, 375, 380, 380, 380, 385, 385],
    recommendation: 'Demand spike from monsoon-end slab pours. Lock bulk bookings early.',
  },
  {
    id: 'm-sand-zone2',
    name: 'Manufactured Sand (M-Sand Zone-II)',
    category: 'Aggregates',
    unit: 'Brass (100 cft)',
    currentPrice: 4200,
    previousClose: 4200,
    change: 0,
    changePercent: 0,
    lastUpdated: 'Today, 8:30 AM IST',
    marketTrend: 'neutral',
    dailyRange: { low: 4150, high: 4300 },
    sevenDayTrend: [4150, 4200, 4200, 4200, 4200, 4200, 4200],
    recommendation: 'Crusher supply steady at Medchal and Patancheru yards.',
  },
  {
    id: 'blue-metal-20mm',
    name: 'Granite Blue Metal (20mm Coarse)',
    category: 'Aggregates',
    unit: 'Brass (100 cft)',
    currentPrice: 3600,
    previousClose: 3650,
    change: -50,
    changePercent: -1.37,
    lastUpdated: 'Today, 8:30 AM IST',
    marketTrend: 'bearish',
    dailyRange: { low: 3550, high: 3650 },
    sevenDayTrend: [3700, 3680, 3650, 3650, 3650, 3600, 3600],
    recommendation: 'High quarry stockpile volume available for immediate dispatch.',
  },
  {
    id: 'aac-blocks-4inch',
    name: 'AAC Blocks 600x200x100mm (Grade-I)',
    category: 'Masonry',
    unit: 'CBM (Cu.m)',
    currentPrice: 2850,
    previousClose: 2850,
    change: 0,
    changePercent: 0,
    lastUpdated: 'Today, 9:00 AM IST',
    marketTrend: 'neutral',
    dailyRange: { low: 2800, high: 2900 },
    sevenDayTrend: [2900, 2850, 2850, 2850, 2850, 2850, 2850],
    recommendation: 'Stable rates. Ideal for interior partition procurement.',
  },
];
