<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Food {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  serving: string
}

const emit = defineEmits<{
  (e: 'select', food: Food): void
}>()

const inputValue = ref('')
const suggestions = ref<Food[]>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let debounceTimer: number | null = null

const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) return []
  return suggestions.value
})

async function searchFoods(query: string) {
  if (!query.trim()) {
    suggestions.value = []
    return
  }
  try {
    const response = await fetch(`/api/foods?query=${encodeURIComponent(query)}&limit=8`)
    suggestions.value = await response.json()
    selectedIndex.value = -1
  } catch (error) {
    console.error('搜索食物失败:', error)
    suggestions.value = []
  }
}

function handleInput() {
  showSuggestions.value = true
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = window.setTimeout(() => {
    searchFoods(inputValue.value)
  }, 200)
}

function handleSelect(food: Food) {
  inputValue.value = food.name
  showSuggestions.value = false
  emit('select', food)
  inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || filteredSuggestions.value.length === 0) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredSuggestions.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0 && filteredSuggestions.value[selectedIndex.value]) {
        handleSelect(filteredSuggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      break
  }
}

function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function handleFocus() {
  if (filteredSuggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <div class="food-search" ref="containerRef">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="search-input"
        placeholder="输入食物名称搜索..."
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    
    <transition name="dropdown">
      <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
        <div
          v-for="(food, index) in filteredSuggestions"
          :key="food.id"
          class="suggestion-item"
          :class="{ selected: index === selectedIndex }"
          @mousedown.prevent="handleSelect(food)"
          @mouseenter="selectedIndex = index"
        >
          <div class="suggestion-info">
            <span class="suggestion-name">{{ food.name }}</span>
            <span class="suggestion-serving">{{ food.serving }}</span>
          </div>
          <div class="suggestion-calories">
            <span class="calories-value">{{ Math.round(food.calories) }}</span>
            <span class="calories-unit">kcal</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.food-search {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 14px;
  opacity: 0.5;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  font-size: 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
  max-height: 320px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: #f0f4ff;
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.suggestion-serving {
  font-size: 12px;
  color: #999;
}

.suggestion-calories {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.calories-value {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.calories-unit {
  font-size: 11px;
  color: #999;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
