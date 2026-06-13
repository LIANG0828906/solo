<template>
  <div class="code-card" :class="themeClass" :style="{ '--theme-bg': themeConfig.bgColor }">
    <div class="theme-label" :style="{ backgroundColor: themeConfig.labelColor, color: isLightTheme ? '#333' : '#fff' }">
      {{ themeName }}
    </div>
    
    <div class="code-container" :style="{ backgroundColor: themeConfig.bgColor }">
      <div class="line-numbers" :style="{ backgroundColor: themeConfig.lineNumBg, color: themeConfig.lineNumColor }">
        <span v-for="n in lineCount" :key="n" class="line-num">{{ n }}</span>
      </div>
      <pre class="code-block" :style="{ backgroundColor: themeConfig.bgColor, color: themeConfig.textColor }">
        <code v-html="highlightedHtml" class="hljs"></code>
      </pre>
    </div>
    
    <button
      class="copy-btn"
      @click="copyCode"
      @mouseenter="showTooltipHandler"
      @mouseleave="hideTooltipHandler"
      :class="{ 'copied': isCopied }"
    >
      <span v-if="!isCopied" class="copy-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </span>
      <span v-else class="check-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span class="copy-text">{{ isCopied ? '已复制' : '复制' }}</span>
    </button>

    <div class="tooltip" :class="{ 'show': showTooltip }">复制到剪贴板</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ThemeConfig } from '../themes'

const props = defineProps<{
  themeName: string
  highlightedHtml: string
  rawCode: string
  themeConfig: ThemeConfig
}>()

const isCopied = ref(false)
const showTooltip = ref(false)

const themeClass = computed(() => `theme-${props.themeName}`)

const lineCount = computed(() => {
  const lines = props.rawCode.split('\n')
  return Math.max(lines.length, 1)
})

const isLightTheme = computed(() => {
  const lightThemes = ['Light', 'GitHub']
  return lightThemes.includes(props.themeName)
})

function copyCode() {
  if (isCopied.value) return
  
  navigator.clipboard.writeText(props.rawCode).then(() => {
    isCopied.value = true
    showTooltip.value = false
    
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }).catch(err => {
    console.error('Copy failed:', err)
  })
}

function showTooltipHandler() {
  if (!isCopied.value) {
    showTooltip.value = true
  }
}

function hideTooltipHandler() {
  showTooltip.value = false
}
</script>

<style scoped>
.code-card {
  position: relative;
  width: 260px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.code-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.theme-label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  border-bottom-right-radius: 8px;
  z-index: 10;
  letter-spacing: 0.5px;
}

.code-container {
  display: flex;
  margin-top: 36px;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.line-numbers {
  display: flex;
  flex-direction: column;
  padding: 16px 8px 16px 12px;
  font-family: Consolas, 'Courier New', Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  min-width: 40px;
}

.line-num {
  height: 1.6em;
}

.code-block {
  flex: 1;
  padding: 16px 12px;
  margin: 0;
  font-family: Consolas, 'Courier New', Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
}

.code-block :deep(.hljs) {
  background: transparent !important;
  padding: 0 !important;
}

.copy-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 15;
}

