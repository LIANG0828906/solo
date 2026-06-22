import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PoetryData } from '../utils/parsePoetry'

interface CanvasElement {
  id: string
  type: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  zIndex: number
  layer: 'background' | 'midground' | 'foreground' | 'text'
}

interface InkCanvasProps {
  poetryData: PoetryData | null
  seed: number
  onReParse: () => void
  onRefreshSeed: () => void
}

function createSeededRandom(seed: number) {
  let s = Math.abs(seed) || 1
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateMountainPath(
  baseX: number,
  baseY: number,
  width: number,
  height: number,
  random: () => number,
  segments: number = 10,
): string {
  const points: { x: number; y: number }[] = []
  const startX = baseX
  const endX = baseX + width
  const peakCount = Math.max(2, Math.floor(segments / 2))

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = startX + t * width
    let yOffset = 0

    for (let p = 0; p < peakCount; p++) {
      const peakX = startX + (p + 0.5) * (width / peakCount)
      const peakHeight = height * (0.4 + random() * 0.6)
      const distance = Math.abs(x - peakX)
      const maxDist = width / peakCount
      if (distance < maxDist) {
        yOffset = Math.max(yOffset, peakHeight * (1 - distance / maxDist))
      }
    }

    const jitter = (random() - 0.5) * height * 0.15
    points.push({ x, y: baseY - yOffset + jitter })
  }

  let path = `M ${startX} ${baseY}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const cpx1 = p1.x + (p2.x - p1.x) * 0.35
    const cpy1 = p1.y + (random() - 0.5) * height * 0.18
    const cpx2 = p1.x + (p2.x - p1.x) * 0.65
    const cpy2 = p2.y + (random() - 0.5) * height * 0.18
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p2.x} ${p2.y}`
  }
  path += ` L ${endX} ${baseY} Z`

  return path
}

function generateTreePaths(
  x: number,
  y: number,
  height: number,
  random: () => number,
): { trunk: string; branches: string[] } {
  const trunkWidth = height * 0.09
  const curveOffset = (random() - 0.5) * trunkWidth * 2.5

  let trunkPath = `M ${x - trunkWidth / 2} ${y}`
  trunkPath += ` Q ${x + curveOffset} ${y - height * 0.5}`
  trunkPath += ` ${x - trunkWidth / 4} ${y - height}`
  trunkPath += ` L ${x + trunkWidth / 4} ${y - height}`
  trunkPath += ` Q ${x + curveOffset * 0.8} ${y - height * 0.5}`
  trunkPath += ` ${x + trunkWidth / 2} ${y} Z`

  const branches: string[] = []
  const branchCount = 4 + Math.floor(random() * 3)

  for (let i = 0; i < branchCount; i++) {
    const branchYRatio = 0.25 + (i / branchCount) * 0.6
    const branchY = y - height * branchYRatio
    const direction = i % 2 === 0 ? 1 : -1
    const branchLength = height * (0.18 + random() * 0.35)
    const startX = x + direction * trunkWidth * 0.3
    const endX = startX + direction * branchLength
    const endY = branchY - branchLength * 0.25 + (random() - 0.5) * 12

    const cpx = (startX + endX) / 2 + direction * (random() - 0.3) * 15
    const cpy = (branchY + endY) / 2 - 8 - random() * 12

    let branchPath = `M ${startX} ${branchY}`
    branchPath += ` Q ${cpx} ${cpy}, ${endX} ${endY}`
    branches.push(branchPath)

    if (random() > 0.35) {
      const subLen = branchLength * 0.45
      const subStartX = cpx
      const subStartY = cpy
      const subEndX = subStartX + direction * subLen
      const subEndY = subStartY - subLen * 0.35

      let subPath = `M ${subStartX} ${subStartY}`
      subPath += ` Q ${(subStartX + subEndX) / 2 + (random() - 0.5) * 8} ${(subStartY + subEndY) / 2 - 5}`
      subPath += ` ${subEndX} ${subEndY}`
      branches.push(subPath)
    }
  }

  return { trunk: trunkPath, branches }
}

function generateBirdPath(x: number, y: number, scale: number): string {
  const s = scale
  let path = `M ${x - 20 * s} ${y + 3 * s}`
  path += ` Q ${x - 12 * s} ${y - 14 * s}, ${x} ${y - 4 * s}`
  path += ` Q ${x + 12 * s} ${y - 14 * s}, ${x + 20 * s} ${y + 3 * s}`
  path += ` Q ${x + 10 * s} ${y - 2 * s}, ${x} ${y + 1 * s}`
  path += ` Q ${x - 10 * s} ${y - 2 * s}, ${x - 20 * s} ${y + 3 * s} Z`
  return path
}

