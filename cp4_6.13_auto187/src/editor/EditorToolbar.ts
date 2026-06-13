import { useEditorStore } from '@/store/useEditorStore'
import { ref } from 'vue'

export class EditorToolbar {
  private store!: ReturnType<typeof useEditorStore>
  private _showConfirmDialog = ref(false)

  private getStore() {
    if (!this.store) {
      this.store = useEditorStore()
    }
    return this.store
  }

  get showGrid() {
    return this.getStore().showGrid
  }

  get autoScale() {
    return this.getStore().autoScale
  }

  get anchorCount() {
    return this.getStore().anchors.length
  }

  get confirmVisible() {
    return this._showConfirmDialog
  }

  toggleGrid() {
    this.getStore().toggleGrid()
  }

  toggleAutoScale() {
    this.getStore().toggleAutoScale()
  }

  requestClearAll() {
    if (this.getStore().anchors.length === 0) return
    this._showConfirmDialog.value = true
  }

  confirmClearAll() {
    this.getStore().clearAnchors()
    this._showConfirmDialog.value = false
  }

  cancelClearAll() {
    this._showConfirmDialog.value = false
  }
}
