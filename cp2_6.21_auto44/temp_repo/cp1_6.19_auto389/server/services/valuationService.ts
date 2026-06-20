interface ValuationResult {
  suggestedPrice: number;
  priceRangeMin: number;
  priceRangeMax: number;
  basis: string;
  marketReference: number;
  depreciationRate: number;
}

interface PriceEntry {
  brand: string;
  model: string;
  category: string;
  price: number;
}

const priceTable: PriceEntry[] = [
  { brand: '雅马哈', model: 'F310', category: 'guitar', price: 899 },
  { brand: '雅马哈', model: 'FG830', category: 'guitar', price: 2580 },
  { brand: '雅马哈', model: 'LL16', category: 'guitar', price: 6800 },
  { brand: '雅马哈', model: 'LLTA', category: 'guitar', price: 12800 },
  { brand: '雅马哈', model: 'P125', category: 'keyboard', price: 4299 },
  { brand: '雅马哈', model: 'P515', category: 'keyboard', price: 9800 },
  { brand: '雅马哈', model: 'CVP805', category: 'keyboard', price: 38800 },
  { brand: '雅马哈', model: 'YAS-280', category: 'wind', price: 7800 },
  { brand: '雅马哈', model: 'YAS-62', category: 'wind', price: 19800 },
  { brand: '雅马哈', model: 'YTS-62', category: 'wind', price: 25800 },
  { brand: '雅马哈', model: 'SVC210', category: 'string', price: 15800 },

  { brand: '芬达', model: 'Squier Affinity', category: 'guitar', price: 1680 },
  { brand: '芬达', model: 'Player Stratocaster', category: 'guitar', price: 7800 },
  { brand: '芬达', model: 'Professional II Stratocaster', category: 'guitar', price: 16800 },
  { brand: '芬达', model: 'American Vintage II 1957', category: 'guitar', price: 28800 },
  { brand: '芬达', model: 'Custom Shop Stratocaster', category: 'guitar', price: 58000 },
  { brand: '芬达', model: 'Mustang Micro', category: 'guitar', price: 1280 },

  { brand: '吉布森', model: 'Les Paul Studio', category: 'guitar', price: 12800 },
  { brand: '吉布森', model: 'Les Paul Standard', category: 'guitar', price: 26800 },
  { brand: '吉布森', model: 'Les Paul Custom', category: 'guitar', price: 42800 },
  { brand: '吉布森', model: 'SG Standard', category: 'guitar', price: 18800 },
  { brand: '吉布森', model: 'ES-335', category: 'guitar', price: 32800 },
  { brand: '吉布森', model: 'Hummingbird Standard', category: 'guitar', price: 29800 },

  { brand: '卡西欧', model: 'CDP-S100', category: 'keyboard', price: 2399 },
  { brand: '卡西欧', model: 'PX-S7000', category: 'keyboard', price: 8800 },
  { brand: '卡西欧', model: 'AP-710', category: 'keyboard', price: 15800 },
  { brand: '卡西欧', model: 'GP-510', category: 'keyboard', price: 36800 },
  { brand: '卡西欧', model: 'CT-S1', category: 'keyboard', price: 999 },
  { brand: '卡西欧', model: 'CTK-6250', category: 'keyboard', price: 1899 },

  { brand: '罗兰', model: 'FP-30X', category: 'keyboard', price: 5280 },
  { brand: '罗兰', model: 'FP-90X', category: 'keyboard', price: 18800 },
  { brand: '罗兰', model: 'LX708', category: 'keyboard', price: 78000 },
  { brand: '罗兰', model: 'HP704', category: 'keyboard', price: 25800 },
  { brand: '罗兰', model: 'Aerophone GO', category: 'wind', price: 3800 },
  { brand: '罗兰', model: 'AE-30', category: 'wind', price: 12800 },
  { brand: '罗兰', model: 'JC-120', category: 'guitar', price: 8800 },

  { brand: '马丁', model: 'LX1E', category: 'guitar', price: 3280 },
  { brand: '马丁', model: 'D-10E', category: 'guitar', price: 8800 },
  { brand: '马丁', model: 'D-28', category: 'guitar', price: 22800 },
  { brand: '马丁', model: 'HD-28', category: 'guitar', price: 26800 },
  { brand: '马丁', model: 'D-45', category: 'guitar', price: 68000 },
  { brand: '马丁', model: '000-15M', category: 'guitar', price: 12800 },

  { brand: '泰勒', model: 'GS Mini', category: 'guitar', price: 4580 },
  { brand: '泰勒', model: '114CE', category: 'guitar', price: 7800 },
  { brand: '泰勒', model: '214CE', category: 'guitar', price: 11800 },
  { brand: '泰勒', model: '314CE', category: 'guitar', price: 18800 },
  { brand: '泰勒', model: '814CE', category: 'guitar', price: 38800 },
  { brand: '泰勒', model: 'K24CE', category: 'guitar', price: 52800 },

  { brand: '塞尔玛', model: 'SA80 Series II', category: 'wind', price: 42800 },
  { brand: '塞尔玛', model: 'SA80 Series III', category: 'wind', price: 52800 },
  { brand: '塞尔玛', model: 'Supreme Alto', category: 'wind', price: 68000 },
  { brand: '塞尔玛', model: 'Reference 54', category: 'wind', price: 58000 },
  { brand: '塞尔玛', model: 'Seles Axos', category: 'wind', price: 22800 },
];

