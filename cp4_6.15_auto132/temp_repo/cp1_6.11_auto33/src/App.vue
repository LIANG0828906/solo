<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import confetti from 'canvas-confetti'
import type { StyleEntry, ZoomData } from './dropper'
import { extractStyle, getZoomData } from './dropper'
import { generateCSSVariables, highlightCSS } from './generator'

interface Ripple {
  id: number
  x: number
  y: number
}

const MAX_ENTRIES = 20
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const CANVAS_TARGET_WIDTH = 800

const fileInputRef = ref<HTMLInputElement | null>(null)
const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const zoomCanvasRef = ref<HTMLCanvasElement | null>(null)
const previewWrapRef = ref<HTMLDivElement | null>(null)

const imageLoaded = ref(false)
const dropperEnabled = ref(false)
const styleEntries = reactive<StyleEntry[]>([])
const generatedCode = ref('')
const highlightedCode = ref('')
const generateSummary = ref({ colors: 0, fonts: 0, sizes: 0 })
const toastMessage = ref('')
const toastVisible = ref(false)

const hoverPos = reactive({ x: 0, y: 0, visible: false, clientX: 0, clientY: 0 })
const zoomData = ref<ZoomData | null>(null)
const ripples = reactive<Ripple[]>([])

const canvasDisplaySize = reactive({ width: 0, height: 0 })
const canvasNaturalSize = reactive({ width: 0, height: 0 })
const scaleFactor = ref(1)

let rippleSeq = 0
let rafId = 0

const hasEntries = computed(() => styleEntries.length > 0)
const entriesCountText = computed(() => `${styleEntries.length} / ${MAX_ENTRIES}`)

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  window.setTimeout(() => {
    toastVisible.value = false
  }, 1800)
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function validateFile(file: File): string | null {
  if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) {
    return '仅支持 PNG / JPG 格式图片'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return '图片大小不能超过 5MB'
  }
  return null
}

async function handleFile(file: File) {
  const err = validateFile(file)
  if (err) {
    showToast(err)
    return
  }
  const url = URL.createObjectURL(file)
  try {
    await loadImageToCanvas(url)
    showToast('图片加载成功')
  } catch {
    showToast('图片解析失败')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImageToCanvas(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const targetW = CANVAS_TARGET_WIDTH
      const ratio = img.height / img.width
      const targetH = Math.round(targetW * ratio)
      canvasDisplaySize.width = targetW
      canvasDisplaySize.height = targetH
      canvasNaturalSize.width = img.width
      canvasNaturalSize.height = img.height
      scaleFactor.value = targetW / img.width
      nextTick(() => {
        const canvas = mainCanvasRef.value
        if (!canvas) { reject(new Error('canvas missing')); return }
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('ctx missing')); return }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, targetW, targetH)
        imageLoaded.value = true
        resolve()
      })
    }
    img.onerror = () => reject(new Error('img load error'))
    img.src = src
  })
}

function onUploadClick() {
  fileInputRef.value?.click()
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) handleFile(f)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  const f = e.dataTransfer?.files?.[0]
  if (f) handleFile(f)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } | null {
  const canvas = mainCanvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = (clientX - rect.left) * (canvas.width / rect.width)
  const y = (clientY - rect.top) * (canvas.height / rect.height)
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null
  return { x, y }
}

function scheduleRenderZoom() {
  if (rafId) return
  rafId = window.requestAnimationFrame(() => {
    rafId = 0
    renderZoom()
  })
}