.code-card:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.copy-btn.copied {
  color: #28a745;
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.check-icon {
  animation: checkPop 0.3s ease;
}

@keyframes checkPop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.tooltip {
  position: absolute;
  bottom: -32px;
  right: 12px;
  background-color: #333;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 20;
}

.tooltip.show {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 768px) {
  .code-card {
    width: 90%;
  }
}
</style>

<style>
/* Theme-specific styles */
/* Light theme - default highlight.js light */
.theme-Light .hljs {
  color: #24292e !important;
  background: transparent !important;
}

.theme-Light .hljs-keyword,
.theme-Light .hljs-selector-tag,
.theme-Light .hljs-title,
.theme-Light .hljs-section,
.theme-Light .hljs-doctag,
.theme-Light .hljs-name,
.theme-Light .hljs-strong {
  font-weight: bold;
  color: #d73a49;
}

.theme-Light .hljs-comment,
.theme-Light .hljs-quote {
  color: #6a737d;
  font-style: italic;
}

.theme-Light .hljs-string,
.theme-Light .hljs-template-variable,
.theme-Light .hljs-variable,
.theme-Light .hljs-regexp,
.theme-Light .hljs-selector-attr,
.theme-Light .hljs-selector-pseudo {
  color: #032f62;
}

.theme-Light .hljs-number,
.theme-Light .hljs-literal,
.theme-Light .hljs-type,
.theme-Light .hljs-params,
.theme-Light .hljs-meta,
.theme-Light .hljs-link {
  color: #005cc5;
}

.theme-Light .hljs-built_in,
.theme-Light .hljs-class .hljs-title,
.theme-Light .hljs-attr,
.theme-Light .hljs-attribute {
  color: #6f42c1;
}

/* Dark theme */
.theme-Dark .hljs {
  color: #e1e4e8 !important;
  background: transparent !important;
}

.theme-Dark .hljs-keyword,
.theme-Dark .hljs-selector-tag,
.theme-Dark .hljs-title,
.theme-Dark .hljs-section,
.theme-Dark .hljs-doctag,
.theme-Dark .hljs-name,
.theme-Dark .hljs-strong {
  color: #f97583;
  font-weight: bold;
}

.theme-Dark .hljs-comment,
.theme-Dark .hljs-quote {
  color: #8b949e;
  font-style: italic;
}

.theme-Dark .hljs-string,
.theme-Dark .hljs-template-variable,
.theme-Dark .hljs-variable,
.theme-Dark .hljs-regexp,
.theme-Dark .hljs-selector-attr,
.theme-Dark .hljs-selector-pseudo {
  color: #9ecbff;
}

.theme-Dark .hljs-number,
.theme-Dark .hljs-literal,
.theme-Dark .hljs-type,
.theme-Dark .hljs-params,
.theme-Dark .hljs-meta,
.theme-Dark .hljs-link {
  color: #79b8ff;
}

.theme-Dark .hljs-built_in,
.theme-Dark .hljs-class .hljs-title {
  color: #f1e05a;
}

/* Monokai theme */
.theme-Monokai .hljs {
  color: #f8f8f2 !important;
  background: transparent !important;
}

.theme-Monokai .hljs-keyword,
.theme-Monokai .hljs-selector-tag,
.theme-Monokai .hljs-title,
.theme-Monokai .hljs-section,
.theme-Monokai .hljs-doctag,
.theme-Monokai .hljs-name,
.theme-Monokai .hljs-strong {
  color: #f92672;
  font-weight: bold;
}

.theme-Monokai .hljs-comment,
.theme-Monokai .hljs-quote {
  color: #75715e;
  font-style: italic;
}

.theme-Monokai .hljs-string,
.theme-Monokai .hljs-template-variable,
.theme-Monokai .hljs-variable,
.theme-Monokai .hljs-regexp,
.theme-Monokai .hljs-selector-attr,
.theme-Monokai .hljs-selector-pseudo {
  color: #e6db74;
}

.theme-Monokai .hljs-number,
.theme-Monokai .hljs-literal,
.theme-Monokai .hljs-type,
.theme-Monokai .hljs-params,
.theme-Monokai .hljs-meta,
.theme-Monokai .hljs-link {
  color: #ae81ff;
}

.theme-Monokai .hljs-built_in,
.theme-Monokai .hljs-class .hljs-title,
.theme-Monokai .hljs-attr,
.theme-Monokai .hljs-attribute {
  color: #a6e22e;
}

.theme-Monokai .hljs-selector-class,
.theme-Monokai .hljs-selector-id {
  color: #fd971f;
}

.theme-Monokai .hljs-function .hljs-title {
  color: #a6e22e;
}

/* Dracula theme */
.theme-Dracula .hljs {
  color: #f8f8f2 !important;
  background: transparent !important;
}

.theme-Dracula .hljs-keyword,
.theme-Dracula .hljs-selector-tag,
.theme-Dracula .hljs-title,
.theme-Dracula .hljs-section,
.theme-Dracula .hljs-doctag,
.theme-Dracula .hljs-name,
.theme-Dracula .hljs-strong {
  color: #ff79c6;
  font-weight: bold;
}

.theme-Dracula .hljs-comment,
.theme-Dracula .hljs-quote {
  color: #6272a4;
  font-style: italic;
}

.theme-Dracula .hljs-string,
.theme-Dracula .hljs-template-variable,
.theme-Dracula .hljs-variable,
.theme-Dracula .hljs-regexp,
.theme-Dracula .hljs-selector-attr,
.theme-Dracula .hljs-selector-pseudo {
  color: #f1fa8c;
}

.theme-Dracula .hljs-number,
.theme-Dracula .hljs-literal,
.theme-Dracula .hljs-type,
.theme-Dracula .hljs-params,
.theme-Dracula .hljs-meta,
.theme-Dracula .hljs-link {
  color: #bd93f9;
}

.theme-Dracula .hljs-built_in,
.theme-Dracula .hljs-class .hljs-title,
.theme-Dracula .hljs-attr,
.theme-Dracula .hljs-attribute,
.theme-Dracula .hljs-symbol,
.theme-Dracula .hljs-bullet,
.theme-Dracula .hljs-addition {
  color: #50fa7b;
}

.theme-Dracula .hljs-selector-class,
.theme-Dracula .hljs-selector-id {
  color: #f1fa8c;
}

.theme-Dracula .hljs-function .hljs-title {
  color: #50fa7b;
}

/* GitHub theme */
.theme-GitHub .hljs {
  color: #24292e !important;
  background: transparent !important;
}

.theme-GitHub .hljs-keyword,
.theme-GitHub .hljs-selector-tag,
.theme-GitHub .hljs-title,
.theme-GitHub .hljs-section,
.theme-GitHub .hljs-doctag,
.theme-GitHub .hljs-name,
.theme-GitHub .hljs-strong {
  font-weight: bold;
  color: #d73a49;
}

.theme-GitHub .hljs-comment,
.theme-GitHub .hljs-quote {
  color: #6a737d;
  font-style: italic;
}

.theme-GitHub .hljs-string,
.theme-GitHub .hljs-template-variable,
.theme-GitHub .hljs-variable,
.theme-GitHub .hljs-regexp,
.theme-GitHub .hljs-selector-attr,
.theme-GitHub .hljs-selector-pseudo {
  color: #032f62;
}

.theme-GitHub .hljs-number,
.theme-GitHub .hljs-literal,
.theme-GitHub .hljs-type,
.theme-GitHub .hljs-params,
.theme-GitHub .hljs-meta,
.theme-GitHub .hljs-link {
  color: #005cc5;
}

.theme-GitHub .hljs-built_in,
.theme-GitHub .hljs-class .hljs-title,
.theme-GitHub .hljs-attr,
.theme-GitHub .hljs-attribute {
  color: #e36209;
}

.theme-GitHub .hljs-selector-class,
.theme-GitHub .hljs-selector-id {
  color: #6f42c1;
}

.theme-GitHub .hljs-function .hljs-title {
  color: #6f42c1;
}
</style>
