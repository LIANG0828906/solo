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

interface WaterErosionParams {
  erosionRate: number
  depositionRate: number
  evaporationRate: number
  sedimentCapacity: number
  dropCountRatio: number
  maxSteps: number
  stepSize: number
}

const DEFAULT_WATER_EROSION_PARAMS: WaterErosionParams = {
  erosionRate: 0.002,
  depositionRate: 0.001,
  evaporationRate: 0.02,
  sedimentCapacity: 0.3,
  dropCountRatio: 0.05,
  maxSteps: 30,
  stepSize: 0.5,
}

function waterErosion(
  heightMap: Float32Array,
  gridSize: number,
  intensity: number,
  iterations: number,
  customParams?: Partial<WaterErosionParams>
): Float32Array {
  const params = { ...DEFAULT_WATER_EROSION_PARAMS, ...customParams }
  const result = new Float32Array(heightMap)
  
  // 侵蚀速率与强度成正比，控制单位时间内从地表剥离的物质体积
  // 公式: erosionAmount = (capacity - sediment) * erosionRate * intensity
  const erosionRate = params.erosionRate * intensity
  
  // 沉积速率控制泥沙从水流中析出的速度
  // 公式: depositAmount = (sediment - capacity) * depositionRate * intensity
  const depositionRate = params.depositionRate * intensity
  
  // 水滴数量：与网格面积和强度成正比
  // 每个水滴代表一定体积的水流，沿坡度方向侵蚀地表
  const numDrops = Math.floor(gridSize * gridSize * params.dropCountRatio * Math.min(1, intensity))
  
  for (let iter = 0; iter < iterations; iter++) {
    for (let d = 0; d < numDrops; d++) {
      // 在地形上随机生成水滴
      let x = Math.random() * (gridSize - 2) + 1
      let y = Math.random() * (gridSize - 2) + 1
      let water = 1.0       // 水滴的水量（体积）
      let sediment = 0.0    // 水滴携带的泥沙量
      
      // 水滴沿坡度流动，直到蒸发或到达边界
      for (let step = 0; step < params.maxSteps; step++) {
        const xi = Math.floor(x)
        const yi = Math.floor(y)
        
        if (xi < 1 || xi >= gridSize - 1 || yi < 1 || yi >= gridSize - 1) break
        
        // 计算当前位置的坡度梯度
        // gradient = (h(x+1) - h(x-1), h(x) - h(x-1) + (h(x+1) - h(x)) + ...，用中心差分近似
        const gradient = getGradient(result, x, y, gridSize)
        const currentHeight = getHeight(result, x, y, gridSize)
        
        // 水流方向：沿坡度最陡方向（负梯度方向）
        // flow_dir = -normalize(gradient)
        const dx = -gradient.gx
        const dy = -gradient.gy
        
        const gradLen = Math.sqrt(dx * dx + dy * dy)
        if (gradLen < 0.001) break // 地形平坦，水流停止
        
        // 归一化方向并按步长移动
        const moveX = (dx / gradLen) * params.stepSize
        const moveY = (dy / gradLen) * params.stepSize
        
        const newX = x + moveX
        const newY = y + moveY
        
        if (newX < 1 || newX >= gridSize - 1 || newY < 1 || newY >= gridSize - 1) break
        
        const newHeight = getHeight(result, newX, newY, gridSize)
        const heightDiff = currentHeight - newHeight // 高程差（正值表示向下流动）
        
        // 泥沙容量公式: capacity = height_diff * water * sediment_capacity
        // 物理意义：水流速度越快（高差越大）、水量越大，能携带的泥沙越多
        const capacity = Math.max(0, heightDiff * water * params.sedimentCapacity)
        
        if (sediment > capacity) {
          // 沉积：当携带泥沙超过容量时，多余泥沙沉积到地面
          // 沉积量 = (当前泥沙量 - 容量) * 沉积速率
          const deposit = (sediment - capacity) * depositionRate
          const idx = yi * gridSize + xi
          result[idx] += deposit
          sediment -= deposit
        } else {
          // 侵蚀：当携带泥沙低于容量时，从地面侵蚀泥沙
          // 侵蚀量 = min((容量 - 当前泥沙量) * 侵蚀速率, 高差 * 0.5)
          // 限制侵蚀量不超过高差的一半，避免过度侵蚀造成尖刺
          const erode = Math.min((capacity - sediment) * erosionRate, heightDiff * 0.5)
          const idx = yi * gridSize + xi
          result[idx] -= erode
          sediment += erode
        }
        
        // 移动到下一个位置
        x = newX
        y = newY
        // 水分蒸发，水量随流动距离递减
        water *= (1 - params.evaporationRate)
      }
    }
  }
  
  return result
}

