<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
import CalendarPicker from '@/components/CalendarPicker.vue'
import FoodSearch from '@/components/FoodSearch.vue'
import RingProgress from '@/components/RingProgress.vue'

const store = useNutritionStore()

interface Food {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  serving: string
}

interface Recipe {
  id: string
  name: string
  description: string
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  matchScore: number
  category: string
  foodIds: string[]
}

const recommendations = ref<Recipe[]>([])
const addingRecipeId = ref<string | null>(null)
const deletingMealId = ref<string | null>(null)

const selectedDate = computed({
  get: () => store.currentDate,
  set: (val: string) => store.setDate(val)
})

const formattedDate = computed(() => {
  const date = new Date(selectedDate.value)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
})

function handleFoodSelect(food: Food) {
  store.addMeal(food.id, 1)
}

async function handleDeleteMeal(id: string) {
  deletingMealId.value = id
  setTimeout(async () => {
    await store.deleteMeal(id)
    deletingMealId.value = null
  }, 200)
}

async function fetchRecommendations() {
  try {
    const response = await fetch(
      `/api/recommendations?target=maintain&date=${selectedDate.value}`
    )
    recommendations.value = await response.json()
  } catch (error) {
    console.error('获取推荐食谱失败:', error)
  }
}

async function handleAddRecipe(recipe: Recipe) {
  addingRecipeId.value = recipe.id
  try {
    await store.addRecipe(recipe.id)
    fetchRecommendations()
  } finally {
    setTimeout(() => {
      addingRecipeId.value = null
    }, 500)
  }
}

onMounted(async () => {
  await store.fetchGoals()
  await store.fetchMeals()
  fetchRecommendations()
})

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
  }
  return map[category] || category
}
</script>

<template>
  <div class="meal-tracker">
    <div class="page-header">
      <h1 class="page-title">饮食记录</h1>
      <p class="page-subtitle">{{ formattedDate }} 的营养摄入</p>
    </div>

    <div class="main-grid">
      <div class="left-column">
        <div class="card calendar-card">
          <div class="card-title">日期选择</div>
          <CalendarPicker v-model="selectedDate" />
        </div>

        <div class="card progress-card">
          <div class="card-title">今日营养摄入</div>
          <div class="ring-progresses">
            <RingProgress
              :value="store.dailyTotals.calories"
              :max-value="store.goals.dailyCalories"
              color="#3498db"
              label="总热量"
              unit="kcal"
              :size="130"
              :stroke-width="10"
            />
            <RingProgress
              :value="store.dailyTotals.protein"
              :max-value="store.goals.dailyProtein"
              color="#e67e22"
              label="蛋白质"
              unit="g"
              :size="130"
              :stroke-width="10"
            />
          </div>
          <div class="nutrition-summary">
            <div class="summary-item">
              <span class="summary-dot" style="background: #f1c40f"></span>
              <span class="summary-label">脂肪</span>
              <span class="summary-value">{{ store.dailyTotals.fat.toFixed(1) }}g</span>
            </div>
            <div class="summary-item">
              <span class="summary-dot" style="background: #1abc9c"></span>
              <span class="summary-label">碳水</span>
              <span class="summary-value">{{ store.dailyTotals.carbs.toFixed(1) }}g</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="card add-food-card">
          <div class="card-title">添加食物</div>
          <FoodSearch @select="handleFoodSelect" />
          <p class="search-hint">从100种常见食物中搜索，支持拼音和汉字</p>
        </div>

        <div class="card meals-card">
          <div class="card-header">
            <div class="card-title">今日餐食</div>
            <span class="meal-count">{{ store.meals.length }} 项</span>
          </div>
          
          <div v-if="store.loading" class="loading-state">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="store.meals.length === 0" class="empty-state">
            <span class="empty-icon">🍽️</span>
            <p>还没有记录，添加一些食物吧</p>
          </div>
          
          <div v-else class="meals-list">
            <transition-group name="meal-item">
              <div
                v-for="meal in store.meals"
                :key="meal.id"
                class="meal-item"
                :class="{ deleting: deletingMealId === meal.id }"
              >
                <div class="meal-info">
                  <div class="meal-name">{{ meal.foodName }}</div>
                  <div class="meal-meta">
                    <span>{{ meal.serving }}</span>
                  </div>
                </div>
                <div class="meal-nutrition">
                  <div class="nutrition-calories">{{ Math.round(meal.calories) }} kcal</div>
                  <div class="nutrition-details">
                    <span>P {{ meal.protein.toFixed(1) }}g</span>
                    <span>F {{ meal.fat.toFixed(1) }}g</span>
                    <span>C {{ meal.carbs.toFixed(1) }}g</span>
                  </div>
                </div>
                <button
                  class="delete-btn"
                  @click="handleDeleteMeal(meal.id)"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </transition-group>
          </div>
        </div>

        <div class="card recommendations-card">
          <div class="card-header">
            <div class="card-title">
              <span>推荐食谱</span>
              <span class="badge">智能推荐</span>
            </div>
          </div>
          
          <div class="recommendations-list">
            <div
              v-for="recipe in recommendations"
              :key="recipe.id"
              class="recipe-card"
              :class="{ adding: addingRecipeId === recipe.id }"
            >
              <div class="recipe-header">
                <div class="recipe-name">{{ recipe.name }}</div>
                <span class="recipe-category">{{ getCategoryLabel(recipe.category) }}</span>
              </div>
              <p class="recipe-description">{{ recipe.description }}</p>
              <div class="recipe-nutrition">
                <div class="recipe-nutri-item">
                  <span class="nutri-value">{{ Math.round(recipe.totalCalories) }}</span>
                  <span class="nutri-label">kcal</span>
                </div>
                <div class="recipe-nutri-item">
                  <span class="nutri-value">{{ recipe.totalProtein.toFixed(1) }}g</span>
                  <span class="nutri-label">蛋白质</span>
                </div>
                <div class="recipe-nutri-item">
                  <span class="nutri-value">{{ recipe.totalFat.toFixed(1) }}g</span>
                  <span class="nutri-label">脂肪</span>
                </div>
                <div class="recipe-nutri-item">
                  <span class="nutri-value">{{ recipe.totalCarbs.toFixed(1) }}g</span>
                  <span class="nutri-label">碳水</span>
                </div>
              </div>
              <button
                class="add-recipe-btn"
                :disabled="addingRecipeId === recipe.id"
                @click="handleAddRecipe(recipe)"
              >
                <span v-if="addingRecipeId === recipe.id">添加中...</span>
                <span v-else>+ 一键添加</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meal-tracker {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #999;
}

