import { create } from 'zustand';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PresetColor, AddColor, Recipe, PaletteState } from '../types';
import { DEFAULT_BASE_COLOR, PRESET_COLORS } from '../constants/presetColors';
import { mixColors, formatRecipeText } from '../utils/colorMixer';

interface PaletteActions {
  setBaseColor: (color: PresetColor) => void;
  addAddColor: (color?: PresetColor) => void;
  removeAddColor: (id: string) => void;
  setRatio: (index: number, value: number) => void;
  saveRecipe: (name: string) => Promise<void>;
  loadRecipes: () => Promise<void>;
  searchRecipes: (keyword: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  loadRecipe: (recipe: Recipe) => void;
  copyRecipeText: (recipe: Recipe) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const usePaletteStore = create<PaletteState & PaletteActions>((set, get) => ({
  baseColor: DEFAULT_BASE_COLOR,
  addColors: [],
  ratios: [],
  recipes: [],
  searchKeyword: '',
  toast: null,

  setBaseColor: (color) => set({ baseColor: color }),

  addAddColor: (color) => {
    const { addColors } = get();
    if (addColors.length >= 3) return;
    
    const availableColors = PRESET_COLORS.filter(
      c => !addColors.some(ac => ac.color.hex === c.hex)
    );
    if (availableColors.length === 0) return;

    const newColor: AddColor = {
      id: uuidv4(),
      color: color || availableColors[0],
    };

    set({
      addColors: [...addColors, newColor],
      ratios: [...get().ratios, 20],
    });
  },

  removeAddColor: (id) => {
    const { addColors, ratios } = get();
    const idx = addColors.findIndex(ac => ac.id === id);
    if (idx === -1) return;

    set({
      addColors: addColors.filter(ac => ac.id !== id),
      ratios: ratios.filter((_, i) => i !== idx),
    });
  },

  setRatio: (index, value) => {
    const { ratios } = get();
    if (index < 0 || index >= ratios.length) return;

    const clamped = Math.max(0, Math.min(95, value));
    const newRatios = [...ratios];
    newRatios[index] = clamped;

    const total = newRatios.reduce((s, r) => s + r, 0);
    if (total > 95) {
      const excess = total - 95;
      const otherIndices = newRatios
        .map((_, i) => i)
        .filter(i => i !== index && newRatios[i] > 0);
      
      if (otherIndices.length > 0) {
        const reduceEach = Math.ceil(excess / otherIndices.length);
        otherIndices.forEach(i => {
          newRatios[i] = Math.max(0, newRatios[i] - reduceEach);
        });
      }
    }

    set({ ratios: newRatios });
  },

  saveRecipe: async (name) => {
    const { baseColor, addColors, ratios } = get();
    const mixedColor = mixColors(
      baseColor,
      addColors.map(ac => ac.color),
      ratios
    );

    const recipe: Recipe = {
      id: uuidv4(),
      name: name.slice(0, 20) || `配方 ${Date.now()}`,
      baseColor,
      addColors,
      ratios,
      mixedColor,
      isFavorite: false,
      createdAt: Date.now(),
    };

    try {
      await axios.post('/api/recipes', recipe);
      await get().loadRecipes();
      get().showToast('配方已保存！');
    } catch {
      get().showToast('保存失败，请重试');
    }
  },

  loadRecipes: async () => {
    try {
      const res = await axios.get('/api/recipes');
      set({ recipes: res.data });
    } catch {
      set({ recipes: [] });
    }
  },

  searchRecipes: (keyword) => set({ searchKeyword: keyword }),

  toggleFavorite: async (id) => {
    const { recipes } = get();
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    try {
      await axios.patch(`/api/recipes/${id}`, {
        isFavorite: !recipe.isFavorite,
      });
      await get().loadRecipes();
    } catch {
      get().showToast('操作失败');
    }
  },

  deleteRecipe: async (id) => {
    try {
      await axios.delete(`/api/recipes/${id}`);
      await get().loadRecipes();
      get().showToast('配方已删除');
    } catch {
      get().showToast('删除失败');
    }
  },

  loadRecipe: (recipe) => {
    set({
      baseColor: recipe.baseColor,
      addColors: recipe.addColors,
      ratios: recipe.ratios,
    });
  },

  copyRecipeText: (recipe) => {
    const text = formatRecipeText(
      recipe.baseColor,
      recipe.addColors.map(ac => ac.color),
      recipe.ratios
    );
    navigator.clipboard.writeText(text).then(() => {
      get().showToast(`已复制：${text}`);
    }).catch(() => {
      get().showToast('复制失败');
    });
  },

  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 2000);
  },

  hideToast: () => set({ toast: null }),
}));
