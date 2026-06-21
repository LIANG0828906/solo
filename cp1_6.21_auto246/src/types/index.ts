export type ComponentType = 'button' | 'input' | 'text' | 'image' | 'container'

export interface ComponentStyle {
  backgroundColor: string
  color: string
  fontSize: number
  borderColor: string
  borderWidth: number
  borderRadius: number
  boxShadow: string
  padding: number
}

export interface CanvasComponent {
  id: string
  type: ComponentType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  style: ComponentStyle
  content?: string
  src?: string
  placeholder?: string
  children?: CanvasComponent[]
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  components: CanvasComponent[]
}

export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  components: CanvasComponent[]
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

export const defaultStyle: ComponentStyle = {
  backgroundColor: '#FFFFFF',
  color: '#0F172A',
  fontSize: 14,
  borderColor: '#CBD5E1',
  borderWidth: 1,
  borderRadius: 8,
  boxShadow: 'none',
  padding: 8,
}

export const componentDefaults: Record<ComponentType, Partial<CanvasComponent>> = {
  button: {
    width: 120,
    height: 44,
    content: '按钮',
    style: {
      ...defaultStyle,
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      borderWidth: 0,
    },
  },
  input: {
    width: 240,
    height: 44,
    placeholder: '请输入内容',
    style: {
      ...defaultStyle,
      backgroundColor: '#FFFFFF',
      borderColor: '#CBD5E1',
    },
  },
  text: {
    width: 200,
    height: 32,
    content: '文本内容',
    style: {
      ...defaultStyle,
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  },
  image: {
    width: 200,
    height: 150,
    src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20abstract%20gradient&image_size=square',
    style: {
      ...defaultStyle,
      backgroundColor: '#F1F5F9',
      borderWidth: 0,
    },
  },
  container: {
    width: 400,
    height: 300,
    style: {
      ...defaultStyle,
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
    },
  },
}