.main-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.badge {
  font-size: 10px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-weight: 500;
}

.ring-progresses {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.nutrition-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.summary-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.add-food-card {
  margin-bottom: 20px;
}

.search-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 10px;
  text-align: center;
}

.meal-count {
  font-size: 12px;
  color: #999;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 10px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: #999;
  font-size: 13px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #bbb;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

.meals-list {
  max-height: 400px;
  overflow-y: auto;
}

.meal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.meal-item.deleting {
  opacity: 0;
  transform: translateX(20px);
}

.meal-info {
  flex: 1;
  min-width: 0;
}

.meal-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meal-meta {
  font-size: 11px;
  color: #999;
}

.meal-nutrition {
  text-align: right;
  flex-shrink: 0;
}

.nutrition-calories {
  font-size: 15px;
  font-weight: 600;
  color: #667eea;
}

.nutrition-details {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #fee2e2;
  color: #ef4444;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #fecaca;
}

.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.recipe-card {
  background: linear-gradient(135deg, #f5f7ff 0%, #fdf4ff 100%);
  border-radius: 10px;
  padding: 14px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.recipe-card.adding {
  opacity: 0.5;
  transform: scale(0.98);
}

.recipe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.recipe-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.recipe-category {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  border-radius: 4px;
}

.recipe-description {
  font-size: 11px;
  color: #888;
  margin-bottom: 10px;
  line-height: 1.4;
}

.recipe-nutrition {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
}

.recipe-nutri-item {
  text-align: center;
}

.nutri-value {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.nutri-label {
  display: block;
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.add-recipe-btn {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.add-recipe-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-recipe-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.meal-item-enter-active,
.meal-item-leave-active {
  transition: all 0.3s ease;
}

.meal-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.meal-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
  }

  .recommendations-list {
    grid-template-columns: 1fr;
  }

  .ring-progresses {
    justify-content: center;
    gap: 30px;
  }
}
</style>
