<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { EditorCanvas } from '@/editor/EditorCanvas'
import { EditorToolbar } from '@/editor/EditorToolbar'
import { ClipPreviewer } from '@/viewer/ClipPreviewer'
import { CodeExporter } from '@/viewer/CodeExporter'
import { useEditorStore } from '@/store/useEditorStore'

const store = useEditorStore()
const toolbar = new EditorToolbar()
const previewer = new ClipPreviewer()
const codeExporter = new CodeExporter()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainerRef = ref<HTMLDivElement | null>(null)
let editorCanvas: EditorCanvas | null = null

const BASE_WIDTH = 800
const BASE_HEIGHT = 600
const MIN_WIDTH = 400

const canvasDisplayWidth = ref(BASE_WIDTH)
const canvasDisplayHeight = ref(BASE_HEIGHT)

const copyButtonText = ref('复制代码')

const previewStyle = computed(() => previewer.getPreviewStyle().value)
const cssCode = computed(() => codeExporter.cssCode.value)
const isCopied = computed(() => codeExporter.isCopied.value)
const showToast = computed(() => codeExporter.toastVisible.value)
const showConfirm = computed(() => toolbar.confirmVisible.value)
const showGrid = computed(() => store.showGrid)
const autoScale = computed(() => store.autoScale)
const anchorCount = computed(() => store.anchors.length)
const hasValidShape = computed(() => store.anchors.length >= 3)

const highlightedCode = computed(() => {
  return codeExporter.highlightCode(cssCode.value)
})

watch(isCopied, (val) => {
  copyButtonText.value = val ? '已复制 ✓' : '复制代码'
})

function handleCopy() {
  codeExporter.copyCode()
}

function handleClearClick() {
  toolbar.requestClearAll()
}

function handleConfirmClear() {
  toolbar.confirmClearAll()
}

function handleCancelClear() {
  toolbar.cancelClearAll()
}

function toggleGrid() {
  toolbar.toggleGrid()
  if (editorCanvas) {
    editorCanvas.refresh()
  }
}

function toggleAutoScale() {
  toolbar.toggleAutoScale()
  if (store.autoScale) {
    updateCanvasScale()
  } else {
    canvasDisplayWidth.value = BASE_WIDTH
    canvasDisplayHeight.value = BASE_HEIGHT
    if (editorCanvas) {
      editorCanvas.resize(BASE_WIDTH, BASE_HEIGHT)
    }
  }
}

function updateCanvasScale() {
  if (!canvasContainerRef.value || !store.autoScale) return

  const containerWidth = canvasContainerRef.value.clientWidth - 48
  const containerHeight = canvasContainerRef.value.clientHeight - 120

  const scaleX = containerWidth / BASE_WIDTH
  const scaleY = containerHeight / BASE_HEIGHT
  const scale = Math.min(scaleX, scaleY, 1)

  const newWidth = Math.max(MIN_WIDTH, BASE_WIDTH * scale)
  const newHeight = Math.max(MIN_WIDTH * 0.75, BASE_HEIGHT * scale)

  canvasDisplayWidth.value = newWidth
  canvasDisplayHeight.value = newHeight

  if (editorCanvas) {
    editorCanvas.resize(newWidth, newHeight)
  }
}

function handleResize() {
  if (store.autoScale) {
    updateCanvasScale()
  }
}

