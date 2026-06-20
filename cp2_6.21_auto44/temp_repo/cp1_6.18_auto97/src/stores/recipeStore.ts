import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Ingredient {
  name: string;
  icon: string;
}

export interface SolarTermRecipe {
  id: string;
  solarTerm: string;
  solarTermIcon: string;
  dishName: string;
  description: string;
  ingredients: Ingredient[];
  decoration: string;
  decorationColor: string;
}

export interface FavoriteRecipe {
  id: string;
  recipeId: string;
  solarTerm: string;
  dishName: string;
  rating: number;
  note: string;
  order: number;
  createdAt: number;
}

interface RecipeState {
  recipes: SolarTermRecipe[];
  favorites: FavoriteRecipe[];
  currentSolarTerm: string;
  toggleFavorite: (recipeId: string) => void;
  updateRating: (recipeId: string, rating: number) => void;
  updateNote: (recipeId: string, note: string) => void;
  reorderFavorites: (fromIndex: number, toIndex: number) => void;
  isFavorite: (recipeId: string) => boolean;
  getFavorite: (recipeId: string) => FavoriteRecipe | undefined;
  getFavoritesBySolarTerm: () => Record<string, FavoriteRecipe[]>;
}

const solarTermRecipes: SolarTermRecipe[] = [
  {
    id: 'lichun',
    solarTerm: '立春',
    solarTermIcon: 'willow',
    dishName: '春卷',
    description: '咬春迎新，薄皮裹鲜蔬，一口尝到春天的滋味',
    ingredients: [
      { name: '春卷皮', icon: 'bread' },
      { name: '豆芽', icon: 'leaf' },
      { name: '韭黄', icon: 'wheat' },
      { name: '肉丝', icon: 'beef' },
    ],
    decoration: 'willow',
    decorationColor: '#8BC34A',
  },
  {
    id: 'yushui',
    solarTerm: '雨水',
    solarTermIcon: 'rain',
    dishName: '红枣糕',
    description: '雨水润物，红枣暖心，香甜软糯好时节',
    ingredients: [
      { name: '红枣', icon: 'cherry' },
      { name: '糯米粉', icon: 'wheat' },
      { name: '红糖', icon: 'cookie' },
    ],
    decoration: 'rain',
    decorationColor: '#64B5F6',
  },
  {
    id: 'jingzhe',
    solarTerm: '惊蛰',
    solarTermIcon: 'bug',
    dishName: '梨汤',
    description: '惊蛰醒春，雪梨润肺，清甜滋润解春燥',
    ingredients: [
      { name: '雪梨', icon: 'apple' },
      { name: '冰糖', icon: 'gem' },
      { name: '银耳', icon: 'cloud' },
      { name: '枸杞', icon: 'cherry' },
    ],
    decoration: 'sprout',
    decorationColor: '#AED581',
  },
  {
    id: 'chunfen',
    solarTerm: '春分',
    solarTermIcon: 'flower',
    dishName: '香椿炒蛋',
    description: '春分昼夜均，香椿芽嫩，炒蛋飘香',
    ingredients: [
      { name: '香椿', icon: 'leaf' },
      { name: '鸡蛋', icon: 'egg' },
      { name: '香油', icon: 'droplet' },
    ],
    decoration: 'flower',
    decorationColor: '#F48FB1',
  },
  {
    id: 'qingming',
    solarTerm: '清明',
    solarTermIcon: 'leaf',
    dishName: '青团',
    description: '清明艾草香，青团糯韧，相思寄情',
    ingredients: [
      { name: '艾草', icon: 'leaf' },
      { name: '糯米粉', icon: 'wheat' },
      { name: '豆沙', icon: 'cookie' },
      { name: '肉松', icon: 'beef' },
    ],
    decoration: 'grass',
    decorationColor: '#66BB6A',
  },
  {
    id: 'guyu',
    solarTerm: '谷雨',
    solarTermIcon: 'cloud',
    dishName: '谷雨茶',
    description: '雨生百谷，新茶初摘，一杯清香满春光',
    ingredients: [
      { name: '春茶', icon: 'leaf' },
      { name: '山泉', icon: 'droplet' },
      { name: '桂花', icon: 'flower' },
    ],
    decoration: 'tea',
    decorationColor: '#4DB6AC',
  },
  {
    id: 'lixia',
    solarTerm: '立夏',
    solarTermIcon: 'sun',
    dishName: '立夏饭',
    description: '立夏尝新，蚕豆饭香，万物繁茂始',
    ingredients: [
      { name: '蚕豆', icon: 'bean' },
      { name: '春笋', icon: 'sprout' },
      { name: '咸肉', icon: 'beef' },
      { name: '糯米', icon: 'wheat' },
    ],
    decoration: 'sun',
    decorationColor: '#FFD54F',
  },
  {
    id: 'xiaoman',
    solarTerm: '小满',
    solarTermIcon: 'wheat',
    dishName: '苦菜',
    description: '小满麦渐黄，苦菜清热，初夏养生',
    ingredients: [
      { name: '苦菜', icon: 'leaf' },
      { name: '蒜泥', icon: 'flower' },
      { name: '香醋', icon: 'droplet' },
    ],
    decoration: 'wheat',
    decorationColor: '#FFB74D',
  },
  {
    id: 'mangzhong',
    solarTerm: '芒种',
    solarTermIcon: 'wheat',
    dishName: '青梅酒',
    description: '芒种忙种，青梅煮酒，酸甜解暑',
    ingredients: [
      { name: '青梅', icon: 'apple' },
      { name: '冰糖', icon: 'gem' },
      { name: '白酒', icon: 'wine' },
      { name: '蜂蜜', icon: 'droplet' },
    ],
    decoration: 'plum',
    decorationColor: '#81C784',
  },
  {
    id: 'xiazhi',
    solarTerm: '夏至',
    solarTermIcon: 'lotus',
    dishName: '凉面',
    description: '夏至日长，麻酱凉面，清爽一夏',
    ingredients: [
      { name: '面条', icon: 'wheat' },
      { name: '麻酱', icon: 'droplet' },
      { name: '黄瓜', icon: 'leaf' },
      { name: '鸡蛋', icon: 'egg' },
    ],
    decoration: 'lotus',
    decorationColor: '#F06292',
  },
  {
    id: 'xiaoshu',
    solarTerm: '小暑',
    solarTermIcon: 'sun',
    dishName: '绿豆汤',
    description: '小暑初热，绿豆消暑，清心降火',
    ingredients: [
      { name: '绿豆', icon: 'bean' },
      { name: '冰糖', icon: 'gem' },
      { name: '百合', icon: 'flower' },
    ],
    decoration: 'sun-small',
    decorationColor: '#FF8A65',
  },
  {
    id: 'dashu',
    solarTerm: '大暑',
    solarTermIcon: 'flame',
    dishName: '仙草冻',
    description: '大暑酷热，仙草清凉，甜蜜消暑',
    ingredients: [
      { name: '仙草', icon: 'leaf' },
      { name: '蜂蜜', icon: 'droplet' },
      { name: '红豆', icon: 'bean' },
      { name: '芋圆', icon: 'cookie' },
    ],
    decoration: 'flame',
    decorationColor: '#EF5350',
  },
  {
    id: 'liqiu',
    solarTerm: '立秋',
    solarTermIcon: 'leaf',
    dishName: '啃秋瓜',
    description: '立秋咬秋，西瓜清甜，暑去凉来',
    ingredients: [
      { name: '西瓜', icon: 'melon' },
      { name: '薄荷', icon: 'leaf' },
      { name: '冰糖', icon: 'gem' },
    ],
    decoration: 'maple',
    decorationColor: '#4FC3F7',
  },
  {
    id: 'chushu',
    solarTerm: '处暑',
    solarTermIcon: 'cloud',
    dishName: '百合莲子羹',
    description: '处暑止暑，百合润肺，安神养心',
    ingredients: [
      { name: '百合', icon: 'flower' },
      { name: '莲子', icon: 'bean' },
      { name: '银耳', icon: 'cloud' },
      { name: '红枣', icon: 'cherry' },
    ],
    decoration: 'cloud-sun',
    decorationColor: '#7986CB',
  },
  {
    id: 'bailu',
    solarTerm: '白露',
    solarTermIcon: 'droplet',
    dishName: '龙眼',
    description: '白露凝珠，龙眼滋补，益气补血',
    ingredients: [
      { name: '龙眼', icon: 'cherry' },
      { name: '糯米', icon: 'wheat' },
      { name: '红枣', icon: 'cherry' },
    ],
    decoration: 'dew',
    decorationColor: '#90CAF9',
  },
  {
    id: 'qiufen',
    solarTerm: '秋分',
    solarTermIcon: 'moon',
    dishName: '螃蟹',
    description: '秋分蟹肥，金桂飘香，正是食蟹好时节',
    ingredients: [
      { name: '大闸蟹', icon: 'crab' },
      { name: '姜醋', icon: 'droplet' },
      { name: '黄酒', icon: 'wine' },
    ],
    decoration: 'moon',
    decorationColor: '#FFD180',
  },
  {
    id: 'hanlu',
    solarTerm: '寒露',
    solarTermIcon: 'cloud',
    dishName: '芝麻酥',
    description: '寒露霜重，芝麻润燥，酥香满口',
    ingredients: [
      { name: '黑芝麻', icon: 'seed' },
      { name: '面粉', icon: 'wheat' },
      { name: '黄油', icon: 'droplet' },
      { name: '糖粉', icon: 'gem' },
    ],
    decoration: 'chrysanthemum',
    decorationColor: '#FFCA28',
  },
  {
    id: 'shuangjiang',
    solarTerm: '霜降',
    solarTermIcon: 'snowflake',
    dishName: '柿子',
    description: '霜降柿红，事事如意，清甜润肺',
    ingredients: [
      { name: '柿子', icon: 'cherry' },
      { name: '糯米粉', icon: 'wheat' },
      { name: '豆沙', icon: 'cookie' },
    ],
    decoration: 'persimmon',
    decorationColor: '#FF7043',
  },
  {
    id: 'lidong',
    solarTerm: '立冬',
    solarTermIcon: 'snowflake',
    dishName: '饺子',
    description: '立冬补冬，饺子暖心，阖家团圆',
    ingredients: [
      { name: '饺子皮', icon: 'bread' },
      { name: '猪肉', icon: 'beef' },
      { name: '白菜', icon: 'leaf' },
      { name: '虾仁', icon: 'fish' },
    ],
    decoration: 'snow',
    decorationColor: '#90A4AE',
  },
  {
    id: 'xiaoxue',
    solarTerm: '小雪',
    solarTermIcon: 'snowflake',
    dishName: '腊肉',
    description: '小雪腌肉，风味醇厚，年味渐浓',
    ingredients: [
      { name: '五花肉', icon: 'beef' },
      { name: '花椒', icon: 'seed' },
      { name: '海盐', icon: 'gem' },
      { name: '料酒', icon: 'wine' },
    ],
    decoration: 'snow-light',
    decorationColor: '#B0BEC5',
  },
  {
    id: 'daxue',
    solarTerm: '大雪',
    solarTermIcon: 'snowflake',
    dishName: '羊肉汤',
    description: '大雪纷飞，羊肉温补，驱寒暖身',
    ingredients: [
      { name: '羊肉', icon: 'beef' },
      { name: '萝卜', icon: 'leaf' },
      { name: '当归', icon: 'leaf' },
      { name: '生姜', icon: 'flower' },
    ],
    decoration: 'snow-heavy',
    decorationColor: '#78909C',
  },
  {
    id: 'dongzhi',
    solarTerm: '冬至',
    solarTermIcon: 'snowflake',
    dishName: '汤圆',
    description: '冬至大如年，汤圆团圆，甜暖心间',
    ingredients: [
      { name: '糯米粉', icon: 'wheat' },
      { name: '黑芝麻', icon: 'seed' },
      { name: '花生', icon: 'seed' },
      { name: '红糖', icon: 'cookie' },
    ],
    decoration: 'winter-solstice',
    decorationColor: '#5C6BC0',
  },
  {
    id: 'xiaohan',
    solarTerm: '小寒',
    solarTermIcon: 'wind',
    dishName: '腊八粥',
    description: '小寒大寒，腊八粥香，温暖过年',
    ingredients: [
      { name: '大米', icon: 'wheat' },
      { name: '红豆', icon: 'bean' },
      { name: '桂圆', icon: 'cherry' },
      { name: '莲子', icon: 'bean' },
      { name: '红枣', icon: 'cherry' },
    ],
    decoration: 'plum-blossom',
    decorationColor: '#EC407A',
  },
  {
    id: 'dahan',
    solarTerm: '大寒',
    solarTermIcon: 'snowflake',
    dishName: '年糕',
    description: '大寒岁末，年糕高升，年年有余',
    ingredients: [
      { name: '糯米', icon: 'wheat' },
      { name: '红糖', icon: 'cookie' },
      { name: '红枣', icon: 'cherry' },
      { name: '桂花', icon: 'flower' },
    ],
    decoration: 'lantern',
    decorationColor: '#E53935',
  },
];

