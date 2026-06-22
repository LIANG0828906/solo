<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

const emit = defineEmits<{
  (e: 'search-confirmed'): void
}>()

const store = useGalleryStore()
const inputValue = ref('')
const lastInputValue = ref('')
const showHistory = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let debounceTimer: number | null = null

const suggestions = ref<string[]>([])

function updateSuggestions(query: string): void {
  if (!query.trim()) {
    suggestions.value = []
    return
  }
  const q: string = query.toLowerCase()
  const allTerms = new Set<string>()

  store.images.forEach((img): void => {
    if (img.title.toLowerCase().includes(q)) {
      allTerms.add(img.title)
    }
    img.tags.forEach((tag: string): void => {
      if (tag.toLowerCase().includes(q)) {
        allTerms.add(tag)
      }
    })
  })

  suggestions.value = Array.from(allTerms).slice(0, 5)
}

function handleInput(e: Event): void {
  const target = e.target as HTMLInputElement
  const value: string = target.value

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  const isDeleting: boolean = value.length < lastInputValue.value.length
  const isNowEmpty: boolean = !value.trim()

  if (isNowEmpty) {
    inputValue.value = ''
    store.clearSearchQuery()
    suggestions.value = []
    lastInputValue.value = ''
    return
  }

  lastInputValue.value = value

  if (isDeleting) {
    store.setSearchQuery(inputValue.value)
    updateSuggestions(inputValue.value)
    return
  }

  debounceTimer = window.setTimeout((): void => {
    store.setSearchQuery(inputValue.value)
    updateSuggestions(inputValue.value)
  }, 300)
}

function handleFocus(): void {
  showHistory.value = true
}

function handleBlur(): void {
  setTimeout((): void => {
    showHistory.value = false
  }, 200)
}

function handleClear(e: MouseEvent): void {
  e.stopPropagation()
  inputValue.value = ''
  store.clearSearchQuery()
  suggestions.value = []
  inputRef.value?.focus()
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    emit('search-confirmed')
    showHistory.value = false
  } else if (e.key === 'Escape') {
    inputRef.value?.blur()
  }
}

function selectHistory(term: string): void {
  inputValue.value = term
  store.useHistoryItem(term)
  showHistory.value = false
  inputRef.value?.focus()
  emit('search-confirmed')
}

function selectSuggestion(term: string): void {
  inputValue.value = term
  store.setSearchQuery(term)
  suggestions.value = []
  showHistory.value = false
  emit('search-confirmed')
}

function handleClearHistory(e: MouseEvent): void {
  e.stopPropagation()
  store.clearSearchHistory()
}

watch(
  (): string => store.searchQuery,
  (newVal: string): void => {
    if (newVal !== inputValue.value) {
      inputValue.value = newVal
    }
  }
)

function handleClickOutside(e: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showHistory.value = false
  }
}

onMounted((): void => {
  inputValue.value = store.searchQuery
  document.addEventListener('click', handleClickOutside)
})

onUnmounted((): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="search-container" ref="containerRef">
    <div class="search-wrapper">
      <svg
        class="search-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="search-input"
        placeholder="搜索图片标题或标签..."
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="inputValue"
        class="clear-btn"
        @click="handleClear"
        aria-label="清除搜索"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <transition name="fade">
      <div v-if="showHistory && (store.searchHistory.length > 0 || suggestions.length > 0)" class="search-dropdown">
        <div v-if="suggestions.length > 0" class="dropdown-section">
          <div class="dropdown-title">搜索建议</div>
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            class="dropdown-item"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            <svg
              class="item-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>{{ suggestion }}</span>
          </button>
        </div>

        <div v-if="store.searchHistory.length > 0" class="dropdown-section">
          <div class="dropdown-header">
            <span class="dropdown-title">搜索历史</span>
            <button class="clear-history-btn" @mousedown.prevent="handleClearHistory">
              清除
            </button>
          </div>
          <button
            v-for="term in store.searchHistory"
            :key="term"
            class="dropdown-item"
            @mousedown.prevent="selectHistory(term)"
          >
            <svg
              class="item-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{{ term }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 0 16px;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.search-wrapper:focus-within {
  background: var(--bg-primary);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
}

.search-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 8px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.clear-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: 50%;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  z-index: 1000;
  max-height: 320px;
  overflow-y: auto;
}

.dropdown-section {
  padding: 8px 0;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid var(--bg-secondary);
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 8px;
}

.dropdown-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 16px 8px;
}

.dropdown-header .dropdown-title {
  padding: 0;
}

.clear-history-btn {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.clear-history-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-primary);
  text-align: left;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.item-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
