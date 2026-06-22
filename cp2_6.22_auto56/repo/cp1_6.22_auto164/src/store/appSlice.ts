import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { Recipe, WeekPlan, WeeklyNutrition, ChartData, MealCategory } from '../types';

interface AppState {
  recipes: Recipe[];
  weekPlan: WeekPlan;
  nutrition: WeeklyNutrition | null;
  chartData: ChartData | null;
  selectedDay: number;
  loading: boolean;
}

const initialState: AppState = {
  recipes: [],
  weekPlan: [],
  nutrition: null,
  chartData: null,
  selectedDay: 0,
  loading: false,
};

export const fetchRecipes = createAsyncThunk(
  'app/fetchRecipes',
  async (params?: { category?: MealCategory; search?: string }) => {
    const res = await axios.get('/api/recipes', { params });
    return res.data as Recipe[];
  }
);

export const fetchWeekPlan = createAsyncThunk(
  'app/fetchWeekPlan',
  async () => {
    const res = await axios.get('/api/week-plan');
    return res.data;
  }
);

export const addRecipe = createAsyncThunk(
  'app/addRecipe',
  async (recipe: Omit<Recipe, 'id' | 'nutrition'>) => {
    const res = await axios.post('/api/recipes', recipe);
    return res.data as Recipe;
  }
);

export const updateRecipe = createAsyncThunk(
  'app/updateRecipe',
  async ({ id, data }: { id: string; data: Partial<Recipe> }) => {
    const res = await axios.put(`/api/recipes/${id}`, data);
    return res.data as Recipe;
  }
);

export const deleteRecipe = createAsyncThunk(
  'app/deleteRecipe',
  async (id: string) => {
    await axios.delete(`/api/recipes/${id}`);
    return id;
  }
);

export const setMeal = createAsyncThunk(
  'app/setMeal',
  async ({ dayIndex, mealType, recipeId }: { dayIndex: number; mealType: MealCategory; recipeId: string | null }) => {
    const res = await axios.put(`/api/week-plan/${dayIndex}/${mealType}`, { recipeId });
    return res.data;
  }
);

export const swapMeals = createAsyncThunk(
  'app/swapMeals',
  async ({ fromDay, fromMeal, toDay, toMeal }: { fromDay: number; fromMeal: MealCategory; toDay: number; toMeal: MealCategory }) => {
    const res = await axios.put('/api/week-plan/swap', { fromDay, fromMeal, toDay, toMeal });
    return res.data;
  }
);

export const resetAllData = createAsyncThunk(
  'app/resetAllData',
  async () => {
    const res = await axios.post('/api/reset');
    return res.data;
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedDay: (state, action: PayloadAction<number>) => {
      state.selectedDay = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.recipes = action.payload;
      })
      .addCase(fetchWeekPlan.fulfilled, (state, action) => {
        state.weekPlan = action.payload.plan;
        state.nutrition = action.payload.nutrition;
        state.chartData = action.payload.chartData;
      })
      .addCase(addRecipe.fulfilled, (state, action) => {
        state.recipes.push(action.payload);
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        const idx = state.recipes.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) state.recipes[idx] = action.payload;
      })
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.recipes = state.recipes.filter(r => r.id !== action.payload);
      })
      .addCase(setMeal.fulfilled, (state, action) => {
        state.weekPlan = action.payload.plan;
        state.nutrition = action.payload.nutrition;
        state.chartData = action.payload.chartData;
      })
      .addCase(swapMeals.fulfilled, (state, action) => {
        state.weekPlan = action.payload.plan;
        state.nutrition = action.payload.nutrition;
        state.chartData = action.payload.chartData;
      })
      .addCase(resetAllData.fulfilled, (state, action) => {
        state.recipes = action.payload.recipes;
        state.weekPlan = action.payload.plan;
        state.nutrition = action.payload.nutrition;
        state.chartData = action.payload.chartData;
      });
  },
});

export const { setSelectedDay } = appSlice.actions;
export default appSlice.reducer;
