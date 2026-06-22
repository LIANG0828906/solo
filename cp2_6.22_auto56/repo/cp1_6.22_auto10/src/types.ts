export type ShapeType = 'circle' | 'rect' | 'triangle' | 'line' | 'path'

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  rotation?: number
  points?: string
  fill: string
  stroke: string
  strokeWidth: number
}

export interface User {
  id: string
  username: string
  color: string
  cursor?: { x: number; y: number }
}

export type Tool = 'select' | ShapeType

export type ClientMessage =
  | { type: 'INIT' }
  | { type: 'ADD_SHAPE'; shape: Shape }
  | { type: 'UPDATE_SHAPE'; id: string; updates: Partial<Shape> }
  | { type: 'DELETE_SHAPE'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'CURSOR'; x: number; y: number; username: string; color: string }
  | { type: 'USER_LEAVE' }

export type ServerMessage =
  | { type: 'INIT'; shapes: Shape[]; users: User[]; userId: string }
  | { type: 'SHAPE_ADDED'; shape: Shape }
  | { type: 'SHAPE_UPDATED'; id: string; updates: Partial<Shape> }
  | { type: 'SHAPE_DELETED'; id: string }
  | { type: 'ALL_CLEARED' }
  | { type: 'CURSOR_UPDATE'; userId: string; x: number; y: number; username: string; color: string }
  | { type: 'USER_JOINED'; user: User }
  | { type: 'USER_LEFT'; userId: string }

export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'clear'
  shape?: Shape
  previousShapes?: Shape[]
  previousState?: Shape
  id?: string
}
