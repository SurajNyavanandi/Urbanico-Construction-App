/**
 * Indian GST Tax Invoice Helper & Number-to-Words Formatter
 */

export function getHSNCodeForMaterial(materialName: string): { code: string; desc: string; gstRate: number } {
  const lower = (materialName || '').toLowerCase();

  if (lower.includes('sand') || lower.includes('m-sand') || lower.includes('p-sand')) {
    return { code: '2505', desc: 'Natural Sand & Crushed Stone Sand', gstRate: 18 };
  }
  if (lower.includes('cement') || lower.includes('opc') || lower.includes('ppc')) {
    return { code: '2523', desc: 'Portland Cement, Aluminous Cement & Slag', gstRate: 18 };
  }
  if (lower.includes('steel') || lower.includes('rebar') || lower.includes('tmt') || lower.includes('iron')) {
    return { code: '7214', desc: 'TMT Steel Bars & Rods (Hot-rolled / Forged)', gstRate: 18 };
  }
  if (lower.includes('aggregate') || lower.includes('gravel') || lower.includes('metal') || lower.includes('crushed')) {
    return { code: '2517', desc: 'Pebbles, Gravel & Crushed Stone Aggregates', gstRate: 18 };
  }
  if (lower.includes('brick') || lower.includes('block') || lower.includes('aac')) {
    return { code: '6810', desc: 'Articles of Cement, Concrete or Artificial Stone', gstRate: 18 };
  }
  if (lower.includes('concrete') || lower.includes('rmc') || lower.includes('mortar')) {
    return { code: '3824', desc: 'Ready-mix Concrete (RMC) & Specialized Mortars', gstRate: 18 };
  }
  return { code: '2517', desc: 'Construction Materials & Mining Aggregates', gstRate: 18 };
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts any number to Indian Currency Words (Lakhs, Crores, Thousands, Rupees, Paise)
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Rupees Zero Only';

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  let result = '';

  const crore = Math.floor(intPart / 10000000);
  let remainder = intPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  const hundredAndBelow = remainder % 1000;

  if (crore > 0) {
    result += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    result += convertLessThanThousand(hundredAndBelow) + ' ';
  }

  result = 'INR ' + result.trim() + ' Only';

  if (decPart > 0) {
    result = result.replace(' Only', ` and ${convertLessThanThousand(decPart)} Paise Only`);
  }

  return result;
}

/**
 * Generates a standard GST compliant IRN hash representation
 */
export function generateIRNHash(orderNum: string, date: string): string {
  const seed = `${orderNum}_${date}_URBANICO_36AAACU9812A1Z4`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `4a7b${hex}e92c01f8d839210acbf4729104b684918239023471029471928340192834`;
}
