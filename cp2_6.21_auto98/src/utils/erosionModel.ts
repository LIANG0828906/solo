export interface ErosionParams {
  windSpeed: number
  waterFlow: number
  glacierStrength: number
  gridSize: number
}

export interface Snapshot {
  id: string
  name: string
  heightMap: Float32Array
  timestamp: number
  params: ErosionParams
}

export type TerrainType = 'mountain' | 'basin' | 'plain' | 'volcano'

const GRID_SIZE = 200

function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

function smoothNoise(x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  
  const v00 = hash(x0, y0)
  const v10 = hash(x0 + 1, y0)
  const v01 = hash(x0, y0 + 1)
  const v11 = hash(x0 + 1, y0 + 1)
  
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  
  const v0 = v00 * (1 - sx) + v10 * sx
  const v1 = v01 * (1 - sx) + v11 * sx
  
  return v0 * (1 - sy) + v1 * sy
}

function fbm(x: number, y: number, octaves: number = 6): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency)
    amplitude *= 0.5
    frequency *= 2
  }
  
  return value
}

export function generateTerrain(type: TerrainType, gridSize: number = GRID_SIZE): Float32Array {
  const heightMap = new Float32Array(gridSize * gridSize)
  const center = gridSize / 2
  const maxDist = Math.sqrt(2) * center
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = y * gridSize + x
      const dx = (x - center) / center
      const dy = (y - center) / center
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      let height = 0
      
      switch (type) {
        case 'mountain': {
          const noise = fbm(x * 0.03, y * 0.03, 6)
          const mountainShape = Math.max(0, 1 - dist * 0.8)
          height = noise * 0.6 + mountainShape * 0.8
          height += fbm(x * 0.08, y * 0.08, 4) * 0.15
          break
        }
        case 'basin': {
          const noise = fbm(x * 0.04, y * 0.04, 5)
          const basinShape = dist * dist * 0.7 - 0.3
          height = basinShape + noise * 0.15
          height = Math.max(-0.5, Math.min(0.5, height))
          break
        }
        case 'plain': {
          const noise = fbm(x * 0.02, y * 0.02, 4)
          height = noise * 0.15 + 0.05
          height += fbm(x * 0.08, y * 0.08, 3) * 0.05
          break
        }
        case 'volcano': {
          const noise = fbm(x * 0.05, y * 0.05, 5)
          const craterDist = Math.max(0, dist - 0.15)
          const volcanoShape = Math.max(0, 1 - craterDist * 1.5)
          const crater = dist < 0.2 ? (0.2 - dist) * 2 : 0
          height = volcanoShape * 0.9 - crater * 0.5 + noise * 0.1
          break
        }
      }
      
      heightMap[idx] = Math.max(0, Math.min(1, height))
    }
  }
  
  return heightMap
}

function getHeight(heightMap: Float32Array, x: number, y: number, gridSize: number): number {
  const xi = Math.floor(Math.max(0, Math.min(gridSize - 1, x)))
  const yi = Math.floor(Math.max(0, Math.min(gridSize - 1, y)))
  return heightMap[yi * gridSize + xi]
}

function getGradient(heightMap: Float32Array, x: number, y: number, gridSize: number): { gx: number; gy: number } {
  const hL = getHeight(heightMap, x - 1, y, gridSize)
  const hR = getHeight(heightMap, x + 1, y, gridSize)
  const hU = getHeight(heightMap, x, y - 1, gridSize)
  const hD = getHeight(heightMap, x, y + 1, gridSize)
  
  return {
    gx: (hR - hL) * 0.5,
    gy: (hD - hU) * 0.5
  }
}

