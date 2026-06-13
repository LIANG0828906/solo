import { useEditorStore } from '@/store/useEditorStore'
import { computed } from 'vue'

export class ClipPreviewer {
  private store = useEditorStore()

  get clipPath() {
    return computed(() => this.store.clipPathValue)
  }

  get anchorCount() {
    return computed(() => this.store.anchors.length)
  }

  get hasValidShape() {
    return computed(() => this.store.anchors.length >= 3)
  }

  getPreviewStyle() {
    return computed(() => ({
      clipPath: this.store.clipPathValue,
      WebkitClipPath: this.store.clipPathValue
    }))
  }
}
