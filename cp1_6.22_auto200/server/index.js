const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const round = (num, dp = 2) => {
  const factor = Math.pow(10, dp);
  return Math.round(num * factor) / factor;
};

const getDateStr = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateNutritionForGrams = (food, grams) => {
  const ratio = grams / 100;
  return {
    calories: round(food.calories * ratio),
    protein: round(food.protein * ratio),
    fat: round(food.fat * ratio),
    carbs: round(food.carbs * ratio),
    sodium: round(food.sodium * ratio)
  };
};

const sumMealNutrition = (foods) => {
  const sum = { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 };
  foods.forEach(item => {
    const n = calculateNutritionForGrams(item.food, item.grams);
    sum.calories += n.calories;
    sum.protein += n.protein;
    sum.fat += n.fat;
    sum.carbs += n.carbs;
    sum.sodium += n.sodium;
  });
  Object.keys(sum).forEach(k => sum[k] = round(sum[k]));
  return sum;
};

const getMealNameCN = (type) => {
  const map = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
  };
  return map[type] || type;
};

const foods = [
  { id: 1, name: '白米饭', calories: 116, protein: 2.6, fat: 0.3, carbs: 25.9, sodium: 2 },
  { id: 2, name: '煮鸡蛋', calories: 151, protein: 13.3, fat: 8.8, carbs: 2.8, sodium: 132 },
  { id: 3, name: '煎鸡胸肉', calories: 133, protein: 19.4, fat: 5, carbs: 2.5, sodium: 64 },
  { id: 4, name: '清蒸鱼', calories: 113, protein: 20.4, fat: 3.5, carbs: 0, sodium: 58 },
  { id: 5, name: '番茄炒蛋', calories: 86, protein: 5.5, fat: 6.2, carbs: 3.8, sodium: 196 },
  { id: 6, name: '炒青菜', calories: 46, protein: 2, fat: 3.5, carbs: 2.8, sodium: 85 },
  { id: 7, name: '红烧肉', calories: 395, protein: 13.6, fat: 37, carbs: 2.4, sodium: 80 },
  { id: 8, name: '水饺', calories: 240, protein: 9.5, fat: 13, carbs: 22, sodium: 450 },
  { id: 9, name: '牛奶', calories: 54, protein: 3, fat: 3.2, carbs: 3.4, sodium: 37 },
  { id: 10, name: '豆浆', calories: 54, protein: 3, fat: 1.8, carbs: 5.6, sodium: 21 },
  { id: 11, name: '面包', calories: 312, protein: 8.3, fat: 5.1, carbs: 58.6, sodium: 230 },
  { id: 12, name: '燕麦粥', calories: 377, protein: 15, fat: 6.7, carbs: 61.4, sodium: 12 },
  { id: 13, name: '苹果', calories: 52, protein: 0.3, fat: 0.2, carbs: 13.8, sodium: 1 },
  { id: 14, name: '香蕉', calories: 89, protein: 1.1, fat: 0.3, carbs: 22.8, sodium: 1 },
  { id: 15, name: '牛肉', calories: 250, protein: 26, fat: 15, carbs: 0, sodium: 66 },
  { id: 16, name: '猪肉', calories: 395, protein: 13.2, fat: 37, carbs: 2.4, sodium: 59 },
  { id: 17, name: '豆腐', calories: 81, protein: 8.1, fat: 3.7, carbs: 3.8, sodium: 7 },
  { id: 18, name: '面条', calories: 138, protein: 4.5, fat: 0.7, carbs: 29, sodium: 180 },
  { id: 19, name: '沙拉', calories: 152, protein: 4, fat: 12, carbs: 8, sodium: 220 },
  { id: 20, name: '炒饭', calories: 173, protein: 5.5, fat: 6.4, carbs: 25, sodium: 350 },
  { id: 21, name: '披萨', calories: 266, protein: 11, fat: 10, carbs: 34, sodium: 640 },
  { id: 22, name: '汉堡', calories: 295, protein: 17, fat: 15, carbs: 25, sodium: 680 },
  { id: 23, name: '薯条', calories: 312, protein: 3.4, fat: 15, carbs: 41, sodium: 230 },
  { id: 24, name: '可乐', calories: 43, protein: 0, fat: 0, carbs: 10.6, sodium: 12 },
  { id: 25, name: '咖啡', calories: 2, protein: 0.3, fat: 0, carbs: 0, sodium: 2 },
  { id: 26, name: '绿茶', calories: 1, protein: 0.2, fat: 0, carbs: 0.2, sodium: 1 }
];

