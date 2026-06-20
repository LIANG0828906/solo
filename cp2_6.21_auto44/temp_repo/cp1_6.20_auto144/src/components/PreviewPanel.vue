<template>
  <div class="preview-container">
    <div class="preview-mode-wrap" :class="store.mode">
      <div
        class="preview-pane"
        :class="{ 'full-width': store.mode === 'single' }"
        ref="paneA"
      >
        <div class="pane-header">
          <span class="pane-tag tag-a">A</span>
          <span class="pane-font-name">{{ getFontLabel(store.fontA.family) }}</span>
        </div>
        <div class="grid-bg">
          <div
            class="preview-text"
            :style="fontAStyle"
          >{{ store.sampleText }}</div>
        </div>
      </div>

      <div
        class="preview-pane"
        :class="{ 'full-width': store.mode === 'single' }"
        v-show="store.mode === 'side-by-side'"
        ref="paneB"
      >
        <div class="pane-header">
          <span class="pane-tag tag-b">B</span>
          <span class="pane-font-name">{{ getFontLabel(store.fontB.family) }}</span>
        </div>
        <div class="grid-bg">
          <div
            class="preview-text"
            :style="fontBStyle"
          >{{ store.sampleText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFontStore, AVAILABLE_FONTS } from '../stores/fontStore'

const store = useFontStore()

function getFontLabel(family: string): string {
  const found = AVAILABLE_FONTS.find(f => f.value === family)
  return found ? found.label : family
}

const fontAStyle = computed(() => ({
  fontFamily: store.fontA.family,
  fontSize: store.fontA.size + 'px',
  fontWeight: store.fontA.weight,
  lineHeight: store.fontA.lineHeight,
  color: store.fontA.color,
  transition: 'font-size 200ms ease, font-weight 200ms ease, line-height 200ms ease, color 200ms ease'
}))

const fontBStyle = computed(() => ({
  fontFamily: store.fontB.family,
  fontSize: store.fontB.size + 'px',
  fontWeight: store.fontB.weight,
  lineHeight: store.fontB.lineHeight,
  color: store.fontB.color,
  transition: 'font-size 200ms ease, font-weight 200ms ease, line-height 200ms ease, color 200ms ease'
}))
</script>

<style scoped>
.preview-container {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  padding: 24px;
  background: #1e1e2e;
  box-sizing: border-box;
}

.preview-mode-wrap {
  display: flex;
  gap: 20px;
  height: calc(100vh - 48px);
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-mode-wrap.single {
  gap: 0;
}

.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2a2a3e;
  border-radius: 12px;
  overflow: hidden;
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
}

.preview-pane.full-width {
  flex: 1;
  max-width: 100%;
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #252538;
  border-bottom: 1px solid #3a3a50;
}

.pane-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 13px;
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

.pane-font-name {
  font-size: 13px;
  color: #9090a8;
  font-weight: 500;
}

.grid-bg {
  flex: 1;
  padding: 24px;
  background-color: #f0f0f0;
  background-image:
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 10px 10px;
  overflow-y: auto;
}

.preview-text {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 60px;
}
</style>
