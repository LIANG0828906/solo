import { useEditorStore } from '@/store/useEditorStore'
import { ref, computed } from 'vue'

export class CodeExporter {
  private store = useEditorStore()
  private copied = ref(false)
  private showToast = ref(false)
  private toastTimer: number | null = null

  get cssCode() {
    return computed(() => {
      const clipPath = this.store.clipPathValue
      if (clipPath === 'none') {
        return '/* 在画布上添加至少3个锚点以生成裁剪路径 */'
      }
      return `.clip-element {\n  clip-path: ${clipPath};\n  -webkit-clip-path: ${clipPath};\n}`
    })
  }

  get isCopied() {
    return this.copied
  }

  get toastVisible() {
    return this.showToast
  }

  async copyCode() {
    if (this.store.clipPathValue === 'none') return
    
    try {
      await navigator.clipboard.writeText(this.cssCode.value)
      this.copied.value = true
      this.showToast.value = true

      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
      }

      this.toastTimer = window.setTimeout(() => {
        this.copied.value = false
        this.showToast.value = false
        this.toastTimer = null
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  highlightCode(code: string): string {
    return code
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      .replace(/(\.[a-z-]+)/g, '<span class="code-selector">$1</span>')
      .replace(/(clip-path|-webkit-clip-path)/g, '<span class="code-property">$1</span>')
      .replace(/(polygon|none)/g, '<span class="code-function">$1</span>')
      .replace(/(\d+\.?\d*%)/g, '<span class="code-number">$1</span>')
  }
}
