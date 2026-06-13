<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMobile = ref(false)

const navItems = [
  { path: '/tracker', name: '饮食记录', icon: '🍽️' },
  { path: '/dashboard', name: '营养分析', icon: '📊' }
]

const currentPageTitle = computed(() => {
  const item = navItems.find(n => n.path === route.path)
  return item ? item.name : '营养追踪'
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="app-container">
    <header class="top-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🥗</span>
          <span class="logo-text">智能营养追踪</span>
        </div>
        <div class="header-title">{{ currentPageTitle }}</div>
        <div class="header-spacer"></div>
      </div>
    </header>

    <div class="main-layout">
      <aside v-if="!isMobile" class="sidebar">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: route.path === item.path }"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.name }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <nav v-if="isMobile" class="bottom-tabbar">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="tab-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="tab-icon">{{ item.icon }}</span>
          <span class="tab-label">{{ item.name }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
  position: relative;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.logo-icon {
  font-size: 24px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-spacer {
  width: 120px;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 12px;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #666;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f5f7fa;
}

.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 20px;
  color: #999;
  font-size: 12px;
  transition: color 0.2s ease;
}

.tab-item.active {
  color: #667eea;
}

.tab-icon {
  font-size: 22px;
}

.tab-label {
  font-size: 11px;
}

@media (max-width: 768px) {
  .top-header {
    padding: 0 16px;
    height: 52px;
  }

  .logo-text {
    font-size: 15px;
  }

  .header-title {
    display: none;
  }

  .main-content {
    padding: 16px;
    padding-bottom: 80px;
  }
}
</style>