function waterErosion(
  heightMap: Float32Array,
  gridSize: number,
  intensity: number,
  iterations: number
): Float32Array {
  const result = new Float32Array(heightMap)
  const erosionRate = intensity * 0.002
  const depositionRate = intensity * 0.001
  const evaporationRate = 0.02
  const sedimentCapacity = 0.3
  
  const numDrops = Math.floor(gridSize * gridSize * 0.05 * Math.min(1, intensity))
  
  for (let i = 0; i < iterations; i++) {
    for (let d = 0; d < numDrops; d++) {
      let x = Math.random() * (gridSize - 2) + 1
      let y = Math.random() * (gridSize - 2) + 1
      let water = 1.0
      let sediment = 0.0
      
      const maxSteps = 30
      
      for (let step = 0; step < maxSteps; step++) {
        const xi = Math.floor(x)
        const yi = Math.floor(y)
        
        if (xi < 1 || xi >= gridSize - 1 || yi < 1 || yi >= gridSize - 1) break
        
        const gradient = getGradient(result, x, y, gridSize)
        const currentHeight = getHeight(result, x, y, gridSize)
        
        const dx = -gradient.gx
        const dy = -gradient.gy
        
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.001) break
        
        const moveX = (dx / len) * 0.5
        const moveY = (dy / len) * 0.5
        
        const newX = x + moveX
        const newY = y + moveY
        
        if (newX < 1 || newX >= gridSize - 1 || newY < 1 || newY >= gridSize - 1) break
        
        const newHeight = getHeight(result, newX, newY, gridSize)
        const heightDiff = currentHeight - newHeight
        
        const capacity = Math.max(0, heightDiff * water * sedimentCapacity)
        
        if (sediment > capacity) {
          const deposit = (sediment - capacity) * depositionRate
          const idx = yi * gridSize + xi
          result[idx] += deposit
          sediment -= deposit
        } else {
          const erode = Math.min((capacity - sediment) * erosionRate, heightDiff * 0.5)
          const idx = yi * gridSize + xi
          result[idx] -= erode
          sediment += erode
        }
        
        x = newX
        y = newY
        water *= (1 - evaporationRate)
      }
    }
  }
  
  return result
}

function windErosion(
  heightMap: Float32Array,
  gridSize: number,
  windSpeed: number,
  iterations: number
): Float32Array {
  const result = new Float32Array(heightMap)
  const windDirX = 1.0
  const windDirY = 0.3
  const windLen = Math.sqrt(windDirX * windDirX + windDirY * windDirY)
  const wdx = windDirX / windLen
  const wdy = windDirY / windLen
  
  const intensity = windSpeed * 0.01
  
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Float32Array(result)
    
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        const idx = y * gridSize + x
        const currentH = result[idx]
        
        const upX = Math.floor(x - wdx * 2)
        const upY = Math.floor(y - wdy * 2)
        
        if (upX < 0 || upX >= gridSize || upY < 0 || upY >= gridSize) continue
        
        const upIdx = upY * gridSize + upX
        const upH = result[upIdx]
        
        const slope = (currentH - upH) / 2
        
        if (slope > 0) {
          const erosion = slope * intensity * 0.1
          temp[idx] -= erosion
          
          const downX = Math.floor(x + wdx * 3)
          const downY = Math.floor(y + wdy * 3)
          
          if (downX >= 0 && downX < gridSize && downY >= 0 && downY < gridSize) {
            const downIdx = downY * gridSize + downX
            temp[downIdx] += erosion * 0.7
          }
        }
      }
    }
    
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.max(0, Math.min(1, temp[i]))
    }
  }
  
  return result
}

function glacierErosion(
  heightMap: Float32Array,
  gridSize: number,
  strength: number,
  iterations: number
): Float32Array {
  const result = new Float32Array(heightMap)
  const intensity = strength * 0.05
  
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Float32Array(result)
    
    for (let y = 2; y < gridSize - 2; y++) {
      for (let x = 2; x < gridSize - 2; x++) {
        const idx = y * gridSize + x
        const currentH = result[idx]
        
        let maxGradient = 0
        let maxGX = 0
        let maxGY = 0
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx
            const ny = y + dy
            const nIdx = ny * gridSize + nx
            const grad = (currentH - result[nIdx]) / Math.sqrt(dx * dx + dy * dy)
            if (grad > maxGradient) {
              maxGradient = grad
              maxGX = dx
              maxGY = dy
            }
          }
        }
        
        if (maxGradient > 0.01 && currentH > 0.2) {
          const erosion = maxGradient * intensity * 0.05
          temp[idx] -= erosion
          
          const valleyWidth = Math.floor(strength * 0.5)
          const perpX = -maxGY
          const perpY = maxGX
          
          for (let w = -valleyWidth; w <= valleyWidth; w++) {
            const vx = Math.floor(x + perpX * w * 0.5)
            const vy = Math.floor(y + perpY * w * 0.5)
            
            if (vx >= 2 && vx < gridSize - 2 && vy >= 2 && vy < gridSize - 2) {
              const vIdx = vy * gridSize + vx
              const distFactor = 1 - Math.abs(w) / (valleyWidth + 1)
              temp[vIdx] += erosion * 0.1 * distFactor
            }
          }
        }
      }
    }
    
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.max(0, Math.min(1, temp[i]))
    }
  }
  
  return result
}