const goals = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 250,
  sodium: 2000
};

const generateMeals = () => {
  const meals = [];
  const today = new Date();
  let mealId = 1;

  const mealTemplates = [
    [
      { dateOffset: 0, mealType: 'breakfast', items: [{ foodId: 11, grams: 80 }, { foodId: 2, grams: 100 }, { foodId: 9, grams: 250 }] },
      { dateOffset: 0, mealType: 'lunch', items: [{ foodId: 1, grams: 200 }, { foodId: 3, grams: 150 }, { foodId: 6, grams: 150 }] },
      { dateOffset: 0, mealType: 'dinner', items: [{ foodId: 18, grams: 250 }, { foodId: 4, grams: 180 }, { foodId: 17, grams: 100 }] }
    ],
    [
      { dateOffset: -1, mealType: 'breakfast', items: [{ foodId: 12, grams: 60 }, { foodId: 13, grams: 150 }, { foodId: 10, grams: 300 }] },
      { dateOffset: -1, mealType: 'lunch', items: [{ foodId: 1, grams: 180 }, { foodId: 7, grams: 120 }, { foodId: 5, grams: 150 }] },
      { dateOffset: -1, mealType: 'dinner', items: [{ foodId: 8, grams: 200 }, { foodId: 14, grams: 120 }] }
    ],
    [
      { dateOffset: -2, mealType: 'breakfast', items: [{ foodId: 11, grams: 100 }, { foodId: 9, grams: 200 }] },
      { dateOffset: -2, mealType: 'lunch', items: [{ foodId: 20, grams: 300 }, { foodId: 25, grams: 200 }] },
      { dateOffset: -2, mealType: 'dinner', items: [{ foodId: 1, grams: 200 }, { foodId: 15, grams: 150 }, { foodId: 6, grams: 120 }] }
    ],
    [
      { dateOffset: -3, mealType: 'breakfast', items: [{ foodId: 2, grams: 100 }, { foodId: 10, grams: 250 }] },
      { dateOffset: -3, mealType: 'lunch', items: [{ foodId: 21, grams: 250 }, { foodId: 24, grams: 330 }] },
      { dateOffset: -3, mealType: 'dinner', items: [{ foodId: 18, grams: 200 }, { foodId: 16, grams: 130 }, { foodId: 17, grams: 150 }] }
    ],
    [
      { dateOffset: -4, mealType: 'breakfast', items: [{ foodId: 12, grams: 80 }, { foodId: 9, grams: 250 }] },
      { dateOffset: -4, mealType: 'lunch', items: [{ foodId: 22, grams: 200 }, { foodId: 23, grams: 100 }] },
      { dateOffset: -4, mealType: 'dinner', items: [{ foodId: 1, grams: 180 }, { foodId: 5, grams: 200 }, { foodId: 6, grams: 150 }] }
    ],
    [
      { dateOffset: -5, mealType: 'breakfast', items: [{ foodId: 11, grams: 80 }, { foodId: 2, grams: 100 }, { foodId: 26, grams: 200 }] },
      { dateOffset: -5, mealType: 'lunch', items: [{ foodId: 1, grams: 220 }, { foodId: 4, grams: 200 }, { foodId: 19, grams: 150 }] },
      { dateOffset: -5, mealType: 'dinner', items: [{ foodId: 8, grams: 220 }] }
    ],
    [
      { dateOffset: -6, mealType: 'breakfast', items: [{ foodId: 2, grams: 100 }, { foodId: 13, grams: 150 }, { foodId: 10, grams: 300 }] },
      { dateOffset: -6, mealType: 'lunch', items: [{ foodId: 20, grams: 350 }, { foodId: 25, grams: 200 }] },
      { dateOffset: -6, mealType: 'dinner', items: [{ foodId: 1, grams: 200 }, { foodId: 15, grams: 180 }, { foodId: 5, grams: 180 }] }
    ]
  ];

  mealTemplates.forEach(dayTemplate => {
    dayTemplate.forEach(meal => {
      const d = new Date(today);
      d.setDate(d.getDate() + meal.dateOffset);
      const dateStr = getDateStr(d);
      const mealFoods = meal.items.map(item => {
        const food = foods.find(f => f.id === item.foodId);
        return { food, grams: item.grams };
      });
      meals.push({
        id: mealId++,
        date: dateStr,
        mealType: meal.mealType,
        foods: mealFoods,
        createdAt: d.toISOString()
      });
    });
  });

  return meals;
};

