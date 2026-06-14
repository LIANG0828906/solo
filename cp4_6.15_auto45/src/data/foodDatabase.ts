export interface Food {
  id: string;
  name: string;
  icon: string;
  category: 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  defaultUnit: 'g' | 'ml' | '份';
}

export const foodDatabase: Food[] = [
  { id: '1', name: '白米饭', icon: '🍚', category: 'staple', calories: 116, protein: 2.6, fat: 0.3, carbs: 25.9, fiber: 0.3, defaultUnit: 'g' },
  { id: '2', name: '馒头', icon: '🥟', category: 'staple', calories: 223, protein: 7, fat: 1.1, carbs: 47, fiber: 1.3, defaultUnit: 'g' },
  { id: '3', name: '面条', icon: '🍜', category: 'staple', calories: 109, protein: 4.5, fat: 0.5, carbs: 22, fiber: 0.8, defaultUnit: 'g' },
  { id: '4', name: '面包', icon: '🍞', category: 'staple', calories: 312, protein: 8.3, fat: 5.1, carbs: 58.6, fiber: 0.5, defaultUnit: 'g' },
  { id: '5', name: '燕麦粥', icon: '🥣', category: 'staple', calories: 68, protein: 2.4, fat: 1.4, carbs: 12, fiber: 1.7, defaultUnit: 'g' },
  { id: '6', name: '玉米', icon: '🌽', category: 'staple', calories: 112, protein: 4, fat: 1.2, carbs: 22.8, fiber: 2.9, defaultUnit: 'g' },
  { id: '7', name: '红薯', icon: '🍠', category: 'staple', calories: 99, protein: 1.1, fat: 0.2, carbs: 24.7, fiber: 1.6, defaultUnit: 'g' },
  { id: '8', name: '土豆', icon: '🥔', category: 'staple', calories: 77, protein: 2, fat: 0.2, carbs: 17.2, fiber: 0.7, defaultUnit: 'g' },
  { id: '9', name: '全麦面包', icon: '🍞', category: 'staple', calories: 246, protein: 10.3, fat: 3.5, carbs: 49.6, fiber: 5.6, defaultUnit: 'g' },
  { id: '10', name: '饺子', icon: '🥟', category: 'staple', calories: 240, protein: 8, fat: 8, carbs: 33, fiber: 1, defaultUnit: '份' },
  { id: '53', name: '包子', icon: '🥟', category: 'staple', calories: 227, protein: 7.9, fat: 3.4, carbs: 41, fiber: 1.5, defaultUnit: '份' },
  { id: '54', name: '粽子', icon: '🍙', category: 'staple', calories: 195, protein: 4, fat: 2.8, carbs: 38, fiber: 1.2, defaultUnit: '份' },

  { id: '11', name: '鸡胸肉', icon: '🍗', category: 'meat', calories: 133, protein: 19.4, fat: 5, carbs: 2.5, fiber: 0, defaultUnit: 'g' },
  { id: '12', name: '牛肉', icon: '🥩', category: 'meat', calories: 125, protein: 19.9, fat: 4.2, carbs: 2, fiber: 0, defaultUnit: 'g' },
  { id: '13', name: '猪肉', icon: '🥓', category: 'meat', calories: 395, protein: 13.2, fat: 37, carbs: 2.4, fiber: 0, defaultUnit: 'g' },
  { id: '14', name: '鸡蛋', icon: '🥚', category: 'meat', calories: 144, protein: 13.3, fat: 8.8, carbs: 2.8, fiber: 0, defaultUnit: '份' },
  { id: '15', name: '三文鱼', icon: '🐟', category: 'meat', calories: 139, protein: 17.2, fat: 7.8, carbs: 0, fiber: 0, defaultUnit: 'g' },
  { id: '16', name: '虾', icon: '🦐', category: 'meat', calories: 93, protein: 18.6, fat: 0.8, carbs: 2.8, fiber: 0, defaultUnit: 'g' },
  { id: '17', name: '鸡腿', icon: '🍗', category: 'meat', calories: 181, protein: 16, fat: 13, carbs: 0, fiber: 0, defaultUnit: '份' },
  { id: '18', name: '培根', icon: '🥓', category: 'meat', calories: 541, protein: 37, fat: 42, carbs: 3.6, fiber: 0, defaultUnit: 'g' },
  { id: '19', name: '金枪鱼', icon: '🐟', category: 'meat', calories: 144, protein: 23.3, fat: 4.9, carbs: 0, fiber: 0, defaultUnit: 'g' },
  { id: '20', name: '鸭肉', icon: '🦆', category: 'meat', calories: 240, protein: 15.5, fat: 19.7, carbs: 0.2, fiber: 0, defaultUnit: 'g' },
  { id: '55', name: '羊肉', icon: '🍖', category: 'meat', calories: 203, protein: 19, fat: 14.1, carbs: 0, fiber: 0, defaultUnit: 'g' },
  { id: '56', name: '螃蟹', icon: '🦀', category: 'meat', calories: 103, protein: 17.5, fat: 2.6, carbs: 2.3, fiber: 0, defaultUnit: '份' },

  { id: '21', name: '西兰花', icon: '🥦', category: 'vegetable', calories: 36, protein: 2.8, fat: 0.4, carbs: 4.3, fiber: 1.6, defaultUnit: 'g' },
  { id: '22', name: '胡萝卜', icon: '🥕', category: 'vegetable', calories: 41, protein: 0.9, fat: 0.2, carbs: 8.8, fiber: 1.1, defaultUnit: 'g' },
  { id: '23', name: '西红柿', icon: '🍅', category: 'vegetable', calories: 20, protein: 0.9, fat: 0.2, carbs: 4, fiber: 0.5, defaultUnit: 'g' },
  { id: '24', name: '黄瓜', icon: '🥒', category: 'vegetable', calories: 16, protein: 0.8, fat: 0.2, carbs: 2.9, fiber: 0.5, defaultUnit: 'g' },
  { id: '25', name: '菠菜', icon: '🥬', category: 'vegetable', calories: 24, protein: 2.6, fat: 0.3, carbs: 4.5, fiber: 1.7, defaultUnit: 'g' },
  { id: '26', name: '生菜', icon: '🥗', category: 'vegetable', calories: 15, protein: 1.4, fat: 0.2, carbs: 2.1, fiber: 0.7, defaultUnit: 'g' },
  { id: '27', name: '白菜', icon: '🥬', category: 'vegetable', calories: 17, protein: 1.5, fat: 0.1, carbs: 3.2, fiber: 0.8, defaultUnit: 'g' },
  { id: '28', name: '青椒', icon: '🫑', category: 'vegetable', calories: 22, protein: 1, fat: 0.2, carbs: 5.4, fiber: 1.4, defaultUnit: 'g' },
  { id: '29', name: '茄子', icon: '🍆', category: 'vegetable', calories: 24, protein: 1.1, fat: 0.2, carbs: 4.9, fiber: 1.3, defaultUnit: 'g' },
  { id: '30', name: '洋葱', icon: '🧅', category: 'vegetable', calories: 40, protein: 1.1, fat: 0.2, carbs: 9.3, fiber: 0.9, defaultUnit: 'g' },
  { id: '57', name: '南瓜', icon: '🎃', category: 'vegetable', calories: 26, protein: 1, fat: 0.1, carbs: 5.3, fiber: 0.8, defaultUnit: 'g' },
  { id: '58', name: '芦笋', icon: '🥦', category: 'vegetable', calories: 22, protein: 2.2, fat: 0.1, carbs: 4.9, fiber: 2.1, defaultUnit: 'g' },

  { id: '31', name: '苹果', icon: '🍎', category: 'fruit', calories: 54, protein: 0.2, fat: 0.2, carbs: 13.5, fiber: 1.2, defaultUnit: '份' },
  { id: '32', name: '香蕉', icon: '🍌', category: 'fruit', calories: 93, protein: 1.4, fat: 0.2, carbs: 22, fiber: 1.2, defaultUnit: '份' },
  { id: '33', name: '橙子', icon: '🍊', category: 'fruit', calories: 48, protein: 0.8, fat: 0.2, carbs: 11.1, fiber: 0.6, defaultUnit: '份' },
  { id: '34', name: '葡萄', icon: '🍇', category: 'fruit', calories: 45, protein: 0.5, fat: 0.2, carbs: 10.3, fiber: 0.4, defaultUnit: 'g' },
  { id: '35', name: '西瓜', icon: '🍉', category: 'fruit', calories: 26, protein: 0.6, fat: 0.1, carbs: 5.8, fiber: 0.3, defaultUnit: 'g' },
  { id: '36', name: '草莓', icon: '🍓', category: 'fruit', calories: 32, protein: 1, fat: 0.2, carbs: 7.1, fiber: 1.1, defaultUnit: 'g' },
  { id: '37', name: '蓝莓', icon: '🫐', category: 'fruit', calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4, defaultUnit: 'g' },
  { id: '38', name: '芒果', icon: '🥭', category: 'fruit', calories: 32, protein: 0.6, fat: 0.2, carbs: 7, fiber: 1.3, defaultUnit: '份' },
  { id: '39', name: '梨', icon: '🍐', category: 'fruit', calories: 51, protein: 0.4, fat: 0.2, carbs: 13, fiber: 1.1, defaultUnit: '份' },
  { id: '40', name: '猕猴桃', icon: '🥝', category: 'fruit', calories: 61, protein: 0.8, fat: 0.6, carbs: 14.5, fiber: 2.1, defaultUnit: '份' },
  { id: '59', name: '菠萝', icon: '🍍', category: 'fruit', calories: 44, protein: 0.5, fat: 0.1, carbs: 10.8, fiber: 1.3, defaultUnit: '份' },
  { id: '60', name: '桃子', icon: '🍑', category: 'fruit', calories: 48, protein: 0.9, fat: 0.1, carbs: 12.2, fiber: 1.3, defaultUnit: '份' },

  { id: '41', name: '薯片', icon: '🍟', category: 'snack', calories: 547, protein: 6.6, fat: 37.5, carbs: 49.7, fiber: 4.2, defaultUnit: 'g' },
  { id: '42', name: '巧克力', icon: '🍫', category: 'snack', calories: 586, protein: 4.3, fat: 40.1, carbs: 53.4, fiber: 4.3, defaultUnit: 'g' },
  { id: '43', name: '饼干', icon: '🍪', category: 'snack', calories: 435, protein: 9, fat: 12.7, carbs: 71.7, fiber: 1.1, defaultUnit: 'g' },
  { id: '44', name: '蛋糕', icon: '🍰', category: 'snack', calories: 347, protein: 7.4, fat: 14.9, carbs: 48.4, fiber: 0.8, defaultUnit: '份' },
  { id: '45', name: '冰淇淋', icon: '🍦', category: 'snack', calories: 207, protein: 3.5, fat: 8.6, carbs: 29.8, fiber: 0.3, defaultUnit: '份' },
  { id: '46', name: '坚果', icon: '🥜', category: 'snack', calories: 607, protein: 20, fat: 53.6, carbs: 21.2, fiber: 8.6, defaultUnit: 'g' },
  { id: '61', name: '爆米花', icon: '🍿', category: 'snack', calories: 387, protein: 12.9, fat: 4.5, carbs: 77.9, fiber: 14.5, defaultUnit: 'g' },
  { id: '62', name: '糖果', icon: '🍬', category: 'snack', calories: 396, protein: 0.1, fat: 4.2, carbs: 91.8, fiber: 0.1, defaultUnit: 'g' },
  { id: '63', name: '蜂蜜', icon: '🍯', category: 'snack', calories: 304, protein: 0.3, fat: 0, carbs: 82.4, fiber: 0.2, defaultUnit: 'g' },
  { id: '64', name: '能量棒', icon: '🥜', category: 'snack', calories: 452, protein: 18, fat: 22, carbs: 45, fiber: 5, defaultUnit: '份' },
  { id: '65', name: '果冻', icon: '🍮', category: 'snack', calories: 70, protein: 1.5, fat: 0, carbs: 16, fiber: 0, defaultUnit: '份' },
  { id: '66', name: '布丁', icon: '🍮', category: 'snack', calories: 105, protein: 3.5, fat: 2.8, carbs: 17, fiber: 0, defaultUnit: '份' },

  { id: '47', name: '酸奶', icon: '🥛', category: 'drink', calories: 72, protein: 2.5, fat: 2.7, carbs: 9.3, fiber: 0, defaultUnit: 'ml' },
  { id: '48', name: '牛奶', icon: '🥛', category: 'drink', calories: 54, protein: 3, fat: 3.2, carbs: 3.4, fiber: 0, defaultUnit: 'ml' },
  { id: '49', name: '豆浆', icon: '🥛', category: 'drink', calories: 31, protein: 3, fat: 1.6, carbs: 1.2, fiber: 0, defaultUnit: 'ml' },
  { id: '50', name: '果汁', icon: '🧃', category: 'drink', calories: 46, protein: 0.7, fat: 0.2, carbs: 10.8, fiber: 0.1, defaultUnit: 'ml' },
  { id: '51', name: '咖啡', icon: '☕', category: 'drink', calories: 4, protein: 0.2, fat: 0, carbs: 0.8, fiber: 0, defaultUnit: 'ml' },
  { id: '52', name: '奶茶', icon: '🧋', category: 'drink', calories: 98, protein: 1.5, fat: 3.8, carbs: 15, fiber: 0, defaultUnit: 'ml' },
  { id: '67', name: '可乐', icon: '🥤', category: 'drink', calories: 43, protein: 0, fat: 0, carbs: 10.6, fiber: 0, defaultUnit: 'ml' },
  { id: '68', name: '绿茶', icon: '🍵', category: 'drink', calories: 1, protein: 0.2, fat: 0, carbs: 0.2, fiber: 0, defaultUnit: 'ml' },
];

export const searchFood = (keyword: string): Food[] => {
  if (!keyword.trim()) return [];
  const lowerKeyword = keyword.toLowerCase();
  return foodDatabase.filter((food) =>
    food.name.toLowerCase().includes(lowerKeyword)
  );
};

export const getFoodById = (id: string): Food | undefined => {
  return foodDatabase.find((food) => food.id === id);
};
