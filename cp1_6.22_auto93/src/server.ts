import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Food, FoodRecord, UserProfile, NutritionGoals, WeeklyMealPlan } from './types';
import { calculateNutritionGoals, generateWeeklyMealPlan, calculateNutritionForAmount } from './utils/nutrition';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
}));
app.use(express.json());

const foods: Food[] = [
  { id: '1', name: '米饭', category: '主食', protein: 2.6, carbs: 25.6, fat: 0.3, fiber: 0.3, calories: 116 },
  { id: '2', name: '面条', category: '主食', protein: 4.5, carbs: 56, fat: 0.5, fiber: 1.5, calories: 248 },
  { id: '3', name: '馒头', category: '主食', protein: 7, carbs: 47, fat: 1.1, fiber: 1.3, calories: 221 },
  { id: '4', name: '面包', category: '主食', protein: 8.3, carbs: 58.6, fat: 5.1, fiber: 4.9, calories: 312 },
  { id: '5', name: '燕麦粥', category: '主食', protein: 5, carbs: 27, fat: 2, fiber: 3, calories: 145 },
  { id: '6', name: '玉米', category: '主食', protein: 4, carbs: 22.8, fat: 1.2, fiber: 2.9, calories: 112 },
  { id: '7', name: '红薯', category: '主食', protein: 1.6, carbs: 24.7, fat: 0.1, fiber: 3, calories: 102 },
  { id: '8', name: '土豆', category: '主食', protein: 2.6, carbs: 17.8, fat: 0.2, fiber: 1.1, calories: 81 },
  { id: '9', name: '全麦面包', category: '主食', protein: 13, carbs: 41, fat: 4.2, fiber: 7, calories: 250 },
  { id: '10', name: '糙米', category: '主食', protein: 7.7, carbs: 77, fat: 2.6, fiber: 3.4, calories: 348 },
  { id: '11', name: '鸡胸肉', category: '肉类', protein: 24.6, carbs: 0, fat: 1.9, fiber: 0, calories: 118 },
  { id: '12', name: '鸡腿肉', category: '肉类', protein: 20.2, carbs: 0, fat: 7.4, fiber: 0, calories: 151 },
  { id: '13', name: '牛肉', category: '肉类', protein: 25.8, carbs: 0, fat: 4.2, fiber: 0, calories: 142 },
  { id: '14', name: '猪肉', category: '肉类', protein: 20.3, carbs: 0, fat: 6.2, fiber: 0, calories: 143 },
  { id: '15', name: '羊肉', category: '肉类', protein: 23.2, carbs: 0, fat: 3.9, fiber: 0, calories: 128 },
  { id: '16', name: '鱼肉', category: '肉类', protein: 18, carbs: 0, fat: 4.3, fiber: 0, calories: 113 },
  { id: '17', name: '虾', category: '肉类', protein: 18.6, carbs: 1.5, fat: 0.8, fiber: 0, calories: 93 },
  { id: '18', name: '鸡蛋', category: '肉类', protein: 13.3, carbs: 2.8, fat: 8.8, fiber: 0, calories: 144 },
  { id: '19', name: '鸭蛋', category: '肉类', protein: 12.6, carbs: 3.1, fat: 13, fiber: 0, calories: 180 },
  { id: '20', name: '三文鱼', category: '肉类', protein: 20.4, carbs: 0, fat: 13.4, fiber: 0, calories: 208 },
  { id: '21', name: '西兰花', category: '蔬菜', protein: 4.1, carbs: 4.3, fat: 0.6, fiber: 1.6, calories: 36 },
  { id: '22', name: '胡萝卜', category: '蔬菜', protein: 1, carbs: 8.8, fat: 0.2, fiber: 1.1, calories: 39 },
  { id: '23', name: '西红柿', category: '蔬菜', protein: 0.9, carbs: 4, fat: 0.2, fiber: 0.5, calories: 19 },
  { id: '24', name: '黄瓜', category: '蔬菜', protein: 0.8, carbs: 2.9, fat: 0.2, fiber: 0.5, calories: 15 },
  { id: '25', name: '菠菜', category: '蔬菜', protein: 2.6, carbs: 4.5, fat: 0.3, fiber: 1.7, calories: 24 },
  { id: '26', name: '白菜', category: '蔬菜', protein: 1.5, carbs: 3.2, fat: 0.1, fiber: 0.8, calories: 17 },
  { id: '27', name: '青菜', category: '蔬菜', protein: 1.4, carbs: 2.4, fat: 0.1, fiber: 0.7, calories: 15 },
  { id: '28', name: '茄子', category: '蔬菜', protein: 1.1, carbs: 4.9, fat: 0.2, fiber: 1.3, calories: 23 },
  { id: '29', name: '青椒', category: '蔬菜', protein: 0.8, carbs: 3.8, fat: 0.1, fiber: 0.9, calories: 19 },
  { id: '30', name: '豆角', category: '蔬菜', protein: 2.5, carbs: 6.7, fat: 0.2, fiber: 2.1, calories: 37 },
  { id: '31', name: '豆芽', category: '蔬菜', protein: 1.4, carbs: 3.2, fat: 0.1, fiber: 0.6, calories: 18 },
  { id: '32', name: '蘑菇', category: '蔬菜', protein: 2.7, carbs: 4.1, fat: 0.1, fiber: 2.1, calories: 24 },
  { id: '33', name: '洋葱', category: '蔬菜', protein: 1.1, carbs: 9, fat: 0.2, fiber: 0.9, calories: 39 },
  { id: '34', name: '芹菜', category: '蔬菜', protein: 0.8, carbs: 3.9, fat: 0.1, fiber: 1.2, calories: 17 },
  { id: '35', name: '生菜', category: '蔬菜', protein: 1.3, carbs: 2, fat: 0.3, fiber: 0.7, calories: 15 },
  { id: '36', name: '苹果', category: '水果', protein: 0.3, carbs: 13.7, fat: 0.2, fiber: 1.7, calories: 52 },
  { id: '37', name: '香蕉', category: '水果', protein: 1.4, carbs: 22, fat: 0.2, fiber: 1.2, calories: 91 },
  { id: '38', name: '橙子', category: '水果', protein: 0.8, carbs: 11.1, fat: 0.2, fiber: 0.6, calories: 47 },
  { id: '39', name: '葡萄', category: '水果', protein: 0.5, carbs: 10.3, fat: 0.2, fiber: 0.4, calories: 43 },
  { id: '40', name: '西瓜', category: '水果', protein: 0.6, carbs: 5.8, fat: 0.1, fiber: 0.3, calories: 25 },
  { id: '41', name: '草莓', category: '水果', protein: 1, carbs: 7.1, fat: 0.2, fiber: 1.1, calories: 32 },
  { id: '42', name: '蓝莓', category: '水果', protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, calories: 57 },
  { id: '43', name: '猕猴桃', category: '水果', protein: 0.8, carbs: 14.5, fat: 0.6, fiber: 2.6, calories: 61 },
  { id: '44', name: '芒果', category: '水果', protein: 0.6, carbs: 14.98, fat: 0.32, fiber: 1.6, calories: 60 },
  { id: '45', name: '牛奶', category: '乳制品', protein: 3.4, carbs: 5.2, fat: 3.6, fiber: 0, calories: 65 },
  { id: '46', name: '酸奶', category: '乳制品', protein: 10, carbs: 7, fat: 3.5, fiber: 0, calories: 99 },
  { id: '47', name: '奶酪', category: '乳制品', protein: 25.4, carbs: 3.5, fat: 23.5, fiber: 0, calories: 328 },
  { id: '48', name: '豆浆', category: '乳制品', protein: 3, carbs: 1.2, fat: 1.6, fiber: 0.2, calories: 30 },
  { id: '49', name: '豆腐', category: '其他', protein: 8.1, carbs: 3.8, fat: 3.7, fiber: 0.4, calories: 81 },
  { id: '50', name: '坚果', category: '其他', protein: 21.2, carbs: 21.5, fat: 50.6, fiber: 7.7, calories: 607 },
  { id: '51', name: '蜂蜜', category: '其他', protein: 0.4, carbs: 82.4, fat: 1.9, fiber: 0.2, calories: 321 },
  { id: '52', name: '橄榄油', category: '其他', protein: 0, carbs: 0, fat: 100, fiber: 0, calories: 899 },
];

