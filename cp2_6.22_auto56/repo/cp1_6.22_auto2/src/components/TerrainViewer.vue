<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Search, Ruler, RotateCcw, Crosshair, ChevronUp, ChevronDown, X } from 'lucide-vue-next'
import { useTerrain } from '@/composables/useTerrain'
import { usePerformance } from '@/composables/usePerformance'
import { InteractionHandler } from '@/renderer/interactionHandler'
import { searchCity } from '@/data/terrainLoader'
import { getLODForDistance } from '@/data/tileManager'
import type { GeoSearchResult, MeasurementResult } from '@/types'

const terrainCanvas = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<GeoSearchResult[]>([])
const searchHistory = ref<string[]>([])
const showDropdown = ref(false)
const isMeasureMode = ref(false)
const measureResult = ref<MeasurementResult | null>(null)
const hoverInfo = ref<{ lat: number; lon: number; elevation: number } | null>(null)
const isMobile = ref(window.innerWidth < 768)
const drawerOpen = ref(false)
const zoomLevel = ref(50)

const {
  renderer,
  loading,
  loadProgress,
  currentLOD,
  lodOffset,
  initRenderer,
  loadVisibleTiles,
  throttledLoad,
  resetView,
} = useTerrain()

const {
  fps,
  vertexCount,
  autoLODOffset,
  startMonitoring,
  stopMonitoring,
} = usePerformance()

let interactionHandler: InteractionHandler | null = null
let resizeObserver: ResizeObserver | null = null

const loadSearchResults = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }
  const historyMatches = searchHistory.value
    .filter(h => h.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .map(h => ({
      name: h,
      country: '历史记录',
      lat: 0,
      lon: 0,
      displayName: h,
    } as GeoSearchResult))

  const apiResults = await searchCity(searchQuery.value)
  searchResults.value = [...historyMatches, ...apiResults]
  showDropdown.value = true
}

const selectSearchResult = async (result: GeoSearchResult) => {
  searchQuery.value = result.name
  showDropdown.value = false

  if (!searchHistory.value.includes(result.name)) {
    searchHistory.value.unshift(result.name)
    if (searchHistory.value.length > 10) searchHistory.value.pop()
  }

  if (renderer.value && result.lat !== 0 && result.lon !== 0) {
    await renderer.value.animateCameraTo(result.lat, result.lon, 1.5)
    nextTick(() => {
      if (renderer.value) loadVisibleTiles(renderer.value)
    })
  }
}

const toggleMeasure = () => {
  isMeasureMode.value = !isMeasureMode.value
  if (interactionHandler) {
    interactionHandler.setMeasureMode(isMeasureMode.value)
    if (!isMeasureMode.value) {
      interactionHandler.clearMeasurement()
      measureResult.value = null
    }
  }
}

const handleReset = () => {
  if (renderer.value) {
    interactionHandler?.clearMeasurement()
    measureResult.value = null
    isMeasureMode.value = false
    interactionHandler?.setMeasureMode(false)
    resetView(renderer.value)
  }
}

