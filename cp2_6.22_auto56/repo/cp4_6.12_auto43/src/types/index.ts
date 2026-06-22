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
