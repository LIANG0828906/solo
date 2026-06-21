<template>
  <div class="app-container">
    <svg class="icon-defs" style="position: absolute; width: 0; height: 0;">
      <defs>
        <symbol id="icon-vase" viewBox="0 0 100 100">
          <path d="M50 10 L45 20 Q30 25 35 45 Q32 60 40 80 Q45 90 50 90 Q55 90 60 80 Q68 60 65 45 Q70 25 55 20 L50 10 Z" />
          <ellipse cx="50" cy="15" rx="8" ry="3" />
        </symbol>
        <symbol id="icon-gear" viewBox="0 0 100 100">
          <path d="M50 10 L55 20 L65 18 L68 28 L78 30 L76 40 L85 45 L80 50 L85 55 L76 60 L78 70 L68 72 L65 82 L55 80 L50 90 L45 80 L35 82 L32 72 L22 70 L24 60 L15 55 L20 50 L15 45 L24 40 L22 30 L32 28 L35 18 L45 20 Z" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" stroke-width="3" />
        </symbol>
        <symbol id="icon-chair" viewBox="0 0 100 100">
          <rect x="25" y="40" width="50" height="8" rx="2" />
          <rect x="25" y="25" width="8" height="55" rx="2" />
          <rect x="67" y="25" width="8" height="55" rx="2" />
          <rect x="30" y="20" width="40" height="10" rx="3" />
          <rect x="30" y="70" width="6" height="25" rx="2" />
          <rect x="64" y="70" width="6" height="25" rx="2" />
        </symbol>
        <symbol id="icon-explode" viewBox="0 0 100 100">
          <rect x="35" y="10" width="30" height="20" rx="3" />
          <rect x="10" y="40" width="25" height="20" rx="3" />
          <rect x="65" y="40" width="25" height="20" rx="3" />
          <rect x="35" y="70" width="30" height="20" rx="3" />
          <line x1="50" y1="30" x2="50" y2="40" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />
          <line x1="35" y1="50" x2="40" y2="50" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />
          <line x1="60" y1="50" x2="65" y2="50" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />
          <line x1="50" y1="60" x2="50" y2="70" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />
        </symbol>
        <symbol id="icon-assemble" viewBox="0 0 100 100">
          <path d="M50 15 L65 30 L50 45 L35 30 Z" />
          <path d="M20 50 L35 35 L35 65 Z" />
          <path d="M80 50 L65 35 L65 65 Z" />
          <path d="M50 85 L65 70 L50 55 L35 70 Z" />
        </symbol>
        <symbol id="icon-reset" viewBox="0 0 100 100">
          <path d="M50 20 Q30 20 20 40 Q10 60 30 70 Q50 80 60 65" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
          <polygon points="55,50 70,40 55,30" />
        </symbol>
      </defs>
    </svg>

    <div class="main-layout" :class="{ 'mobile-layout': isMobile }">
      <div class="viewport-container" ref="viewportRef">
        <div class="loading-overlay" v-if="isLoading">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="loading-text">加载中...</div>
          </div>
        </div>
        
        <div class="viewport-hint" v-if="!isLoading && !hasInteracted">
          <div class="hint-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span>拖拽旋转 • 滚轮缩放 • 点击查看详情</span>
          </div>
        </div>
      </div>

      <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo-section">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="#00d2ff">
                <polygon points="50,10 90,35 90,75 50,100 10,75 10,35" fill="none" stroke="currentColor" stroke-width="4" />
                <circle cx="50" cy="55" r="15" fill="none" stroke="currentColor" stroke-width="3" />
              </svg>
            </div>
            <div class="logo-text">
              <h1 class="app-title">3D 展品馆</h1>
              <span class="app-subtitle">交互式展示</span>
            </div>
          </div>
        </div>

        <div class="sidebar-content">
          <ModelList 
            :selected-id="currentExhibitId" 
            @select="handleSelectExhibit" 
          />
          
          <div class="control-section">
            <h3 class="section-title">视图控制</h3>
            
            <div class="control-buttons">
              <button 
                class="control-btn"
                :class="{ active: isExploded }"
                @click="handleToggleExplode"
                :disabled="isLoading"
              >
                <svg class="btn-icon" viewBox="0 0 100 100">
                  <use :href="isExploded ? '#icon-assemble' : '#icon-explode'" />
                </svg>
                <span>{{ isExploded ? '组装' : '拆解' }}</span>
                <div class="ripple" ref="rippleRef"></div>
              </button>
              
              <button 
                class="control-btn"
                @click="handleResetView"
                :disabled="isLoading"
              >
                <svg class="btn-icon" viewBox="0 0 100 100">
                  <use href="#icon-reset" />
                </svg>
                <span>复位</span>
              </button>
            </div>
          </div>

          <div class="exhibit-info" v-if="currentExhibit">
            <h3 class="section-title">展品信息</h3>
            <div class="info-card">
              <h4 class="exhibit-name">{{ currentExhibit.name }}</h4>
              <span class="exhibit-category">{{ currentExhibit.category }}</span>
              <p class="exhibit-desc">{{ currentExhibit.description }}</p>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="fps-indicator">
            <span class="fps-dot" :class="{ good: fps >= 50, ok: fps >= 30 && fps < 50, bad: fps < 30 }"></span>
            <span class="fps-text">{{ fps }} FPS</span>
          </div>
        </div>
      </aside>
    </div>

    <div class="bottom-nav" v-if="isMobile">
      <ModelList 
        :selected-id="currentExhibitId" 
        @select="handleSelectExhibit" 
      />
      
      <div class="bottom-controls">
        <button 
          class="mobile-btn"
          :class="{ active: isExploded }"
          @click="handleToggleExplode"
        >
          <svg viewBox="0 0 100 100">
            <use :href="isExploded ? '#icon-assemble' : '#icon-explode'" />
          </svg>
          <span>{{ isExploded ? '组装' : '拆解' }}</span>
        </button>
        <button class="mobile-btn" @click="handleResetView">
          <svg viewBox="0 0 100 100">
            <use href="#icon-reset" />
          </svg>
          <span>复位</span>
        </button>
      </div>
    </div>

    <InfoPanel
      :visible="showInfoPanel"
      :info="panelInfo"
      @close="closeInfoPanel"
    />

    <div 
      v-if="showInfoPanel"
      class="click-marker"
      :style="markerStyle"
    >
      <div class="marker-ring"></div>
      <div class="marker-pulse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import SceneManager from '@/modules/sceneManager';
