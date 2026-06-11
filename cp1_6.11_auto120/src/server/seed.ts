import { CookingMethod, DEFAULT_SEASON, Importance } from '../shared/types';

export interface DishSeedIngredient {
  name: string;
  emoji: string;
  origin: string;
  seasonMonths: number[];
  importance: Importance;
  rating: number;
}

export interface DishSeed {
  name: string;
  coverImage: string;
  rating: number;
  ingredients: DishSeedIngredient[];
  methods: CookingMethod[];
  tags: string[];
}

const buildCoverImage = (name: string, color1: string, color2: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)" rx="16"/>
    <text x="200" y="160" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="44" font-weight="bold" fill="white" text-anchor="middle">${name}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export function buildSeedDishes(): DishSeed[] {
  return [
    {
      name: '红烧牛肉',
      coverImage: buildCoverImage('红烧牛肉', '#FF6B35', '#F7C59F'),
      rating: 4.8,
      ingredients: [
        { name: '牛肉', emoji: '🥩', origin: '内蒙古', seasonMonths: DEFAULT_SEASON, importance: 3, rating: 5 },
        { name: '土豆', emoji: '🥔', origin: '甘肃', seasonMonths: [9, 10, 11], importance: 2, rating: 4 },
        { name: '八角', emoji: '🌿', origin: '广西', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '冰糖', emoji: '🍬', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '生抽', emoji: '🥫', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '料酒', emoji: '🥃', origin: '浙江', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['炖', '焖', '炒'],
      tags: ['家常', '硬菜', '下饭菜', '宴客', '经典'],
    },
    {
      name: '宫保鸡丁',
      coverImage: buildCoverImage('宫保鸡丁', '#E63946', '#F4A261'),
      rating: 4.7,
      ingredients: [
        { name: '鸡肉', emoji: '🍗', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 3, rating: 5 },
        { name: '花生', emoji: '🥜', origin: '山东', seasonMonths: [8, 9, 10], importance: 2, rating: 4 },
        { name: '辣椒', emoji: '🌶️', origin: '贵州', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '葱', emoji: '🧅', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '糖', emoji: '🍯', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '醋', emoji: '🧪', origin: '山西', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['炒'],
      tags: ['川菜', '经典', '下饭菜', '酸甜', '快手菜'],
    },
    {
      name: '清蒸鲈鱼',
      coverImage: buildCoverImage('清蒸鲈鱼', '#457B9D', '#A8DADC'),
      rating: 4.9,
      ingredients: [
        { name: '鲈鱼', emoji: '🐟', origin: '江苏', seasonMonths: [3, 4, 5, 9, 10, 11], importance: 3, rating: 5 },
        { name: '姜', emoji: '🫚', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '葱', emoji: '🧅', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '生抽', emoji: '🥫', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '盐', emoji: '🧂', origin: '全国', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['蒸'],
      tags: ['粤菜', '清淡', '宴客', '海鲜', '高蛋白'],
    },
    {
      name: '蒜蓉西兰花',
      coverImage: buildCoverImage('蒜蓉西兰花', '#2D6A4F', '#95D5B2'),
      rating: 4.5,
      ingredients: [
        { name: '西兰花', emoji: '🥦', origin: '云南', seasonMonths: DEFAULT_SEASON, importance: 3, rating: 5 },
        { name: '蒜', emoji: '🧄', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '盐', emoji: '🧂', origin: '全国', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '生抽', emoji: '🥫', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['炒', '蒸'],
      tags: ['素菜', '健康', '低卡', '快手菜', '减脂'],
    },
    {
      name: '糖醋里脊',
      coverImage: buildCoverImage('糖醋里脊', '#FF4D6D', '#FFD166'),
      rating: 4.6,
      ingredients: [
        { name: '里脊', emoji: '🥓', origin: '浙江', seasonMonths: DEFAULT_SEASON, importance: 3, rating: 5 },
        { name: '糖', emoji: '🍯', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '醋', emoji: '🧪', origin: '山西', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '生粉', emoji: '🌾', origin: '东北', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '料酒', emoji: '🥃', origin: '浙江', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '盐', emoji: '🧂', origin: '全国', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['炸', '炒'],
      tags: ['酸甜', '硬菜', '宴客', '儿童最爱', '鲁菜'],
    },
    {
      name: '香辣烤翅',
      coverImage: buildCoverImage('香辣烤翅', '#D00000', '#FFBA08'),
      rating: 4.7,
      ingredients: [
        { name: '鸡翅', emoji: '🍗', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 3, rating: 5 },
        { name: '辣椒', emoji: '🌶️', origin: '贵州', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '生抽', emoji: '🥫', origin: '广东', seasonMonths: DEFAULT_SEASON, importance: 2, rating: 4 },
        { name: '料酒', emoji: '🥃', origin: '浙江', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
        { name: '姜', emoji: '🫚', origin: '山东', seasonMonths: DEFAULT_SEASON, importance: 1, rating: 4 },
      ],
      methods: ['烤', '焗'],
      tags: ['烧烤', '夜宵', '香辣', '零食', '聚会'],
    },
  ];
}
