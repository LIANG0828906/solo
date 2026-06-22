<template>
  <div class="search-bar-wrapper">
    <div class="search-input-container">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref="inputRef"
        :value="modelValue"
        type="text"
        class="search-input"
        :placeholder="placeholder"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEscape"
      />
      <button
        v-if="modelValue"
        class="clear-btn"
        type="button"
        @click="handleClear"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>

    <Transition name="fade">
      <div
        v-if="showDropdown && (hasHistory || hasSuggestions)"
        class="search-dropdown"
      >
        <div v-if="hasHistory" class="dropdown-section">
          <div class="section-label">搜索历史</div>
          <div class="history-list">
            <div
              v-for="(item, index) in searchHistory"
              :key="'history-' + index"
              class="dropdown-item"
              @mousedown.prevent="selectHistory(item)"
            >
              <svg class="item-icon history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <span class="item-text">{{ item }}</span>
            </div>
          </div>
        </div>

        <div v-if="hasSuggestions" class="dropdown-section">
          <div class="section-label">搜索建议</div>
          <div class="suggestions-list">
            <div
              v-for="(item, index) in suggestions"
              :key="'suggestion-' + index"
              class="dropdown-item"
              @mousedown.prevent="selectSuggestion(item)"
            >
              <svg v-if="item.type === 'tag'" class="item-icon tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <svg v-else class="item-icon title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <span class="item-text">{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useGalleryStore } from '../stores/galleryStore'

interface Props {
  modelValue: string
  placeholder?: string
  debounceMs?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索图片...',
  debounceMs: 300
})

const emit = defineEmits<Emits>()

const galleryStore = useGalleryStore()

const inputRef = ref<HTMLInputElement | null>(null)
const showDropdown = ref(false)
const localValue = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const searchHistory = computed(() => galleryStore.searchHistory.slice(0, 5))

const hasHistory = computed(() => searchHistory.value.length > 0 && !localValue.value.trim())

interface Suggestion {
  text: string
  type: 'tag' | 'title'
}

const suggestions = computed<Suggestion[]>(() => {
  const query = localValue.value.trim().toLowerCase()
  if (!query) return []

  const result: Suggestion[] = []
  const seen = new Set<string>()

  for (const tagItem of galleryStore.allTags) {
    if (tagItem.tag.toLowerCase().includes(query)) {
      result.push({ text: tagItem.tag, type: 'tag' })
      seen.add(tagItem.tag)
    }
    if (result.length >= 5) break
  }

  for (const img of galleryStore.images) {
    if (img.title.toLowerCase().includes(query) && !seen.has(img.title)) {
      result.push({ text: img.title, type: 'title' })
      seen.add(img.title)
    }
    if (result.length >= 8) break
  }

  return result
})

const hasSuggestions = computed(() => suggestions.value.length > 0 && localValue.value.trim().length > 0)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  localValue.value = value
  emit('update:modelValue', value)

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('search', value)
    galleryStore.setSearchQuery(value)
  }, props.debounceMs)
}

function handleFocus() {
  showDropdown.value = true
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

function handleEnter() {
  const value = localValue.value.trim()
  if (value) {
    galleryStore.addToSearchHistory(value)
    galleryStore.setSearchQuery(value)
    emit('search', value)
  }
  showDropdown.value = false
}

function handleEscape() {
  showDropdown.value = false
  inputRef.value?.blur()
}

function handleClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  galleryStore.setSearchQuery('')
  emit('search', '')
  inputRef.value?.focus()
}

function selectHistory(item: string) {
  localValue.value = item
  emit('update:modelValue', item)
  galleryStore.setSearchQuery(item)
  galleryStore.addToSearchHistory(item)
  emit('search', item)
  showDropdown.value = false
}

function selectSuggestion(item: Suggestion) {
  localValue.value = item.text
  emit('update:modelValue', item.text)
  galleryStore.setSearchQuery(item.text)
  galleryStore.addToSearchHistory(item.text)
  emit('search', item.text)
  showDropdown.value = false
}

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

onMounted(() => {
  localValue.value = props.modelValue
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
.search-bar-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #adb5bd;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background-color: #f8f9fa;
  color: #2c3e50;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2c3e50;
  background-color: #ffffff;
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-btn {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #adb5bd;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
}

.clear-btn:hover {
  color: #2c3e50;
  background-color: #f1f3f5;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-section {
  padding: 8px 0;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid #f1f3f5;
}

.section-label {
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #868e96;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: rgba(248, 249, 250, 0.9);
}

.item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.history-icon {
  color: #adb5bd;
}

.tag-icon {
  color: #495057;
}

.title-icon {
  color: #868e96;
}

.item-text {
  font-size: 14px;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