import ModelLoader from '@/modules/modelLoader';
import InteractionHandler, { PointInfoData } from '@/modules/interactionHandler';
import ModelList from '@/components/ModelList.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import { exhibits, ExhibitInfo } from '@/data/exhibits';
const viewportRef = ref<HTMLElement | null>(null);
const currentExhibitId = ref('vase-1');
const isLoading = ref(false);
const isExploded = ref(false);
const showInfoPanel = ref(false);
const hasInteracted = ref(false);
const fps = ref(60);
const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const panelInfo = ref<PointInfoData>({
 material: '',
 productionDate: '',
 description: '',
 position: { x: 0, y: 0, z: 0 },
 screenX: 0,
 screenY: 0,
});
let sceneManager: SceneManager | null = null;
let modelLoader: ModelLoader | null = null;
let interactionHandler: InteractionHandler | null = null;
let fpsFrames = 0;
let fpsLastTime = performance.now();
let animationFrameId: number | null = null;
const currentExhibit = computed<ExhibitInfo | undefined>(() => {
 return exhibits.find(e => e.id === currentExhibitId.value);
});
const markerStyle = computed(() => {
 return {
 left: `${panelInfo.value.screenX}px`,
 top: `${panelInfo.value.screenY}px`,
 };
});
const handleSelectExhibit = async (id: string) => {
 if (isLoading.value || id === currentExhibitId.value)
 return;
 isLoading.value = true;
 showInfoPanel.value = false;
 isExploded.value = false;
 const exhibit = exhibits.find(e => e.id === id);
 if (!exhibit || !modelLoader || !sceneManager) {
 isLoading.value = false;
 return;
 }
 try {
 const modelData = await modelLoader.loadModel(exhibit);
 await sceneManager.loadModel(modelData);
 currentExhibitId.value = id;
 }
 catch (error) {
 console.error('Failed to load model:', error);
 }
 finally {
 isLoading.value = false;
 }
};
const handleToggleExplode = async () => {
 if (!sceneManager || isLoading.value)
 return;
 if (isExploded.value) {
 await sceneManager.assemble(1.5);
 }
 else {
 await sceneManager.explode(1.5);
 }
 isExploded.value = !isExploded.value;
};
const handleResetView = () => {
 if (!sceneManager || !currentExhibit.value)
 return;
 handleSelectExhibit(currentExhibitId.value);
};
const handlePick = (info: PointInfoData | null) => {
 if (info) {
 panelInfo.value = info;
 showInfoPanel.value = true;
 }
 else {
 showInfoPanel.value = false;
 }
};
const closeInfoPanel = () => {
 showInfoPanel.value = false;
};
const handleRotate = () => {
 hasInteracted.value = true;
 if (showInfoPanel.value) {
 updatePanelPosition();
 }
};
const updatePanelPosition = () => {
 if (!interactionHandler || !showInfoPanel.value)
 return;
 const screenPos = interactionHandler.updateInfoPanelPosition(panelInfo.value.position);
 panelInfo.value.screenX = screenPos.x;
 panelInfo.value.screenY = screenPos.y;
};
const measureFPS = () => {
 fpsFrames++;
 const now = performance.now();
 if (now - fpsLastTime >= 1000) {
 fps.value = Math.round(fpsFrames * 1000 / (now - fpsLastTime));
 fpsFrames = 0;
 fpsLastTime = now;
 }
 animationFrameId = requestAnimationFrame(measureFPS);
};
const checkMobile = () => {
 isMobile.value = window.innerWidth <= 768;
};
const handleResize = () => {
 checkMobile();
 updatePanelPosition();
};
onMounted(async () => {
 checkMobile();
 window.addEventListener('resize', handleResize);
 if (!viewportRef.value)
 return;
 sceneManager = new SceneManager(viewportRef.value);
 modelLoader = new ModelLoader();
 interactionHandler = new InteractionHandler(sceneManager, viewportRef.value, handlePick, handleRotate);
 measureFPS();
 await nextTick();
 const exhibit = exhibits.find(e => e.id === currentExhibitId.value);
 if (exhibit && modelLoader && sceneManager) {
 isLoading.value = true;
 try {
 const modelData = await modelLoader.loadModel(exhibit);
 await sceneManager.loadModel(modelData);
 }
 catch (error) {
 console.error('Failed to load initial model:', error);
 }
 finally {
 isLoading.value = false;
 }
 }
});
onUnmounted(() => {
 window.removeEventListener('resize', handleResize);
 if (animationFrameId) {
 cancelAnimationFrame(animationFrameId);
 }
 if (interactionHandler) {
 interactionHandler.dispose();
 }
 if (sceneManager) {
 sceneManager.dispose();
 }
});
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  position: relative;
  overflow: hidden;
}