function renderZoom() {
  const zoomCanvas = zoomCanvasRef.value
  const src = zoomData.value
  if (!zoomCanvas || !src) return
  const srcPixels = src.pixels
  const zoom = 2
  const w = srcPixels.width
  const h = srcPixels.height
  if (zoomCanvas.width !== w * zoom || zoomCanvas.height !== h * zoom) {
    zoomCanvas.width = w * zoom
    zoomCanvas.height = h * zoom
  }
  const zctx = zoomCanvas.getContext('2d')
  if (!zctx) return
  zctx.imageSmoothingEnabled = false
  zctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height)
  const srcData = srcPixels.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4
      const r = srcData[si], g = srcData[si + 1], b = srcData[si + 2], a = srcData[si + 3]
      zctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
      zctx.fillRect(x * zoom, y * zoom, zoom, zoom)
    }
  }
  zctx.strokeStyle = 'rgba(255,255,255,0.15)'
  zctx.lineWidth = 1
  for (let x = 0; x <= w; x++) {
    zctx.beginPath()
    zctx.moveTo(x * zoom + 0.5, 0)
    zctx.lineTo(x * zoom + 0.5, h * zoom)
    zctx.stroke()
  }
  for (let y = 0; y <= h; y++) {
    zctx.beginPath()
    zctx.moveTo(0, y * zoom + 0.5)
    zctx.lineTo(w * zoom, y * zoom + 0.5)
    zctx.stroke()
  }
  const cx = Math.floor(w / 2) * zoom
  const cy = Math.floor(h / 2) * zoom
  zctx.strokeStyle = '#ffd700'
  zctx.lineWidth = 1
  zctx.strokeRect(cx, cy, zoom, zoom)
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!dropperEnabled.value || !imageLoaded.value) return
  const pos = getCanvasCoords(e.clientX, e.clientY)
  if (!pos) {
    hoverPos.visible = false
    return
  }
  hoverPos.x = pos.x
  hoverPos.y = pos.y
  hoverPos.clientX = e.clientX
  hoverPos.clientY = e.clientY
  hoverPos.visible = true
  const canvas = mainCanvasRef.value
  if (canvas) {
    zoomData.value = getZoomData(canvas, pos.x, pos.y)
    scheduleRenderZoom()
  }
}

function onCanvasMouseLeave() {
  hoverPos.visible = false
}

function spawnRipple(canvasX: number, canvasY: number) {
  const canvas = mainCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const screenX = (canvasX / canvas.width) * rect.width
  const screenY = (canvasY / canvas.height) * rect.height
  const id = ++rippleSeq
  ripples.push({ id, x: screenX, y: screenY })
  window.setTimeout(() => {
    const idx = ripples.findIndex(r => r.id === id)
    if (idx >= 0) ripples.splice(idx, 1)
  }, 300)
}

function onCanvasClick(e: MouseEvent) {
  if (!dropperEnabled.value || !imageLoaded.value) return
  const pos = getCanvasCoords(e.clientX, e.clientY)
  if (!pos) return
  const canvas = mainCanvasRef.value
  if (!canvas) return
  if (styleEntries.length >= MAX_ENTRIES) {
    showToast(`最多只能保留 ${MAX_ENTRIES} 条记录`)
    return
  }
  const entry = extractStyle(canvas, pos.x, pos.y)
  styleEntries.push(entry)
  spawnRipple(pos.x, pos.y)
}

function removeEntry(id: string) {
  const idx = styleEntries.findIndex(e => e.id === id)
  if (idx >= 0) styleEntries.splice(idx, 1)
}

async function reextractEntry(id: string) {
  const entry = styleEntries.find(e => e.id === id)
  const canvas = mainCanvasRef.value
  if (!entry || !canvas) return
  const fresh = extractStyle(canvas, entry.pixelX, entry.pixelY)
  entry.hex = fresh.hex
  entry.rgb = fresh.rgb
  entry.fontName = fresh.fontName
  entry.fontSize = fresh.fontSize
  entry.timestamp = Date.now()
  spawnRipple(entry.pixelX, entry.pixelY)
  showToast('已重新提取')
}

async function copyHexColor(hex: string) {
  const ok = await copyToClipboard(hex)
  showToast(ok ? `已复制 ${hex}` : '复制失败')
}

function handleGenerate() {
  if (styleEntries.length === 0) {
    showToast('请先提取至少一条样式')
    return
  }
  const result = generateCSSVariables(styleEntries)
  generatedCode.value = result.code
  highlightedCode.value = highlightCSS(result.code)
  generateSummary.value = { colors: result.colorCount, fonts: result.fontCount, sizes: result.sizeCount }
  showToast('CSS 变量已生成')
}

