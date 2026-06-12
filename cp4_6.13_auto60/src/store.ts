import { create } from 'zustand';
import type {
  CoffeeBean,
  Recipe,
  Customer,
  CustomerDemand,
  GameStore,
} from './types';

const INITIAL_BEANS: CoffeeBean[] = [
  {
    id: 'brazil',
    name: '巴西喜拉多',
    emoji: '🇧🇷',
    stockGrams: 500,
    marketPrice: 1.2,
    basePrice: 1.2,
    flavorProfile: '坚果、巧克力和淡淡的焦糖甜感，口感醇厚顺滑，是经典的拼配基底。',
    roastLevel: '中深烘焙',
    baseAcid: 28,
    baseBitter: 55,
    baseSweet: 62,
  },
  {
    id: 'colombia',
    name: '哥伦比亚慧兰',
    emoji: '🇨🇴',
    stockGrams: 500,
    marketPrice: 1.5,
    basePrice: 1.5,
    flavorProfile: '红果与柑橘的明亮酸质，焦糖甜感余韵，均衡度极佳，适合单饮或拼配。',
    roastLevel: '中度烘焙',
    baseAcid: 58,
    baseBitter: 40,
    baseSweet: 65,
  },
  {
    id: 'ethiopia',
    name: '埃塞俄比亚耶加雪菲',
    emoji: '🇪🇹',
    stockGrams: 500,
    marketPrice: 2.1,
    basePrice: 2.1,
    flavorProfile: '茉莉花与佛手柑的馥郁花香，柠檬与蓝莓的明亮酸质，茶感干净。',
    roastLevel: '浅度烘焙',
    baseAcid: 82,
    baseBitter: 20,
    baseSweet: 58,
  },
  {
    id: 'guatemala',
    name: '危地马拉安提瓜',
    emoji: '🇬🇹',
    stockGrams: 500,
    marketPrice: 1.7,
    basePrice: 1.7,
    flavorProfile: '可可与烟熏气息，黑糖甜感，橙子的柔和酸质，巧克力余韵绵长。',
    roastLevel: '中深烘焙',
    baseAcid: 42,
    baseBitter: 60,
    baseSweet: 70,
  },
];

const CUSTOMER_EMOJIS = [
  '👩', '👨', '👧', '👦', '🧑', '👵', '👴', '🧕',
  '👩‍🎓', '👨‍💼', '🧑‍💻', '👩‍🍳', '🧑‍🎨', '👨‍🔬', '👩‍🌾',
];

const CUSTOMER_KEYWORDS = [
  '偏酸', '偏苦', '偏甜', '清淡', '浓郁', '花香', '果香', '巧克力',
];

const BEAN_IDS = INITIAL_BEANS.map(b => b.id);

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function buildDemand(): CustomerDemand {
  const keyword = pick(CUSTOMER_KEYWORDS);
  const preferredCount = randInt(1, 2);
  const preferredBeans = pickN(BEAN_IDS, preferredCount);
  const preferredNames = preferredBeans
    .map(id => INITIAL_BEANS.find(b => b.id === id)?.name.split(' ')[0])
    .filter(Boolean)
    .join('或');

  let maxBitter: number | undefined;
  let minAcid: number | undefined;
  let minSweet: number | undefined;
  let description = '';

  switch (keyword) {
    case '偏酸':
      minAcid = randInt(55, 70);
      description = `要一杯偏酸的${preferredNames}拼配，能接受苦度不超过35`;
      maxBitter = 35;
      break;
    case '偏苦':
      maxBitter = undefined;
      minAcid = undefined;
      description = `想要一杯浓郁偏苦的${preferredNames}咖啡，提神用`;
      break;
    case '偏甜':
      minSweet = randInt(60, 75);
      description = `喜欢甜感明显的${preferredNames}风味，越甜越好`;
      break;
    case '清淡':
      maxBitter = randInt(35, 45);
      description = `要一杯清淡的${preferredNames}，不要太苦`;
      break;
    case '浓郁':
      minSweet = randInt(50, 65);
      description = `来一杯${preferredNames}为主的浓郁咖啡`;
      break;
    case '花香':
      minAcid = randInt(60, 75);
      description = `想要带花香的${preferredNames}，酸质明亮一点`;
      break;
    case '果香':
      minAcid = randInt(50, 68);
      description = `喜欢果香浓郁的${preferredNames}，酸甜平衡`;
      break;
    case '巧克力':
      minSweet = randInt(55, 70);
      maxBitter = randInt(50, 65);
      description = `想要一杯带巧克力风味的${preferredNames}咖啡`;
      break;
  }

  return {
    preferredBeans,
    maxBitter,
    minAcid,
    minSweet,
    keyword,
    description,
  };
}

