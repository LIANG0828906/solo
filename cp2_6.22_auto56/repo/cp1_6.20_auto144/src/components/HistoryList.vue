<template>
  <div class="history-list" v-if="store.schemes.length > 0">
    <h3 class="history-title">已保存方案</h3>
    <div class="cards-grid">
      <div
        class="scheme-card"
        v-for="scheme in store.schemes"
        :key="scheme.id"
        @click="store.restoreScheme(scheme)"
      >
        <div class="card-header">
          <div class="card-fonts">
            <span class="card-font-tag tag-a">A</span>
            <span class="card-font-name">{{ getFontLabel(scheme.fontA.family) }}</span>
            <span class="card-separator">vs</span>
            <span class="card-font-tag tag-b">B</span>
            <span class="card-font-name">{{ getFontLabel(scheme.fontB.family) }}</span>
          </div>
          <div class="card-actions">
            <button class="card-btn export-btn" @click.stop="handleExport(scheme)" title="导出CSS">CSS</button>
            <button class="card-btn delete-btn" @click.stop="store.deleteScheme(scheme.id)" title="删除">✕</button>
          </div>
        </div>
        <div class="card-params">
          <span class="param-item">A: {{ scheme.fontA.size }}px / {{ scheme.fontA.weight }} / {{ scheme.fontA.lineHeight.toFixed(1) }}</span>
          <span class="param-divider">|</span>
          <span class="param-item">B: {{ scheme.fontB.size }}px / {{ scheme.fontB.weight }} / {{ scheme.fontB.lineHeight.toFixed(1) }}</span>
        </div>
        <div class="card-preview" :style="{ fontFamily: scheme.fontA.family, fontSize: Math.min(scheme.fontA.size, 14) + 'px', fontWeight: scheme.fontA.weight, color: '#9090a8', lineHeight: 1.4 }">
          {{ truncate(scheme.sampleText, 60) }}
        </div>
      </div>
    </div>

    <div class="css-modal-overlay" v-if="exportModal.visible" @click.self="exportModal.visible = false">
      <div class="css-modal">
        <div class="css-modal-header">
          <span>导出 CSS</span>
          <button class="css-modal-close" @click="exportModal.visible = false">✕</button>
        </div>
        <pre class="css-code">{{ exportModal.code }}</pre>
        <button class="copy-btn" @click="copyCSS">复制代码</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useFontStore, AVAILABLE_FONTS, type SavedScheme } from '../stores/fontStore'

const store = useFontStore()

const exportModal = reactive({
  visible: false,
  code: ''
})

function getFontLabel(family: string): string {
  const found = AVAILABLE_FONTS.find(f => f.value === family)
  return found ? found.label : family
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function handleExport(scheme: SavedScheme) {
  exportModal.code = store.exportCSS(scheme)
  exportModal.visible = true
}

function copyCSS() {
  navigator.clipboard.writeText(exportModal.code).then(() => {
    store.showToast('CSS 已复制到剪贴板')
    exportModal.visible = false
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = exportModal.code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    store.showToast('CSS 已复制到剪贴板')
    exportModal.visible = false
  })
}
</script>

<style scoped>
.history-list {
  padding: 20px 24px;
  background: #1e1e2e;
  border-top: 1px solid #3a3a50;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: #e0e0f0;
  margin: 0 0 16px 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.scheme-card {
  background: #2a2a3e;
  border: 1px solid #3a3a50;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.scheme-card:hover {
  background: #32324a;
  border-color: #7c5cbf;
  transform: translateY(-1px);
}

.scheme-card:active {
  transform: scale(0.97);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-fonts {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-font-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.tag-a {
  background: rgba(124, 92, 191, 0.3);
  color: #a78bfa;
}

.tag-b {
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.card-font-name {
  font-size: 12px;
  color: #c0c0d8;
  font-weight: 500;
}

.card-separator {
  font-size: 10px;
  color: #666;
  margin: 0 2px;
}

.card-actions {
  display: flex;
  gap: 6px;
}

.card-btn {
  background: none;
  border: 1px solid #444;
  border-radius: 4px;
  color: #9090a8;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.card-btn:hover {
  border-color: #7c5cbf;
  color: #e0e0f0;
}

.card-btn:active {
  transform: scale(0.95);
}

.delete-btn:hover {
  border-color: #e55;
  color: #e55;
}

.card-params {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #707088;
  font-family: 'Fira Code', monospace;
}

.param-divider {
  color: #444;
}

.card-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-height: 40px;
}

.css-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.css-modal {
  background: #2a2a3e;
  border: 1px solid #7c5cbf;
  border-radius: 12px;
  padding: 20px;
  max-width: 520px;
  width: 90%;
}

.css-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: #e0e0f0;
  font-weight: 600;
}

.css-modal-close {
  background: none;
  border: none;
  color: #9090a8;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.css-modal-close:hover {
  color: #e55;
}

.css-code {
  background: #1e1e2e;
  border: 1px solid #3a3a50;
  border-radius: 8px;
  padding: 16px;
  color: #a0a0c0;
  font-size: 13px;
  font-family: 'Fira Code', monospace;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0 0 16px 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.copy-btn {
  background: #7c5cbf;
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #8b6cc8;
}

.copy-btn:active {
  transform: scale(0.97);
}
</style>
