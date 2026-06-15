import { useEditorStore } from '@/store/useEditorStore'
import { computed } from 'vue'

export class ClipPreviewer {
  private store!: ReturnType<typeof useEditorStore>

  private getStore() {
    if (!this.store) {
      this.store = useEditorStore()
    }
    return this.store
  }

  get clipPath() {
    return computed(() => this.getStore().clipPathValue)
  }

  get hasValidShape() {
    return computed(() => this.getStore().anchors.length >= 3)
  }

  getPreviewStyle() {
    return computed(() => ({
      clipPath: this.getStore().clipPathValue,
      WebkitClipPath: this.getStore().clipPathValue,
    }))
  }
}
