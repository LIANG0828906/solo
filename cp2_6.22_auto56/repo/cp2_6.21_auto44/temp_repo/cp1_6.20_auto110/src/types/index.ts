export type ComponentType = 'button' | 'card' | 'input' | 'navbar' | 'badge' | 'canvas'

export type AnimationType = 'fadeIn' | 'slideUp' | 'none'

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none'

export interface ComponentBase {
  id: string
  type: ComponentType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface ButtonComponent extends ComponentBase {
  type: 'button'
  text: string
  backgroundColor: string
  textColor: string
  borderRadius: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  borderStyle: BorderStyle
  borderWidth: number
  borderColor: string
}

export interface CardComponent extends ComponentBase {
  type: 'card'
  title: string
  description: string
  imageUrl: string
  margin: number
  animationType: AnimationType
}

export interface InputComponent extends ComponentBase {
  type: 'input'
  placeholder: string
  borderColor: string
  focusColor: string
  disabled: boolean
}

export interface NavbarComponent extends ComponentBase {
  type: 'navbar'
  brandText: string
  links: string[]
  backgroundColor: string
}

export interface BadgeComponent extends ComponentBase {
  type: 'badge'
  text: string
  backgroundColor: string
  textColor: string
}

export interface CanvasComponent extends ComponentBase {
  type: 'canvas'
  backgroundColor: string
  borderRadius: number
}

export type Component =
  | ButtonComponent
  | CardComponent
  | InputComponent
  | NavbarComponent
  | BadgeComponent
  | CanvasComponent

export interface Template {
  id: string
  name: string
  description: string
  thumbnail?: string
  components: Component[]
  createdAt: number
  updatedAt: number
}