onMounted(() => {
  if (canvasRef.value) {
    editorCanvas = new EditorCanvas({
      canvas: canvasRef.value,
      getAnchors: () => store.anchors,
      getSelectedId: () => store.selectedAnchorId,
      getShowGrid: () => store.showGrid,
      getCanvasWidth: () => canvasDisplayWidth.value,
      getCanvasHeight: () => canvasDisplayHeight.value,
      onAddAnchor: (x, y) => store.addAnchor(x, y),
      onUpdateAnchor: (id, x, y) => store.updateAnchor(id, x, y),
      onSelectAnchor: (id) => store.selectAnchor(id),
      onEditAnchor: (id, x, y) => {
        store.updateAnchor(id, x, y)
        store.removeAnchor(id)
      },
    })

    nextTick(() => {
      updateCanvasScale()
    })
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (editorCanvas) {
    editorCanvas.destroy()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="logo">
        <span class="logo-text">ClipCraft</span>
      </div>
      <div class="header-controls">
        <label class="toggle-switch" :title="showGrid ? '隐藏网格' : '显示网格'">
          <span class="toggle-label">网格</span>
          <div class="switch-track" :class="{ active: showGrid }" @click="toggleGrid">
            <div class="switch-thumb" />
          </div>
        </label>
        <label class="toggle-switch" :title="autoScale ? '关闭自适应' : '开启自适应'">
          <span class="toggle-label">自适应</span>
          <div class="switch-track" :class="{ active: autoScale }" @click="toggleAutoScale">
            <div class="switch-thumb" />
          </div>
        </label>
      </div>
    </header>

    <main class="app-main">
      <section class="editor-panel">
        <div ref="canvasContainerRef" class="canvas-container">
          <canvas ref="canvasRef" />
          <div class="canvas-info">
            <span>锚点: {{ anchorCount }}</span>
            <span>{{ canvasDisplayWidth }}×{{ canvasDisplayHeight }}</span>
          </div>
          <button class="clear-btn" @click="handleClearClick" :disabled="anchorCount === 0">
            清除所有锚点
          </button>
        </div>
      </section>

      <section class="preview-panel">
        <div class="preview-card">
          <h3 class="section-title">实时预览</h3>
          <div class="preview-image-wrapper">
            <img
              v-if="hasValidShape"
              src="https://picsum.photos/400/300?random=clipcraft"
              alt="Preview"
              class="preview-image"
              :style="previewStyle"
            />
            <div v-else class="preview-placeholder">
              <span>在画布上添加至少3个锚点</span>
            </div>
          </div>
        </div>

        <div class="code-card">
          <div class="code-header">
            <h3 class="section-title">CSS 代码</h3>
            <button
              class="copy-btn"
              :class="{ copied: isCopied }"
              @click="handleCopy"
              :disabled="!hasValidShape"
            >
              {{ copyButtonText }}
            </button>
          </div>
          <div class="code-block">
            <pre><code v-html="highlightedCode"></code></pre>
          </div>
        </div>
      </section>
    </main>

    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <span>✓ CSS代码已复制到剪贴板</span>
      </div>
    </Transition>

    <Transition name="confirm">
      <div v-if="showConfirm" class="confirm-overlay" @click.self="handleCancelClear">
        <div class="confirm-dialog">
          <p class="confirm-text">确认清除所有锚点？</p>
          <p class="confirm-sub">此操作不可撤销</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click="handleCancelClear">取消</button>
            <button class="confirm-ok" @click="handleConfirmClear">确认清除</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e2e;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #2a2a3e;
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-style: italic;
  font-weight: 400;
  font-size: 24px;
  color: #6366f1;
  letter-spacing: -0.5px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-label {
  font-size: 13px;
  color: #999;
}

.switch-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #444;
  position: relative;
  transition: background 0.3s ease;
}

.switch-track.active {
  background: #6366f1;
}

.switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.switch-track.active .switch-thumb {
  transform: translateX(16px);
}

.app-main {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
  min-height: 0;
}

.editor-panel {
  flex: 1;
  display: flex;
  padding: 16px;
  min-width: 0;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.canvas-container canvas {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  cursor: crosshair;
}

.canvas-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

.clear-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.clear-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.preview-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 16px 0;
  overflow-y: auto;
}

.preview-card,
.code-card {
  background: #2a2a3e;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 12px;
}

.preview-image-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e2e;
  position: relative;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  animation: fadeIn 0.5s ease;
}

.preview-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 13px;
  border: 2px dashed #444;
  border-radius: 12px;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.code-header .section-title {
  margin-bottom: 0;
}

.copy-btn {
  padding: 6px 14px;
  background: #6366f1;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover:not(:disabled) {
  background: #818cf8;
}

.copy-btn.copied {
  background: #22c55e;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.code-block {
  background: #282c34;
  border-radius: 8px;
  padding: 14px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #22c55e;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.toast-enter-active {
  animation: slideUp 0.3s ease forwards;
}

.toast-leave-active {
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.confirm-dialog {
  background: #2a2a3e;
  border-radius: 12px;
  padding: 28px 32px;
  text-align: center;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.confirm-text {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.confirm-sub {
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-cancel,
.confirm-ok {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.confirm-cancel {
  background: #444;
  color: #e0e0e0;
}

.confirm-cancel:hover {
  background: #555;
}

.confirm-ok {
  background: #ef4444;
  color: white;
}

.confirm-ok:hover {
  background: #dc2626;
}

.confirm-enter-active {
  animation: fadeIn 0.3s ease;
}

.confirm-enter-active .confirm-dialog {
  animation: fadeInScale 0.3s ease forwards;
}

.confirm-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-leave-active .confirm-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
  transform: scale(0.9);
  opacity: 0;
}

.confirm-leave-to {
  opacity: 0;
}
</style>
