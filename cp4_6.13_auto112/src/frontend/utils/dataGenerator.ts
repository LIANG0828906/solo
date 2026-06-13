export interface SalesTrendPoint {
  time: string;
  value: number;
  timestamp: number;
}

export interface CategorySalesItem {
  category: string;
  value: number;
  products: { product: string; value: number }[];
}

export interface HeatmapPoint {
  hour: number;
  region: string;
  value: number;
}

const CATEGORIES = ['电子产品', '服装配饰', '食品饮料', '家居用品', '美妆个护'];
const PRODUCTS: Record<string, string[]> = {
  '电子产品': ['手机', '笔记本电脑', '平板', '耳机', '智能手表'],
  '服装配饰': ['T恤', '牛仔裤', '运动鞋', '外套', '包包'],
  '食品饮料': ['零食', '饮料', '生鲜', '速食', '甜品'],
  '家居用品': ['收纳', '厨具', '床品', '装饰', '灯具'],
  '美妆个护': ['护肤', '彩妆', '香水', '洗护', '工具'],
};
const REGIONS = ['华东', '华北', '华南', '西南', '西北', '东北', '华中'];

let salesTrendData: SalesTrendPoint[] = [];
let categorySalesData: CategorySalesItem[] = [];
let heatmapData: HeatmapPoint[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let frequency = 1000;

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function initializeMockData(): void {
  const now = new Date();
  salesTrendData = [];
  for (let i = 59; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 1000);
    salesTrendData.push({
      time: formatTime(time),
      value: randomInRange(800, 2000),
      timestamp: time.getTime(),
    });
  }

  categorySalesData = CATEGORIES.map((category) => {
    const products = PRODUCTS[category].map((product) => ({
      product,
      value: randomInRange(50, 500),
    }));
    const total = products.reduce((sum, p) => sum + p.value, 0);
    return {
      category,
      value: total,
      products,
    };
  });

  heatmapData = [];
  for (let h = 0; h < 24; h++) {
    for (const region of REGIONS) {
      heatmapData.push({
        hour: h,
        region,
        value: randomInRange(10, 200),
      });
    }
  }
}

export function getSalesTrend(): SalesTrendPoint[] {
  return [...salesTrendData];
}

export function getCategorySales(): CategorySalesItem[] {
  return [...categorySalesData];
}

export function getHeatmap(): HeatmapPoint[] {
  return [...heatmapData];
}

function updateSalesTrend(): void {
  const now = new Date();
  salesTrendData.shift();
  salesTrendData.push({
    time: formatTime(now),
    value: randomInRange(800, 2000),
    timestamp: now.getTime(),
  });
}

function updateCategorySales(): void {
  categorySalesData = categorySalesData.map((item) => {
    const products = item.products.map((p) => ({
      ...p,
      value: Math.max(10, p.value + randomInRange(-20, 30)),
    }));
    const total = products.reduce((sum, p) => sum + p.value, 0);
    return {
      ...item,
      value: total,
      products,
    };
  });
}

function updateHeatmap(): void {
  heatmapData = heatmapData.map((point) => ({
    ...point,
    value: Math.max(5, point.value + randomInRange(-10, 15)),
  }));
}

type DataCallback = (data: unknown) => void;
const callbacks: Map<string, DataCallback[]> = new Map();

export function subscribe(channel: string, callback: DataCallback): () => void {
  if (!callbacks.has(channel)) {
    callbacks.set(channel, []);
  }
  callbacks.get(channel)!.push(callback);

  if (channel === 'sales-trend') {
    callback(getSalesTrend());
  } else if (channel === 'category-sales') {
    callback(getCategorySales());
  } else if (channel === 'heatmap') {
    callback(getHeatmap());
  }

  return () => {
    const cbs = callbacks.get(channel);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    }
  };
}

function emit(channel: string, data: unknown): void {
  const cbs = callbacks.get(channel);
  if (cbs) {
    cbs.forEach((cb) => cb(data));
  }
}

export function startMockStream(freq: number = 1000): void {
  frequency = freq;
  if (intervalId) {
    clearInterval(intervalId);
  }
  initializeMockData();
  intervalId = setInterval(() => {
    updateSalesTrend();
    emit('sales-trend', getSalesTrend());

    updateCategorySales();
    emit('category-sales', getCategorySales());

    updateHeatmap();
    emit('heatmap', getHeatmap());
  }, frequency);
}

export function stopMockStream(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function setMockFrequency(freq: number): void {
  if (freq > 0 && freq !== frequency) {
    startMockStream(freq);
  }
}

export function getDrillDownData(
  chartType: string,
  dataPoint: unknown
): { detailTable: unknown[]; subChartData: unknown[] } {
  if (chartType === 'bar' && dataPoint && typeof dataPoint === 'object' && 'category' in dataPoint) {
    const category = (dataPoint as { category: string }).category;
    const catData = categorySalesData.find((c) => c.category === category);
    if (catData) {
      const detailTable = catData.products.map((p, i) => ({
        id: i + 1,
        product: p.product,
        sales: p.value,
        percentage: ((p.value / catData.value) * 100).toFixed(1) + '%',
        trend: randomInRange(-10, 20),
      }));
      return {
        detailTable,
        subChartData: catData.products.map((p) => ({ name: p.product, value: p.value })),
      };
    }
  }

  if (chartType === 'line' && dataPoint) {
    const detailTable = [];
    for (let i = 0; i < 10; i++) {
      detailTable.push({
        id: i + 1,
        orderId: `ORD${String(randomInRange(100000, 999999))}`,
        amount: randomInRange(50, 500),
        customer: `客户${i + 1}`,
        time: formatTime(new Date(Date.now() - i * 60000)),
      });
    }
    return {
      detailTable,
      subChartData: [
        { name: '新用户', value: randomInRange(100, 300) },
        { name: '老用户', value: randomInRange(200, 500) },
        { name: 'VIP用户', value: randomInRange(50, 150) },
      ],
    };
  }

  if (chartType === 'heatmap' && dataPoint && typeof dataPoint === 'object') {
    const detailTable = [];
    for (let i = 0; i < 8; i++) {
      detailTable.push({
        id: i + 1,
        page: ['首页', '商品列表', '商品详情', '购物车', '结算页'][i % 5],
        visits: randomInRange(50, 300),
        duration: randomInRange(10, 120) + '秒',
        bounceRate: randomInRange(20, 60) + '%',
      });
    }
    return {
      detailTable,
      subChartData: [
        { name: '直接访问', value: randomInRange(100, 250) },
        { name: '搜索引擎', value: randomInRange(80, 200) },
        { name: '社交媒体', value: randomInRange(50, 150) },
        { name: '推荐链接', value: randomInRange(30, 100) },
      ],
    };
  }

  return { detailTable: [], subChartData: [] };
}