async function handleCopyCode() {
  if (!generatedCode.value) {
    showToast('请先生成 CSS 变量')
    return
  }
  const ok = await copyToClipboard(generatedCode.value)
  if (ok) {
    showToast('代码已复制到剪贴板')
    fireConfetti()
  } else {
    showToast('复制失败')
  }
}

function fireConfetti() {
  const duration = 1500
  const end = Date.now() + duration
  const colors = ['#0f3460', '#533483', '#e94560', '#ffd700', '#00d9ff', '#98c379']
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.8 },
      colors,
      scalar: 0.8
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.8 },
      colors,
      scalar: 0.8
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

function toggleDropper() {
  if (!imageLoaded.value) {
    showToast('请先上传设计稿')
    return
  }
  dropperEnabled.value = !dropperEnabled.value
}

function resetAll() {
  styleEntries.length = 0
  generatedCode.value = ''
  highlightedCode.value = ''
  dropperEnabled.value = false
  imageLoaded.value = false
  canvasDisplaySize.width = 0
  canvasDisplaySize.height = 0
  zoomData.value = null
  hoverPos.visible = false
}

watch(() => styleEntries.length, () => {
  if (generatedCode.value) handleGenerate()
})

onMounted(() => {})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand">
        <div class="brand-logo">SD</div>
        <div class="brand-text">
          <h1>样式滴管 & CSS变量生成器</h1>
          <p>从设计稿截图中提取颜色、字体、字号，一键生成标准 CSS 变量</p>
        </div>
      </div>
      <button v-if="imageLoaded" class="btn btn-ghost" @click="resetAll">
        重新开始
      </button>
    </header>

    <main class="app-main">
      <section class="preview-section">
        <div
          v-if="!imageLoaded"
          class="upload-zone"
          @click="onUploadClick"
          @drop="onDrop"
          @dragover="onDragOver"
        >
          <div class="upload-inner">
            <div class="upload-icon">
              <svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="8" width="40" height="32" rx="4" />
                <circle cx="16" cy="18" r="3" />
                <path d="M4 34l12-12 10 10 8-8 10 10" />
              </svg>
            </div>
            <h2>上传设计稿截图</h2>
            <p>拖拽图片到此处，或点击选择文件</p>
            <p class="upload-hint">支持 PNG / JPG 格式 · 单张不超过 5MB</p>
            <button class="btn btn-primary" @click.stop="onUploadClick">
              选择图片
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style="display:none"
            @change="onFileInputChange"
          />
        </div>

        <div v-else class="canvas-wrapper" ref="previewWrapRef">
          <div
            class="canvas-container"
            :class="{ 'dropper-active': dropperEnabled }"
          >
            <canvas
              ref="mainCanvasRef"
              :width="canvasDisplaySize.width"
              :height="canvasDisplaySize.height"
              class="main-canvas"
              :style="{ cursor: dropperEnabled ? 'crosshair' : 'default' }"
              @mousemove="onCanvasMouseMove"
              @mouseleave="onCanvasMouseLeave"
              @click="onCanvasClick"
            />
            <div
              v-for="r in ripples"
              :key="r.id"
              class="ripple"
              :style="{ left: r.x + 'px', top: r.y + 'px' }"
            />

            <div
              v-if="hoverPos.visible && dropperEnabled && zoomData"
              class="magnifier"
              :style="getMagnifierStyle()"
            >
              <div class="magnifier-body">
                <canvas ref="zoomCanvasRef" class="zoom-canvas"></canvas>
              </div>
              <div class="magnifier-info">
                <div
                  class="magnifier-swatch"
                  :style="{
                    background: `rgb(${zoomData.centerColor.r},${zoomData.centerColor.g},${zoomData.centerColor.b})`
                  }"
                />
                <div class="magnifier-text">
                  <div class="magnifier-hex">
                    {{ rgbToHex(zoomData.centerColor.r, zoomData.centerColor.g, zoomData.centerColor.b) }}
                  </div>
                  <div class="magnifier-rgb">
                    RGB({{ zoomData.centerColor.r }}, {{ zoomData.centerColor.g }}, {{ zoomData.centerColor.b }})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="canvas-toolbar">
            <button
              class="btn"
              :class="dropperEnabled ? 'btn-primary' : 'btn-secondary'"
              @click="toggleDropper"
            >
              <span class="btn-dot" :style="{ background: dropperEnabled ? '#ffd700' : 'transparent' }" />
              滴管模式 {{ dropperEnabled ? '开启' : '关闭' }}
            </button>
            <div class="toolbar-hint">
              <template v-if="dropperEnabled">
                💡 移动鼠标查看像素，点击图片提取该位置的颜色与字体信息
              </template>
              <template v-else>
                点击上方按钮开启滴管模式
              </template>
            </div>
          </div>
        </div>
      </section>

      <aside class="sidebar">
        <div class="sidebar-card entries-card">
          <div class="card-header">
            <h3>提取的样式</h3>
            <span class="count-badge">{{ entriesCountText }}</span>
          </div>
          <div v-if="!hasEntries" class="empty-state">
            <div class="empty-icon">🎨</div>
            <p>还没有样式记录</p>
            <p class="empty-sub">开启滴管模式并点击图片任意位置开始提取</p>
          </div>
          <div v-else class="entries-list">
            <div
              v-for="entry in styleEntries"
              :key="entry.id"
              class="entry-item"
            >
              <button
                class="color-swatch"
                :style="{ background: entry.hex }"
                :title="`点击复制 ${entry.hex}`"
                @click="copyHexColor(entry.hex)"
              />
              <div class="entry-info">
                <div class="entry-hex">{{ entry.hex }}</div>
                <div class="entry-meta">
                  <span class="entry-font">{{ entry.fontName }}</span>
                  <span class="entry-divider">·</span>
                  <span class="entry-size">{{ entry.fontSize }}px</span>
                </div>
              </div>
              <div class="entry-actions">
                <button class="icon-btn" title="重新提取" @click="reextractEntry(entry.id)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
                <button class="icon-btn icon-btn-danger" title="删除" @click="removeEntry(entry.id)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-card code-card">
          <div class="card-header">
            <h3>CSS 变量</h3>
            <div v-if="generatedCode" class="summary-tags">
              <span class="tag">🎨 {{ generateSummary.colors }}</span>
              <span class="tag">🔤 {{ generateSummary.fonts }}</span>
              <span class="tag">📏 {{ generateSummary.sizes }}</span>
            </div>
          </div>

          <button
            class="btn btn-primary btn-full"
            :disabled="!hasEntries"
            @click="handleGenerate"
          >
            生成 CSS 变量
          </button>

          <div v-if="highlightedCode" class="code-editor">
            <div class="code-header">
              <span class="code-lang">:root.css</span>
            </div>
            <div class="code-body" v-html="highlightedCode"></div>
          </div>
          <div v-else class="code-placeholder">
            <span>点击上方按钮生成代码</span>
          </div>

          <button
            v-if="generatedCode"
            class="btn btn-secondary btn-full"
            @click="handleCopyCode"
          >
            📋 复制代码
          </button>
        </div>
      </aside>
    </main>

    <transition name="toast">
      <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    rgbToHex(r: number, g: number, b: number): string {
      const toHex = (n: number) => {
        const s = Math.max(0, Math.min(255, Math.round(n))).toString(16)
        return s.length === 1 ? '0' + s : s
      }
      return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase()
    },
    getMagnifierStyle() {
      const margin = 18
      const boxW = 160
      const boxH = 200
      let left = margin
      let top = margin
      const w = window.innerWidth
      const h = window.innerHeight
      const cx = (this as any).hoverPos.clientX
      const cy = (this as any).hoverPos.clientY
      if (cx + boxW + margin * 2 < w) {
        left = cx + margin
      } else {
        left = Math.max(margin, cx - boxW - margin)
      }
      if (cy + boxH + margin < h) {
        top = cy + margin
      } else {
        top = Math.max(margin, cy - boxH - margin)
      }
      return {
        position: 'fixed' as const,
        left: left + 'px',
        top: top + 'px',
        zIndex: 999
      }
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, 'Microsoft YaHei', monospace;
  background: #1a1a2e;
  color: #e0e0e0;
}
button {
  font-family: inherit;
}

