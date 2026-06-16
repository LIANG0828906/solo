import * as THREE from 'three'
import type { DataSeries, DataPoint } from './types'

interface ChartOptions {
  color: string
  barWidth?: number
  barDepth?: number
  lineWidth?: number
  pointSize?: number
  hasZ?: boolean
  xRange?: [number, number]
  yRange?: [number, number]
  zRange?: [number, number]
  lodLevel?: number
}

interface ChartResult {
  group: THREE.Group
  objects: Map<number, THREE.Mesh>
  updateData: (data: DataPoint[], progress?: number) => void
  animateIn: () => void
  animateOut: () => Promise<void>
  dispose: () => void
}

const SPREAD_X = 20
const SPREAD_Z = 15
const MAX_Y = 10

function normalizeValue(val: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (val - min) / (max - min)
}

function createGradientMaterial(color: string, isEmissive = false): THREE.MeshStandardMaterial {
  const c = new THREE.Color(color)
  const darker = c.clone().multiplyScalar(0.6)
  const lighter = c.clone().multiplyScalar(1.2)
  
  const material = new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.4,
    metalness: 0.2,
    emissive: isEmissive ? lighter : new THREE.Color(0x000000),
    emissiveIntensity: isEmissive ? 0.3 : 0,
    transparent: true,
    opacity: 1
  })
  
  return material
}

export function createBars(
  series: DataSeries,
  options: ChartOptions
): ChartResult {
  const { color, barWidth = 0.6, barDepth = 0.6, xRange, yRange, hasZ, zRange } = options
  const group = new THREE.Group()
  const objects = new Map<number, THREE.Mesh>()
  
  const data = series.data
  const yMin = yRange ? yRange[0] : Math.min(...data.map(d => d.y), 0)
  const yMax = yRange ? yRange[1] : Math.max(...data.map(d => d.y))
  const xMin = xRange ? xRange[0] : 0
  const xMax = xRange ? xRange[1] : data.length - 1
  const zMin = zRange ? zRange[0] : 0
  const zMax = zRange ? zRange[1] : 1
  
  const geometry = new THREE.BoxGeometry(barWidth, 1, barDepth)
  
  data.forEach((point, index) => {
    const material = createGradientMaterial(color, true)
    
    const bar = new THREE.Mesh(geometry.clone(), material)
    
    const xPos = data.length > 1 
      ? -SPREAD_X / 2 + (index / (data.length - 1)) * SPREAD_X
      : 0
    
    const zPos = hasZ && point.z !== undefined
      ? -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
      : 0
    
    const height = Math.max(0.1, normalizeValue(point.y, yMin, yMax) * MAX_Y)
    
    bar.position.set(xPos, height / 2, zPos)
    bar.scale.y = height
    bar.userData = { 
      pointIndex: index, 
      seriesId: series.id,
      pointData: point,
      seriesName: series.name
    }
    
    bar.scale.set(0.001, 0.001, 0.001)
    bar.visible = false
    
    group.add(bar)
    objects.set(index, bar)
  })
  
  const updateData = (newData: DataPoint[], progress = 1) => {
    const visibleCount = Math.floor(newData.length * progress)
    
    newData.forEach((point, index) => {
      const bar = objects.get(index)
      if (!bar) return
      
      const isVisible = index < visibleCount
      bar.visible = isVisible
      
      if (isVisible) {
        const targetHeight = Math.max(0.1, normalizeValue(point.y, yMin, yMax) * MAX_Y)
        bar.scale.y = targetHeight
        bar.position.y = targetHeight / 2
        
        if (hasZ && point.z !== undefined) {
          bar.position.z = -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
        }
      }
    })
  }
  
  const animateIn = () => {
    const duration = 600
    const startTime = performance.now()
    const totalBars = data.length
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const visibleCount = Math.ceil(totalBars * eased)
      
      data.forEach((point, index) => {
        const bar = objects.get(index)
        if (!bar) return
        
        if (index < visibleCount) {
          bar.visible = true
          const localProgress = Math.min(1, (elapsed - (index / totalBars) * duration * 0.5) / (duration * 0.5))
          const localEased = 1 - Math.pow(1 - Math.max(0, localProgress), 3)
          
          const targetHeight = Math.max(0.1, normalizeValue(point.y, yMin, yMax) * MAX_Y)
          const scale = localEased
          bar.scale.set(scale, targetHeight * scale, scale)
          bar.position.y = (targetHeight * scale) / 2
          
          const mat = bar.material as THREE.MeshStandardMaterial
          mat.opacity = localEased
        } else {
          bar.visible = false
        }
      })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
  
  const animateOut = (): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 600
      const startTime = performance.now()
      
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(progress, 3)
        
        data.forEach((_, index) => {
          const bar = objects.get(index)
          if (!bar || !bar.visible) return
          
          bar.scale.setScalar(eased * 0.01)
          const mat = bar.material as THREE.MeshStandardMaterial
          mat.opacity = eased
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          group.visible = false
          resolve()
        }
      }
      
      animate()
    })
  }
  
  const dispose = () => {
    geometry.dispose()
    objects.forEach(obj => {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    })
  }
  
  return { group, objects, updateData, animateIn, animateOut, dispose }
}

