export interface Food {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

export const foods: Food[] = [
  { id: '1', name: '鸡胸肉', calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  { id: '2', name: '三文鱼', calories: 139, protein: 20, fat: 6.3, carbs: 0, fiber: 0 },
  { id: '3', name: '牛排', calories: 271, protein: 26, fat: 18, carbs: 0, fiber: 0 },
  { id: '4', name: '猪里脊', calories: 143, protein: 21, fat: 7, carbs: 0, fiber: 0 },
  { id: '5', name: '鸡蛋', calories: 144, protein: 13, fat: 9.5, carbs: 1.1, fiber: 0 },
  { id: '6', name: '牛奶', calories: 54, protein: 3.0, fat: 3.2, carbs: 5, fiber: 0 },
  { id: '7', name: '酸奶', calories: 61, protein: 3.5, fat: 3.5, carbs: 4.7, fiber: 0 },
  { id: '8', name: '豆腐', calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3 },
  { id: '9', name: '米饭', calories: 130, protein: 2.6, fat: 0.3, carbs: 25.9, fiber: 0.4 },
  { id: '10', name: '面条', calories: 138, protein: 4.5, fat: 0.6, carbs: 28, fiber: 1.8 },
  { id: '11', name: '面包', calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7 },
  { id: '12', name: '燕麦', calories: 389, protein: 17, fat: 6.9, carbs: 66, fiber: 10.6 },
  { id: '13', name: '红薯', calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 2.5 },
  { id: '14', name: '西兰花', calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6 },
  { id: '15', name: '菠菜', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
  { id: '16', name: '胡萝卜', calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8 },
  { id: '17', name: '番茄', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  { id: '18', name: '黄瓜', calories: 16, protein: 0.7, fat: 0.2, carbs: 3.6, fiber: 0.5 },
  { id: '19', name: '苹果', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4 },
  { id: '20', name: '香蕉', calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6 },
  { id: '21', name: '橙子', calories: 47, protein: 0.9, fat: 0.1, carbs: 12, fiber: 2.4 },
  { id: '22', name: '葡萄', calories: 69, protein: 0.7, fat: 0.2, carbs: 18, fiber: 0.9 },
  { id: '23', name: '西瓜', calories: 30, protein: 0.6, fat: 0.2, carbs: 8, fiber: 0.4 },
  { id: '24', name: '草莓', calories: 33, protein: 0.7, fat: 0.3, carbs: 8, fiber: 2 },
  { id: '25', name: '蓝莓', calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
  { id: '26', name: '核桃', calories: 654, protein: 15, fat: 65, carbs: 14, fiber: 6.7 },
  { id: '27', name: '杏仁', calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12.5 },
  { id: '28', name: '花生', calories: 567, protein: 26, fat: 49, carbs: 16, fiber: 8.5 },
  { id: '29', name: '橄榄油', calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0 },
  { id: '30', name: '黄油', calories: 717, protein: 0.9, fat: 81, carbs: 0.1, fiber: 0 },
  { id: '31', name: '奶酪', calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0 },
  { id: '32', name: '鳕鱼', calories: 82, protein: 18, fat: 0.7, carbs: 0, fiber: 0 },
  { id: '33', name: '虾', calories: 99, protein: 24, fat: 0.3, carbs: 0.2, fiber: 0 },
  { id: '34', name: '鸡腿肉', calories: 209, protein: 26, fat: 11, carbs: 0, fiber: 0 },
  { id: '35', name: '鸭胸', calories: 133, protein: 20, fat: 5.0, carbs: 0, fiber: 0 },
  { id: '36', name: '羊肉', calories: 203, protein: 18, fat: 14, carbs: 0, fiber: 0 },
  { id: '37', name: '玉米', calories: 86, protein: 3.3, fat: 1.4, carbs: 19, fiber: 2.7 },
  { id: '38', name: '土豆', calories: 77, protein: 2.0, fat: 0.1, carbs: 17.0, fiber: 2.2 },
  { id: '39', name: '南瓜', calories: 26, protein: 1, fat: 0.1, carbs: 7, fiber: 0.5 },
  { id: '40', name: '蘑菇', calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3, fiber: 1 },
  { id: '41', name: '洋葱', calories: 40, protein: 1.1, fat: 0.1, carbs: 9, fiber: 1.7 },
  { id: '42', name: '青椒', calories: 20, protein: 0.9, fat: 0.2, carbs: 4.6, fiber: 1.7 },
  { id: '43', name: '卷心菜', calories: 25, protein: 1.3, fat: 0.1, carbs: 6, fiber: 2.5 },
  { id: '44', name: '芹菜', calories: 16, protein: 0.7, fat: 0.2, carbs: 3, fiber: 1.6 },
  { id: '45', name: '茄子', calories: 25, protein: 1, fat: 0.2, carbs: 6, fiber: 3 },
  { id: '46', name: '豆角', calories: 31, protein: 2.4, fat: 0.1, carbs: 7, fiber: 2.7 },
  { id: '47', name: '豆浆', calories: 33, protein: 2.8, fat: 1.6, carbs: 1.8, fiber: 0.6 },
  { id: '48', name: '全麦面包', calories: 252, protein: 13, fat: 3.4, carbs: 42.7, fiber: 6.8 },
  { id: '49', name: '糙米', calories: 123, protein: 2.7, fat: 0.9, carbs: 25.6, fiber: 1.8 },
  { id: '50', name: '鸡翅', calories: 203, protein: 19, fat: 14, carbs: 0, fiber: 0 },
  { id: '51', name: '牛奶巧克力', calories: 535, protein: 8, fat: 30, carbs: 59, fiber: 2.5 },
]
