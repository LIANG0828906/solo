<template>
  <div class="control-panel">
    <h2 class="panel-title">参数控制</h2>

    <div class="section">
      <label class="section-label">示例文本</label>
      <textarea
        class="sample-input"
        :value="store.sampleText"
        @input="store.setSampleText(($event.target as HTMLTextAreaElement).value)"
        rows="3"
        placeholder="输入示例文本..."
      ></textarea>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-label">字体 A</span>
        <span class="font-tag tag-a">A</span>
      </div>
      <div class="control-group">
        <label class="control-label">字体</label>
        <select class="control-select" :value="store.fontA.family" @change="store.updateFontA({ family: ($event.target as HTMLSelectElement).value })">
          <option v-for="f in AVAILABLE_FONTS" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="control-group">
        <label class="control-label">字号 <span class="control-value">{{ store.fontA.size }}px</span></label>
        <input type="range" class="control-slider" min="12" max="72" step="1" :value="store.fontA.size" @input="store.updateFontA({ size: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">字重 <span class="control-value">{{ store.fontA.weight }}</span></label>
        <input type="range" class="control-slider" min="100" max="900" step="100" :value="store.fontA.weight" @input="store.updateFontA({ weight: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">行高 <span class="control-value">{{ store.fontA.lineHeight.toFixed(1) }}</span></label>
        <input type="range" class="control-slider" min="1.0" max="2.0" step="0.1" :value="store.fontA.lineHeight" @input="store.updateFontA({ lineHeight: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">颜色</label>
        <div class="color-picker-wrap">
          <input type="color" class="control-color" :value="store.fontA.color" @input="store.updateFontA({ color: ($event.target as HTMLInputElement).value })" />
          <span class="color-hex">{{ store.fontA.color }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-label">字体 B</span>
        <span class="font-tag tag-b">B</span>
      </div>
      <div class="control-group">
        <label class="control-label">字体</label>
        <select class="control-select" :value="store.fontB.family" @change="store.updateFontB({ family: ($event.target as HTMLSelectElement).value })">
          <option v-for="f in AVAILABLE_FONTS" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
      </div>
      <div class="control-group">
        <label class="control-label">字号 <span class="control-value">{{ store.fontB.size }}px</span></label>
        <input type="range" class="control-slider" min="12" max="72" step="1" :value="store.fontB.size" @input="store.updateFontB({ size: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">字重 <span class="control-value">{{ store.fontB.weight }}</span></label>
        <input type="range" class="control-slider" min="100" max="900" step="100" :value="store.fontB.weight" @input="store.updateFontB({ weight: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">行高 <span class="control-value">{{ store.fontB.lineHeight.toFixed(1) }}</span></label>
        <input type="range" class="control-slider" min="1.0" max="2.0" step="0.1" :value="store.fontB.lineHeight" @input="store.updateFontB({ lineHeight: +($event.target as HTMLInputElement).value })" />
      </div>
      <div class="control-group">
        <label class="control-label">颜色</label>
        <div class="color-picker-wrap">
          <input type="color" class="control-color" :value="store.fontB.color" @input="store.updateFontB({ color: ($event.target as HTMLInputElement).value })" />
          <span class="color-hex">{{ store.fontB.color }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="control-group">
        <label class="control-label">预览模式</label>
        <button class="mode-btn" @click="store.toggleMode()">
          <span class="mode-icon">{{ store.mode === 'side-by-side' ? '▦' : '▬' }}</span>
          {{ store.mode === 'side-by-side' ? '并排对比' : '单一预览' }}
        </button>
      </div>
    </div>

    <div class="section">
      <button class="save-btn" @click="handleSave">
        <span class="save-icon">☆</span> 保存方案
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFontStore, AVAILABLE_FONTS } from '../stores/fontStore'

const store = useFontStore()

function handleSave() {
  store.saveScheme()
}
</script>

<style scoped>
.control-panel {
  width: 320px;
  min-width: 320px;
  height: 100vh;
  overflow-y: auto;
  padding: 20px 16px;
  background: #2a2a3e;
  border-right: 1px solid #3a3a50;
  box-sizing: border-box;
}

.control-panel::-webkit-scrollbar {
  width: 4px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0f0;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #3a3a50;
}

.section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3a3a50;
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #b0b0c8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.font-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
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

.sample-input {
  width: 100%;
  background: #1e1e2e;
  border: 1px solid #444;
  border-radius: 8px;
  color: #e0e0f0;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.sample-input:focus {
  outline: none;
  border-color: #7c5cbf;
}

.control-group {
  margin-bottom: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #9090a8;
  margin-bottom: 6px;
}

.control-value {
  color: #7c5cbf;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.control-select {
  width: 100%;
  background: #1e1e2e;
  border: 1px solid #444;
  border-radius: 8px;
  color: #e0e0f0;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239090a8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.control-select:hover {
  border-color: #7c5cbf;
  background-color: #3a3a50;
}

.control-select:focus {
  outline: none;
  border-color: #7c5cbf;
}

.control-slider {
  width: 100%;
  height: 6px;
  appearance: none;
  background: #444;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.control-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #7c5cbf;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(124, 92, 191, 0.5);
}

.control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #7c5cbf;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-color {
  width: 36px;
  height: 36px;
  border: 2px solid #444;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: transparent;
  transition: border-color 0.2s;
}

.control-color:hover {
  border-color: #7c5cbf;
}

.control-color::-webkit-color-swatch-wrapper {
  padding: 0;
}

.control-color::-webkit-color-swatch {
  border: none;
  border-radius: 5px;
}

.color-hex {
  font-size: 12px;
  color: #9090a8;
  font-family: 'Fira Code', monospace;
}

.mode-btn {
  width: 100%;
  background: #1e1e2e;
  border: 1px solid #444;
  border-radius: 8px;
  color: #e0e0f0;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mode-btn:hover {
  background: #3a3a50;
  border-color: #7c5cbf;
}

.mode-btn:active {
  transform: scale(0.97);
}

.mode-icon {
  font-size: 16px;
}

.save-btn {
  width: 100%;
  background: #7c5cbf;
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-btn:hover {
  background: #8b6cc8;
}

.save-btn:active {
  transform: scale(0.97);
}

.save-icon {
  font-size: 16px;
}
</style>
