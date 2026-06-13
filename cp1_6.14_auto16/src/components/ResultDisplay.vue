<script setup lang="ts">
import type { ContrastResult, RecommendedColor } from '@/utils/contrastCalculator'

const props = defineProps<{
  foreground: string
  background: string
  contrastResult: ContrastResult | null
  recommendations: RecommendedColor[]
  previewText: string
}>()

const emit = defineEmits<{
  'apply-color': [hex: string]
  'update:previewText': [text: string]
}>()

function onPreviewInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:previewText', target.value)
}
</script>

<template>
  <div class="result-display" v-if="contrastResult">
    <div class="ratio-section">
      <div class="ratio-number">
        <span class="ratio-value">{{ contrastResult.ratio.toFixed(2) }}</span>
        <span class="ratio-label">: 1</span>
      </div>
      <div class="ratio-bar">
        <div
          class="ratio-fill"
          :style="{
            width: Math.min((contrastResult.ratio / 21) * 100, 100) + '%',
            backgroundColor: contrastResult.ratio >= 7 ? '#22c55e' : contrastResult.ratio >= 4.5 ? '#eab308' : '#ef4444'
          }"
        ></div>
      </div>
    </div>

    <div class="badges-section">
      <div class="badge-group">
        <h4 class="badge-group-title">AA 标准</h4>
        <div class="badge-row">
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aa.normal ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aa.normal ? '✓' : '✗' }} 正常文本
          </span>
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aa.large ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aa.large ? '✓' : '✗' }} 大文本
          </span>
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aa.graphics ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aa.graphics ? '✓' : '✗' }} 图形组件
          </span>
        </div>
      </div>
      <div class="badge-group">
        <h4 class="badge-group-title">AAA 标准</h4>
        <div class="badge-row">
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aaa.normal ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aaa.normal ? '✓' : '✗' }} 正常文本
          </span>
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aaa.large ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aaa.large ? '✓' : '✗' }} 大文本
          </span>
          <span
            class="badge"
            :class="contrastResult.wcagLevel.aaa.graphics ? 'badge-pass' : 'badge-fail'"
          >
            {{ contrastResult.wcagLevel.aaa.graphics ? '✓' : '✗' }} 图形组件
          </span>
        </div>
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-header">
        <h4 class="preview-title">模拟视图预览</h4>
        <input
          type="text"
          :value="previewText"
          @input="onPreviewInput"
          class="preview-text-input"
          placeholder="自定义预览文本..."
        />
      </div>
      <div class="preview-area" :style="{ backgroundColor: background }">
        <div class="preview-normal" :style="{ color: foreground }">
          {{ previewText || '预览文本示例' }}
        </div>
        <div class="preview-heading" :style="{ color: foreground }">
          {{ previewText || '标题文本示例' }}
        </div>
        <div class="preview-small" :style="{ color: foreground }">
          {{ previewText || '小字文本示例' }}
        </div>
        <div class="preview-link" :style="{ color: foreground }">
          {{ previewText || '高亮链接示例' }}
        </div>
      </div>
    </div>

    <div class="recommendations-section" v-if="recommendations.length > 0">
      <h4 class="rec-title">推荐色值</h4>
      <div class="rec-list">
        <div
          v-for="rec in recommendations"
          :key="rec.hex"
          class="rec-item"
          @click="emit('apply-color', rec.hex)"
        >
          <div class="rec-color-circle" :style="{ backgroundColor: rec.hex }">
            <span class="rec-level-tag">{{ rec.level }}</span>
          </div>
          <div class="rec-info">
            <span class="rec-hex">{{ rec.hex }}</span>
            <span class="rec-ratio">{{ rec.ratio }}:1</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ratio-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-number {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.ratio-value {
  font-family: 'DM Serif Display', serif;
  font-size: 48px;
  color: #1E3A5F;
  line-height: 1;
}

.ratio-label {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  color: #64748b;
  font-weight: 300;
}

.ratio-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.ratio-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.badges-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge-group-title {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  animation: badge-fade-in 0.3s ease forwards;
}

.badge-pass {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.badge-fail {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

@keyframes badge-fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-title {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  white-space: nowrap;
}

.preview-text-input {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  color: #1E3A5F;
  background: white;
  min-width: 0;
  flex: 1;
  max-width: 200px;
  transition: border-color 0.2s ease;
}

.preview-text-input:focus {
  border-color: #1E3A5F;
}

.preview-area {
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 140px;
}

.preview-normal {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.preview-heading {
  font-family: 'DM Serif Display', serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.preview-small {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
}

.preview-link {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.recommendations-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rec-title {
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.rec-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rec-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.rec-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.rec-item:active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(-50%, -50%);
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  to {
    width: 80px;
    height: 80px;
    opacity: 0;
  }
}

.rec-color-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.rec-level-tag {
  font-family: 'Outfit', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.rec-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.rec-hex {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #1E3A5F;
}

.rec-ratio {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  color: #64748b;
}
</style>