export function computeFlavor(
  ingredients: { beanId: string; grams: number }[],
  beans: CoffeeBean[],
): { acid: number; bitter: number; sweet: number; energy: number } {
  let totalGrams = 0;
  let acidSum = 0;
  let bitterSum = 0;
  let sweetSum = 0;

  for (const ing of ingredients) {
    const bean = beans.find(b => b.id === ing.beanId);
    if (!bean) continue;
    totalGrams += ing.grams;
    acidSum += bean.baseAcid * ing.grams;
    bitterSum += bean.baseBitter * ing.grams;
    sweetSum += bean.baseSweet * ing.grams;
  }

  if (totalGrams === 0) {
    return { acid: 0, bitter: 0, sweet: 0, energy: 0 };
  }

  return {
    acid: Math.round(acidSum / totalGrams),
    bitter: Math.round(bitterSum / totalGrams),
    sweet: Math.round(sweetSum / totalGrams),
    energy: Math.round(totalGrams * 0.8),
  };
}

export function matchRecipeToDemand(
  recipe: Recipe,
  demand: CustomerDemand,
): { success: boolean; score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const recipeBeanIds = recipe.ingredients.map(i => i.beanId);
  let beanMatchCount = 0;
  for (const pref of demand.preferredBeans) {
    if (recipeBeanIds.includes(pref)) beanMatchCount++;
  }
  if (beanMatchCount > 0) {
    score += beanMatchCount * 35;
    reasons.push(`含${beanMatchCount}种偏好豆子 +${beanMatchCount * 35}`);
  } else {
    score -= 40;
    reasons.push('未使用偏好豆子 -40');
  }

  if (demand.maxBitter !== undefined) {
    if (recipe.totalBitter <= demand.maxBitter) {
      score += 25;
      reasons.push(`苦度${recipe.totalBitter}≤${demand.maxBitter} +25`);
    } else {
      score -= 50;
      reasons.push(`苦度${recipe.totalBitter}>${demand.maxBitter} -50`);
    }
  }

  if (demand.minAcid !== undefined) {
    if (recipe.totalAcid >= demand.minAcid) {
      score += 25;
      reasons.push(`酸度${recipe.totalAcid}≥${demand.minAcid} +25`);
    } else {
      score -= 30;
      reasons.push(`酸度${recipe.totalAcid}<${demand.minAcid} -30`);
    }
  }

  if (demand.minSweet !== undefined) {
    if (recipe.totalSweet >= demand.minSweet) {
      score += 20;
      reasons.push(`甜度${recipe.totalSweet}≥${demand.minSweet} +20`);
    } else {
      score -= 25;
      reasons.push(`甜度${recipe.totalSweet}<${demand.minSweet} -25`);
    }
  }

  return { success: score >= 45, score, reasons };
}

function createInitialRecipes(): Recipe[] {
  const classic = computeFlavor(
    [{ beanId: 'brazil', grams: 25 }, { beanId: 'colombia', grams: 20 }],
    INITIAL_BEANS,
  );
  const floral = computeFlavor(
    [{ beanId: 'ethiopia', grams: 30 }, { beanId: 'colombia', grams: 15 }],
    INITIAL_BEANS,
  );
  return [
    {
      id: 'r-classic',
      name: '经典拼配',
      ingredients: [
        { beanId: 'brazil', grams: 25 },
        { beanId: 'colombia', grams: 20 },
      ],
      totalAcid: classic.acid,
      totalBitter: classic.bitter,
      totalSweet: classic.sweet,
      energyKcal: classic.energy,
      brewedCount: 0,
    },
    {
      id: 'r-floral',
      name: '花漾耶加',
      ingredients: [
        { beanId: 'ethiopia', grams: 30 },
        { beanId: 'colombia', grams: 15 },
      ],
      totalAcid: floral.acid,
      totalBitter: floral.bitter,
      totalSweet: floral.sweet,
      energyKcal: floral.energy,
      brewedCount: 0,
    },
  ];
}

