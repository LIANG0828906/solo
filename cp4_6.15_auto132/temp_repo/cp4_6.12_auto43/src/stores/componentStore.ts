import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ComponentProp {
  name: string
  type: 'string' | 'number' | 'boolean' | 'color' | 'select'
  default: any
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface ComponentExample {
  id: string
  name: string
  code: string
  thumbnail?: string
}

export interface RegisteredComponent {
  id: string
  name: string
  version: string
  isLatest: boolean
  sourceCode: string
  props: ComponentProp[]
  examples: ComponentExample[]
}

export interface ImportState {
  isImporting: boolean
  progress: number
  totalFiles: number
  processedFiles: number
}

export const useComponentStore = defineStore('components', () => {
  const components = ref<RegisteredComponent[]>([
    {
      id: 'demo-button',
      name: 'DemoButton',
      version: '1.0.0',
      isLatest: true,
      sourceCode: `<template>
  <button :style="buttonStyle" @click="$emit('click')">
    <span v-if="icon">{{ icon }}</span>
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: 'Click Me'
  },
  size: {
    type: String,
    default: 'medium'
  },
  color: {
    type: String,
    default: '#58a6ff'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  }
})

defineEmits<{
  (e: 'click'): void
}>()

const buttonStyle = computed(() => ({
  padding: props.size === 'small' ? '4px 12px' : props.size === 'large' ? '12px 24px' : '8px 16px',
  backgroundColor: props.disabled ? '#30363d' : props.color,
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: props.disabled ? 'not-allowed' : 'pointer',
  fontSize: props.size === 'small' ? '12px' : props.size === 'large' ? '18px' : '14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease-out',
  opacity: props.disabled ? 0.6 : 1
}))
</script>`,
      props: [
        { name: 'label', type: 'string', default: 'Click Me' },
        { name: 'size', type: 'select', default: 'medium', options: ['small', 'medium', 'large'] },
        { name: 'color', type: 'color', default: '#58a6ff' },
        { name: 'disabled', type: 'boolean', default: false },
        { name: 'icon', type: 'string', default: '' }
      ],
      examples: [
        {
          id: 'ex1',
          name: '基础用法',
          code: `<DemoButton label="按钮" />`
        },
        {
          id: 'ex2',
          name: '不同尺寸',
          code: `<DemoButton label="小" size="small" />\n<DemoButton label="中" size="medium" />\n<DemoButton label="大" size="large" />`
        }
      ]
    }
  ])

  const activeComponentId = ref<string | null>(components.value[0]?.id || null)
  const importState = ref<ImportState>({
    isImporting: false,
    progress: 0,
    totalFiles: 0,
    processedFiles: 0
  })

  const activeComponent = computed(() => {
    return components.value.find(c => c.id === activeComponentId.value) || null
  })

  function setActive(id: string) {
    activeComponentId.value = id
  }

  function registerComponent(comp: RegisteredComponent) {
    const existingIndex = components.value.findIndex(c => c.id === comp.id)
    if (existingIndex >= 0) {
      components.value[existingIndex] = comp
    } else {
      components.value.push(comp)
    }
    if (!activeComponentId.value) {
      activeComponentId.value = comp.id
    }
  }

  function registerComponents(comps: RegisteredComponent[]) {
    comps.forEach(comp => registerComponent(comp))
  }

  function setImportProgress(progress: number, processed: number, total: number) {
    importState.value.progress = progress
    importState.value.processedFiles = processed
    importState.value.totalFiles = total
  }

  function startImport() {
    importState.value.isImporting = true
    importState.value.progress = 0
    importState.value.processedFiles = 0
    importState.value.totalFiles = 0
  }

  function finishImport() {
    importState.value.isImporting = false
    importState.value.progress = 100
  }

  async function importZip(file: File) {
    startImport()
    
    const ParseWorker = new Worker(new URL('@/components/importer/ParseWorker.ts', import.meta.url), { type: 'module' })
    
    ParseWorker.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data
      
      if (type === 'progress') {
        setImportProgress(data.progress, data.processed, data.total)
      } else if (type ===