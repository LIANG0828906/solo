import { useEditorStore } from '@/store/useEditorStore'
import { ref } from 'vue'

export class EditorToolbar {
  private store = useEditorStore()
  private showConfirmDialog = ref(false)

  get showGrid() {
    return this.store.showGrid
  }

  get autoScale() {
    return this.store.autoScale
  }

  get anchorCount() {
    return this.store.anchors.length
  }

  toggleGrid() {
    this.store.toggleGrid()
  }

  toggleAutoScale() {
    this.store.toggleAutoScale()
  }

  requestClearAll() {
    if (this.store.anchors.length === 0) return
    this.showConfirmDialog.value = true
  }

  confirmClearAll() {
    this.store.clearAnchors()
    this.showConfirmDialog.value = false
  }

  cancelClearAll() {
    this.showConfirmDialog.value = false
  }

  get confirmVisible() {
    return this.showConfirmDialog
  }
}
