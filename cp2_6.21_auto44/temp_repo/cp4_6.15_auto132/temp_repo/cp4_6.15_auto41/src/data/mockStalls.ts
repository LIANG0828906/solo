import { Stall, Category } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const BASE_LAT = 39.9042;
const BASE_LNG = 116.4074;

const stallOwners = [
  { name: '李小花', avatar: '🌸' },
  { name: '王大锤', avatar: '🔨' },
  { name: '张三丰', avatar: '☯️' },
  { name: '赵四', avatar: '🎭' },
  { name: '钱多多', avatar: '💰' },
  { name: '孙小美', avatar: '💄' },
  { name: '周八皮', avatar: '🐔' },
  { name: '吴彦祖', avatar: '🎬' },
  { name: '郑秀文', avatar: '🎤' },
  { name: '冯小刚', avatar: '🎥' }
];

const productImages = [
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop'
];

const stallNames = {
  handcraft: ['巧手坊', '匠心独运', '木语空间', '布艺小筑', '陶艺人家'],
  books: ['书香阁', '旧书摊', '知识驿站', '文字杂货店', '悦读时光'],
  clothing: ['时尚衣橱', '复古穿搭', '棉麻小铺', '童趣童装', '潮流前线'],
  electronics: ['数码之家', '科技小站', '创意电子', '智能生活', '玩物志'],
  food: ['美食巷', '味道记忆', '甜品小屋', '茶香四溢', '小食光']
};

const productNames = {
  handcraft: ['手工钱包', '木雕摆件', '编织手环', '手绘明信片', '陶瓷茶杯'],
  books: ['经典文学', '旅行手记', '摄影画册', '编程指南', '历史故事'],
  clothing: ['纯棉T恤', '复古连衣裙', '羊毛围巾', '牛仔裤', '毛线帽'],
  electronics: ['蓝牙音箱', '无线耳机', '便携充电宝', '智能手环', 'LED台灯'],
  food: ['手工曲奇', '精品茶叶', '自制果酱', '传统糕点', '精品咖啡豆']
};

function randomProducts(category: Category) {
  const names = productNames[category];
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    name: names[i % names.length],
    price: Math.round((10 + Math.random() * 200) * 100) / 100,
    image: productImages[(i + Math.floor(Math.random() * 5)) % productImages.length],
    isHot: Math.random() > 0.7
  }));
}

function randomPosition(index: number) {
  const row = Math.floor(index / 5);
  const col = index % 5;
  return {
    lat: BASE_LAT + (row - 1) * 0.003 + (Math.random() - 0.5) * 0.001,
    lng: BASE_LNG + (col - 2) * 0.003 + (Math.random() - 0.5) * 0.001
  };
}

const categories: Category[] = ['handcraft', 'books', 'clothing', 'electronics', 'food'];
const markerIcons = ['🎨', '📚', '👕', '💻', '🍪'];
const markerColors = ['#D4A574', '#6B8E23', '#E67E22', '#3498DB', '#E74C3C'];

export function generateMockStalls(): Stall[] {
  const stalls: Stall[] = [];

  categories.forEach((category, catIndex) => {
    const names = stallNames[category];
    for (let i = 0; i < 5; i++) {
      const stallIndex = catIndex * 5 + i;
      const owner = stallOwners[stallIndex % stallOwners.length];
      stalls.push({
        id: generateId(),
        name: names[i],
        owner: owner.name,
        ownerAvatar: owner.avatar,
        category,
        description: `欢迎来到${names[i]}！这里有${category === 'handcraft' ? '精美手工制品' : category === 'books' ? '各类优质好书' : category === 'clothing' ? '时尚潮流服饰' : category === 'electronics' ? '创意电子产品' : '美味特色食品'}，期待您的光临。`,
        products: randomProducts(category),
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        position: randomPosition(stallIndex),
        markerColor: markerColors[catIndex],
        markerIcon: markerIcons[catIndex],
        isOpen: Math.random() > 0.25,
        distance: 0
      });
    }
  });

  return stalls;
}

export const mockStalls = generateMockStalls();