interface WindErosionParams {
  windDirectionX: number
  windDirectionY: number
  erosionCoeff: number
  depositionRatio: number
  fetchDistance: number
  depositDistance: number
}

const DEFAULT_WIND_EROSION_PARAMS: WindErosionParams = {
  windDirectionX: 1.0,
  windDirectionY: 0.3,
  erosionCoeff: 0.001,
  depositionRatio: 0.7,
  fetchDistance: 2,
  depositDistance: 3,
}

function windErosion(
  heightMap: Float32Array,
  gridSize: number,
  windSpeed: number,
  iterations: number,
  customParams?: Partial<WindErosionParams>
): Float32Array {
  const params = { ...DEFAULT_WIND_EROSION_PARAMS, ...customParams }
  const result = new Float32Array(heightMap)
  
  // 归一化风向向量
  const windLen = Math.sqrt(params.windDirectionX * params.windDirectionX + params.windDirectionY * params.windDirectionY)
  const wdx = params.windDirectionX / windLen
  const wdy = params.windDirectionY / windLen
  
  // 风蚀强度与风速成正比
  // 公式: erosion_intensity = wind_speed * erosion_coeff
  // 物理意义：风速越大，风的携沙能力越强，侵蚀越剧烈
  const intensity = windSpeed * params.erosionCoeff
  
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Float32Array(result)
    
    // 遍历每个网格点，计算风蚀作用
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        const idx = y * gridSize + x
        const currentH = result[idx]
        
        // 获取上风向位置的高程（迎风面）
        const upX = Math.floor(x - wdx * params.fetchDistance)
        const upY = Math.floor(y - wdy * params.fetchDistance)
        
        if (upX < 0 || upX >= gridSize || upY < 0 || upY >= gridSize) continue
        
        const upIdx = upY * gridSize + upX
        const upH = result[upIdx]
        
        // 计算迎风面坡度
        // slope = (当前高度 - 上风向高度) / 距离
        const slope = (currentH - upH) / params.fetchDistance
        
        // 迎风面（坡度>0）发生侵蚀
        // 侵蚀量 = 坡度 * 风蚀强度
        // 物理意义：坡度越陡，风的紊流越强，侵蚀越严重
        if (slope > 0) {
          const erosion = slope * intensity
          temp[idx] -= erosion
          
          // 泥沙在下风向沉积
          // 沉积量 = 侵蚀量 * 沉积比例
          const downX = Math.floor(x + wdx * params.depositDistance)
          const downY = Math.floor(y + wdy * params.depositDistance)
          
          if (downX >= 0 && downX < gridSize && downY >= 0 && downY < gridSize) {
            const downIdx = downY * gridSize + downX
            temp[downIdx] += erosion * params.depositionRatio
          }
        }
      }
    }
    
    // 应用侵蚀结果并限制高度范围
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.max(0, Math.min(1, temp[i]))
    }
  }
  
  return result
}

interface GlacierErosionParams {
  erosionCoeff: number
  valleyWidthCoeff: number
  depositionRatio: number
  minGradient: number
  minHeight: number
  searchRadius: number
}

const DEFAULT_GLACIER_EROSION_PARAMS: GlacierErosionParams = {
  erosionCoeff: 0.0025,
  valleyWidthCoeff: 0.5,
  depositionRatio: 0.1,
  minGradient: 0.01,
  minHeight: 0.2,
  searchRadius: 1,
}