const MAX_SEATS = 6;

export const useGameStore = create<GameStore>((set, get) => ({
  coins: 120,
  satisfaction: 75,
  businessTimeLeft: 600,
  dayCount: 1,
  isBusinessRunning: false,
  selectedRecipeId: null,
  beans: INITIAL_BEANS,
  recipes: createInitialRecipes(),
  customers: [],
  complaintActive: false,
  complaintCustomerId: null,
  screenShake: false,

  setModeAction: () => {},

  addCoins: (amount) =>
    set((s) => ({ coins: Math.max(0, s.coins + amount) })),

  spendCoins: (amount) => {
    const s = get();
    if (s.coins < amount) return false;
    set({ coins: s.coins - amount });
    return true;
  },

  addRecipe: (recipe) =>
    set((s) => ({
      recipes: [
        ...s.recipes,
        {
          ...recipe,
          id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          brewedCount: 0,
        },
      ],
    })),

  incrementBrewedCount: (recipeId) =>
    set((s) => ({
      recipes: s.recipes.map((r) =>
        r.id === recipeId ? { ...r, brewedCount: r.brewedCount + 1 } : r,
      ),
    })),

  updateBeanStock: (beanId, delta) =>
    set((s) => ({
      beans: s.beans.map((b) =>
        b.id === beanId
          ? { ...b, stockGrams: Math.max(0, b.stockGrams + delta) }
          : b,
      ),
    })),

  fluctuateMarketPrices: () =>
    set((s) => ({
      beans: s.beans.map((b) => ({
        ...b,
        marketPrice: Number(
          (b.basePrice * (1 + rand(-0.15, 0.15))).toFixed(2),
        ),
      })),
    })),

  selectRecipe: (recipeId) => set({ selectedRecipeId: recipeId }),

  generateCustomer: () => {
    const s = get();
    const activeCustomers = s.customers.filter(
      (c) => c.status === 'waiting' || c.status === 'complaining',
    );
    if (activeCustomers.length >= MAX_SEATS) return;
    const usedSeats = new Set(s.customers.map((c) => c.seatIndex));
    let seatIndex = 0;
    for (let i = 0; i < MAX_SEATS; i++) {
      if (!usedSeats.has(i)) {
        seatIndex = i;
        break;
      }
    }
    const customer: Customer = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji: pick(CUSTOMER_EMOJIS),
      mood: 'neutral',
      demand: buildDemand(),
      patience: 100,
      hasComplaint: false,
      wrongAttempts: 0,
      status: 'waiting',
      seatIndex,
      enteredAt: Date.now(),
    };
    set((st) => ({ customers: [...st.customers, customer] }));
  },

  removeCustomer: (customerId) =>
    set((s) => ({
      customers: s.customers.filter((c) => c.id !== customerId),
      complaintCustomerId:
        s.complaintCustomerId === customerId ? null : s.complaintCustomerId,
      complaintActive:
        s.complaintCustomerId === customerId ? false : s.complaintActive,
    })),

  serveCustomer: (customerId, recipeId) => {
    const s = get();
    const customer = s.customers.find((c) => c.id === customerId);
    const recipe = s.recipes.find((r) => r.id === recipeId);
    if (!customer || !recipe) {
      return { success: false, message: '顾客或配方不存在' };
    }
    const match = matchRecipeToDemand(recipe, customer.demand);
    const newAttempts = customer.wrongAttempts + 1;

    if (match.success) {
      const revenue = 18 + Math.floor(match.score / 8);
      for (const ing of recipe.ingredients) {
        get().updateBeanStock(ing.beanId, -ing.grams);
      }
      get().addCoins(revenue);
      get().adjustSatisfaction(5);
      get().incrementBrewedCount(recipeId);
      set((st) => ({
        customers: st.customers.map((c) =>
          c.id === customerId
            ? { ...c, status: 'served', mood: 'happy', wrongAttempts: 0 }
            : c,
        ),
      }));
      setTimeout(() => get().removeCustomer(customerId), 1400);
      return {
        success: true,
        message: `匹配成功！${revenue}金币收入（评分 ${match.score}）`,
      };
    }

    if (newAttempts >= 3) {
      get().adjustSatisfaction(-12);
      set((st) => ({
        customers: st.customers.map((c) =>
          c.id === customerId
            ? { ...c, status: 'leaving', mood: 'angry', wrongAttempts: newAttempts }
            : c,
        ),
      }));
      setTimeout(() => get().removeCustomer(customerId), 1000);
      return {
        success: false,
        message: `连续匹配失败3次，顾客生气离开！（评分 ${match.score}）`,
      };
    }

    set((st) => ({
      customers: st.customers.map((c) =>
        c.id === customerId
          ? { ...c, wrongAttempts: newAttempts, mood: newAttempts >= 2 ? 'angry' : 'neutral' }
          : c,
      ),
    }));
    return {
      success: false,
      message: `匹配失败第${newAttempts}次，请重新选择配方（评分 ${match.score}）`,
    };
  },

  triggerComplaint: () => {
    const s = get();
    const waiting = s.customers.filter((c) => c.status === 'waiting' && !c.hasComplaint);
    if (waiting.length === 0) return;
    const victim = pick(waiting);
    set((st) => ({
      complaintActive: true,
      complaintCustomerId: victim.id,
      screenShake: true,
      customers: st.customers.map((c) =>
        c.id === victim.id
          ? { ...c, hasComplaint: true, mood: 'angry', status: 'complaining' }
          : c,
      ),
    }));
    setTimeout(() => set({ screenShake: false }), 320);
  },

  resolveComplaint: () => {
    const s = get();
    if (!s.complaintCustomerId) return;
    const victimId = s.complaintCustomerId;
    get().adjustSatisfaction(-4);
    set((st) => ({
      complaintActive: false,
      complaintCustomerId: null,
      customers: st.customers.map((c) =>
        c.id === victimId
          ? { ...c, hasComplaint: false, mood: 'neutral', status: 'waiting', wrongAttempts: 0 }
          : c,
      ),
    }));
  },

  adjustSatisfaction: (delta) =>
    set((s) => ({
      satisfaction: Math.max(0, Math.min(100, s.satisfaction + delta)),
    })),

  startBusiness: () => {
    const s = get();
    if (s.isBusinessRunning) return;
    set({
      isBusinessRunning: true,
      businessTimeLeft: 600,
      customers: [],
      complaintActive: false,
      complaintCustomerId: null,
      selectedRecipeId: null,
    });
    get().fluctuateMarketPrices();
  },

  tickBusiness: () => {
    const s = get();
    if (!s.isBusinessRunning) return;
    const next = s.businessTimeLeft - 1;
    if (next <= 0) {
      get().endBusiness();
      return;
    }
    set({ businessTimeLeft: next });
    if (Math.random() < 0.035 && s.complaintActive === false) {
      get().triggerComplaint();
    }
  },

  endBusiness: () => {
    set((s) => ({
      isBusinessRunning: false,
      businessTimeLeft: 0,
      dayCount: s.dayCount + 1,
      customers: [],
      complaintActive: false,
      complaintCustomerId: null,
    }));
    get().fluctuateMarketPrices();
  },

  triggerScreenShake: () => {
    set({ screenShake: true });
    setTimeout(() => set({ screenShake: false }), 320);
  },

  resetWrongAttempts: (customerId) =>
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId ? { ...c, wrongAttempts: 0, mood: 'neutral' } : c,
      ),
    })),
}));
