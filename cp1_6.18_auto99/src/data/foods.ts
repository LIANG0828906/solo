export interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  nutrients: Nutrients;
}

export const foods: Food[] = [
  {
    id: '1',
    name: '大米',
    category: '主食',
    nutrients: { calories: 116, protein: 2.6, fat: 0.3, carbs: 25.6, fiber: 0.3, sodium: 2 },
  },
  {
    id: '2',
    name: '白馒头',
    category: '主食',
    nutrients: { calories: 223, protein: 7, fat: 1.1, carbs: 47, fiber: 1.3, sodium: 165 },
  },
  {
    id: '3',
    name: '面条(煮)',
    category: '主食',
    nutrients: { calories: 109, protein: 3.9, fat: 0.4, carbs: 22.5, fiber: 0.8, sodium: 170 },
  },
  {
    id: '4',
    name: '全麦面包',
    category: '主食',
    nutrients: { calories: 246, protein: 13, fat: 4.2, carbs: 41, fiber: 7, sodium: 450 },
  },
  {
    id: '5',
    name: '燕麦片',
    category: '主食',
    nutrients: { calories: 367, protein: 15, fat: 6.7, carbs: 61.6, fiber: 5.3, sodium: 7 },
  },
  {
    id: '6',
    name: '红薯',
    category: '主食',
    nutrients: { calories: 99, protein: 1.1, fat: 0.2, carbs: 24.7, fiber: 2.2, sodium: 15 },
  },
  {
    id: '7',
    name: '玉米',
    category: '主食',
    nutrients: { calories: 112, protein: 4, fat: 1.2, carbs: 22.8, fiber: 2.9, sodium: 1 },
  },
  {
    id: '8',
    name: '鸡胸肉',
    category: '肉类',
    nutrients: { calories: 133, protein: 19.4, fat: 5, carbs: 2.5, fiber: 0, sodium: 64 },
  },
  {
    id: '9',
    name: '猪里脊',
    category: '肉类',
    nutrients: { calories: 155, protein: 20.2, fat: 7.9, carbs: 1.7, fiber: 0, sodium: 45 },
  },
  {
    id: '10',
    name: '牛肉(瘦)',
    category: '肉类',
    nutrients: { calories: 125, protein: 20.2, fat: 4.2, carbs: 1.2, fiber: 0, sodium: 53 },
  },
  {
    id: '11',
    name: '羊肉(瘦)',
    category: '肉类',
    nutrients: { calories: 118, protein: 20.5, fat: 3.9, carbs: 0.2, fiber: 0, sodium: 69 },
  },
  {
    id: '12',
    name: '三文鱼',
    category: '水产',
    nutrients: { calories: 139, protein: 17.2, fat: 7.8, carbs: 0, fiber: 0, sodium: 59 },
  },
  {
    id: '13',
    name: '草鱼',
    category: '水产',
    nutrients: { calories: 113, protein: 16.6, fat: 5.2, carbs: 0, fiber: 0, sodium: 46 },
  },
  {
    id: '14',
    name: '虾',
    category: '水产',
    nutrients: { calories: 93, protein: 18.6, fat: 0.8, carbs: 2.8, fiber: 0, sodium: 165 },
  },
  {
    id: '15',
    name: '鸡蛋',
    category: '蛋奶',
    nutrients: { calories: 144, protein: 13.3, fat: 8.8, carbs: 2.8, fiber: 0, sodium: 132 },
  },
  {
    id: '16',
    name: '牛奶',
    category: '蛋奶',
    nutrients: { calories: 54, protein: 3, fat: 3.2, carbs: 3.4, fiber: 0, sodium: 37 },
  },
  {
    id: '17',
    name: '酸奶',
    category: '蛋奶',
    nutrients: { calories: 72, protein: 2.5, fat: 2.7, carbs: 9.3, fiber: 0, sodium: 39 },
  },
  {
    id: '18',
    name: '豆腐',
    category: '豆制品',
    nutrients: { calories: 81, protein: 8.1, fat: 3.7, carbs: 3.8, fiber: 0.4, sodium: 7.2 },
  },
  {
    id: '19',
    name: '黄豆',
    category: '豆制品',
    nutrients: { calories: 359, protein: 35, fat: 16, carbs: 34.2, fiber: 15.5, sodium: 2.2 },
  },
  {
    id: '20',
    name: '白菜',
    category: '蔬菜',
    nutrients: { calories: 17, protein: 1.5, fat: 0.1, carbs: 3.2, fiber: 0.8, sodium: 57.5 },
  },
  {
    id: '21',
    name: '菠菜',
    category: '蔬菜',
    nutrients: { calories: 24, protein: 2.6, fat: 0.3, carbs: 4.5, fiber: 1.7, sodium: 85.2 },
  },
  {
    id: '22',
    name: '西兰花',
    category: '蔬菜',
    nutrients: { calories: 33, protein: 4.1, fat: 0.6, carbs: 4.3, fiber: 1.6, sodium: 33.6 },
  },
  {
    id: '23',
    name: '胡萝卜',
    category: '蔬菜',
    nutrients: { calories: 37, protein: 1, fat: 0.2, carbs: 8.8, fiber: 1.1, sodium: 71.4 },
  },
  {
    id: '24',
    name: '番茄',
    category: '蔬菜',
    nutrients: { calories: 19, protein: 0.9, fat: 0.2, carbs: 4, fiber: 0.5, sodium: 5 },
  },
  {
    id: '25',
    name: '黄瓜',
    category: '蔬菜',
    nutrients: { calories: 15, protein: 0.8, fat: 0.2, carbs: 2.9, fiber: 0.5, sodium: 4.9 },
  },
  {
    id: '26',
    name: '土豆',
    category: '蔬菜',
    nutrients: { calories: 76, protein: 2, fat: 0.2, carbs: 17.2, fiber: 0.7, sodium: 2.7 },
  },
  {
    id: '27',
    name: '苹果',
    category: '水果',
    nutrients: { calories: 54, protein: 0.2, fat: 0.2, carbs: 13.5, fiber: 1.2, sodium: 1.6 },
  },
  {
    id: '28',
    name: '香蕉',
    category: '水果',
    nutrients: { calories: 93, protein: 1.4, fat: 0.2, carbs: 22, fiber: 1.2, sodium: 0.8 },
  },
  {
    id: '29',
    name: '橙子',
    category: '水果',
    nutrients: { calories: 48, protein: 0.8, fat: 0.2, carbs: 11.1, fiber: 0.6, sodium: 1.2 },
  },
  {
    id: '30',
    name: '葡萄',
    category: '水果',
    nutrients: { calories: 44, protein: 0.5, fat: 0.2, carbs: 10.3, fiber: 0.4, sodium: 1.3 },
  },
  {
    id: '31',
    name: '花生',
    category: '坚果',
    nutrients: { calories: 574, protein: 24.8, fat: 44.3, carbs: 16.2, fiber: 5.5, sodium: 3.6 },
  },
  {
    id: '32',
    name: '核桃',
    category: '坚果',
    nutrients: { calories: 627, protein: 14.9, fat: 58.8, carbs: 19.1, fiber: 9.5, sodium: 6.4 },
  },
  {
    id: '33',
    name: '杏仁',
    category: '坚果',
    nutrients: { calories: 578, protein: 22.5, fat: 50.6, carbs: 19.9, fiber: 8, sodium: 1 },
  },
  {
    id: '34',
    name: '橄榄油',
    category: '油脂',
    nutrients: { calories: 899, protein: 0, fat: 99.9, carbs: 0, fiber: 0, sodium: 0 },
  },
  {
    id: '35',
    name: '花生油',
    category: '油脂',
    nutrients: { calories: 899, protein: 0, fat: 99.9, carbs: 0, fiber: 0, sodium: 0 },
  },
  {
    id: '36',
    name: '米饭(蒸)',
    category: '主食',
    nutrients: { calories: 116, protein: 2.6, fat: 0.3, carbs: 25.9, fiber: 0.3, sodium: 3 },
  },
  {
    id: '37',
    name: '紫菜',
    category: '蔬菜',
    nutrients: { calories: 207, protein: 26.7, fat: 1.1, carbs: 44.1, fiber: 21.6, sodium: 710 },
  },
  {
    id: '38',
    name: '海带',
    category: '蔬菜',
    nutrients: { calories: 12, protein: 1.2, fat: 0.1, carbs: 2.1, fiber: 0.5, sodium: 8.6 },
  },
  {
    id: '39',
    name: '木耳(干)',
    category: '蔬菜',
    nutrients: { calories: 205, protein: 12.1, fat: 1.5, carbs: 65.5, fiber: 29.9, sodium: 48.5 },
  },
  {
    id: '40',
    name: '巧克力',
    category: '零食',
    nutrients: { calories: 586, protein: 4.3, fat: 40.1, carbs: 53.4, fiber: 4.3, sodium: 11 },
  },
];

export const foodCategories = ['主食', '肉类', '水产', '蛋奶', '豆制品', '蔬菜', '水果', '坚果', '油脂', '零食'];