export function createLine(
  series: DataSeries,
  options: ChartOptions
): ChartResult {
  const { color, lineWidth = 0.15, xRange, yRange, hasZ, zRange, pointSize = 0.25 } = options
  const group = new THREE.Group()
  const objects = new Map<number, THREE.Mesh>()
  
  const data = series.data
  const yMin = yRange ? yRange[0] : Math.min(...data.map(d => d.y), 0)
  const yMax = yRange ? yRange[1] : Math.max(...data.map(d => d.y))
  const xMin = xRange ? xRange[0] : 0
  const xMax = xRange ? xRange[1] : data.length - 1
  const zMin = zRange ? zRange[0] : 0
  const zMax = zRange ? zRange[1] : 1
  
  const lineColor = new THREE.Color(color)
  const glowColor = lineColor.clone().multiplyScalar(1.5)
  
  const points: THREE.Vector3[] = []
  data.forEach((point, index) => {
    const xPos = data.length > 1 
      ? -SPREAD_X / 2 + (index / (data.length - 1)) * SPREAD_X
      : 0
    
    const yPos = normalizeValue(point.y, yMin, yMax) * MAX_Y
    
    const zPos = hasZ && point.z !== undefined
      ? -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
      : 0
    
    points.push(new THREE.Vector3(xPos, yPos, zPos))
  })
  
  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(64, data.length * 4), lineWidth, 8, false)
  
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: lineColor,
    roughness: 0.3,
    metalness: 0.3,
    emissive: glowColor,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0
  })
  
  const lineMesh = new THREE.Mesh(tubeGeometry, lineMaterial)
  lineMesh.userData = { isLine: true, seriesId: series.id }
  group.add(lineMesh)
  
  const pointGeometry = new THREE.SphereGeometry(pointSize, 16, 16)
  
  data.forEach((point, index) => {
    const pointMaterial = new THREE.MeshStandardMaterial({
      color: lineColor,
      roughness: 0.3,
      metalness: 0.4,
      emissive: glowColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0
    })
    
    const sphere = new THREE.Mesh(pointGeometry.clone(), pointMaterial)
    
    const xPos = data.length > 1 
      ? -SPREAD_X / 2 + (index / (data.length - 1)) * SPREAD_X
      : 0
    
    const yPos = normalizeValue(point.y, yMin, yMax) * MAX_Y
    
    const zPos = hasZ && point.z !== undefined
      ? -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
      : 0
    
    sphere.position.set(xPos, yPos, zPos)
    sphere.userData = { 
      pointIndex: index, 
      seriesId: series.id,
      pointData: point,
      seriesName: series.name,
      isDataPoint: true
    }
    sphere.visible = false
    
    group.add(sphere)
    objects.set(index, sphere)
  })
  
  const updateData = (newData: DataPoint[], progress = 1) => {
    const visibleCount = Math.floor(newData.length * progress)
    
    newData.forEach((point, index) => {
      const sphere = objects.get(index)
      if (!sphere) return
      
      const isVisible = index < visibleCount
      sphere.visible = isVisible
      
      if (isVisible) {
        sphere.position.y = normalizeValue(point.y, yMin, yMax) * MAX_Y
        if (hasZ && point.z !== undefined) {
          sphere.position.z = -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
        }
      }
    })
  }
  
  const animateIn = () => {
    const duration = 600
    const startTime = performance.now()
    const totalPoints = data.length
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      lineMaterial.opacity = eased
      
      const visibleCount = Math.ceil(totalPoints * eased)
      data.forEach((point, index) => {
        const sphere = objects.get(index)
        if (!sphere) return
        
        if (index < visibleCount) {
          sphere.visible = true
          const mat = sphere.material as THREE.MeshStandardMaterial
          mat.opacity = eased
          
          const localProgress = Math.min(1, (elapsed - (index / totalPoints) * duration * 0.3) / (duration * 0.4))
          const localEased = 1 - Math.pow(1 - Math.max(0, localProgress), 3)
          sphere.scale.setScalar(localEased)
        } else {
          sphere.visible = false
        }
      })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
  
  const animateOut = (): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 600
      const startTime = performance.now()
      
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(progress, 3)
        
        lineMaterial.opacity = eased
        lineMesh.scale.setScalar(0.5 + eased * 0.5)
        
        objects.forEach(sphere => {
          const mat = sphere.material as THREE.MeshStandardMaterial
          mat.opacity = eased
          sphere.scale.setScalar(eased)
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          group.visible = false
          resolve()
        }
      }
      
      animate()
    })
  }
  
  const dispose = () => {
    tubeGeometry.dispose()
    lineMaterial.dispose()
    pointGeometry.dispose()
    objects.forEach(obj => {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    })
  }
  
  return { group, objects, updateData, animateIn, animateOut, dispose }
}