const formatDistance = (m: number): string => {
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(2)} km`
}

const formatElevation = (m: number): string => {
  return `${m.toFixed(0)} m`
}

watch(searchQuery, () => {
  loadSearchResults()
})

watch(zoomLevel, (val) => {
  if (!renderer.value) return
  const dir = new THREE.Vector3()
  renderer.value.camera.getWorldDirection(dir)
  const factor = 1 + (50 - val) * 0.03
  renderer.value.controls.dampingFactor = 0.08
  renderer.value.camera.position.multiplyScalar(factor > 1 ? 1.01 : 0.99)
  renderer.value.controls.update()
})

import * as THREE from 'three'

onMounted(async () => {
  if (!terrainCanvas.value) return

  const r = initRenderer(terrainCanvas.value)

  interactionHandler = new InteractionHandler(r, terrainCanvas.value)
  interactionHandler.setOnMeasure(result => {
    measureResult.value = result
  })
  interactionHandler.setOnHover(info => {
    hoverInfo.value = info
  })

  startMonitoring(r)

  r.controls.addEventListener('change', () => {
    if (renderer.value) throttledLoad(renderer.value)
  })

  await loadVisibleTiles(r)

  resizeObserver = new ResizeObserver(() => {
    isMobile.value = window.innerWidth < 768
  })
  resizeObserver.observe(document.body)
})

onBeforeUnmount(() => {
  stopMonitoring()
  interactionHandler?.dispose()
  renderer.value?.dispose()
  resizeObserver?.disconnect()
})

const closeDropdown = () => {
  showDropdown.value = false
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-deep-blue">
    <!-- 3D视图区域 -->
    <div class="relative flex-1 min-w-0" :class="isMobile ? 'w-full' : 'w-4/5'">
      <div ref="terrainCanvas" class="w-full h-full" @click="closeDropdown" />

      <!-- 悬停信息 -->
      <div
        v-if="hoverInfo && !isMeasureMode"
        class="absolute bottom-4 left-4 px-3 py-2 rounded-lg glass-panel text-xs font-body pointer-events-none"
        style="backdrop-filter: blur(8px)"
      >
        <span class="text-accent-glow font-display text-[10px]">LAT</span>
        {{ hoverInfo.lat.toFixed(4) }}°
        <span class="text-accent-glow font-display text-[10px] ml-2">LON</span>
        {{ hoverInfo.lon.toFixed(4) }}°
        <span class="text-accent-glow font-display text-[10px] ml-2">ELEV</span>
        {{ formatElevation(hoverInfo.elevation) }}
      </div>

      <!-- 测量结果面板 -->
      <div
        v-if="measureResult"
        class="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl glass-panel"
        style="backdrop-filter: blur(12px)"
      >
        <div class="flex items-center gap-4 font-body text-sm">
          <div>
            <span class="text-accent-glow font-display text-[10px]">距离</span>
            <div class="text-white font-medium">{{ formatDistance(measureResult.distance) }}</div>
          </div>
          <div class="w-px h-8 bg-panel-border" />
          <div>
            <span class="text-accent-glow font-display text-[10px]">高差</span>
            <div class="text-white font-medium">{{ formatElevation(measureResult.elevationDiff) }}</div>
          </div>
          <button @click="interactionHandler?.clearMeasurement(); measureResult = null" class="ml-2 text-gray-400 hover:text-white transition-colors">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- 加载进度条 -->
      <div v-if="loading" class="absolute bottom-0 left-0 right-0 h-1 bg-deep-blue/50">
        <div
          class="h-full bg-gradient-to-r from-accent to-accent-glow progress-bar"
          :style="{ width: loadProgress + '%' }"
        />
      </div>
    </div>

    <!-- 右侧控制面板（桌面端） -->
    <div v-if="!isMobile" class="w-[20%] min-w-[260px] glass-panel flex flex-col overflow-y-auto">
      <div class="p-5 flex flex-col gap-5">
        <!-- Logo -->
        <div class="text-center">
          <h1 class="font-display text-lg font-bold text-accent-glow tracking-widest">GEOTERRAIN</h1>
          <p class="text-[10px] text-gray-500 font-display tracking-wider">3D TERRAIN VIEWER</p>
        </div>

        <div class="h-px bg-panel-border" />

        <!-- 搜索框 -->
        <div class="relative">
          <div class="flex items-center gap-2 bg-deep-blue/60 rounded-lg px-3 py-2 border border-panel-border focus-within:border-accent transition-colors">
            <Search :size="16" class="text-accent shrink-0" />
            <input
              v-model="searchQuery"
              placeholder="搜索城市..."
              class="bg-transparent outline-none text-sm font-body w-full text-white placeholder:text-gray-500"
              @focus="showDropdown = searchResults.length > 0"
            />
            <button v-if="searchQuery" @click="searchQuery = ''; searchResults = []; showDropdown = false" class="text-gray-500 hover:text-white">
              <X :size="14" />
            </button>
          </div>
          <!-- 搜索下拉 -->
          <div
            v-if="showDropdown && searchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-1 rounded-lg bg-deep-blue/95 border border-panel-border z-50 search-dropdown shadow-xl"
            style="backdrop-filter: blur(12px)"
          >
            <div
              v-for="(r, i) in searchResults"
              :key="i"
              @click="selectSearchResult(r)"
              class="px-3 py-2 cursor-pointer hover:bg-accent/10 transition-colors text-sm border-b border-panel-border/30 last:border-0"
            >
              <div class="text-white font-medium">{{ r.name }}</div>
              <div class="text-[10px] text-gray-500">{{ r.country }}</div>
            </div>
          </div>
        </div>

        <!-- 工具按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="toggleMeasure"
            class="btn-ripple flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200"
            :class="isMeasureMode
              ? 'bg-accent/20 border-accent text-accent-glow'
              : 'bg-deep-blue/40 border-panel-border text-gray-400 hover:text-white hover:border-accent/50 hover:scale-110'"
          >
            <Ruler :size="16" />
            <span class="text-xs font-body">{{ isMeasureMode ? '测量中' : '测量' }}</span>
          </button>
          <button
            @click="handleReset"
            class="btn-ripple flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border bg-deep-blue/40 border-panel-border text-gray-400 hover:text-white hover:border-accent/50 hover:scale-110 transition-all duration-200"
          >
            <RotateCcw :size="16" />
            <span class="text-xs font-body">重置</span>
          </button>
        </div>

        <!-- 缩放控制 -->
        <div>
          <label class="text-[10px] font-display text-accent-glow tracking-wider mb-2 block">ZOOM</label>
          <div class="flex items-center gap-2">
            <button @click="zoomLevel = Math.max(0, zoomLevel - 10)" class="text-gray-400 hover:text-white transition-colors">
              <ChevronDown :size="18" />
            </button>
            <input
              v-model.number="zoomLevel"
              type="range"
              min="0"
              max="100"
              class="flex-1 accent-accent h-1"
            />
            <button @click="zoomLevel = Math.min(100, zoomLevel + 10)" class="text-gray-400 hover:text-white transition-colors">
              <ChevronUp :size="18" />
            </button>
          </div>
        </div>

        <div class="h-px bg-panel-border" />

        <!-- 性能监控 -->
        <div>
          <label class="text-[10px] font-display text-accent-glow tracking-wider mb-2 block">PERFORMANCE</label>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-deep-blue/40 rounded-lg p-3 border border-panel-border/50">
              <div class="text-[10px] text-gray-500 font-display">FPS</div>
              <div class="text-xl font-display font-bold" :class="fps >= 45 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'">
                {{ fps }}
              </div>
            </div>
            <div class="bg-deep-blue/40 rounded-lg p-3 border border-panel-border/50">
              <div class="text-[10px] text-gray-500 font-display">VERTICES</div>
              <div class="text-xl font-display font-bold text-accent-glow">
                {{ vertexCount > 1000 ? (vertexCount / 1000).toFixed(1) + 'K' : vertexCount }}
              </div>
            </div>
          </div>
          <div class="mt-2 text-[10px] text-gray-500 font-body">
            LOD: {{ currentLOD }} | Auto+{{ autoLODOffset }}
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="bg-deep-blue/40 rounded-lg p-3 border border-panel-border/50">
          <div class="animate-pulse-text text-sm text-accent-glow font-body mb-2">
            数据加载中...
          </div>
          <div class="w-full h-1 bg-deep-blue rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-accent to-accent-glow progress-bar rounded-full"
              :style="{ width: loadProgress + '%' }"
            />
          </div>
          <div class="text-[10px] text-gray-500 mt-1">{{ loadProgress }}%</div>
        </div>

        <!-- 坐标信息 -->
        <div v-if="hoverInfo" class="bg-deep-blue/40 rounded-lg p-3 border border-panel-border/50">
          <label class="text-[10px] font-display text-accent-glow tracking-wider mb-1 block">POSITION</label>
          <div class="text-xs font-body text-gray-300">
            <div>{{ hoverInfo.lat.toFixed(4) }}°, {{ hoverInfo.lon.toFixed(4) }}°</div>
            <div>海拔: {{ formatElevation(hoverInfo.elevation) }}</div>
          </div>
        </div>

        <div class="mt-auto pt-4 text-center text-[10px] text-gray-600 font-body">
          GeoTerrain 3D v1.0
        </div>
      </div>
    </div>

    <!-- 移动端底部抽屉按钮 -->
    <button
      v-if="isMobile"
      @click="drawerOpen = !drawerOpen"
      class="absolute bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-accent/80 text-white flex items-center justify-center shadow-lg btn-ripple hover:scale-110 transition-transform"
    >
      <Crosshair :size="20" />
    </button>

    <!-- 移动端底部抽屉面板 -->
    <div
      v-if="isMobile && drawerOpen"
      class="absolute bottom-0 left-0 right-0 z-40 glass-panel drawer-panel max-h-[60vh] overflow-y-auto rounded-t-2xl"
    >
      <div class="p-4 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-sm font-bold text-accent-glow tracking-wider">控制面板</h2>
          <button @click="drawerOpen = false" class="text-gray-400 hover:text-white">
            <X :size="18" />
          </button>
        </div>

        <!-- 搜索 -->
        <div class="relative">
          <div class="flex items-center gap-2 bg-deep-blue/60 rounded-lg px-3 py-2 border border-panel-border">
            <Search :size="14" class="text-accent shrink-0" />
            <input
              v-model="searchQuery"
              placeholder="搜索城市..."
              class="bg-transparent outline-none text-sm font-body w-full text-white placeholder:text-gray-500"
            />
          </div>
          <div
            v-if="showDropdown && searchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-1 rounded-lg bg-deep-blue/95 border border-panel-border z-50 search-dropdown shadow-xl"
          >
            <div
              v-for="(r, i) in searchResults"
              :key="i"
              @click="selectSearchResult(r)"
              class="px-3 py-2 cursor-pointer hover:bg-accent/10 transition-colors text-sm border-b border-panel-border/30 last:border-0"
            >
              <div class="text-white">{{ r.name }}</div>
            </div>
          </div>
        </div>

        <!-- 工具 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="toggleMeasure"
            class="btn-ripple flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-xs transition-all"
            :class="isMeasureMode ? 'bg-accent/20 border-accent text-accent-glow' : 'bg-deep-blue/40 border-panel-border text-gray-400'"
          >
            <Ruler :size="14" />
            {{ isMeasureMode ? '测量中' : '测量' }}
          </button>
          <button
            @click="handleReset"
            class="btn-ripple flex items-center justify-center gap-1 px-2 py-2 rounded-lg border bg-deep-blue/40 border-panel-border text-gray-400 text-xs"
          >
            <RotateCcw :size="14" />
            重置
          </button>
        </div>

        <!-- 性能 -->
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-deep-blue/40 rounded-lg p-2 border border-panel-border/50 text-center">
            <div class="text-[9px] text-gray-500 font-display">FPS</div>
            <div class="text-lg font-display font-bold" :class="fps >= 45 ? 'text-green-400' : 'text-yellow-400'">
              {{ fps }}
            </div>
          </div>
          <div class="bg-deep-blue/40 rounded-lg p-2 border border-panel-border/50 text-center">
            <div class="text-[9px] text-gray-500 font-display">VERTS</div>
            <div class="text-lg font-display font-bold text-accent-glow">
              {{ vertexCount > 1000 ? (vertexCount / 1000).toFixed(1) + 'K' : vertexCount }}
            </div>
          </div>
        </div>

        <!-- 加载 -->
        <div v-if="loading">
          <div class="animate-pulse-text text-xs text-accent-glow font-body mb-1">数据加载中...</div>
          <div class="w-full h-1 bg-deep-blue rounded-full overflow-hidden">
            <div class="h-full bg-accent progress-bar rounded-full" :style="{ width: loadProgress + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
