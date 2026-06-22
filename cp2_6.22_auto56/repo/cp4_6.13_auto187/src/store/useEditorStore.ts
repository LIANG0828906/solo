import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AnchorPoint {
  id: string
  x: number
  y: number
}

export const useEditorStore = defineStore('editor', () => {
  const anchors = ref<AnchorPoint[]>([])
  const showGrid = ref(true)
  const autoScale = ref(true)
  const scale = ref(1)
  const canvasWidth = ref(800)
  const canvasHeight = ref(600)
  const selectedAnchorId = ref<string | null>(null)

  const clipPathValue = computed(() => {
    if (anchors.value.length < 3) return 'none'
    const points = anchors.value.map(anchor => {
      const xPercent = ((anchor.x / canvasWidth.value) * 100).toFixed(2)
      const yPercent = ((anchor.y / canvasHeight.value) * 100).toFixed(2)
      return `${xPercent}% ${yPercent}%`
    })
    return `polygon(${points.join(', ')})`
  })

  function addAnchor(x: number, y: number) {
    const id = `anchor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    anchors.value.push({ id, x, y })
    return id
  }

  function updateAnchor(id: string, x: number, y: number) {
    const anchor = anchors.value.find(a => a.id === id)
    if (anchor) {
      anchor.x = Math.max(0, Math.min(canvasWidth.value, x))
      anchor.y = Math.max(0, Math.min(canvasHeight.value, y))
    }
  }

  function removeAnchor(id: string) {
    const index = anchors.value.findIndex(a => a.id === id)
    if (index > -1) {
      anchors.value.splice(index, 1)
    }
  }

  function clearAnchors() {
    anchors.value = []
    selectedAnchorId.value = null
  }

  function selectAnchor(id: string | null) {
    selectedAnchorId.value = id
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  function toggleAutoScale() {
    autoScale.value = !autoScale.value
  }

  function setScale(value: number) {
    scale.value = value
  }

  function setCanvasSize(width: number, height: number) {
    canvasWidth.value = width
    canvasHeight.value = height
  }

  return {
    anchors,
    showGrid,
    autoScale,
    scale,
    canvasWidth,
    canvasHeight,
    selectedAnchorId,
    clipPathValue,
    addAnchor,
    updateAnchor,
    removeAnchor,
    clearAnchors,
    selectAnchor,
    toggleGrid,
    toggleAutoScale,
    setScale,
    setCanvasSize,
  }
})