export function processErosion(
  heightMap: Float32Array,
  params: ErosionParams,
  steps: number = 1
): Float32Array {
  let result = new Float32Array(heightMap)
  const gridSize = params.gridSize
  
  if (params.waterFlow > 0) {
    result = waterErosion(result, gridSize, params.waterFlow / 50, steps)
  }
  
  if (params.windSpeed > 0) {
    result = windErosion(result, gridSize, params.windSpeed / 100, steps)
  }
  
  if (params.glacierStrength > 0) {
    result = glacierErosion(result, gridSize, params.glacierStrength / 10, steps)
  }
  
  return result
}

export function getProfile(
  heightMap: Float32Array,
  gridSize: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  numPoints: number = 100
): { heights: number[]; maxHeight: number; minHeight: number; avgHeight: number } {
  const heights: number[] = []
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t
    
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    
    const x0 = Math.max(0, Math.min(gridSize - 1, xi))
    const y0 = Math.max(0, Math.min(gridSize - 1, yi))
    const x1c = Math.max(0, Math.min(gridSize - 1, xi + 1))
    const y1c = Math.max(0, Math.min(gridSize - 1, yi + 1))
    
    const h00 = heightMap[y0 * gridSize + x0]
    const h10 = heightMap[y0 * gridSize + x1c]
    const h01 = heightMap[y1c * gridSize + x0]
    const h11 = heightMap[y1c * gridSize + x1c]
    
    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx
    const h = h0 * (1 - fy) + h1 * fy
    
    heights.push(h)
  }
  
  let maxH = -Infinity
  let minH = Infinity
  let sum = 0
  
  for (const h of heights) {
    maxH = Math.max(maxH, h)
    minH = Math.min(minH, h)
    sum += h
  }
  
  return {
    heights,
    maxHeight: maxH,
    minHeight: minH,
    avgHeight: sum / heights.length
  }
}

export function getWaterFlowPaths(
  heightMap: Float32Array,
  gridSize: number,
  numParticles: number
): { x: number; y: number; dx: number; dy: number }[] {
  const particles: { x: number; y: number; dx: number; dy: number }[] = []
  
  for (let i = 0; i < numParticles; i++) {
    const startX = Math.random() * (gridSize - 2) + 1
    const startY = Math.random() * (gridSize - 2) + 1
    
    let x = startX
    let y = startY
    
    const maxSteps = 15
    
    for (let step = 0; step < maxSteps; step++) {
      const gradient = getGradient(heightMap, x, y, gridSize)
      
      const dx = -gradient.gx
      const dy = -gradient.gy
      
      const len = Math.sqrt(dx * dx + dy * dy)
      
      if (len < 0.001) break
      
      const moveX = (dx / len) * 0.3
      const moveY = (dy / len) * 0.3
      
      x += moveX
      y += moveY
      
      if (x < 1 || x >= gridSize - 1 || y < 1 || y >= gridSize - 1) break
    }
    
    const finalGradient = getGradient(heightMap, Math.floor(x), Math.floor(y), gridSize)
    const dx = -finalGradient.gx
    const dy = -finalGradient.gy
    const finalLen = Math.sqrt(dx * dx + dy * dy)
    
    particles.push({
      x: Math.floor(startX),
      y: Math.floor(startY),
      dx: finalLen > 0 ? dx / finalLen : 0,
      dy: finalLen > 0 ? dy / finalLen : 0
    })
  }
  
  return particles
}
