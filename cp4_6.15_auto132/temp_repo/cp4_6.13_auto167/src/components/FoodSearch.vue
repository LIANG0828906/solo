<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

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
const isLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let debounceTimer: number | null = null
let lastRequestId = 0
const DEBOUNCE_DELAY = 350

const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) return []
  return suggestions.value
})

async function searchFoods(query: string) {
  const trimmed = query.trim()
  if (!trimmed) {
    suggestions.value = []
    isLoading.value = false
    return
  }

  const requestId = ++lastRequestId
  isLoading.value = true

  try {
    const response = await fetch(`/api/foods?query=${encodeURIComponent(trimmed)}&limit=8`)
    if (!response.ok) throw new Error('请求失败')
    const data = await response.json()

    if (requestId === lastRequestId) {
      suggestions.value = Array.isArray(data) ? data : []
      selectedIndex.value = -1
    }
  } catch (error) {
    if (requestId === lastRequestId) {
      console.error('搜索食物失败:', error)
      suggestions.value = []
    }
  } finally {
    if (requestId === lastRequestId) {
      isLoading.value = false
    }
  }
}

function handleInput() {
  showSuggestions.value = true

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  const query = inputValue.value
  if (!query.trim()) {
    suggestions.value = []
    isLoading.value = false
    return
  }

  debounceTimer = window.setTimeout(() => {
    searchFoods(query)
  }, DEBOUNCE_DELAY)
}

function handleSelect(food: Food) {
  showSuggestions.value = false
  emit('select', food)
  inputValue.value = ''
  suggestions.value = []
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || filteredSuggestions.value.length === 0) {
    if (e.key === 'ArrowDown' && inputValue.value.trim()) {
      handleInput()
    }
    return
  }

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
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 180)
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
    debounceTimer = null
  }
  lastRequestId++
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
        :class="{ loading: isLoading }"
        placeholder="输入食物名称搜索..."
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        autocomplete="off"
        spellcheck="false"
      />
      <span v-if="isLoading" class="loading-spinner"></span>
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
          <div class="suggestion-nutrition">
            <span class="nutrition-kcal">{{ Math.round(food.calories) }} kcal</span>
            <div class="nutrition-mini">
              <span>P {{ food.protein.toFixed(1) }}</span>
              <span>F {{ food.fat.toFixed(1) }}</span>
              <span>C {{ food.carbs.toFixed(1) }}</span>
            </div>
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
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
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

.search-input.loading {
  color: #666;
}

.loading-spinner {
  position: absolute;
  right: 14px;
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  z-index: 200;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f5f6f8;
  gap: 12px;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: linear-gradient(135deg, #f5f7ff 0%, #faf5ff 100%);
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.suggestion-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-serving {
  font-size: 11px;
  color: #9ca3af;
}

.suggestion-nutrition {
  text-align: right;
  flex-shrink: 0;
}

.nutrition-kcal {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.nutrition-mini {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
  justify-content: flex-end;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
