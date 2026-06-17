export interface ForceFieldParams {
  x: number
  y: number
  forceX: number
  forceY: number
  strength: number
  radius: number
}

const MAX_DEFLECTION_ANGLE = (30 * Math.PI) / 180

export function applyForce(
  particles: Float32Array,
  positions: Float32Array,
  params: ForceFieldParams
): void {
  const { x, y, forceX, forceY, strength, radius } = params
  const particleCount = positions.length / 3

  if (strength <= 0 || radius <= 0) return

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    const px = positions[i3]
    const py = positions[i3 + 1]

    const dx = px - x
    const dy = py - y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius && dist > 0) {
      const falloff = 1 - dist / radius
      const influence = falloff * falloff * strength

      const vx = particles[i3]
      const vy = particles[i3 + 1]
      const speed = Math.sqrt(vx * vx + vy * vy) || 0.001

      const newVx = vx + forceX * influence * 0.01
      const newVy = vy + forceY * influence * 0.01

      const originalAngle = Math.atan2(vy, vx)
      const newAngle = Math.atan2(newVy, newVx)
      let angleDiff = newAngle - originalAngle

      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

      const maxDeflection = MAX_DEFLECTION_ANGLE * falloff
      if (Math.abs(angleDiff) > maxDeflection) {
        const clampedAngle = originalAngle + Math.sign(angleDiff) * maxDeflection
        particles[i3] = Math.cos(clampedAngle) * speed
        particles[i3 + 1] = Math.sin(clampedAngle) * speed
      } else {
        const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy) || 0.001
        particles[i3] = (newVx / newSpeed) * speed
        particles[i3 + 1] = (newVy / newSpeed) * speed
      }
    }
  }
}

export function applyForceOnGrid(
  velocityGrid: Float32Array,
  gridSize: number,
  gridBounds: { minX: number; maxX: number; minY: number; maxY: number },
  params: ForceFieldParams
): void {
  const { x, y, forceX, forceY, strength, radius } = params
  const cellWidth = (gridBounds.maxX - gridBounds.minX) / gridSize
  const cellHeight = (gridBounds.maxY - gridBounds.minY) / gridSize

  if (strength <= 0 || radius <= 0) return

  const gridX = Math.floor((x - gridBounds.minX) / cellWidth)
  const gridY = Math.floor((y - gridBounds.minY) / cellHeight)
  const gridRadius = Math.ceil(radius / Math.min(cellWidth, cellHeight))

  for (let gy = gridY - gridRadius; gy <= gridY + gridRadius; gy++) {
    if (gy < 0 || gy >= gridSize) continue
    for (let gx = gridX - gridRadius; gx <= gridX + gridRadius; gx++) {
      if (gx < 0 || gx >= gridSize) continue

      const cellCenterX = gridBounds.minX + (gx + 0.5) * cellWidth
      const cellCenterY = gridBounds.minY + (gy + 0.5) * cellHeight

      const dx = cellCenterX - x
      const dy = cellCenterY - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < radius) {
        const falloff = 1 - dist / radius
        const influence = falloff * falloff * strength * 0.01

        const idx = (gy * gridSize + gx) * 2
        velocityGrid[idx] += forceX * influence
        velocityGrid[idx + 1] += forceY * influence
      }
    }
  }
}