function generateFlowerPaths(
  x: number,
  y: number,
  scale: number,
  random: () => number,
): { petals: string[]; center: string; stem: string } {
  const petalCount = 5 + Math.floor(random() * 3)
  const petals: string[] = []
  const s = scale

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2
    const petalLength = (11 + random() * 7) * s
    const petalWidth = (5 + random() * 3) * s
    const tipX = x + Math.cos(angle) * petalLength
    const tipY = y + Math.sin(angle) * petalLength
    const perpAngle = angle + Math.PI / 2
    const leftX = x + Math.cos(perpAngle) * petalWidth
    const leftY = y + Math.sin(perpAngle) * petalWidth
    const rightX = x - Math.cos(perpAngle) * petalWidth
    const rightY = y - Math.sin(perpAngle) * petalWidth

    let petalPath = `M ${x} ${y}`
    petalPath += ` Q ${leftX} ${leftY}, ${tipX} ${tipY}`
    petalPath += ` Q ${rightX} ${rightY}, ${x} ${y} Z`
    petals.push(petalPath)
  }

  const centerR = 4.5 * s
  const center = `M ${x - centerR} ${y} A ${centerR} ${centerR} 0 1 1 ${x + centerR} ${y} A ${centerR} ${centerR} 0 1 1 ${x - centerR} ${y} Z`

  const stemEndY = y + 30 * s
  const stemCpx = x + (random() - 0.5) * 12
  const stem = `M ${x} ${y + centerR} Q ${stemCpx} ${y + (stemEndY - y) * 0.5}, ${x + (random() - 0.5) * 10} ${stemEndY}`

  return { petals, center, stem }
}

function generateCloudPath(
  x: number,
  y: number,
  width: number,
  height: number,
  random: () => number,
): string {
  const circles = 3 + Math.floor(random() * 4)
  let path = ''

  for (let i = 0; i < circles; i++) {
    const t = circles > 1 ? i / (circles - 1) : 0.5
    const cx = x + t * width - width / 2
    const cy = y + (random() - 0.4) * height * 0.4
    const r = (height / 2) * (0.7 + random() * 0.7)

    if (i === 0) {
      path += `M ${cx - r} ${cy}`
    }
    path += ` A ${r} ${r * 0.55} 0 0 1 ${cx + r} ${cy}`
    path += ` A ${r} ${r * 0.55} 0 0 1 ${cx - r} ${cy}`
  }

  return path
}

function generateWaterPaths(
  width: number,
  baseY: number,
  random: () => number,
): { fillPath: string; wavePaths: string[] } {
  const waveCount = 7
  const wavePaths: string[] = []

  let fillPath = `M 0 ${baseY}`

  for (let i = 0; i < waveCount; i++) {
    const yOffset = i * 6
    const amplitude = 4 + random() * 6
    const frequency = 0.012 + random() * 0.01
    const phase = random() * Math.PI * 2

    let path = ''
    for (let x = 0; x <= width; x += 6) {
      const y = baseY + yOffset + Math.sin(x * frequency + phase) * amplitude
      if (x === 0) {
        path += `M ${x} ${y}`
      } else {
        path += ` L ${x} ${y}`
      }
    }
    wavePaths.push(path)
  }

  for (let x = 0; x <= width; x += 8) {
    const y = baseY + Math.sin(x * 0.015) * 5
    if (x === 0) {
      fillPath += ` L ${x} ${y}`
    } else {
      fillPath += ` L ${x} ${y}`
    }
  }
  fillPath += ` L ${width} 9999 L 0 9999 Z`

  return { fillPath, wavePaths }
}