export function createScatter(
  series: DataSeries,
  options: ChartOptions
): ChartResult {
  const { color, pointSize = 0.35, xRange, yRange, hasZ, zRange, lodLevel = 0 } = options
  const group = new THREE.Group()
  const objects = new Map<number, THREE.Mesh>()
  
  const data = series.data
  const yMin = yRange ? yRange[0] : Math.min(...data.map(d => d.y), 0)
  const yMax = yRange ? yRange[1] : Math.max(...data.map(d => d.y))
  const xMin = xRange ? xRange[0] : 0
  const xMax = xRange ? xRange[1] : data.length - 1
  const zMin = zRange ? zRange[0] : 0
  const zMax = zRange ? zRange[1] : 1
  
  const sphereColor = new THREE.Color(color)
  const emissiveColor = sphereColor.clone().multiplyScalar(1.3)
  
  const segments = lodLevel > 0 ? 4 : 12
  const geometry = new THREE.SphereGeometry(pointSize, segments, segments)
  
  data.forEach((point, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: sphereColor,
      roughness: 0.35,
      metalness: 0.3,
      emissive: emissiveColor,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0
    })
    
    const sphere = new THREE.Mesh(geometry.clone(), material)
    
    const xPos = data.length > 1 
      ? -SPREAD_X / 2 + (index / (data.length - 1)) * SPREAD_X
      : 0
    
    const yPos = normalizeValue(point.y, yMin, yMax) * MAX_Y
    
    const zPos = hasZ && point.z !== undefined
      ? -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
      : 0
    
    sphere.position.set(xPos, yPos, zPos)
    sphere.userData = { 
      pointIndex: index, 
      seriesId: series.id,
      pointData: point,
      seriesName: series.name
    }
    sphere.scale.setScalar(0.01)
    sphere.visible = false
    
    group.add(sphere)
    objects.set(index, sphere)
  })
  
  const updateData = (newData: DataPoint[], progress = 1) => {
    const visibleCount = Math.floor(newData.length * progress)
    
    newData.forEach((point, index) => {
      const sphere = objects.get(index)
      if (!sphere) return
      
      const isVisible = index < visibleCount
      sphere.visible = isVisible
      
      if (isVisible) {
        sphere.position.y = normalizeValue(point.y, yMin, yMax) * MAX_Y
        if (hasZ && point.z !== undefined) {
          sphere.position.z = -SPREAD_Z / 2 + normalizeValue(point.z, zMin, zMax) * SPREAD_Z
        }
      }
    })
  }
  
  const animateIn = () => {
    const duration = 600
    const startTime = performance.now()
    const totalPoints = data.length
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const visibleCount = Math.ceil(totalPoints * eased)
      
      data.forEach((_, index) => {
        const sphere = objects.get(index)
        if (!sphere) return
        
        if (index < visibleCount) {
          sphere.visible = true
          
          const delay = (index / totalPoints) * duration * 0.5
          const localProgress = Math.min(1, Math.max(0, (elapsed - delay)) / (duration * 0.5))
          const localEased = 1 - Math.pow(1 - localProgress, 3)
          
          sphere.scale.setScalar(localEased)
          const mat = sphere.material as THREE.MeshStandardMaterial
          mat.opacity = localEased
        } else {
          sphere.visible = false
        }
      })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
  
  const animateOut = (): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 600
      const startTime = performance.now()
      
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(progress, 3)
        
        objects.forEach(sphere => {
          sphere.scale.setScalar(eased * 0.01)
          const mat = sphere.material as THREE.MeshStandardMaterial
          mat.opacity = eased
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          group.visible = false
          resolve()
        }
      }
      
      animate()
    })
  }
  
  const dispose = () => {
    geometry.dispose()
    objects.forEach(obj => {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    })
  }
  
  return { group, objects, updateData, animateIn, animateOut, dispose }
}

export const chartFactory = {
  createBars,
  createLine,
  createScatter
}