const db = {
  meals: generateMeals()
};

app.get('/api/foods/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json(foods);
  }
  const results = foods.filter(f => f.name.toLowerCase().includes(q));
  res.json(results);
});

app.post('/api/meals', (req, res) => {
  const { date, mealType, foods: mealFoods } = req.body;
  if (!date || !mealType || !Array.isArray(mealFoods)) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const newMeal = {
    id: db.meals.length > 0 ? Math.max(...db.meals.map(m => m.id)) + 1 : 1,
    date,
    mealType,
    foods: mealFoods.map(item => ({
      food: foods.find(f => f.id === item.foodId) || item.food,
      grams: item.grams
    })),
    createdAt: new Date().toISOString()
  };
  db.meals.push(newMeal);
  res.status(201).json(newMeal);
});

app.get('/api/meals', (req, res) => {
  const { date } = req.query;
  if (date) {
    return res.json(db.meals.filter(m => m.date === date));
  }
  res.json(db.meals);
});

app.get('/api/meals/history', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  const history = db.meals.filter(m => {
    const mealDate = new Date(m.date);
    mealDate.setHours(0, 0, 0, 0);
    return mealDate >= startDate && mealDate <= today;
  });
  res.json(history);
});

app.get('/api/goals', (req, res) => {
  res.json(goals);
});

app.put('/api/goals', (req, res) => {
  const updates = req.body;
  Object.keys(updates).forEach(key => {
    if (key in goals && typeof updates[key] === 'number') {
      goals[key] = updates[key];
    }
  });
  res.json(goals);
});

const calculateDailySummary = (date) => {
  const dailyMeals = db.meals.filter(m => m.date === date);
  const total = { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 };

  dailyMeals.forEach(meal => {
    const sum = sumMealNutrition(meal.foods);
    total.calories += sum.calories;
    total.protein += sum.protein;
    total.fat += sum.fat;
    total.carbs += sum.carbs;
    total.sodium += sum.sodium;
  });

  Object.keys(total).forEach(k => total[k] = round(total[k]));

  const percentage = {
    calories: round((total.calories / goals.calories) * 100),
    protein: round((total.protein / goals.protein) * 100),
    fat: round((total.fat / goals.fat) * 100),
    carbs: round((total.carbs / goals.carbs) * 100),
    sodium: round((total.sodium / goals.sodium) * 100)
  };

  return { date, total, goals, percentage, meals: dailyMeals };
};

app.get('/api/daily-summary', (req, res) => {
  const date = req.query.date || getDateStr();
  res.json(calculateDailySummary(date));
});

app.get('/api/suggestions', (req, res) => {
  const date = req.query.date || getDateStr();
  const suggestions = [];
  const dailyMeals = db.meals.filter(m => m.date === date);

  dailyMeals.forEach(meal => {
    const sum = sumMealNutrition(meal.foods);
    const fatPercent = (sum.fat / goals.fat) * 100;
    if (fatPercent > 50) {
      suggestions.push({
        type: 'warning',
        text: `${getMealNameCN(meal.mealType)}的脂肪摄入(${sum.fat}g)已超过日目标的50%，建议选择更清淡的食物`
      });
    }
  });

  const summary = calculateDailySummary(date);
  const proteinPercent = (summary.total.protein / goals.protein) * 100;
  if (proteinPercent < 30) {
    suggestions.push({
      type: 'info',
      text: `今日蛋白质摄入(${summary.total.protein}g)不足目标的30%，建议增加鸡蛋、鸡胸肉、豆腐等高蛋白质食物`
    });
  }

  res.json(suggestions);
});

app.listen(PORT, () => {
  console.log('NutriLog API server running on port 3001');
});