function InkCanvas({ poetryData, seed, onReParse, onRefreshSeed }: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const [animPhase, setAnimPhase] = useState(0)
  const rafRef = useRef<number | null>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastDragTimeRef = useRef(0)

  useEffect(() => {
    let rafId: number
    let lastTime = 0

    const updateDimensions = () => {
      const now = performance.now()
      if (now - lastTime < 100) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          const w = containerRef.current.clientWidth
          const h = containerRef.current.clientHeight
          setDimensions({ width: w, height: h })
        }
        lastTime = now
      })
    }

    const ro = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      ro.observe(containerRef.current)
    }
    updateDimensions()

    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (!poetryData || dimensions.width === 0) return

    const startTime = performance.now()
    const random = createSeededRandom(seed)
    const newElements: CanvasElement[] = []
    const { width, height } = dimensions

    const imageryTypes = poetryData.imagery.map(i => i.type)

    const hasMountain = poetryData.imagery.find(i => i.type === 'mountain')
    const mountainCount = hasMountain ? Math.min(hasMountain.count + 1, 5) : 2
    for (let i = 0; i < mountainCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'mountain',
        x: -width * 0.05 + i * width * 0.02,
        y: height * (0.52 + i * 0.09),
        scale: 1,
        rotation: 0,
        opacity: 0.1 + i * 0.07,
        zIndex: i,
        layer: 'background',
      })
    }

    const hasCloud = poetryData.imagery.find(i => i.type === 'cloud')
    const cloudCount = hasCloud ? Math.min(hasCloud.count + 1, 5) : 0
    for (let i = 0; i < cloudCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'cloud',
        x: width * (0.1 + random() * 0.8),
        y: height * (0.05 + random() * 0.18),
        scale: 0.8 + random() * 0.9,
        rotation: 0,
        opacity: 0.25 + random() * 0.25,
        zIndex: mountainCount + i,
        layer: 'background',
      })
    }

    const hasMoon = poetryData.imagery.find(i => i.type === 'moon')
    if (hasMoon) {
      newElements.push({
        id: uuidv4(),
        type: 'moon',
        x: width * (0.7 + random() * 0.18),
        y: height * (0.09 + random() * 0.12),
        scale: 0.85 + random() * 0.45,
        rotation: 0,
        opacity: 0.95,
        zIndex: mountainCount + cloudCount,
        layer: 'background',
      })
    }

    const hasWater = poetryData.imagery.find(i => i.type === 'water')
    if (hasWater) {
      newElements.push({
        id: uuidv4(),
        type: 'water',
        x: 0,
        y: height * 0.78,
        scale: 1,
        rotation: 0,
        opacity: 0.45,
        zIndex: mountainCount + cloudCount + (hasMoon ? 1 : 0),
        layer: 'midground',
      })
    }

    const hasTree = poetryData.imagery.find(i => i.type === 'tree')
    const treeCount = hasTree ? Math.min(hasTree.count + 1, 5) : 0
    for (let i = 0; i < treeCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'tree',
        x: width * (0.06 + random() * 0.88),
        y: height * (0.6 + random() * 0.25),
        scale: 0.55 + random() * 0.65,
        rotation: (random() - 0.5) * 0.12,
        opacity: 0.65 + random() * 0.35,
        zIndex: 50 + i,
        layer: 'midground',
      })
    }

    const hasFlower = poetryData.imagery.find(i => i.type === 'flower')
    const flowerCount = hasFlower ? Math.min(hasFlower.count + 2, 6) : 0
    for (let i = 0; i < flowerCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'flower',
        x: width * (0.08 + random() * 0.8),
        y: height * (0.7 + random() * 0.22),
        scale: 0.45 + random() * 0.65,
        rotation: (random() - 0.5) * 0.25,
        opacity: 0.7 + random() * 0.3,
        zIndex: 70 + i,
        layer: 'midground',
      })
    }

    const hasBird = poetryData.imagery.find(i => i.type === 'bird')
    const birdCount = hasBird ? Math.min(hasBird.count + 2, 7) : 0
    for (let i = 0; i < birdCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'bird',
        x: width * (0.12 + random() * 0.7),
        y: height * (0.1 + random() * 0.4),
        scale: 0.35 + random() * 0.55,
        rotation: (random() - 0.5) * 0.35,
        opacity: 0.55 + random() * 0.45,
        zIndex: 100 + i,
        layer: 'foreground',
      })
    }

    newElements.push({
      id: uuidv4(),
      type: 'poetry-text',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      zIndex: 200,
      layer: 'text',
    })

    newElements.sort((a, b) => a.zIndex - b.zIndex)

    rafRef.current = requestAnimationFrame(() => {
      setElements(newElements)

      animTimerRef.current.forEach(t => clearTimeout(t))
      animTimerRef.current = []
      setAnimPhase(0)

      const t1 = setTimeout(() => setAnimPhase(1), 50)
      const t2 = setTimeout(() => setAnimPhase(2), 350)
      const t3 = setTimeout(() => setAnimPhase(3), 650)
      animTimerRef.current = [t1, t2, t3]

      const elapsed = performance.now() - startTime
      console.debug(`生成耗时: ${elapsed.toFixed(1)}ms`)
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      animTimerRef.current.forEach(t => clearTimeout(t))
    }
  }, [poetryData, seed, dimensions.width, dimensions.height])

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    return pt.matrixTransform(ctm.inverse())
  }, [])

  const handleDragStart = useCallback(
    (clientX: number, clientY: number, elementId: string) => {
      const element = elements.find(el => el.id === elementId)
      if (!element || element.type === 'poetry-text') return

      const svgP = getSvgPoint(clientX, clientY)
      if (!svgP) return

      setDraggingId(elementId)
      dragOffsetRef.current = {
        x: svgP.x - element.x,
        y: svgP.y - element.y,
      }
    },
    [elements, getSvgPoint],
  )

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingId) return

      const now = performance.now()
      if (now - lastDragTimeRef.current < 16) return
      lastDragTimeRef.current = now

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const svgP = getSvgPoint(clientX, clientY)
        if (!svgP) return

        const offsetX = dragOffsetRef.current.x
        const offsetY = dragOffsetRef.current.y

        setElements(prev =>
          prev.map(el =>
            el.id === draggingId
              ? { ...el, x: svgP.x - offsetX, y: svgP.y - offsetY }
              : el,
          ),
        )
      })
    },
    [draggingId, getSvgPoint],
  )

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault()
      e.stopPropagation()
      handleDragStart(e.clientX, e.clientY, elementId)
    },
    [handleDragStart],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, elementId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const touch = e.touches[0]
      handleDragStart(touch.clientX, touch.clientY, elementId)
    },
    [handleDragStart],
  )

  useEffect(() => {
    if (!draggingId) return

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY)
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const handleEnd = () => {
      setDraggingId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('touchcancel', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('touchcancel', handleEnd)
    }
  }, [draggingId, handleDragMove])

  const exportPNG = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>' + svgData],
      { type: 'image/svg+xml;charset=utf-8' },
    )
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(dimensions.width * dpr)
      canvas.height = Math.floor(dimensions.height * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#e8ddd0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

      try {
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `水墨诗意_${Date.now()}.png`
        link.href = pngUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        console.error('导出PNG失败:', err)
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    img.onerror = () => {
      console.error('SVG转图片失败')
      URL.revokeObjectURL(url)
    }

    img.src = url
  }, [dimensions])

  const getAnimOpacity = useCallback((layer: string) => {
    switch (layer) {
      case 'background':
        return animPhase >= 1 ? 1 : 0
      case 'midground':
        return animPhase >= 2 ? 1 : 0
      case 'foreground':
      case 'text':
        return animPhase >= 3 ? 1 : 0
      default:
        return 1
    }
  }, [animPhase])

  const renderMountain = useCallback((element: CanvasElement, index: number) => {
    const mountainRandom = createSeededRandom(seed + index * 1000 + 123)
    const width = dimensions.width * 1.15
    const height = dimensions.height * (0.28 + mountainRandom() * 0.28)
    const path = generateMountainPath(
      element.x,
      element.y,
      width,
      height,
      mountainRandom,
      8 + Math.floor(mountainRandom() * 5),
    )

    const baseGray = 110 + index * 25
    const fillColor = `rgb(${baseGray}, ${baseGray + 2}, ${baseGray + 10})`

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <path
        key={element.id}
        d={path}
        fill={fillColor}
        className="canvas-element mountain-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center bottom',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      />
    )
  }, [seed, dimensions, getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderTree = useCallback((element: CanvasElement, index: number) => {
    const treeRandom = createSeededRandom(seed + index * 2000 + 456)
    const height = (65 + treeRandom() * 55) * element.scale
    const { trunk, branches } = generateTreePaths(element.x, element.y, height, treeRandom)

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="canvas-element tree-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: `${element.x}px ${element.y}px`,
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={trunk} fill="#3d2b1e" opacity="0.85" />
        {branches.map((branch, i) => (
          <path
            key={i}
            d={branch}
            fill="none"
            stroke="#3d2b1e"
            strokeWidth={1.5 + element.scale * 0.8}
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}
      </g>
    )
  }, [seed, getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderBird = useCallback((element: CanvasElement, index: number) => {
    const path = generateBirdPath(element.x, element.y, element.scale)

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="canvas-element bird-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: `${element.x}px ${element.y}px`,
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={path} fill="#2c1810" opacity="0.85" />
        <path
          d={generateBirdPath(element.x, element.y - 4 * element.scale, element.scale * 0.7)}
          fill="#2c1810"
          opacity="0.4"
        />
      </g>
    )
  }, [getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderMoon = useCallback((element: CanvasElement) => {
    const radius = 30 * element.scale
    const gradientId = `moon-grad-${element.id}`
    const filterId = `moon-glow-${element.id}`

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="canvas-element moon-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: `${element.x}px ${element.y}px`,
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <defs>
          <radialGradient id={gradientId} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffdf5" stopOpacity="1" />
            <stop offset="40%" stopColor="#f8f3e8" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#ede4d0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d4c5a9" stopOpacity="0" />
          </radialGradient>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <circle
          cx={element.x}
          cy={element.y}
          r={radius * 2.2}
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
        />
        <circle
          cx={element.x}
          cy={element.y}
          r={radius}
          fill="#fffdf5"
          opacity="0.98"
        />
        <circle
          cx={element.x + radius * 0.28}
          cy={element.y - radius * 0.18}
          r={radius * 0.14}
          fill="#e8e0d0"
          opacity="0.4"
        />
        <circle
          cx={element.x - radius * 0.18}
          cy={element.y + radius * 0.28}
          r={radius * 0.09}
          fill="#e8e0d0"
          opacity="0.3"
        />
      </g>
    )
  }, [getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderWater = useCallback((element: CanvasElement) => {
    const waterRandom = createSeededRandom(seed + 5000 + 789)
    const { fillPath, wavePaths } = generateWaterPaths(
      dimensions.width,
      element.y,
      waterRandom,
    )

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="water-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <defs>
          <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8a9caa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5a6c79" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#water-grad)" />
        {wavePaths.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="#7a8c99"
            strokeWidth={1 + i * 0.15}
            opacity={0.2 + i * 0.08}
          />
        ))}
      </g>
    )
  }, [seed, dimensions, getAnimOpacity])

  const renderFlower = useCallback((element: CanvasElement, index: number) => {
    const flowerRandom = createSeededRandom(seed + index * 4000 + 321)
    const { petals, center, stem } = generateFlowerPaths(
      element.x,
      element.y,
      element.scale,
      flowerRandom,
    )

    const petalColors = ['#c95a6b', '#d47a8a', '#b84a5b', '#e89aaa', '#d06577', '#c05060']
    const petalColor = petalColors[index % petalColors.length]

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="canvas-element flower-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: `${element.x}px ${element.y}px`,
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path
          d={stem}
          fill="none"
          stroke="#4a6741"
          strokeWidth={1.5 + element.scale * 0.5}
          opacity="0.55"
        />
        {petals.map((petal, i) => (
          <path key={i} d={petal} fill={petalColor} opacity="0.78" />
        ))}
        <path d={center} fill="#f5d060" opacity="0.9" />
      </g>
    )
  }, [seed, getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderCloud = useCallback((element: CanvasElement, index: number) => {
    const cloudRandom = createSeededRandom(seed + index * 6000 + 654)
    const width = (70 + cloudRandom() * 80) * element.scale
    const height = (22 + cloudRandom() * 20) * element.scale
    const path = generateCloudPath(element.x, element.y, width, height, cloudRandom)

    const layerOpacity = getAnimOpacity(element.layer)
    const finalOpacity = layerOpacity * element.opacity

    return (
      <g
        key={element.id}
        className="canvas-element cloud-element"
        style={{
          opacity: finalOpacity,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: `${element.x}px ${element.y}px`,
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={path} fill="#ffffff" opacity="0.85" />
        <path d={path} fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
      </g>
    )
  }, [seed, getAnimOpacity, handleMouseDown, handleTouchStart])

  const renderPoetryText = useCallback(() => {
    if (!poetryData) return null

    const layerOpacity = getAnimOpacity('text')

    const contentLines = poetryData.content.split('\n').filter(l => l.trim())
    if (contentLines.length === 0) return null

    const fontSize = Math.min(dimensions.width, dimensions.height) * 0.04
    const lineHeight = fontSize * 2.0
    const textX = dimensions.width * 0.86
    const startY = dimensions.height * 0.12

    const charLines: string[] = []
    for (const line of contentLines) {
      const cleanLine = line.replace(/[，。？！、；：\s]/g, '')
      if (cleanLine) {
        charLines.push(cleanLine)
      }
    }

    const textElements: JSX.Element[] = []
    const title = poetryData.title || '无题'

    textElements.push(
      <text
        key="title"
        x={textX}
        y={startY}
        fontSize={fontSize * 0.6}
        fill="#5a3e2b"
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-brush)' }}
      >
        {title}
      </text>,
    )

    for (let lineIdx = 0; lineIdx < charLines.length; lineIdx++) {
      const chars = charLines[lineIdx]
      for (let charIdx = 0; charIdx < chars.length; charIdx++) {
        const x = textX + charIdx * fontSize * 1.05 - (chars.length - 1) * fontSize * 0.525
        const y = startY + lineHeight * 0.9 + lineIdx * lineHeight

        textElements.push(
          <text
            key={`char-${lineIdx}-${charIdx}`}
            x={x}
            y={y}
            fontSize={fontSize}
            fill="#3d2b1e"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-brush)' }}
          >
            {chars[charIdx]}
          </text>,
        )
      }
    }

    const sealSize = fontSize * 1.3
    const sealX = textX + fontSize * 0.3
    const sealY = startY + lineHeight * 0.9 + charLines.length * lineHeight + 8

    textElements.push(
      <rect
        key="seal-bg"
        x={sealX}
        y={sealY}
        width={sealSize}
        height={sealSize}
        fill="#c95a6b"
        opacity="0.85"
        rx="2"
      />,
    )
    textElements.push(
      <text
        key="seal-text"
        x={sealX + sealSize / 2}
        y={sealY + sealSize * 0.65}
        fontSize={sealSize * 0.38}
        fill="#ffffff"
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-brush)' }}
      >
        水墨
      </text>,
    )

    return (
      <g
        key="poetry-text-group"
        className="poetry-text"
        style={{
          opacity: layerOpacity,
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {textElements}
      </g>
    )
  }, [poetryData, dimensions, getAnimOpacity])

  const renderedElements = useMemo(() => {
    let mountainIdx = 0
    let treeIdx = 0
    let birdIdx = 0
    let flowerIdx = 0
    let cloudIdx = 0

    return elements.map(element => {
      switch (element.type) {
        case 'mountain':
          return renderMountain(element, mountainIdx++)
        case 'tree':
          return renderTree(element, treeIdx++)
        case 'bird':
          return renderBird(element, birdIdx++)
        case 'moon':
          return renderMoon(element)
        case 'water':
          return renderWater(element)
        case 'flower':
          return renderFlower(element, flowerIdx++)
        case 'cloud':
          return renderCloud(element, cloudIdx++)
        case 'poetry-text':
          return renderPoetryText()
        default:
          return null
      }
    })
  }, [
    elements,
    renderMountain,
    renderTree,
    renderBird,
    renderMoon,
    renderWater,
    renderFlower,
    renderCloud,
    renderPoetryText,
  ])

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      <svg
        ref={svgRef}
        className="ink-svg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="ink-soft">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
        {elements.length > 0 ? (
          renderedElements
        ) : (
          <g className="empty-hint">
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2 - 18}
              textAnchor="middle"
              fontSize="22"
              fill="#8b7355"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              请在左侧输入诗词，生成水墨意境
            </text>
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2 + 18}
              textAnchor="middle"
              fontSize="14"
              fill="#a89078"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              ← 输入诗词，点击生成按钮
            </text>
          </g>
        )}
      </svg>

      <div className="control-panel">
        <button
          className="control-btn"
          onClick={exportPNG}
          title="导出为PNG图片"
          disabled={!poetryData}
        >
          <i className="fa-solid fa-download"></i>
          <span>导出PNG</span>
        </button>
        <button
          className="control-btn"
          onClick={onRefreshSeed}
          title="重新随机生成布局"
          disabled={!poetryData}
        >
          <i className="fa-solid fa-shuffle"></i>
          <span>刷新种子</span>
        </button>
        <button
          className="control-btn"
          onClick={onReParse}
          title="重新解析诗词意象"
          disabled={!poetryData}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>重新解析</span>
        </button>
      </div>
    </div>
  )
}

export default memo(InkCanvas)
