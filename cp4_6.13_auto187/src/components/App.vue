<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { EditorCanvas } from '@/editor/EditorCanvas'
import { EditorToolbar } from '@/editor/EditorToolbar'
import { ClipPreviewer } from '@/viewer/ClipPreviewer'
import { CodeExporter } from '@/viewer/CodeExporter'
import { useEditorStore } from '@/store/useEditorStore'

const store = useEditorStore()
const toolbar = new EditorToolbar()
const previewer = new ClipPreviewer()
const codeExporter = new CodeExporter()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainerRef = ref<HTMLDivElement | null>(null)
let editorCanvas: EditorCanvas | null = null

const BASE_WIDTH = 800
const BASE_HEIGHT = 600
const MIN_WIDTH = 400

const canvasDisplayWidth = ref(BASE_WIDTH)
const canvasDisplayHeight = ref(BASE_HEIGHT)

const previewStyle = computed(() => previewer.getPreviewStyle().value)
const cssCode = computed(() => codeExporter.cssCode.value)
const isCopied = computed(() => codeExporter.isCopied.value)
const showToast = computed(() => codeExporter.toastVisible.value)
const showConfirm = computed(() => toolbar.confirmVisible.value)
const showGrid = computed(() => store.showGrid)
const autoScale = computed(() => store.autoScale)
const anchorCount = computed(() => store.anchors.length)
const hasValidShape = computed(() => store.anchors.length >= 3)

const highlightedCode = computed(() => {
  return codeExporter.highlightCode(cssCode.value)
})

function handleCopy() {
  codeExporter.copyCode()
}

function handleClearClick() {
  toolbar.requestClearAll()
}

function handleConfirmClear() {
  toolbar.confirmClearAll()
}

function handleCancelClear() {
  toolbar.cancelClearAll()
}

function toggleGrid() {
  toolbar.toggleGrid()
  if (editorCanvas) {
    editorCanvas.refresh()
  }
}

function toggleAutoScale() {
  toolbar.toggleAutoScale()
  if (store.autoScale) {
    updateCanvasScale()
  } else {
    canvasDisplayWidth.value = BASE_WIDTH
    canvasDisplayHeight.value = BASE_HEIGHT
    if (editorCanvas) {
      editorCanvas.resize(BASE_WIDTH, BASE_HEIGHT)
    }
  }
}

function updateCanvasScale() {
  if (!canvasContainerRef.value || !store.autoScale) return

  const containerWidth = canvasContainerRef.value.clientWidth - 48
  const containerHeight = canvasContainerRef.value.clientHeight - 120

  const scaleX = containerWidth / BASE_WIDTH
  const scaleY = containerHeight / BASE_HEIGHT
  const scale = Math.min(scaleX, scaleY, 1)

  const newWidth = Math.max(MIN_WIDTH, BASE_WIDTH * scale)
  const newHeight =