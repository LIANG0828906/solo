import { useEditorStore } from '@/store/useEditorStore'
import { ref, computed } from 'vue'

export class CodeExporter {
  private store!: ReturnType<typeof useEditorStore>
  private _copied = ref(false)
  private _showToast = ref(false)
  private toastTimer: number | null = null

  private getStore() {
    if (!this.store) {
      this.store = useEditorStore()
    }
    return this.store
  }

  get cssCode() {
    return computed(() => {
      const clipPath = this.getStore().clipPathValue
      if (clipPath === 'none') {
        return '/* 在画布上添加至少3个锚点以生成裁剪路径 */'
      }
      return `.clip-element {\n  clip-path: ${clipPath};\n  -webkit-clip-path: ${clipPath};\n}`
    })
  }

  get isCopied() {
    return this._copied
  }

  get toastVisible() {
    return this._showToast
  }

  async copyCode() {
    if (this.getStore().clipPathValue === 'none') return

    try {
      await navigator.clipboard.writeText(this.cssCode.value)
      this._copied.value = true
      this._showToast.value = true

      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
      }

      this.toastTimer = window.setTimeout(() => {
        this._copied.value = false
        this._showToast.value = false
        this.toastTimer = null
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  highlightCode(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      .replace(/(\.[a-z][a-z-]+)/g, '<span class="code-selector">$1</span>')
      .replace(/(clip-path|-webkit-clip-path)/g, '<span class="code-property">$1</span>')
      .replace(/\b(polygon|none)\b/g, '<span class="code-function">$1</span>')
      .replace(/(\d+\.?\d*%)/g, '<span class="code-number">$1</span>')
      .replace(/([{}();])/g, '<span class="code-punctuation">$1</span>')
  }
}
