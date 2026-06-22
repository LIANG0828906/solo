<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'
import SearchBar from '@/components/SearchBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import WaterfallGrid from '@/components/WaterfallGrid.vue'
import ImageModal from '@/components/ImageModal.vue'

const store = useGalleryStore()
const route = useRoute()

const isFavoritesView = computed(() => route.path === '/favorites')
const title = computed(() => (isFavoritesView.value ? '我的收藏' : '全部图片'))
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <div class="logo-section">
          <div class="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div class="logo-text">Gallery</div>
        </div>

        <nav class="view-tabs">
          <router-link
            to="/"
            class="tab-link"
            :class="{ active: !isFavoritesView }"
          >
            <span class="tab-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            全部
          </router-link>
          <router-link
            to="/favorites"
            class="tab-link"
            :class="{ active: isFavoritesView }"
          >
            <span class="tab-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </span>
            收藏
            <span v-if="store.favoritesCount > 0" class="fav-badge">
              {{ store.favoritesCount }}
            </span>
          </router-link>
        </nav>

        <SearchBar class="search-slot" />
      </div>
    </header>

    <main class="app-main">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <FilterPanel />
        </div>
      </aside>
      <section class="content">
        <div class="content-heading">
          <h1 class="content-title">{{ title }}</h1>
          <div class="content-meta">
            共 <strong>{{ store.filteredImages.length }}</strong> 张图片
            <template v-if="store.selectedTags.length || store.searchQuery">
              &nbsp;·&nbsp;
              <button class="clear-link" @click="store.clearSearch(); store.clearTags()">
                清除筛选
              </button>
            </template>
          </div>
        </div>
        <WaterfallGrid />
      </section>
    </main>

    <ImageModal />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(1.4) blur(8px);
  -webkit-backdrop-filter: saturate(1.4) blur(8px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--fav-start), var(--fav-end));
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(238, 90, 36, 0.3);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--text-primary);
}

.view-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--bg-primary);
  border-radius: 999px;
  border: 1px solid var(--border);
}

.tab-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 999px;
  transition: var(--transition-fast);
  position: relative;
}

.tab-link:hover {
  color: var(--text-primary);
}

.tab-link.active {
  background: var(--text-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.25);
}

.tab-icon {
  display: inline-flex;
}

.fav-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
}

.search-slot {
  margin-left: auto;
  max-width: 420px;
  width: 100%;
}

.app-main {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 28px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 100px;
}

.sidebar-inner {
  background: var(--bg-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow-card);
}

.content {
  min-width: 0;
}

.content-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.content-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: var(--text-primary);
}

.content-meta {
  font-size: 13px;
  color: var(--text-muted);
}

.content-meta strong {
  color: var(--text-primary);
  font-weight: 600;
}

.clear-link {
  color: var(--fav-end);
  font-weight: 500;
  transition: var(--transition-fast);
}

.clear-link:hover {
  opacity: 0.75;
}

@media (max-width: 1024px) {
  .header-inner {
    padding: 12px 20px;
    gap: 16px;
  }
  .app-main {
    padding: 20px;
    grid-template-columns: 200px 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .header-inner {
    padding: 10px 16px;
    gap: 10px;
    flex-wrap: wrap;
  }
  .logo-text {
    display: none;
  }
  .view-tabs {
    order: 2;
    width: 100%;
    justify-content: space-between;
  }
  .tab-link {
    flex: 1;
    justify-content: center;
  }
  .search-slot {
    margin-left: 0;
    max-width: none;
  }
  .app-main {
    padding: 16px;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .sidebar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    z-index: 40;
    padding: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-top: 1px solid var(--border);
    max-height: 55vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s var(--ease-out);
  }
  .sidebar.open {
    transform: translateY(0);
  }
  .sidebar-inner {
    background: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
    padding: 16px;
  }
  .content-heading {
    margin-bottom: 14px;
  }
}
</style>
