import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Point } from '../utils/pathUtils'
import { pointsToBezierPath } from '../utils/pathUtils'
import cloneDeep from 'lodash/cloneDeep'

export type ToolType = 'select' | 'draw' | 'delete'

export interface PathData {
  id: string
  points: Point[]
  d: string
  strokeWidth: number
  stroke: string
  isDeleted?: boolean
  deleteAnimating?: boolean
}

export const useEditorStore = defineStore('editor', () => {
  const paths = ref<PathData[]>([])
  const selectedPathId = ref<string | null>(null)
  const currentTool = ref<ToolType>('draw')
  const isDrawing = ref(false)
  const currentPoints = ref<Point[]>([])
  const undoStack = ref<PathData[][]>([])
  const redoStack = ref<PathData[][]>([])
  const isAnimatingPreview = ref(false)
  const selectedControlPointIndex = ref<number | null>(null)

  const selectedPath = computed<PathData | null>(() => {
    if (!selectedPathId.value) return null
    return paths.value.find(p => p.id === selectedPathId.value && !p.isDeleted) || null
  })

  const canUndo = computed(() => undoStack.value.length > 0)

  const canRedo = computed(() => redoStack.value.length > 0)

  const totalControlPoints = computed(() => {
    return paths.value
      .filter(p => !p.isDeleted)
      .reduce((sum, path) => sum + path.points.length, 0)
  })

  const selectedPathsCount = computed(() => {
    if (!selectedPathId.value) return 0
    return paths.value.some(p => p.id === selectedPathId.value && !p.isDeleted) ? 1 : 0
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  function saveToUndoStack(): void {
    undoStack.value.push(cloneDeep(paths.value))
    redoStack.value = []
  }

  function setTool(tool: ToolType): void {
    currentTool.value = tool
    if (tool !== 'select') {
      selectedPathId.value = null
      selectedControlPointIndex.value = null
    }
  }

  function startDrawing(point: Point): void {
    if (currentTool.value !== 'draw') return
    isDrawing.value = true
    currentPoints.value = [{ ...point }]
  }

  function addPoint(point: Point): void {
    if (!isDrawing.value) return
    currentPoints.value.push({ ...point })
  }

  function finishDrawing(): void {
    if (!isDrawing.value || currentPoints.value.length < 2) {
      isDrawing.value = false
      currentPoints.value = []
      return
    }

    saveToUndoStack()

    const newPath: PathData = {
      id: generateId(),
      points: [...currentPoints.value],
      d: pointsToBezierPath(currentPoints.value),
      strokeWidth: 2,
      stroke: '#374151'
    }

    paths.value.push(newPath)
    isDrawing.value = false
    currentPoints.value = []
  }

  function selectPath(pathId: string): void {
    const path = paths.value.find(p => p.id === pathId && !p.isDeleted)
    if (path) {
      selectedPathId.value = pathId
      selectedControlPointIndex.value = null
    }
  }

  function deselectPath(): void {
    selectedPathId.value = null
    selectedControlPointIndex.value = null
  }

  function updatePathPoints(pathId: string, points: Point[]): void {
    const pathIndex = paths.value.findIndex(p => p.id === pathId)
    if (pathIndex === -1) return

    saveToUndoStack()

    const path = paths.value[pathIndex]
    path.points = points.map(p => ({ ...p }))
    path.d = pointsToBezierPath(path.points)
  }

  function updateControlPoint(pathId: string, pointIndex: number, point: Point): void {
    const pathIndex = paths.value.findIndex(p => p.id === pathId)
    if (pathIndex === -1) return

    const path = paths.value[pathIndex]
    if (pointIndex < 0 || pointIndex >= path.points.length) return

    saveToUndoStack()

    path.points[pointIndex] = { ...point }
    path.d = pointsToBezierPath(path.points)
  }

  function deleteSelectedPath(): void {
    if (!selectedPathId.value) return

    const pathIndex = paths.value.findIndex(p => p.id === selectedPathId.value)
    if (pathIndex === -1) return

    saveToUndoStack()

    const path = paths.value[pathIndex]
    path.deleteAnimating = true

    setTimeout(() => {
      const idx = paths.value.findIndex(p => p.id === selectedPathId.value)
      if (idx !== -1) {
        paths.value[idx].isDeleted = true
        paths.value[idx].deleteAnimating = false
      }
      selectedPathId.value = null
      selectedControlPointIndex.value = null
    }, 300)
  }

  function clearAll(): void {
    if (paths.value.filter(p => !p.isDeleted).length === 0) return

    saveToUndoStack()

    paths.value.forEach(path => {
      if (!path.isDeleted) {
        path.deleteAnimating = true
      }
    })

    setTimeout(() => {
      paths.value.forEach(path => {
        if (path.deleteAnimating) {
          path.isDeleted = true
          path.deleteAnimating = false
        }
      })
      selectedPathId.value = null
      selectedControlPointIndex.value = null
    }, 300)
  }

  function undo(): void {
    if (undoStack.value.length === 0) return

    redoStack.value.push(cloneDeep(paths.value))
    const previousState = undoStack.value.pop()!
    paths.value = previousState
    selectedPathId.value = null
    selectedControlPointIndex.value = null
  }

  function redo(): void {
    if (redoStack.value.length === 0) return

    undoStack.value.push(cloneDeep(paths.value))
    const nextState = redoStack.value.pop()!
    paths.value = nextState
    selectedPathId.value = null
    selectedControlPointIndex.value = null
  }

  function startPreviewAnimation(): void {
    isAnimatingPreview.value = true
  }

  function stopPreviewAnimation(): void {
    isAnimatingPreview.value = false
  }

  function setSelectedControlPointIndex(index: number | null): void {
    selectedControlPointIndex.value = index
  }

  return {
    paths,
    selectedPathId,
    currentTool,
    isDrawing,
    currentPoints,
    undoStack,
    redoStack,
    isAnimatingPreview,
    selectedControlPointIndex,
    selectedPath,
    canUndo,
    canRedo,
    totalControlPoints,
    selectedPathsCount,
    setTool,
    startDrawing,
    addPoint,
    finishDrawing,
    selectPath,
    deselectPath,
    updatePathPoints,
    updateControlPoint,
    deleteSelectedPath,
    clearAll,
    undo,
    redo,
    startPreviewAnimation,
    stopPreviewAnimation,
    setSelectedControlPointIndex
  }
})
