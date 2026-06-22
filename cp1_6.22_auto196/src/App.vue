<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/store/useThemeStore'
import { paletteToCSSVariables, paletteToTailwindConfig } from '@/palette/paletteController'
import ComponentRenderer from '@/renderer/componentRenderer.vue'

const store = useThemeStore()
const { inputColors, paletteArray, palette, toastMessage, showToast } = storeToRefs(store)

const showTailwindModal = ref(false)
const hoveredColorKey = ref<string | null>(null)
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const tailwindCode = computed(() => {
  return paletteToTailwindConfig(store.getTailwindShades())
})

const cssVariablesCode = computed(() => {
  if (!palette.value) return ''
  return paletteToCSSVariables(palette.value)
})

function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
}

function handleColorInput(id: string, value: string) {
  let hex = value.trim()
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  if (isValidHex(hex)) {
    store.updateColor(id, hex.toUpperCase())
  }
}

function handleColorPicker(id: string, event: Event) {
  const target = event.target as HTMLInputElement
  store.updateColor(id, target.value.toUpperCase())
}

function copyToClipboard(text: string, message: string) {
  const startTime = performance.now()
  navigator.clipboard.writeText(text).then(() => {
    const elapsed = performance.now() - startTime
    if (elapsed < 200) {
      store.triggerToast(message)
    } else {
      store.triggerToast(message)
    }
  })
}

function copySingleColor(hex: string) {
  copyToClipboard(hex.toUpperCase(), `已复制 ${hex.toUpperCase()}`)
}

function copyAllCSSVariables() {
  copyToClipboard(cssVariablesCode.value, 'CSS变量已复制到剪贴板')
}

function copyTailwindCode() {
  copyToClipboard(tailwindCode.value, 'Tailwind配置已复制到剪贴板')
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  dragOverIndex.value = index
}

function onDrop(index: number) {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    store.reorderColors(dragIndex.value, index)
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="app-container">
    <Teleport to="body">
      <div class="toast-container" v-if="showToast">
        <div class="toast">{{ toastMessage }}</div>
      </div>
    </Teleport>

    <aside class="left-panel">
      <div class="panel-header">
        <h1 class="app-title">品牌调色板</h1>
        <p class="app-subtitle">输入品牌色，自动生成协调配色方案</p>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">品牌颜色</span>
          <button
            v-if="inputColors.length < 5"
            class="add-color-btn"
            @click="store.addColor()"
          >
            + 添加颜色
          </button>
        </div>

        <div class="color-input-list">
          <div
            v-for="(color, index) in inputColors"
            :key="color.id"
            class="color-input-row"
            :class="{
              'dragging': dragIndex === index,
              'drag-over': dragOverIndex === index && dragIndex !== index,
            }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover="onDragOver($event, index)"
            @drop="onDrop(index)"
            @dragend="onDragEnd"
          >
            <span class="drag-handle">⋮⋮</span>
            <div class="color-preview-wrapper">
              <div
                class="color-preview"
                :style="{ backgroundColor: color.hex }"
              ></div>
              <input
                type="color"
                class="color-picker"
                :value="color.hex"
                @input="handleColorPicker(color.id, $event)"
              />
            </div>
            <div class="color-name">{{ color.name }}</div>
            <input
              type="text"
              class="hex-input"
              :value="color.hex"
              @input="handleColorInput(color.id, ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="inputColors.length > 1"
              class="remove-btn"
              @click="store.removeColor(color.id)"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">生成的配色方案</span>
        </div>

        <div class="palette-grid">
          <div
            v-for="item in paletteArray"
            :key="item.key"
            class="palette-item"
            @mouseenter="hoveredColorKey = item.key"
            @mouseleave="hoveredColorKey = null"
          >
            <div
              class="palette-swatch"
              :style="{ backgroundColor: item.hex }"
            >
              <button
                class="copy-btn"
                @click="copySingleColor(item.hex)"
                title="复制色值"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <div v-if="hoveredColorKey === item.key" class="color-tooltip">
                {{ item.hex.toUpperCase() }}
              </div>
            </div>
            <div class="palette-label">
              <span class="palette-name">{{ item.name }}</span>
              <span class="palette-hex">{{ item.hex.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section actions">
        <button class="action-btn primary" @click="copyAllCSSVariables">
          复制所有 CSS 变量
        </button>
        <button class="action-btn secondary" @click="showTailwindModal = true">
          导出 Tailwind 色标
        </button>
      </div>
    </aside>

    <main class="right-panel">
      <div class="preview-header">
        <h2 class="preview-title">组件实时预览</h2>
        <span class="preview-hint">配色方案变更时，组件颜色将实时更新</span>
      </div>
      <div class="preview-content">
        <ComponentRenderer />
      </div>
    </main>

    <Teleport to="body">
      <div v-if="showTailwindModal" class="modal-overlay" @click.self="showTailwindModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Tailwind 色标配置</h3>
            <button class="modal-close" @click="showTailwindModal = false">×</button>
          </div>
          <div class="modal-body">
            <pre class="code-block"><code>{{ tailwindCode }}</code></pre>
          </div>
          <div class="modal-footer">
            <button class="action-btn secondary" @click="showTailwindModal = false">关闭</button>
            <button class="action-btn primary" @click="copyTailwindCode">复制代码</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: var(--bg-primary);
}

.left-panel {
  width: 380px;
  flex-shrink: 0;
  background-color: var(--bg-panel);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.app-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-color-btn {
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.add-color-btn:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.color-input-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.color-input-row.dragging {
  opacity: 0.5;
}

.color-input-row.drag-over {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.08);
}

.drag-handle {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: grab;
  user-select: none;
  letter-spacing: -2px;
  padding: 0 2px;
}

.color-preview-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.color-picker {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}

.color-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 54px;
}

.hex-input {
  flex: 1;
  padding: 6px 10px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  font-family: 'SF Mono', Monaco, monospace;
  transition: all 0.3s ease;
}

.hex-input:focus {
  border-color: #3b82f6;
}

.remove-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 18px;
  line-height: 1;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.palette-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-swatch {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.3s ease;
  overflow: hidden;
}

.palette-swatch:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border-radius: 5px;
  opacity: 0;
  transition: all 0.3s ease;
}

.palette-swatch:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.color-tooltip {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  background-color: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, monospace;
  font-weight: 500;
  white-space: nowrap;
}

.palette-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px;
}

.palette-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
}

.palette-hex {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: 'SF Mono', Monaco, monospace;
}

.actions {
  flex-direction: row;
  gap: 10px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.action-btn.primary:hover {
  background-color: #2563eb;
}

.action-btn.secondary {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
  background-color: rgba(255, 255, 255, 0.14);
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  padding: 28px 36px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-hint {
  font-size: 13px;
  color: var(--text-secondary);
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 36px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  width: 680px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 22px;
  line-height: 1;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.code-block {
  background-color: #1a1b2e;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #e2e8f0;
  white-space: pre;
  overflow-x: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.modal-footer .action-btn {
  flex: none;
  padding: 10px 20px;
}
</style>
