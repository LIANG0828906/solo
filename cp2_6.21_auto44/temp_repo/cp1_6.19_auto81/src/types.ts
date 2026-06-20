export type ComponentType =
  | 'button'
  | 'input'
  | 'card'
  | 'navbar'
  | 'table'
  | 'text'
  | 'image'
  | 'checkbox'
  | 'select'
  | 'textarea'
  | 'divider'
  | 'avatar'
  | 'badge'
  | 'switch'
  | 'slider'
  | 'progress'

export interface UIComponentProps {
  x: number
  y: number
  width: number
  height: number
  text?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: number
  placeholder?: string
  borderColor?: string
  fontSize?: number
  fontWeight?: string
  opacity?: number
}

export interface UIComponent {
  id: string
  type: ComponentType
  props: UIComponentProps
  children?: UIComponent[]
}

export interface CanvasState {
  offsetX: number
  offsetY: number
  scale: number
  isDragging: boolean
}

export type AnnotationType = 'text' | 'arrow' | 'dimension'

export interface Annotation {
  id: string
  type: AnnotationType
  x: number
  y: number
  content?: string
  endX?: number
  endY?: number
  color?: string
  sourceId?: string
  targetId?: string
  width?: number
}

export type ToolMode = 'select' | 'text-annotation' | 'arrow-annotation' | 'dimension-annotation'

export interface AppState {
  components: UIComponent[]
  selectedId: string | null
  canvas: CanvasState
  annotations: Annotation[]
  toolMode: ToolMode
  showPropertyPanel: boolean
  arrowStart: { x: number; y: number } | null
  isMobile: boolean
  inputPanelCollapsed: boolean

  addComponent: (component: UIComponent) => void
  addComponents: (components: UIComponent[]) => void
  updateComponent: (id: string, props: Partial<UIComponentProps>) => void
  removeComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  setCanvas: (partial: Partial<CanvasState>) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  selectAnnotation: (id: string | null) => void
  selectedAnnotationId: string | null
  setToolMode: (mode: ToolMode) => void
  setArrowStart: (start: { x: number; y: number } | null) => void
  setIsMobile: (v: boolean) => void
  setInputPanelCollapsed: (v: boolean) => void
}
