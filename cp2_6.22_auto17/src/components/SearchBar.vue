<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

const store = useGalleryStore()

const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const isFocused = ref(false)
const expandedMobile = ref(false)
const localInput = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let submitted = false

const suggestions = computed(() => {
  const q = localInput.value.trim().toLowerCase()
  if (!q) return []
  const result: string[] = []
  for (const t of store.allTags) {
    if (t.name.toLowerCase().startsWith(q)) {
      result.push(t.name)
      if (result.length >= 5) break
    }
  }
  return result
})

const showDropdown = computed(
  () =>
    isFocused.value &&
    !submitted &&
    (store.searchHistory.length > 0 || suggestions.value.length > 0) &&
    localInput.value.trim() === store.searchQuery.trim(),
)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  localInput.value = target.value
  submitted = false
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.searchQuery = target.value
  }, 300)
}

function submit() {
  submitted = true
  store.setSearchQuery(localInput.value)
  collapseMobile()
}

function clearInput() {
  localInput.value = ''
  store.clearSearch()
  submitted = false
  if (debounceTimer) clearTimeout(debounceTimer)
  inputRef.value?.focus()
}

function useHistoryItem(item: string) {
  localInput.value = item
  store.setSearchQuery(item)
  submitted = true
  collapseMobile()
}

function useSuggestion(s: string) {
  localInput.value = s
  store.setSearchQuery(s)
  submitted = true
  collapseMobile()
}

function collapseMobile() {
  expandedMobile.value = false
  isFocused.value = false
}

async function toggleMobile() {
  expandedMobile.value = !expandedMobile.value
  if (expandedMobile.value) {
    await nextTick()
    inputRef.value?.focus()
  }
}

function onDocumentClick(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    isFocused.value = false
  }
}

watch(
  () => store.searchQuery,
  (v) => {
    if (v !== localInput.value) localInput.value = v
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('mousedown', onDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="search-bar"
    :class="{ 'is-mobile-expanded': expandedMobile, focused: isFocused }"
  >
    <button
      class="search-toggle"
      type="button"
      aria-label="搜索"
      @click="toggleMobile"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>

    <div class="search-field">
      <div class="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input
        ref="inputRef"
        type="text"
        class="search-input"
        :value="localInput"
        placeholder="搜索标题或标签…"
        @input="onInput"
        @focus="isFocused = true"
        @keydown.enter="submit"
        @keydown.esc="collapseMobile()"
      />
      <button
        v-if="localInput.length > 0"
        type="button"
        class="clear-btn"
        aria-label="清除"
        @mousedown.prevent
        @click="clearInput"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <Transition name="dropdown">
        <div v-if="showDropdown" class="search-dropdown">
          <div v-if="suggestions.length" class="dd-group">
            <div class="dd-label">匹配标签</div>
            <button
              v-for="s in suggestions"
              :key="'s-'+s"
              type="button"
              class="dd-item"
              @click="useSuggestion(s)"
            >
              <span class="dd-icon tag-icon">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </span>
              <span class="dd-text">{{ s }}</span>
            </button>
          </div>
          <div v-if="store.searchHistory.length" class="dd-group">
            <div class="dd-label">最近搜索</div>
            <button
              v-for="(h, i) in store.searchHistory"
              :key="'h-'+i"
              type="button"
              class="dd-item"
              @click="useHistoryItem(h)"
            >
              <span class="dd-icon">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </span>
              <span class="dd-text">{{ h }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--text-primary);
  transition: var(--transition-fast);
}
.search-toggle:hover {
  background: var(--bg-primary);
}

.search-field {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: var(--transition-fast);
}
.search-field:focus-within {
  background: var(--bg-white);
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
}

.search-icon {
  display: inline-flex;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  font-size: 13.5px;
  color: var(--text-primary);
}
.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.04);
  transition: var(--transition-fast);
  flex-shrink: 0;
}
.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  z-index: 100;
}

.dd-group + .dd-group {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--border);
}

.dd-label {
  padding: 4px 8px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  transition: var(--transition-fast);
  text-align: left;
}
.dd-item:hover {
  background: var(--bg-primary);
}

.dd-icon {
  display: inline-flex;
  color: var(--text-muted);
  width: 16px;
  justify-content: center;
}

.tag-icon {
  color: var(--fav-end);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

@media (max-width: 768px) {
  .search-toggle {
    display: inline-flex;
  }
  .search-field {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    z-index: 60;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    background: var(--bg-white);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    transition: var(--transition-fast);
  }
  .is-mobile-expanded .search-field,
  .search-bar.focused .search-field {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}
</style>
