<template>
  <div class="app-container">
    <nav class="top-nav">
      <div class="nav-left">
        <span class="app-logo">🌿</span>
        <h1 class="app-title">虚拟植物园</h1>
      </div>

      <div class="nav-center">
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: route.name === 'main' }"
        >
          <span class="nav-icon">🌱</span>
          植物总览
        </router-link>
        <router-link
          v-if="selectedPlantId"
          :to="`/plant/${selectedPlantId}"
          class="nav-link"
          :class="{ active: route.name === 'plant-detail' }"
        >
          <span class="nav-icon">📊</span>
          详情
        </router-link>
      </div>

      <div class="nav-right">
        <span class="plant-count-badge">
          {{ plantCount }} 棵植物
        </span>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
        <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div class="bg-gradient"></div>
    <div class="bg-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePlantStore } from '@/stores/plant'
import { storeToRefs } from 'pinia'

const route = useRoute()
const plantStore = usePlantStore()
const { plantCount, selectedPlantId } = storeToRefs(plantStore)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: #e2e8f0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f1629 100%);
  z-index: -2;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
  z-index: -1;
  pointer-events: none;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  font-size: 28px;
  filter: drop-shadow(0 2px 8px rgba(74, 222, 128, 0.3));
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-center {
  display: flex;
  gap: 8px;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.nav-link.active {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
}

.nav-icon {
  font-size: 14px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plant-count-badge {
  padding: 6px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #4ade80;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .top-nav {
    padding: 10px 16px;
  }

  .app-title {
    font-size: 16px;
  }

  .nav-center {
    display: none;
  }

  .plant-count-badge {
    font-size: 11px;
    padding: 4px 10px;
  }
}
</style>
