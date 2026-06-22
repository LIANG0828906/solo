export type ToolType = 'select' | 'rect' | 'circle' | 'line' | 'arrow' | 'text'

export interface Point {
  x: number
  y: number
}

export interface BaseShape {
  id: string
  type: string
  selected?: boolean
}

export interface RectShape extends BaseShape {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export interface CircleShape extends BaseShape {
  type: 'circle'
  cx: number
  cy: number
  r: number
}

export interface LineShape extends BaseShape {
  type: 'line'
  start: Point
  end: Point
}

export interface ArrowShape extends BaseShape {
  type: 'arrow'
  start: Point
  end: Point
}

export interface TextShape extends BaseShape {
  type: 'text'
  x: number
  y: number
  text: string
}

export type Shape = RectShape | CircleShape | LineShape | ArrowShape | TextShape