const brandDefaultPrices: Record<string, number> = {
  '雅马哈': 8500,
  '芬达': 12000,
  '吉布森': 22000,
  '卡西欧': 6000,
  '罗兰': 15000,
  '马丁': 18000,
  '泰勒': 16000,
  '塞尔玛': 45000,
};

const categoryDefaultPrices: Record<string, number> = {
  'guitar': 5000,
  'keyboard': 8000,
  'wind': 12000,
  'string': 6000,
};

export function calculateValuation(
  brand: string,
  model: string,
  usageYears: number,
  condition: number
): ValuationResult {
  const normalizedBrand = brand.trim();
  const normalizedModel = model.trim();

  let marketReference = 3000;
  let matchedEntry: PriceEntry | null = null;
  let matchType = '默认兜底价格';

  for (const entry of priceTable) {
    if (
      entry.brand === normalizedBrand &&
      (entry.model.toLowerCase() === normalizedModel.toLowerCase() ||
        entry.model.toLowerCase().includes(normalizedModel.toLowerCase()) ||
        normalizedModel.toLowerCase().includes(entry.model.toLowerCase()))
    ) {
      marketReference = entry.price;
      matchedEntry = entry;
      matchType = `品牌型号匹配：${entry.brand} ${entry.model}`;
      break;
    }
  }

  if (!matchedEntry) {
    const brandEntries = priceTable.filter(
      (entry) => entry.brand === normalizedBrand
    );
    if (brandEntries.length > 0) {
      const total = brandEntries.reduce((sum, e) => sum + e.price, 0);
      marketReference = Math.round(total / brandEntries.length);
      matchType = `品牌均价参考：${normalizedBrand} (${brandEntries.length}款型号均值)`;
    } else if (brandDefaultPrices[normalizedBrand]) {
      marketReference = brandDefaultPrices[normalizedBrand];
      matchType = `品牌默认参考价：${normalizedBrand}`;
    }
  }

  const cappedYears = Math.min(usageYears, 4);
  const depreciationRate = Math.min(cappedYears * 0.15, 0.6);
  const normalizedCondition = Math.max(1, Math.min(10, condition));

  const suggestedPrice = Math.round(
    marketReference * (1 - depreciationRate) * (normalizedCondition / 10)
  );

  const priceRangeMin = Math.round(suggestedPrice * 0.85);
  const priceRangeMax = Math.round(suggestedPrice * 1.15);

  const basisParts = [
    matchType,
    `市场基准价：¥${marketReference.toLocaleString()}`,
    `使用年限：${usageYears}年，折旧率：${(depreciationRate * 100).toFixed(0)}%${usageYears > 4 ? '（已封顶）' : ''}`,
    `成色评分：${normalizedCondition}/10`,
    `计算公式：基准价 × (1 - 折旧率) × 成色系数`,
  ];
  const basis = basisParts.join('；');

  return {
    suggestedPrice,
    priceRangeMin,
    priceRangeMax,
    basis,
    marketReference,
    depreciationRate,
  };
}

export function getPriceTable(): PriceEntry[] {
  return priceTable;
}

export function getBrands(): string[] {
  const brands = new Set(priceTable.map((e) => e.brand));
  return Array.from(brands);
}

export function getModelsByBrand(brand: string): PriceEntry[] {
  return priceTable.filter((e) => e.brand === brand);
}
