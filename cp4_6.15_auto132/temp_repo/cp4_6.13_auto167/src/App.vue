<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMobile = ref(false)
const resizeTimer = ref<number | null>(null)

const navItems = [
  { path: '/tracker', name: '饮食记录', icon: '🍽️' },
  { path: '/dashboard', name: '营养分析', icon: '📊' }
]

const currentPageTitle = computed(() => {
  const item = navItems.find(n => n.path === route.path)
  return item ? item.name : '营养追踪'
})

const activePath = computed(() => route.path)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleResize() {
  if (resizeTimer.value !== null) {
    clearTimeout(resizeTimer.value)
  }
  resizeTimer.value = window.setTimeout(checkMobile, 120)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer.value !== null) {
    clearTimeout(resizeTimer.value)
    resizeTimer.value = null
  }
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

    <div class="main-layout" :class="{ 'is-mobile': isMobile }">
      <aside v-if="!isMobile" class="sidebar">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: activePath === item.path }"
            exact-active-class="exact-active"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.name }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="main-content" :class="{ 'mobile-full': isMobile }">
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
          :class="{ active: activePath === item.path }"
          exact-active-class="exact-active"
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
  min-height: 100vh;
  background: #f5f7fa;
}

.top-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.35);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  min-width: 160px;
}

.logo-icon {
  font-size: 24px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.header-spacer {
  width: 160px;
}

.main-layout {
  flex: 1;
  display: flex;
  position: relative;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  padding: 24px 14px;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #6b7280;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  transform: translateX(2px);
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
  transform: scale(1.01);
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.nav-label {
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: transparent;
  width: 100%;
  min-width: 0;
}

.main-content.mobile-full {
  padding: 16px 16px 92px 16px;
  margin: 0;
}

.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 66px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 28px;
  color: #9ca3af;
  font-size: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  text-decoration: none;
  flex: 1;
  height: 100%;
}

.tab-item.active {
  color: #667eea;
}

.tab-item.active .tab-icon {
  transform: scale(1.1) translateY(-2px);
  filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.4));
}

.tab-icon {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .top-header {
    padding: 0 16px;
    height: 54px;
  }

  .header-content {
    gap: 8px;
  }

  .logo {
    min-width: auto;
  }

  .logo-text {
    font-size: 15px;
    display: none;
  }

  .logo-icon {
    font-size: 22px;
  }

  .header-title {
    font-size: 15px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .header-spacer {
    display: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .main-content {
    padding: 20px;
  }
}
</style>