.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(83, 52, 131, 0.15), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, rgba(15, 52, 96, 0.18), transparent 55%),
    #1a1a2e;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(26, 26, 46, 0.8);
}
.brand { display: flex; align-items: center; gap: 14px; }
.brand-logo {
  width: 44px; height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f3460, #533483);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; letter-spacing: 1px;
  box-shadow: 0 6px 18px rgba(83, 52, 131, 0.35);
}
.brand-text h1 {
  margin: 0; font-size: 17px; font-weight: 600; letter-spacing: 0.5px;
  background: linear-gradient(90deg, #e0e0e0, #b8a4ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.brand-text p {
  margin: 3px 0 0; font-size: 12px; color: #8a8fa8; letter-spacing: 0.3px;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  padding: 24px 32px 32px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  outline: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  color: #e0e0e0;
}
.btn:hover { filter: brightness(1.2); }
.btn:active { transform: scale(0.95); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; transform: none; }
.btn-primary {
  background: linear-gradient(135deg, #0f3460, #533483);
  box-shadow: 0 4px 14px rgba(83, 52, 131, 0.4);
}
.btn-secondary {
  background: rgba(22, 33, 62, 0.95);
  border: 1px solid rgba(255,255,255,0.08);
}
.btn-ghost {
  background: transparent;
  color: #b8a4ff;
  padding: 8px 14px;
  border: 1px solid rgba(184, 164, 255, 0.25);
}
.btn-ghost:hover { background: rgba(184, 164, 255, 0.08); }
.btn-full { width: 100%; padding: 12px 18px; font-size: 13.5px; }
.btn-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  transition: all 0.2s;
}

.upload-zone {
  flex: 1;
  min-height: 520px;
  border-radius: 16px;
  border: 2px dashed rgba(184, 164, 255, 0.25);
  background: rgba(22, 33, 62, 0.5);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
}
.upload-zone:hover {
  border-color: rgba(184, 164, 255, 0.6);
  background: rgba(22, 33, 62, 0.75);
  box-shadow: inset 0 0 40px rgba(83, 52, 131, 0.15);
}
.upload-inner {
  text-align: center;
  padding: 48px 32px;
  max-width: 480px;
}
.upload-icon {
  color: #b8a4ff;
  margin-bottom: 20px;
  display: inline-block;
  animation: floaty 3s ease-in-out infinite;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.upload-inner h2 {
  margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #e0e0e0;
}
.upload-inner p { margin: 4px 0; color: #8a8fa8; font-size: 13px; }
.upload-hint { margin-top: 8px !important; color: #6c7293 !important; font-size: 12px !important; }
.upload-inner .btn-primary { margin-top: 24px; padding: 12px 28px; font-size: 14px; }

.canvas-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.canvas-container {
  position: relative;
  margin: 0 auto;
  padding: 20px;
  background: #16213e;
  border-radius: 16px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255,255,255,0.04);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  max-width: 100%;
  overflow: hidden;
}
.main-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  image-rendering: -webkit-optimize-contrast;
}
.dropper-active .main-canvas {
  box-shadow:
    0 0 0 2px rgba(255, 215, 0, 0.35),
    0 4px 20px rgba(0,0,0,0.4);
}
.ripple {
  position: absolute;
  width: 30px; height: 30px;
  border: 3px solid #ffd700;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 1;
  pointer-events: none;
  animation: ripple-pop 0.3s ease-out forwards;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}
@keyframes ripple-pop {
  0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
}

.magnifier {
  width: 160px;
  background: #0e1528;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  pointer-events: none;
}
.magnifier-body {
  padding: 8px;
  background: #05081a;
  display: flex;
  justify-content: center;
}
.zoom-canvas {
  display: block;
  width: 144px;
  height: 144px;
  image-rendering: pixelated;
  border-radius: 4px;
}
.magnifier-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.magnifier-swatch {
  width: 22px; height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
}
.magnifier-hex {
  font-size: 12px;
  font-weight: 600;
  color: #ffd700;
  letter-spacing: 0.5px;
}
.magnifier-rgb {
  font-size: 10.5px;
  color: #8a8fa8;
  margin-top: 2px;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(22, 33, 62, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
  flex-wrap: wrap;
}
.toolbar-hint {
  font-size: 12px;
  color: #8a8fa8;
  flex: 1;
  min-width: 240px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 350px;
  position: sticky;
  top: 84px;
  align-self: flex-start;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  padding-right: 4px;
}
.sidebar::-webkit-scrollbar { width: 6px; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

.sidebar-card {
  background: #16213e;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: #e0e0e0;
}
.count-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(184, 164, 255, 0.12);
  color: #b8a4ff;
  border: 1px solid rgba(184, 164, 255, 0.2);
}
.summary-tags { display: flex; gap: 6px; }
.tag {
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  color: #8a8fa8;
}

.empty-state {
  padding: 30px 8px;
  text-align: center;
}
.empty-icon { font-size: 36px; margin-bottom: 8px; opacity: 0.7; }
.empty-state p { margin: 4px 0; font-size: 13px; color: #8a8fa8; }
.empty-sub { font-size: 11.5px !important; color: #6c7293 !important; margin-top: 8px !important; }

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 38vh;
  overflow-y: auto;
  padding-right: 4px;
}
.entries-list::-webkit-scrollbar { width: 5px; }
.entries-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

.entry-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.025);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.2s;
  animation: slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.entry-item:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(184, 164, 255, 0.18);
}
.color-swatch {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1);
}
.color-swatch:hover { transform: scale(1.12); }
.color-swatch:active { transform: scale(0.95); }

.entry-info { flex: 1; min-width: 0; }
.entry-hex {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 0.5px;
}
.entry-meta {
  margin-top: 3px;
  font-size: 11px;
  color: #8a8fa8;
  display: flex;
  align-items: center;
  gap: 6px;
}
.entry-divider { opacity: 0.5; }

.entry-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.icon-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.03);
  color: #8a8fa8;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.icon-btn:hover {
  color: #b8a4ff;
  border-color: rgba(184, 164, 255, 0.3);
  background: rgba(184, 164, 255, 0.08);
}
.icon-btn-danger:hover {
  color: #e94560 !important;
  border-color: rgba(233, 69, 96, 0.35) !important;
  background: rgba(233, 69, 96, 0.08) !important;
}