function getCurrentSolarTerm(): string {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  
  const termDates: [number, number, string][] = [
    [0, 6, '小寒'], [0, 20, '大寒'],
    [1, 4, '立春'], [1, 19, '雨水'],
    [2, 6, '惊蛰'], [2, 21, '春分'],
    [3, 5, '清明'], [3, 20, '谷雨'],
    [4, 6, '立夏'], [4, 21, '小满'],
    [5, 6, '芒种'], [5, 21, '夏至'],
    [6, 7, '小暑'], [6, 23, '大暑'],
    [7, 8, '立秋'], [7, 23, '处暑'],
    [8, 8, '白露'], [8, 23, '秋分'],
    [9, 8, '寒露'], [9, 23, '霜降'],
    [10, 7, '立冬'], [10, 22, '小雪'],
    [11, 7, '大雪'], [11, 22, '冬至'],
  ];
  
  for (let i = termDates.length - 1; i >= 0; i--) {
    const [m, d, name] = termDates[i];
    if (month > m || (month === m && day >= d)) {
      return name;
    }
  }
  
  return '小寒';
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: solarTermRecipes,
  favorites: [],
  currentSolarTerm: getCurrentSolarTerm(),

  toggleFavorite: (recipeId: string) => {
    const state = get();
    const existingIndex = state.favorites.findIndex(f => f.recipeId === recipeId);
    
    if (existingIndex >= 0) {
      set({
        favorites: state.favorites.filter(f => f.recipeId !== recipeId),
      });
    } else {
      const recipe = state.recipes.find(r => r.id === recipeId);
      if (recipe) {
        const newFavorite: FavoriteRecipe = {
          id: uuidv4(),
          recipeId,
          solarTerm: recipe.solarTerm,
          dishName: recipe.dishName,
          rating: 0,
          note: '',
          order: state.favorites.length,
          createdAt: Date.now(),
        };
        set({ favorites: [...state.favorites, newFavorite] });
      }
    }
  },

  updateRating: (recipeId: string, rating: number) => {
    const state = get();
    set({
      favorites: state.favorites.map(f =>
        f.recipeId === recipeId ? { ...f, rating } : f
      ),
    });
  },

  updateNote: (recipeId: string, note: string) => {
    const state = get();
    set({
      favorites: state.favorites.map(f =>
        f.recipeId === recipeId ? { ...f, note } : f
      ),
    });
  },

  reorderFavorites: (fromIndex: number, toIndex: number) => {
    const state = get();
    const result = Array.from(state.favorites);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    
    const reordered = result.map((f, i) => ({ ...f, order: i }));
    set({ favorites: reordered });
  },

  isFavorite: (recipeId: string) => {
    return get().favorites.some(f => f.recipeId === recipeId);
  },

  getFavorite: (recipeId: string) => {
    return get().favorites.find(f => f.recipeId === recipeId);
  },

  getFavoritesBySolarTerm: () => {
    const state = get();
    const result: Record<string, FavoriteRecipe[]> = {};
    
    for (const recipe of state.recipes) {
      const fav = state.favorites.find(f => f.recipeId === recipe.id);
      if (fav) {
        if (!result[recipe.solarTerm]) {
          result[recipe.solarTerm] = [];
        }
        result[recipe.solarTerm].push(fav);
      }
    }
    
    return result;
  },
}));
