export function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize
}

export function getNodeCenter(x: number, y: number, width: number, height: number): { x: number; y: number } {
  return {
    x: x + width / 2,
    y: y + height / 2
  }
}

export function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const offset = Math.abs(x2 - x1) * 0.5
  const cx1 = x1 + offset
  const cy1 = y1
  const cx2 = x2 - offset
  const cy2 = y2
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}

export function getPortPosition(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  port: 'input' | 'output'
): { x: number; y: number } {
  const centerX = nodeX + nodeWidth / 2
  if (port === 'input') {
    return { x: centerX, y: nodeY }
  } else {
    return { x: centerX, y: nodeY + nodeHeight }
  }
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export function isPointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}
