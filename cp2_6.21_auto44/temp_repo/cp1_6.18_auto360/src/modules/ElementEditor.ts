import { PostcardElement } from '../store/elementStore'

export type HandleType =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | 'rotate'

export const HANDLE_SIZE = 8

export interface HandlePosition {
  type: HandleType
  x: number
  y: number
  cursor: string
}

export function getHandles(el: PostcardElement): HandlePosition[] {
  const { x, y, width, height, rotation } = el
  const cx = x + width / 2
  const cy = y + height / 2
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const rotatePoint = (px: number, py: number): [number, number] => {
    const dx = px - cx
    const dy = py - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  }

  const corners: HandlePosition[] = [
    { type: 'nw', x: x, y: y, cursor: 'nwse-resize' },
    { type: 'n', x: x + width / 2, y: y, cursor: 'ns-resize' },
    { type: 'ne', x: x + width, y: y, cursor: 'nesw-resize' },
    { type: 'w', x: x, y: y + height / 2, cursor: 'ew-resize' },
    { type: 'e', x: x + width, y: y + height / 2, cursor: 'ew-resize' },
    { type: 'sw', x: x, y: y + height, cursor: 'nesw-resize' },
    { type: 's', x: x + width / 2, y: y + height, cursor: 'ns-resize' },
    { type: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
  ]

  return corners.map((h) => {
    const [rx, ry] = rotatePoint(h.x, h.y)
    return { ...h, x: rx, y: ry }
  })
}

export function getRotateHandle(el: PostcardElement): HandlePosition {
  const { x, y, width, height, rotation } = el
  const cx = x + width / 2
  const topY = y - 30
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = cx - cx
  const dy = topY - (y + height / 2)
  return {
    type: 'rotate',
    x: cx + dx * cos - dy * sin,
    y: (y + height / 2) + dx * sin + dy * cos,
    cursor: 'grab',
  }
}

export function hitTestHandle(
  el: PostcardElement,
  px: number,
  py: number
): HandleType | null {
  const tol = HANDLE_SIZE
  const handles = getHandles(el)
  for (const h of handles) {
    if (Math.abs(px - h.x) <= tol && Math.abs(py - h.y) <= tol) {
      return h.type
    }
  }
  const rh = getRotateHandle(el)
  if (Math.abs(px - rh.x) <= tol + 2 && Math.abs(py - rh.y) <= tol + 2) {
    return 'rotate'
  }
  return null
}

export function pointInElement(
  el: PostcardElement,
  px: number,
  py: number
): boolean {
  const { x, y, width, height, rotation } = el
  const cx = x + width / 2
  const cy = y + height / 2
  const rad = (-rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  const localX = cx + dx * cos - dy * sin
  const localY = cy + dx * sin + dy * cos
  return localX >= x && localX <= x + width && localY >= y && localY <= y + height
}

export interface TransformState {
  handle: HandleType
  startX: number
  startY: number
  original: PostcardElement
  aspectRatio: number
}

export function createTransformState(
  handle: HandleType,
  startX: number,
  startY: number,
  original: PostcardElement
): TransformState {
  return {
    handle,
    startX,
    startY,
    original,
    aspectRatio: original.width / original.height,
  }
}

export function applyTransform(
  ts: TransformState,
  currentX: number,
  currentY: number,
  shiftKey: boolean
): Partial<PostcardElement> {
  const { handle, startX, startY, original, aspectRatio } = ts
  const cx = original.x + original.width / 2
  const cy = original.y + original.height / 2
  const rad = (original.rotation * Math.PI) / 180
  const cos = Math.cos(-rad)
  const sin = Math.sin(-rad)

  const toLocal = (px: number, py: number): [number, number] => {
    const dx = px - cx
    const dy = py - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  }

  if (handle === 'rotate') {
    const startAngle = Math.atan2(startY - cy, startX - cx)
    const currAngle = Math.atan2(currentY - cy, currentX - cx)
    const rotation = original.rotation + ((currAngle - startAngle) * 180) / Math.PI
    return { rotation: Math.round(rotation * 10) / 10 }
  }

  const [sx, sy] = toLocal(startX, startY)
  const [cxL, cyL] = toLocal(currentX, currentY)
  const dx = cxL - sx
  const dy = cyL - sy

  let { x, y, width, height } = original

  switch (handle) {
    case 'nw':
      x += dx
      y += dy
      width -= dx
      height -= dy
      break
    case 'n':
      y += dy
      height -= dy
      break
    case 'ne':
      y += dy
      width += dx
      height -= dy
      break
    case 'w':
      x += dx
      width -= dx
      break
    case 'e':
      width += dx
      break
    case 'sw':
      x += dx
      width -= dx
      height += dy
      break
    case 's':
      height += dy
      break
    case 'se':
      width += dx
      height += dy
      break
  }

  if (shiftKey && handle !== 'n' && handle !== 's' && handle !== 'e' && handle !== 'w') {
    if (width / aspectRatio < height) {
      height = width / aspectRatio
    } else {
      width = height * aspectRatio
    }
    if (handle === 'nw') {
      x = original.x + original.width - width
      y = original.y + original.height - height
    } else if (handle === 'ne') {
      y = original.y + original.height - height
    } else if (handle === 'sw') {
      x = original.x + original.width - width
    }
  }

  const minSize = 20
  if (width < minSize) {
    if (handle === 'nw' || handle === 'w' || handle === 'sw') {
      x = original.x + original.width - minSize
    }
    width = minSize
  }
  if (height < minSize) {
    if (handle === 'nw' || handle === 'n' || handle === 'ne') {
      y = original.y + original.height - minSize
    }
    height = minSize
  }

  return { x, y, width, height }
}

export function applyMove(
  original: PostcardElement,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): Partial<PostcardElement> {
  return {
    x: original.x + (currentX - startX),
    y: original.y + (currentY - startY),
  }
}

export const PRESET_COLORS = [
  '#333333', '#E53935', '#FB8C00', '#FDD835',
  '#43A047', '#1E88E5', '#8E24AA', '#D81B60',
  '#8D6E63', '#90A4AE', '#5D4037', '#FFB300',
]
