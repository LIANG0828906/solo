// 食材分类类型
export type IngredientCategory = '蔬菜' | '肉类' | '调味品' | '乳制品' | '谷物' | '其他';

// 食材接口
export interface Ingredient {
  name: string;        // 食材名称
  amount: number;      // 食材数量
  unit: string;        // 计量单位（如：克、毫升、个等）
  category: IngredientCategory; // 食材分类
}

// 烹饪步骤接口
export interface CookingStep {
  step: number;        // 步骤序号
  description: string; // 步骤描述
  duration: number;    // 该步骤所需时间（分钟）
}

// 营养信息接口
export interface Nutrition {
  calories: number;    // 热量（千卡）
  protein: number;     // 蛋白质（克）
  fat: number;         // 脂肪（克）
  carbs: number;       // 碳水化合物（克）
}

// 食谱难度等级（1=简单，2=中等，3=困难）
export type DifficultyLevel = 1 | 2 | 3;

// 食谱接口
export interface Recipe {
  id: string;          // 食谱唯一标识
  name: string;        // 食谱名称
  image: string;       // 食谱图片URL
  category: string;    // 食谱分类
  cookTime: number;    // 烹饪总时间（分钟）
  difficulty: DifficultyLevel; // 难度等级
  ingredients: Ingredient[]; // 食材列表
  steps: CookingStep[]; // 烹饪步骤
  nutrition: Nutrition; // 营养信息
}

// 餐食类型
export type MealType = 'breakfast' | 'lunch' | 'dinner';

// 一天的餐食安排
export interface DayMeal {
  breakfast: Recipe | null; // 早餐
  lunch: Recipe | null;     // 午餐
  dinner: Recipe | null;    // 晚餐
}

// 一周餐食计划
export interface MealPlan {
  startDate: string;       // 计划开始日期（ISO格式字符串）
  days: [DayMeal, DayMeal, DayMeal, DayMeal, DayMeal, DayMeal, DayMeal]; // 7天的餐食安排
}

// 购物清单项接口
export interface ShoppingItem {
  id: string;              // 购物项唯一标识
  name: string;            // 食材名称
  amount: number;          // 购买数量
  unit: string;            // 计量单位
  category: IngredientCategory; // 食材分类
  purchased: boolean;      // 是否已购买
}

// 食谱匹配结果接口
export interface MatchResult {
  recipe: Recipe;                    // 匹配的食谱
  matchCount: number;                // 匹配的食材数量
  matchedIngredients: Ingredient[];  // 已匹配的食材列表
  missingIngredients: Ingredient[];  // 缺少的食材列表
}