function glacierErosion(
  heightMap: Float32Array,
  gridSize: number,
  strength: number,
  iterations: number,
  customParams?: Partial<GlacierErosionParams>
): Float32Array {
  const params = { ...DEFAULT_GLACIER_EROSION_PARAMS, ...customParams }
  const result = new Float32Array(heightMap)
  
  // 冰川侵蚀强度与冰川强度成正比
  // 公式: intensity = strength * erosion_coeff
  // 物理意义：冰川越厚（强度越大），刨蚀作用越强，U型谷越宽
  const intensity = strength * params.erosionCoeff
  
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Float32Array(result)
    
    // 遍历每个网格点，模拟冰川刨蚀作用
    for (let y = 2; y < gridSize - 2; y++) {
      for (let x = 2; x < gridSize - 2; x++) {
        const idx = y * gridSize + x
        const currentH = result[idx]
        
        // 在邻域内寻找最大坡度方向（冰川流动方向）
        // 冰川沿山谷向下流动，寻找最陡的下坡方向
        let maxGradient = 0
        let maxGX = 0
        let maxGY = 0
        
        for (let dy = -params.searchRadius; dy <= params.searchRadius; dy++) {
          for (let dx = -params.searchRadius; dx <= params.searchRadius; dx++) {
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
        
        // 冰川只在有一定坡度且高度足够的地方发生侵蚀
        // 冰川侵蚀形成U型谷的机制：底部刨蚀 + 两侧磨蚀
        if (maxGradient > params.minGradient && currentH > params.minHeight) {
          // 底部刨蚀量 = 坡度 * 侵蚀强度
          // 坡度越陡，冰川流速越快，侵蚀越强
          const erosion = maxGradient * intensity
          temp[idx] -= erosion
          
          // U型谷宽度与冰川强度成正比
          // 公式: valley_width = floor(strength * valley_width_coeff)
          const valleyWidth = Math.floor(strength * params.valleyWidthCoeff)
          
          // 计算冰川流动方向的垂直方向（山谷横断面方向）
          const perpX = -maxGY
          const perpY = maxGX
          
          // 在山谷两侧沉积侵蚀下来的物质，形成U型谷剖面
          // 沉积量随距离中心的距离递减（抛物线分布）
          for (let w = -valleyWidth; w <= valleyWidth; w++) {
            const vx = Math.floor(x + perpX * w * 0.5)
            const vy = Math.floor(y + perpY * w * 0.5)
            
            if (vx >= 2 && vx < gridSize - 2 && vy >= 2 && vy < gridSize - 2) {
              const vIdx = vy * gridSize + vx
              // 距离衰减因子：中心最小，边缘最大（U型谷两侧堆积）
              const distFactor = 1 - Math.abs(w) / (valleyWidth + 1)
              temp[vIdx] += erosion * params.depositionRatio * distFactor
            }
          }
        }
      }
    }
    
    // 应用侵蚀结果并限制高度范围
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.max(0, Math.min(1, temp[i]))
    }
  }
  
  return result
}

/**
 * 综合侵蚀处理函数
 * 
 * 依次应用水力侵蚀、风蚀和冰川侵蚀三种作用
 * 每种侵蚀类型的强度由对应的参数控制
 * 
 * 算法流程：
 * 1. 水力侵蚀：雨滴沿坡度流动，侵蚀地表并携带泥沙，在流速减缓处沉积
 *    - 控制参数：水流量（0-50单位/秒），影响沟壑切割深度和宽度
 * 
 * 2. 风蚀：风沿水平方向搬运地表颗粒，迎风面侵蚀，背风面沉积
 *    - 控制参数：风速（0-100m/s），影响地表颗粒剥离速率
 * 
 * 3. 冰川侵蚀：冰川沿山谷向下移动，刨蚀形成U型谷
 *    - 控制参数：冰川强度（0-10级），影响U型谷的宽度和坡度
 * 
 * @param heightMap 地形高度图（一维Float32Array，按行优先存储）
 * @param params 侵蚀参数对象，包含风速、水流量、冰川强度、网格大小
 * @param steps 迭代步数，每步代表一次完整的侵蚀循环
 * @returns 更新后的高度图数组
 */
export function processErosion(
  heightMap: Float32Array,
  params: ErosionParams,
  steps: number = 1
): Float32Array {
  let result = new Float32Array(heightMap)
  const gridSize = params.gridSize
  
  // 水力侵蚀：强度归一化为 0-1 范围
  if (params.waterFlow > 0) {
    result = waterErosion(result, gridSize, params.waterFlow / 50, steps)
  }
  
  // 风蚀：强度归一化为 0-1 范围
  if (params.windSpeed > 0) {
    result = windErosion(result, gridSize, params.windSpeed / 100, steps)
  }
  
  // 冰川侵蚀：强度归一化为 0-1 范围
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
