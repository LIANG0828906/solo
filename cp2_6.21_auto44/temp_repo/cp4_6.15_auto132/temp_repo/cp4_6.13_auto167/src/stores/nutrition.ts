import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Meal {
  id: string
  date: string
  foodId: string
  foodName: string
  calories: number
  protein: number
  fat: number
  carbs: number
  serving: string
  quantity: number
}

export interface NutritionGoals {
  dailyCalories: number
  dailyProtein: number
  dailyFat: number
  dailyCarbs: number
}

export interface DailyTotals {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export const useNutritionStore = defineStore('nutrition', () => {
  const meals = ref<Meal[]>([])
  const dailyTotals = ref<DailyTotals>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  })
  const goals = ref<NutritionGoals>({
    dailyCalories: 2000,
    dailyProtein: 60,
    dailyFat: 65,
    dailyCarbs: 250
  })
  const currentDate = ref<string>(new Date().toISOString().split('T')[0])
  const loading = ref(false)

  const calorieProgress = computed(() => {
    return Math.min(100, Math.round((dailyTotals.value.calories / goals.value.dailyCalories) * 100))
  })

  const proteinProgress = computed(() => {
    return Math.min(100, Math.round((dailyTotals.value.protein / goals.value.dailyProtein) * 100))
  })

  async function fetchMeals(date?: string) {
    const targetDate = date || currentDate.value
    loading.value = true
    try {
      const response = await fetch(`/api/meals?date=${targetDate}`)
      const data = await response.json()
      meals.value = data.meals
      dailyTotals.value = data.totals
    } catch (error) {
      console.error('Failed to fetch meals:', error)
    } finally {
      loading.value = false
    }
  }

  async function addMeal(foodId: string, quantity: number = 1) {
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate.value,
          foodId,
          quantity
        })
      })
      const meal = await response.json()
      meals.value.unshift(meal)
      updateTotals()
      return meal
    } catch (error) {
      console.error('Failed to add meal:', error)
      throw error
    }
  }

  async function addRecipe(recipeId: string) {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: currentDate.value })
      })
      const result = await response.json()
      await fetchMeals()
      return result
    } catch (error) {
      console.error('Failed to add recipe:', error)
      throw error
    }
  }

  async function deleteMeal(id: string) {
    try {
      await fetch(`/api/meals/${id}`, { method: 'DELETE' })
      meals.value = meals.value.filter(m => m.id !== id)
      updateTotals()
    } catch (error) {
      console.error('Failed to delete meal:', error)
      throw error
    }
  }

  function updateTotals() {
    dailyTotals.value = meals.value.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        fat: acc.fat + meal.fat,
        carbs: acc.carbs + meal.carbs
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    )
  }

  async function fetchGoals() {
    try {
      const response = await fetch('/api/goals')
      goals.value = await response.json()
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    }
  }

  async function updateGoals(newGoals: Partial<NutritionGoals>) {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goals.value, ...newGoals })
      })
      goals.value = await response.json()
    } catch (error) {
      console.error('Failed to update goals:', error)
      throw error
    }
  }

  function setDate(date: string) {
    currentDate.value = date
    fetchMeals(date)
  }

  return {
    meals,
    dailyTotals,
    goals,
    currentDate,
    loading,
    calorieProgress,
    proteinProgress,
    fetchMeals,
    addMeal,
    addRecipe,
    deleteMeal,
    fetchGoals,
    updateGoals,
    setDate
  }
})