.code-card { display: flex; flex-direction: column; gap: 12px; }

.code-editor {
  background: #0b1020;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}
.code-header {
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  gap: 8px;
}
.code-lang {
  font-size: 11px;
  color: #b8a4ff;
  letter-spacing: 0.5px;
}
.code-body {
  padding: 12px 10px 12px 6px;
  font-size: 12px;
  line-height: 1.75;
  max-height: 280px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
.code-body::-webkit-scrollbar { width: 6px; }
.code-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

.code-placeholder {
  padding: 28px 16px;
  text-align: center;
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 10px;
  font-size: 12px;
  color: #6c7293;
  background: rgba(255,255,255,0.01);
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(22, 33, 62, 0.98);
  color: #e0e0e0;
  border-radius: 999px;
  font-size: 12.5px;
  z-index: 9999;
  border: 1px solid rgba(184, 164, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  backdrop-filter: blur(10px);
  letter-spacing: 0.3px;
}
.toast-enter-active, .toast-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}

@media (max-width: 768px) {
  .app-header { padding: 14px 16px; }
  .brand-text p { display: none; }
  .app-main {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
  .sidebar {
    width: 100%;
    position: static;
    max-height: none;
    padding-right: 0;
  }
  .upload-zone { min-height: 360px; }
  .canvas-toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-hint { min-width: 0; order: -1; }
  .entries-list { max-height: none; }
}
</style>
