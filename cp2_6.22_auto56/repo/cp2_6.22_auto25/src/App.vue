<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGalleryStore } from '@/stores/galleryStore'
import SearchBar from '@/components/SearchBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ImageModal from '@/components/ImageModal.vue'
import type { ImageItem } from '@/types'

const store = useGalleryStore()
const route = useRoute()
const selectedImage = ref<ImageItem | null>(null)
const isMobileFilterOpen = ref<boolean>(false)
const isMobileSearchOpen = ref<boolean>(false)
const windowWidth = ref<number>(window.innerWidth)

const isFavoritesView = computed<boolean>(() => route.name === 'favorites')

function handleResize(_e: Event): void {
  windowWidth.value = window.innerWidth
}

function openModal(image: ImageItem): void {
  selectedImage.value = image
}

function closeModal(): void {
  selectedImage.value = null
}

function toggleMobileFilter(_e: MouseEvent): void {
  isMobileFilterOpen.value = !isMobileFilterOpen.value
}

function toggleMobileSearch(_e: MouseEvent): void {
  isMobileSearchOpen.value = !isMobileSearchOpen.value
}

function closeMobilePanels(): void {
  isMobileFilterOpen.value = false
  isMobileSearchOpen.value = false
}

function handleTagToggled(_tag: string): void {
  // no-op, handled by store
}

onMounted((): void => {
  window.addEventListener('resize', handleResize)
})

onUnmounted((): void => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="app-container">
    <header class="header">
      <div class="header-inner">
        <div class="header-left">
          <h1 class="logo">画廊</h1>
          <nav class="nav">
            <router-link to="/" class="nav-link" :class="{ active: !isFavoritesView }">
              全部图片
            </router-link>
            <router-link to="/favorites" class="nav-link" :class="{ active: isFavoritesView }">
              <span class="heart-icon">♥</span>
              收藏
              <span v-if="store.favoriteCount > 0" class="badge">{{ store.favoriteCount }}</span>
            </router-link>
          </nav>
        </div>

        <div class="header-right">
          <SearchBar class="desktop-search" />

          <button
            class="icon-btn mobile-search-btn"
            @click="toggleMobileSearch"
            aria-label="搜索"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>

          <button
            class="icon-btn mobile-filter-btn"
            @click="toggleMobileFilter"
            aria-label="筛选"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M7 12h10M10 18h4"></path>
            </svg>
            <span v-if="store.selectedTags.length > 0" class="filter-badge">{{ store.selectedTags.length }}</span>
          </button>
        </div>
      </div>

      <transition name="slide-down">
        <div v-if="isMobileSearchOpen" class="mobile-search-container">
          <SearchBar @search-confirmed="closeMobilePanels" />
        </div>
      </transition>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <FilterPanel :is-favorites-view="isFavoritesView" @tag-toggled="handleTagToggled" />
      </aside>

      <main class="main-content">
        <router-view @open-modal="openModal" />
      </main>
    </div>

    <transition name="slide-up">
      <div v-if="isMobileFilterOpen" class="mobile-filter-overlay" @click.self="closeMobilePanels">
        <div class="mobile-filter-drawer">
          <div class="drawer-header">
            <h3>标签筛选</h3>
            <button class="icon-btn" @click="(_e: MouseEvent): void => closeMobilePanels()" aria-label="关闭">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <FilterPanel :is-favorites-view="isFavoritesView" @tag-toggled="handleTagToggled" />
        </div>
      </div>
    </transition>

    <ImageModal
      v-if="selectedImage"
      :image="selectedImage"
      @close="closeModal"
    />
  </div>
</template>

<style>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --accent: #2c3e50;
  --favorite-start: #ff6b6b;
  --favorite-end: #ee5a24;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
  --border-radius: 8px;
  --transition-fast: 0.2s ease-out;
  --transition-normal: 0.3s ease-out;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

input {
  font-family: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.heart-icon {
  font-size: 14px;
}

.badge {
  background: linear-gradient(135deg, var(--favorite-start), var(--favorite-end));
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.desktop-search {
  width: 320px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  position: relative;
}

.icon-btn:hover {
  background: var(--bg-secondary);
}

.mobile-search-btn,
.mobile-filter-btn {
  display: none;
}

.filter-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, var(--favorite-start), var(--favorite-end));
  color: white;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding: 0 4px;
}

.mobile-search-container {
  padding: 0 24px 16px;
  border-top: 1px solid var(--bg-secondary);
  background: var(--bg-primary);
}

.main-layout {
  flex: 1;
  display: flex;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  padding: 24px;
  gap: 24px;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.mobile-filter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mobile-filter-drawer {
  background: var(--bg-primary);
  width: 100%;
  max-height: 70vh;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--bg-secondary);
}

.drawer-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-normal);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-from .mobile-filter-drawer,
.slide-up-leave-to .mobile-filter-drawer {
  transform: translateY(100%);
}

.slide-up-enter-active .mobile-filter-drawer,
.slide-up-leave-active .mobile-filter-drawer {
  transition: transform var(--transition-normal);
}

@media (max-width: 768px) {
  .header-inner {
    padding: 12px 16px;
    gap: 12px;
  }

  .header-left {
    gap: 16px;
  }

  .logo {
    font-size: 20px;
  }

  .nav {
    display: none;
  }

  .desktop-search {
    display: none;
  }

  .mobile-search-btn,
  .mobile-filter-btn {
    display: flex;
  }

  .main-layout {
    padding: 16px;
    gap: 0;
  }

  .sidebar {
    display: none;
  }
}
</style>
