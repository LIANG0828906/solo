<template>
  <div class="control-panel">
    <div class="panel-title">Flow Control</div>

    <div class="control-group">
      <div class="control-header">
        <span class="control-label">节点数量</span>
        <span class="control-value">{{ nodeCount }}</span>
      </div>
      <div class="slider-track">
        <div class="slider-fill" :style="{ width: ((nodeCount - 10) / 20 * 100) + '%' }"></div>
        <input
          type="range"
          :min="10"
          :max="30"
          :value="nodeCount"
          @input="onNodeCountChange"
          class="slider-input"
        />
      </div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <span class="control-label">流动速度</span>
        <span class="control-value">{{ flowSpeed }}</span>
      </div>
      <div class="slider-track">
        <div class="slider-fill" :style="{ width: ((flowSpeed - 1) / 9 * 100) + '%' }"></div>
        <input
          type="range"
          :min="1"
          :max="10"
          :value="flowSpeed"
          @input="onFlowSpeedChange"
          class="slider-input"
        />
      </div>
    </div>

    <div class="control-group">
      <div class="control-header">
        <span class="control-label">颜色主题</span>
      </div>
      <select :value="colorTheme" @change="onThemeChange" class="theme-select">
        <option value="cyberpunk">赛博朋克青紫</option>
        <option value="warm">暖橙火焰</option>
        <option value="fresh">清新蓝绿</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  nodeCount: number
  flowSpeed: number
  colorTheme: string
}>()

const emit = defineEmits<{
  'update:nodeCount': [value: number]
  'update:flowSpeed': [value: number]
  'update:colorTheme': [value: string]
}>()

function onNodeCountChange(e: Event) {
  emit('update:nodeCount', Number((e.target as HTMLInputElement).value))
}

function onFlowSpeedChange(e: Event) {
  emit('update:flowSpeed', Number((e.target as HTMLInputElement).value))
}

function onThemeChange(e: Event) {
  emit('update:colorTheme', (e.target as HTMLSelectElement).value)
}
</script>

<style scoped>
.control-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  padding: 20px;
  background: rgba(26, 26, 46, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 200;
  color: rgba(255, 255, 255, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
}

.control-group {
  margin-bottom: 16px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.control-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.3px;
}

.control-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Courier New', monospace;
  min-width: 24px;
  text-align: right;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.5), rgba(157, 0, 255, 0.5));
  border-radius: 3px;
  transition: width 0.15s ease;
  pointer-events: none;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

.theme-select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.2s, background-color 0.2s;
}

.theme-select:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.09);
}

.theme-select:focus {
  border-color: rgba(0, 255, 255, 0.4);
}

.theme-select option {
  background: #1a1a2e;
  color: rgba(255, 255, 255, 0.85);
}
</style>
