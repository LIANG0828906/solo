export interface Recipe {
  id: string
  name: string
  description: string
  foodIds: string[]
  servings: number[]
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export const recipeDatabase: Recipe[] = [
  {
    id: 'r001',
    name: '营养早餐套餐A',
    description: '全麦面包配鸡蛋牛奶，营养均衡的经典早餐',
    foodIds: ['f004', 'f013', 'f073'],
    servings: [50, 50, 200],
    totalCalories: 301,
    totalProtein: 18.5,
    totalFat: 10.2,
    totalCarbs: 35.4,
    category: 'breakfast'
  },
  {
    id: 'r002',
    name: '燕麦水果早餐',
    description: '燕麦片搭配牛奶和香蕉，健康低脂',
    foodIds: ['f006', 'f073', 'f062'],
    servings: [40, 200, 100],
    totalCalories: 345,
    totalProtein: 13.6,
    totalFat: 7.4,
    totalCarbs: 62.2,
    category: 'breakfast'
  },
  {
    id: 'r003',
    name: '中式早餐套餐',
    description: '馒头配豆浆和鸡蛋，传统营养搭配',
    foodIds: ['f003', 'f053', 'f013'],
    servings: [100, 200, 50],
    totalCalories: 397,
    totalProtein: 19.4,
    totalFat: 9.5,
    totalCarbs: 60.6,
    category: 'breakfast'
  },
  {
    id: 'r004',
    name: '小米粥配包子',
    description: '清淡养胃的中式早餐',
    foodIds: ['f010', 'f098', 'f031'],
    servings: [200, 100, 50],
    totalCalories: 329,
    totalProtein: 9.2,
    totalFat: 3.7,
    totalCarbs: 66.2,
    category: 'breakfast'
  },
  {
    id: 'r005',
    name: '玉米红薯早餐',
    description: '粗粮组合，高纤维低脂肪',
    foodIds: ['f007', 'f008', 'f073'],
    servings: [150, 150, 200],
    totalCalories: 368,
    totalProtein: 9.6,
    totalFat: 6.5,
    totalCarbs: 69.3,
    category: 'breakfast'
  },
  {
    id: 'r006',
    name: '酸奶水果杯',
    description: '清爽的轻食早餐，富含益生菌',
    foodIds: ['f074', 'f062', 'f066', 'f057'],
    servings: [200, 50, 50, 15],
    totalCalories: 301,
    totalProtein: 13.2,
    totalFat: 8.2,
    totalCarbs: 36.5,
    category: 'breakfast'
  },
  {
    id: 'r007',
    name: '鸡胸肉蔬菜沙拉',
    description: '高蛋白低脂，健身首选午餐',
    foodIds: ['f011', 'f035', 'f039', 'f036'],
    servings: [150, 100, 100, 100],
    totalCalories: 267,
    totalProtein: 33.9,
    totalFat: 7.5,
    totalCarbs: 13.9,
    category: 'lunch'
  },
  {
    id: 'r008',
    name: '牛肉糙米饭',
    description: '优质蛋白配粗粮，增肌减脂',
    foodIds: ['f017', 'f002', 'f032', 'f007'],
    servings: [120, 150, 100, 100],
    totalCalories: 358,
    totalProtein: 32.6,
    totalFat: 4.8,
    totalCarbs: 47.3,
    category: 'lunch'
  },
  {
    id: 'r009',
    name: '三文鱼藜麦碗',
    description: 'Omega-3丰富，营养全面',
    foodIds: ['f025', 'f006', 'f036', 'f034'],
    servings: [120, 80, 100, 50],
    totalCalories: 511,
    totalProtein: 32.3,
    totalFat: 18.2,
    totalCarbs: 53.6,
    category: 'lunch'
  },
  {
    id: 'r010',
    name: '鸡腿肉蔬菜饭',
    description: '美味营养，饱腹感强',
    foodIds: ['f012', 'f001', 'f038', 'f045'],
    servings: [120, 150, 100, 100],
    totalCalories: 445,
    totalProtein: 23.7,
    totalFat: 15.7,
    totalCarbs: 56.1,
    category: 'lunch'
  },
  {
    id: 'r011',
    name: '豆腐素菜饭',
    description: '素食健康，植物蛋白丰富',
    foodIds: ['f052', 'f001', 'f036', 'f043'],
    servings: [150, 150, 100, 100],
    totalCalories: 357,
    totalProtein: 17.7,
    totalFat: 5.5,
    totalCarbs: 59.2,
    category: 'lunch'
  },
  {
    id: 'r012',
    name: '虾仁炒饭套餐',
    description: '鲜香美味，蛋白质充足',
    foodIds: ['f026', 'f096', 'f031', 'f013'],
    servings: [80, 200, 50, 50],
    totalCalories: 513,
    totalProtein: 27.6,
    totalFat: 18.3,
    totalCarbs: 59.5,
    category: 'lunch'
  },
  {
    id: 'r013',
    name: '糖醋里脊套餐',
    description: '经典中式午餐，酸甜可口',
    foodIds: ['f015', 'f001', 'f039', 'f033'],
    servings: [100, 180, 100, 100],
    totalCalories: 420,
    totalProtein: 24.4,
    totalFat: 11.9,
    totalCarbs: 57,
    category: 'lunch'
  },
  {
    id: 'r014',
    name: '清蒸鱼配时蔬',
    description: '低脂高蛋白，健康饮食首选',
    foodIds: ['f024', 'f001', 'f032', 'f050'],
    servings: [150, 150, 100, 50],
    totalCalories: 362,
    totalProtein: 32.9,
    totalFat: 5.9,
    totalCarbs: 45.6,
    category: 'dinner'
  },
  {
    id: 'r015',
    name: '番茄鸡蛋面',
    description: '经典家常晚餐，温暖美味',
    foodIds: ['f005', 'f013', 'f039', 'f031'],
    servings: [200, 50, 100, 50],
    totalCalories: 327,
    totalProtein: 11.3,
    totalFat: 4.7,
    totalCarbs: 58.6,
    category: 'dinner'
  },
  {
    id: 'r016',
    name: '土豆牛肉饭',
    description: '营养丰富，饱腹感强',
    foodIds: ['f017', 'f009', 'f001', 'f031'],
    servings: [100, 100, 150, 100],
    totalCalories: 379,
    totalProtein: 23.8,
    totalFat: 2.8,
    totalCarbs: 62.2,
    category: 'dinner'
  },
  {
    id: 'r017',
    name: '白菜猪肉饺子',
    description: '传统美味，荤素搭配',
    foodIds: ['f097', 'f031', 'f050', 'f073'],
    servings: [200, 50, 30, 100],
    totalCalories: 546,
    totalProtein: 21.3,
    totalFat: 20.7,
    totalCarbs: 72.5,
    category: 'dinner'
  },
  {
    id: 'r018',
    name: '南瓜小米粥套餐',
    description: '清淡养胃，适合晚餐',
    foodIds: ['f010', 'f044', 'f098', 'f032'],
    servings: [200, 100, 80, 50],
    totalCalories: 299,
    totalProtein: 8.7,
    totalFat: 3,
    totalCarbs: 59.2,
    category: 'dinner'
  },
  {
    id: 'r019',
    name: '鸡肉蔬菜卷',
    description: '低卡高蛋白，减脂期晚餐',
    foodIds: ['f011', 'f036', 'f039', 'f004'],
    servings: [100, 80, 50, 60],
    totalCalories: 306,
    totalProtein: 24.1,
    totalFat: 7.5,
    totalCarbs: 32.8,
    category: 'dinner'
  },
  {
    id: 'r020',
    name: '豆腐蘑菇汤饭',
    description: '鲜美清淡，营养丰富',
    foodIds: ['f052', 'f050', 'f051', 'f001'],
    servings: [100, 80, 80, 150],
    totalCalories: 313,
    totalProtein: 14.4,
    totalFat: 4.2,
    totalCarbs: 54.2,
    category: 'dinner'
  },
  {
    id: 'r021',
    name: '牛奶燕麦坚果',
    description: '健康加餐，补充能量',
    foodIds: ['f073', 'f006', 'f057', 'f058'],
    servings: [150, 30, 15, 10],
    totalCalories: 361,
    totalProtein: 12.5,
    totalFat: 16.1,
    totalCarbs: 42.6,
    category: 'snack'
  },
  {
    id: 'r022',
    name: '水果酸奶沙拉',
    description: '清爽解腻，补充维生素',
    foodIds: ['f074', 'f061', 'f063', 'f066'],
    servings: [150, 80, 80, 60],
    totalCalories: 300,
    totalProtein: 16,
    totalFat: 1.4,
    totalCarbs: 44.1,
    category: 'snack'
  },
  {
    id: 'r023',
    name: '全麦三明治',
    description: '便携营养加餐',
    foodIds: ['f004', 'f013', 'f035', 'f052'],
    servings: [60, 50, 30, 30],
    totalCalories: 296,
    totalProtein: 16.6,
    totalFat: 8.4,
    totalCarbs: 38.2,
    category: 'snack'
  },
  {
    id: 'r024',
    name: '坚果能量组合',
    description: '快速补充能量，健脑益智',
    foodIds: ['f057', 'f059', 'f060', 'f067'],
    servings: [20, 20, 20, 50],
    totalCalories: 382,
    totalProtein: 12.9,
    totalFat: 33.1,
    totalCarbs: 16.9,
    category: 'snack'
  },
  {
    id: 'r025',
    name: '香蕉牛奶蛋昔',
    description: '运动后快速补充',
    foodIds: ['f062', 'f073', 'f013', 'f057'],
    servings: [120, 250, 30, 15],
    totalCalories: 395,
    totalProtein: 17.3,
    totalFat: 13.4,
    totalCarbs: 50.8,
    category: 'snack'
  },
  {
    id: 'r026',
    name: '烤红薯配酸奶',
    description: '健康甜点，甜蜜无负担',
    foodIds: ['f008', 'f074', 'f058', 'f067'],
    servings: [150, 120, 10, 30],
    totalCalories: 300,
    totalProtein: 9.9,
    totalFat: 8.5,
    totalCarbs: 49.7,
    category: 'snack'
  },
  {
    id: 'r027',
    name: '鸡胸肉蛋白棒',
    description: '高蛋低脂，健身常备',
    foodIds: ['f011', 'f004', 'f013', 'f054'],
    servings: [80, 30, 30, 20],
    totalCalories: 268,
    totalProtein: 27.8,
    totalFat: 8.1,
    totalCarbs: 17.6,
    category: 'snack'
  },
  {
    id: 'r028',
    name: '紫菜豆腐汤',
    description: '低卡高钙，清爽开胃',
    foodIds: ['f052', 'f030', 'f049', 'f031'],
    servings: [100, 50, 5, 80],
    totalCalories: 103,
    totalProtein: 10.1,
    totalFat: 3.8,
    totalCarbs: 8.3,
    category: 'snack'
  },
  {
    id: 'r029',
    name: '玉米蔬菜沙拉',
    description: '清爽减脂，膳食纤维丰富',
    foodIds: ['f007', 'f035', 'f038', 'f039'],
    servings: [120, 100, 80, 80],
    totalCalories: 200,
    totalProtein: 5.3,
    totalFat: 1.1,
    totalCarbs: 44.3,
    category: 'snack'
  },
  {
    id: 'r030',
    name: '豆浆油条早餐',
    description: '经典中式早餐，美味饱腹',
    foodIds: ['f053', 'f003', 'f013', 'f062'],
    servings: [250, 80, 50, 50],
    totalCalories: 408,
    totalProtein: 17.7,
    totalFat: 9.5,
    totalCarbs: 58.2,
    category: 'breakfast'
  }
]