let records: FoodRecord[] = [];

let profile: UserProfile = {
  age: 30,
  gender: 'male',
  height: 175,
  weight: 70,
  activityLevel: 1.55,
};

app.get('/api/foods', (req, res) => {
  const name = req.query.name as string;
  if (name) {
    const filtered = foods.filter(food =>
      food.name.toLowerCase().includes(name.toLowerCase())
    );
    res.json(filtered);
  } else {
    res.json(foods);
  }
});

app.get('/api/records', (req, res) => {
  const date = req.query.date as string;
  if (date) {
    const filtered = records.filter(record => record.date === date);
    res.json(filtered);
  } else {
    res.json(records);
  }
});

app.post('/api/records', (req, res) => {
  const { foodId, amount, mealType, date, time } = req.body;
  const food = foods.find(f => f.id === foodId);
  if (!food) {
    return res.status(404).json({ error: '食物未找到' });
  }

  const nutrition = calculateNutritionForAmount(food, amount);
  const newRecord: FoodRecord = {
    id: uuidv4(),
    foodId,
    foodName: food.name,
    amount,
    mealType,
    date,
    time,
    ...nutrition,
  };

  records.push(newRecord);
  res.json(newRecord);
});

app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: '记录未找到' });
  }
});

app.get('/api/profile', (_req, res) => {
  res.json(profile);
});

app.put('/api/profile', (req, res) => {
  profile = req.body;
  res.json(profile);
});

app.get('/api/goals', (_req, res) => {
  const goals: NutritionGoals = calculateNutritionGoals(profile);
  res.json(goals);
});

app.get('/api/plan', (_req, res) => {
  const plan: WeeklyMealPlan = generateWeeklyMealPlan(foods, calculateNutritionGoals(profile), records);
  res.json(plan);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