.icon-defs {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.viewport-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.viewport-container :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 46, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner-ring {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(0, 210, 255, 0.2);
  border-top-color: #00d2ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #00d2ff;
  font-size: 14px;
  letter-spacing: 2px;
}

.viewport-hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 30px;
  color: #a0a0b0;
  font-size: 13px;
  animation: fadeInOut 3s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.sidebar {
  width: 300px;
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 210, 255, 0.5), transparent);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 12px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 11px;
  color: #666677;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.control-section {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666677;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

.control-btn {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #a0a0b0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.control-btn:hover:not(:disabled) {
  border-color: rgba(0, 210, 255, 0.5);
  background: rgba(0, 210, 255, 0.08);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 210, 255, 0.2);
}

.control-btn.active {
  border-color: #00d2ff;
  background: rgba(0, 210, 255, 0.15);
  color: #00d2ff;
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.3);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  width: 28px;
  height: 28px;
  fill: currentColor;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 210, 255, 0.4);
  transform: scale(0);
  animation: ripple-effect 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.exhibit-info {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.info-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.exhibit-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.exhibit-category {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 210, 255, 0.15);
  color: #00d2ff;
  font-size: 11px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.exhibit-desc {
  font-size: 13px;
  color: #888899;
  line-height: 1.7;
  margin: 0;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.fps-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fps-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
}

.fps-dot.good {
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.fps-dot.ok {
  background: #ffcc00;
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
}

.fps-dot.bad {
  background: #ff4444;
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.6);
}

.fps-text {
  font-size: 12px;
  color: #666677;
  font-family: monospace;
}

.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-controls {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #a0a0b0;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-btn svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.mobile-btn.active {
  color: #00d2ff;
  border-color: #00d2ff;
  background: rgba(0, 210, 255, 0.1);
}

.mobile-btn:active {
  transform: scale(0.95);
}

.click-marker {
  position: fixed;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 999;
}

.marker-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #00d2ff;
  border-radius: 50%;
  animation: marker-pulse 1.5s ease-in-out infinite;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #00d2ff;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(0, 210, 255, 0.8);
}

@keyframes marker-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .bottom-nav {
    display: block;
  }

  .viewport-container {
    padding-bottom: 180px;
  }

  .viewport-hint {
    bottom: 200px;
  }
}
</style>
