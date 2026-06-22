<template>
  <div class="app-container">
    <header class="navbar">
      <div class="navbar-left">
        <h1 class="app-title" @click="goHome">画廊</h1>
      </div>

      <div class="navbar-center">
        <SearchBar
          v-if="!isMobile || showMobileSearch"
          v-model="searchQuery"
          class="search-bar"
          @search="handleSearch"
        />
        <button
          v-else
          class="icon-btn mobile-search-btn"
          @click="toggleMobileSearch"
          aria-label="搜索"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </div>

      <div class="navbar-right">
        <button class="favorites-btn" @click="goToFavorites">
          <svg class="heart-icon" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="navHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ff6b6b" />
                <stop offset="100%" style="stop-color:#ee5a24" />
              </linearGradient>
            </defs>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="url(#navHeartGradient)"
            />
          </svg>
          <span class="favorites-count">{{ galleryStore.favorites.size }}</span>
        </button>
        <button
          v-if="isMobile"
          class="icon-btn filter-btn"
          @click="showMobileFilter = true"
          aria-label="筛选"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>
    </header>

    <div class="main-layout">
      <aside v-if="!isMobile" class="sidebar">
        <FilterPanel />
      </aside>

      <main class="content">
        <router-view />
      </main>
    </div>

    <Transition name="fade">
      <div v-if="showMobileFilter" class="mobile-filter-overlay" @click.self="closeMobileFilter">
        <Transition name="slide-up">
          <div v-if="showMobileFilter" class="mobile-filter-drawer" @click.stop>
            <div class="drawer-header">
              <h3 class="drawer-title">筛选</h3>
              <button class="icon-btn close-drawer-btn" @click="closeMobileFilter" aria-label="关闭">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div class="drawer-content">
              <FilterPanel />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <ImageModal
      :visible="galleryStore.showModal"
      :image="galleryStore.selectedImage || undefined"
      @close="galleryStore.closeModal"
      @toggle-favorite="galleryStore.toggleFavoriteFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from './components/SearchBar.vue'
import FilterPanel from './components/FilterPanel.vue'
import ImageModal from './components/ImageModal.vue'
import { useGalleryStore } from './stores/galleryStore'

const router = useRouter()
const galleryStore = useGalleryStore()

const searchQuery = ref('')
const showMobileSearch = ref(false)
const showMobileFilter = ref(false)
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    showMobileSearch.value = false
    showMobileFilter.value = false
  }
}

const handleSearch = (query: string) => {
  galleryStore.setSearchQuery(query)
}

const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
}

const closeMobileFilter = () => {
  showMobileFilter.value = false
}

watch(showMobileFilter, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const goHome = () => {
  router.push('/')
}

const goToFavorites = () => {
  router.push('/favorites')
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #2c3e50;
  line-height: 1.6;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-left {
  flex: 1;
  min-width: 0;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.app-title:hover {
  opacity: 0.8;
}

.navbar-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.search-bar {
  width: 100%;
  max-width: 400px;
}

.navbar-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.favorites-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.favorites-btn:hover {
  background-color: #fff0f0;
}

.heart-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.favorites-count {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #f8f9fa;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.icon-btn:hover {
  background-color: #e9ecef;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.main-layout {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 240px;
  padding: 24px;
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  flex-shrink: 0;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.mobile-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.mobile-filter-drawer {
  width: 100%;
  max-height: 70vh;
  background-color: #ffffff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f5;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.close-drawer-btn {
  background-color: #f8f9fa;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (max-width: 768px) {
  .navbar {
    padding: 12px 16px;
  }

  .app-title {
    font-size: 20px;
  }

  .navbar-center {
    flex: 0 0 auto;
  }

  .navbar-right {
    gap: 8px;
  }

  .favorites-btn {
    padding: 6px 12px;
  }

  .favorites-count {
    font-size: 13px;
  }

  .content {
    padding: 16px;
  }
}
</style>
