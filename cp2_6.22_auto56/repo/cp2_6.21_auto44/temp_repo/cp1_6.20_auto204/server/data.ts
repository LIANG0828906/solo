import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  stock: number;
  threshold: number;
  price: number;
  image: string;
  salesHistory: number[];
}

export interface RestockSuggestion {
  productId: string;
  product: Product;
  currentStock: number;
  threshold: number;
  suggestedQuantity: number;
  unitPrice: number;
  subtotal: number;
}

export type StockStatus = 'normal' | 'warning' | 'outOfStock';

export const getStockStatus = (stock: number, threshold: number): StockStatus => {
  if (stock === 0) return 'outOfStock';
  if (stock <= threshold) return 'warning';
  return 'normal';
};

export let products: Product[] = [
  {
    id: uuidv4(),
    sku: 'SKU-001',
    name: '经典白色T恤',
    category: '服装',
    supplier: '优衣服饰有限公司',
    stock: 120,
    threshold: 30,
    price: 89.0,
    image: '',
    salesHistory: [12, 18, 15, 22, 19, 14, 16],
  },
  {
    id: uuidv4(),
    sku: 'SKU-002',
    name: '蓝牙耳机 Pro',
    category: '数码配件',
    supplier: '声讯科技',
    stock: 15,
    threshold: 20,
    price: 299.0,
    image: '',
    salesHistory: [8, 12, 10, 15, 9, 11, 13],
  },
  {
    id: uuidv4(),
    sku: 'SKU-003',
    name: '不锈钢保温杯',
    category: '家居用品',
    supplier: '宜家日用品',
    stock: 8,
    threshold: 25,
    price: 68.0,
    image: '',
    salesHistory: [20, 25, 18, 30, 22, 28, 24],
  },
  {
    id: uuidv4(),
    sku: 'SKU-004',
    name: '机械键盘 RGB版',
    category: '数码配件',
    supplier: '极客外设',
    stock: 45,
    threshold: 15,
    price: 459.0,
    image: '',
    salesHistory: [5, 8, 6, 9, 7, 10, 8],
  },
  {
    id: uuidv4(),
    sku: 'SKU-005',
    name: '运动跑步鞋',
    category: '鞋类',
    supplier: '锐步运动',
    stock: 0,
    threshold: 20,
    price: 399.0,
    image: '',
    salesHistory: [15, 20, 18, 25, 22, 19, 21],
  },
  {
    id: uuidv4(),
    sku: 'SKU-006',
    name: '真皮商务钱包',
    category: '配饰',
    supplier: '匠心皮具',
    stock: 60,
    threshold: 20,
    price: 189.0,
    image: '',
    salesHistory: [8, 10, 7, 12, 9, 11, 8],
  },
  {
    id: uuidv4(),
    sku: 'SKU-007',
    name: '便携式充电宝 20000mAh',
    category: '数码配件',
    supplier: '绿联电子',
    stock: 12,
    threshold: 30,
    price: 149.0,
    image: '',
    salesHistory: [18, 22, 20, 25, 19, 23, 21],
  },
  {
    id: uuidv4(),
    sku: 'SKU-008',
    name: '纯棉四件套',
    category: '家居用品',
    supplier: '梦洁家纺',
    stock: 28,
    threshold: 15,
    price: 329.0,
    image: '',
    salesHistory: [6, 8, 5, 9, 7, 10, 6],
  },
  {
    id: uuidv4(),
    sku: 'SKU-009',
    name: '智能手表',
    category: '数码产品',
    supplier: '小米科技',
    stock: 35,
    threshold: 25,
    price: 799.0,
    image: '',
    salesHistory: [10, 12, 14, 11, 13, 15, 12],
  },
  {
    id: uuidv4(),
    sku: 'SKU-010',
    name: '防晒太阳镜',
    category: '配饰',
    supplier: '暴龙眼镜',
    stock: 5,
    threshold: 15,
    price: 259.0,
    image: '',
    salesHistory: [12, 15, 18, 14, 20, 16, 19],
  },
];

export const calculateRestockSuggestion = (product: Product): RestockSuggestion => {
  const avgDailySales =
    product.salesHistory.reduce((a, b) => a + b, 0) / product.salesHistory.length;
  const safetyStockDays = 7;
  const targetStock = Math.ceil(avgDailySales * safetyStockDays) + product.threshold;
  const suggestedQuantity = Math.max(targetStock - product.stock, product.threshold - product.stock + 10);

  return {
    productId: product.id,
    product,
    currentStock: product.stock,
    threshold: product.threshold,
    suggestedQuantity: Math.max(suggestedQuantity, 10),
    unitPrice: product.price,
    subtotal: Math.max(suggestedQuantity, 10) * product.price,
  };
};
