<template>
  <div class="app-root">
    <nav class="navbar">
      <div class="nav-inner">
        <div class="app-title">调色板工坊</div>
        <button class="reset-btn" @click="handleReset">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 14C3.134 14 0 10.866 0 7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7zm0-1.167A5.833 5.833 0 1 0 7 1.167 5.833 5.833 0 0 0 7 12.833zM6.417 3.5h1.166v3.893l3.396 1.968-.583 1.007-3.979-2.308V3.5z"/>
          </svg>
          重置
        </button>
      </div>
    </nav>

    <main class="main-content">
      <div class="board-wrapper">
        <div class="board-header">
          <div class="board-title">
            <span class="title-dot"></span>
            团队调色板
          </div>
          <button class="share-btn" :class="{ copied: isCopied }" @click="handleShare">
            <svg v-if="!isCopied" width="14" height="14" viewBox="0 0 14 14" fill="white">
              <path d="M7 0C3.134 0 0 3.134 0 7c0 3.084 1.973 5.695 4.667 6.685V9.334H3.5V7h1.167V5.444c0-1.154.913-2.111 2.056-2.111h1.278V4.667H6.722c-.193 0-.389.128-.389.333V7h1.944l-.306 2.333H6.333v4.352A7.002 7.002 0 0 0 14 7c0-3.866-3.134-7-7-7z"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="white">
              <path d="M5.6 8.8L2.8 6l-.8.8L5.6 10.4 12 4l-.8-.8z"/>
            </svg>
            {{ isCopied ? '已复制!' : '分享链接' }}
          </button>
        </div>

        <PaletteBoard
          :swatches="swatches"
          :is-restoring="isRestoring"
          @update-color="updateColor"
          @update-comment="updateComment"
          @update-mood="updateMood"
          @reorder="reorderSwatches"
        />

        <div class="board-hint">
          <span class="hint-item">💡 点击色块修改颜色</span>
          <span class="hint-divider">·</span>
          <span class="hint-item">↔️ 拖拽色块排序</span>
          <span class="hint-divider">·</span>
          <span class="hint-item">📝 展开添加注释</span>
        </div>
      </div>
    </main>

    <div v-if="showShareModal" class="share-modal-overlay" @click.self="showShareModal = false">
      <div class="share-modal">
        <div class="modal-header">
          <h3>分享调色板</h3>
          <button class="modal-close" @click="showShareModal = false">×</button>
        </div>
        <div class="modal-content">
          <p class="modal-desc">复制以下链接，与团队成员分享你的调色板：</p>
          <div class="share-url-wrap">
            <input type="text" readonly :value="shareUrl" ref="urlInputRef" class="share-url" />
            <button class="copy-btn" :class="{ copied: isCopied }" @click="copyToClipboard">
              {{ isCopied ? '✓ 已复制' : '复制' }}
            </button>
          </div>
          <div class="preview-colors">
            <div class="preview-label">颜色预览：</div>
            <div class="preview-row">
              <div
                v-for="swatch in swatches"
                :key="swatch.id"
                class="preview-color"
                :style="{ backgroundColor: swatch.color }"
                :title="swatch.color"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import PaletteBoard from './components/PaletteBoard.vue'
import { useColorHash } from './composables/useColorHash'

const {
  swatches,
  isRestoring,
  generateShareUrl,
  resetSwatches,
  updateColor,
  updateComment,
  updateMood,
  reorderSwatches
} = useColorHash()

const showShareModal = ref(false)
const shareUrl = ref('')
const isCopied = ref(false)
const urlInputRef = ref<HTMLElement | null>(null)
const isClearing = ref(false)

function handleShare() {
  shareUrl.value = generateShareUrl()
  showShareModal.value = true
  isCopied.value = false
  nextTick(() => {
    if (urlInputRef.value) {
      (urlInputRef.value as HTMLInputElement).select()
    }
  })
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch {
    if (urlInputRef.value) {
      const input = urlInputRef.value as HTMLInputElement
      input.select()
      document.execCommand('copy')
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    }
  }
}

function handleReset() {
  isClearing.value = true
  const count = swatches.value.length
  swatches.value = []
  setTimeout(() => {
    resetSwatches()
    isClearing.value = false
  }, Math.max(300, count * 50))
}

onMounted(() => {
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  background-color: #23272A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
}
</style>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.navbar {
  width: 100%;
  height: 48px;
  background-color: #2C2F33;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-inner {
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  background-color: #99AAB5;
  color: #2C2F33;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.reset-btn:hover {
  background-color: #B0BEC5;
}

.reset-btn:active {
  transform: scale(0.97);
}

.main-content {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 40px 20px 0;
}

.board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.board-header {
  width: 900px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #DCDEE0;
  font-size: 16px;
  font-weight: 500;
}

.title-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5865F2, #44BBA4);
  box-shadow: 0 0 8px rgba(88, 101, 242, 0.5);
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 18px;
  background-color: #5865F2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.share-btn:hover {
  background-color: #6B77F3;
}

.share-btn:active {
  transform: scale(0.97);
}

.share-btn.copied {
  background-color: #44BBA4;
}

.board-hint {
  width: 900px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  color: #60646B;
  font-size: 13px;
}

.hint-item {
  display: inline-flex;
  align-items: center;
}

.hint-divider {
  opacity: 0.5;
}

.bottom-space {
  height: 20px;
  flex-shrink: 0;
}

.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: overlayIn 0.2s ease;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.share-modal {
  background: #2C2F33;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #99AAB5;
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: white;
}

.modal-content {
  padding: 22px;
}

.modal-desc {
  color: #99AAB5;
  font-size: 14px;
  margin-bottom: 16px;
}

.share-url-wrap {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.share-url {
  flex: 1;
  background: #23272A;
  border: 1px solid #40444B;
  border-radius: 6px;
  color: #DCDEE0;
  font-size: 12px;
  padding: 10px 12px;
  font-family: 'SF Mono', Consolas, monospace;
  outline: none;
}

.copy-btn {
  flex-shrink: 0;
  padding: 0 16px;
  background-color: #5865F2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background-color: #6B77F3;
}

.copy-btn.copied {
  background-color: #44BBA4;
}

.preview-colors {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-label {
  color: #99AAB5;
  font-size: 12px;
  margin-bottom: 10px;
}

.preview-row {
  display: flex;
  gap: 6px;
  overflow: hidden;
}

.preview-color {
  flex: 1;
  height: 40px;
  border-radius: 6px;
  transition: transform 0.2s;
}

.preview-color:hover {
  transform: scale(1.08);
}
</style>
