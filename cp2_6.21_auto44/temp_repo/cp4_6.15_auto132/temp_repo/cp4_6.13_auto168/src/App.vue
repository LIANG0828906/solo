<template>
  <div class="app-container">
    <header class="header">
      <h1 class="title">Code Theme Compare</h1>
      <p class="subtitle">Compare multiple code themes side by side</p>
    </header>

    <section class="input-section">
      <textarea
        v-model="codeInput"
        class="code-input"
        placeholder="Paste or type your code here..."
        spellcheck="false"
      ></textarea>
      <button
        class="generate-btn"
        @click="handleGenerateClick"
        :disabled="!codeInput.trim()"
      >
        <span class="btn-text">生成对比</span>
        <span class="ripple" v-for="ripple in ripples" :key="ripple.id" :style="ripple.style"></span>
      </button>
    </section>

    <section
      class="results-section"
      ref="resultsRef"
      v-if="themes.length > 0"
    >
      <div class="cards-container">
        <CodeCard
          v-for="theme in themes"
          :key="theme.name"
          :theme-name="theme.name"
          :highlighted-html="theme.highlightedHtml"
          :raw-code="rawCodeWithLineNumbers"
          :theme-config="theme.config"
        />
      </div>
    </section>

    <button
      class="screenshot-btn"
      @click="captureScreenshot"
      :class="{ 'is-visible': themes.length > 0 }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
      <span class="screenshot-tooltip">截取对比图</span>
    </button>

    <transition name="fade">
      <div v-if="isCapturing" class="capture-overlay">
        <div class="spinner"></div>
        <p class="capture-text">正在生成图片...</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import CodeCard from './components/CodeCard.vue'
import html2canvas from 'html2canvas'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import { themesConfig, type ThemeConfig } from './themes'

hljs.registerLanguage('javascript', javascript)

interface Ripple {
  id: number
  style: {
    left: string
    top: string
  }
}

const codeInput = ref<string>(`function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [1, 2, 3, 4, 5];
const result = numbers.map(fibonacci);
console.log(result);`)

const themes = ref<Array<{ name: string; highlightedHtml: string; config: ThemeConfig }>>([])
const resultsRef = ref<HTMLElement | null>(null)
const isCapturing = ref(false)
const ripples = ref<Ripple[]>([])
let rippleId = 0

const rawCodeWithLineNumbers = computed(() => {
  const lines = codeInput.value.split('\n')
  return lines.map((line, index) => `${index + 1}  ${line}`).join('\n')
})

function handleGenerateClick(event: MouseEvent) {
  handleRipple(event)
  generateComparison()
}

function generateComparison() {
  if (!codeInput.value.trim()) {
    return
  }

  nextTick(() => {
    const startTime = performance.now()
    
    themes.value = themesConfig.map(theme => ({
      name: theme.name,
      highlightedHtml: highlightCode(codeInput.value),
      config: theme
    }))
    
    const endTime = performance.now()
    console.log(`Theme rendering took ${endTime - startTime}ms`)
  })
}

function highlightCode(code: string): string {
  try {
    const result = hljs.highlight(code, { language: 'javascript' })
    return result.value
  } catch (e) {
    return escapeHtml(code)
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function handleRipple(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const id = rippleId++
  const ripple: Ripple = {
    id,
    style: {
      left: `${x}px`,
      top: `${y}px`
    }
  }
  
  ripples.value.push(ripple)
  
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}

async function captureScreenshot() {
  if (!resultsRef.value || themes.value.length === 0) return
  
  isCapturing.value = true
  
  try {
    await nextTick()
    
    const canvas = await html2canvas(resultsRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    })
    
    const link = document.createElement('a')
    link.download = `code-theme-compare-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    try {
      await fetch('/api/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: canvas.toDataURL('image/png')
        })
      })
    } catch (e) {
      // 后端接口仅作示例占位，不影响前端功能
    }
  } catch (error) {
    console.error('Screenshot capture failed:', error)
  } finally {
    isCapturing.value = false
  }
}

onMounted(() => {
  generateComparison()
})

watch(isCapturing, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  padding: 40px 20px 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.input-section {
  width: 80%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.code-input {
  width: 100%;
  min-height: 200px;
  padding: 20px;
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: Consolas, 'Courier New', Monaco, monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.code-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  animation: borderGradient 0.3s ease forwards;
}

@keyframes borderGradient {
  0% {
    border-color: #667eea;
  }
  100% {
    border-color: #764ba2;
  }
}

.generate-btn {
  position: relative;
  margin-top: 24px;
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.generate-btn:hover:not(:disabled) {
  transform: translateX(3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -50px;
}

@keyframes ripple-animation {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.results-section {
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}

.screenshot-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 100;
}

.screenshot-btn.is-visible {
  opacity: 1;
  visibility: visible;
}

.screenshot-btn:hover {
  transform: rotate(10deg);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.screenshot-tooltip {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.screenshot-btn:hover .screenshot-tooltip {
  opacity: 1;
  visibility: visible;
}

.capture-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: auto;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.capture-text {
  color: white;
  font-size: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .input-section {
    width: 90%;
  }

  .cards-container {
    flex-direction: column;
    align-items: center;
  }

  .screenshot-btn {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
  }
}
</style>
