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
  segments: number = 8,
): string {
  const points: { x: number; y: number }[] = []
  const startX = baseX
  const endX = baseX + width
  const peakCount = Math.max(1, Math.floor(segments / 2) + 1)

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = startX + t * width
    let yOffset = 0

    for (let p = 0; p < peakCount; p++) {
      const peakX = startX + (p + 0.5) * (width / peakCount)
      const peakHeight = height * (0.5 + random() * 0.5)
      const distance = Math.abs(x - peakX)
      const maxDist = width / peakCount
      if (distance < maxDist) {
        yOffset = Math.max(yOffset, peakHeight * (1 - distance / maxDist))
      }
    }

    const jitter = (random() - 0.5) * height * 0.12
    points.push({ x, y: baseY - yOffset + jitter })
  }

  let path = `M ${startX} ${baseY}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const cpx1 = p1.x + (p2.x - p1.x) * 0.3
    const cpy1 = p1.y + (random() - 0.5) * height * 0.15
    const cpx2 = p1.x + (p2.x - p1.x) * 0.7
    const cpy2 = p2.y + (random() - 0.5) * height * 0.15
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p2.x} ${p2.y}`
  }
  path += ` L ${endX} ${baseY} Z`

  return path
}

function generateTreePath(
  x: number,
  y: number,
  height: number,
  random: () => number,
): { trunk: string; branches: string[]; leaves: string[] } {
  const trunkWidth = height * 0.08
  let trunkPath = `M ${x - trunkWidth / 2} ${y}`
  trunkPath += ` Q ${x + (random() - 0.5) * trunkWidth * 2} ${y - height * 0.5}`
  trunkPath += ` ${x - trunkWidth / 4} ${y - height}`
  trunkPath += ` L ${x + trunkWidth / 4} ${y - height}`
  trunkPath += ` Q ${x + (random() - 0.5) * trunkWidth * 2} ${y - height * 0.5}`
  trunkPath += ` ${x + trunkWidth / 2} ${y} Z`

  const branches: string[] = []
  const leaves: string[] = []
  const branchCount = 3 + Math.floor(random() * 4)
  for (let i = 0; i < branchCount; i++) {
    const branchY = y - height * (0.25 + (i / branchCount) * 0.65)
    const direction = random() > 0.5 ? 1 : -1
    const branchLength = height * (0.2 + random() * 0.35)
    const startX = x + direction * trunkWidth * 0.3
    const endX = startX + direction * branchLength
    const endY = branchY - branchLength * 0.3 + (random() - 0.5) * 10

    let branchPath = `M ${startX} ${branchY}`
    const cpx = (startX + endX) / 2 + (random() - 0.5) * 20
    const cpy = (branchY + endY) / 2 - 10 - random() * 15
    branchPath += ` Q ${cpx} ${cpy}, ${endX} ${endY}`
    branches.push(branchPath)

    if (random() > 0.3) {
      const leafR = 3 + random() * 5
      const leafPath = `M ${endX - leafR} ${endY} A ${leafR} ${leafR * 0.8} 0 1 1 ${endX + leafR} ${endY} A ${leafR} ${leafR * 0.8} 0 1 1 ${endX - leafR} ${endY} Z`
      leaves.push(leafPath)
    }

    if (random() > 0.4) {
      const subBranchLength = branchLength * 0.5
      let subBranchPath = `M ${cpx} ${cpy}`
      subBranchPath += ` Q ${cpx + direction * subBranchLength * 0.5} ${cpy - subBranchLength * 0.4}`
      subBranchPath += ` ${cpx + direction * subBranchLength} ${cpy - subBranchLength * 0.3}`
      branches.push(subBranchPath)

      if (random() > 0.5) {
        const subLeafR = 2 + random() * 4
        const subLeafPath = `M ${cpx + direction * subBranchLength - subLeafR} ${cpy - subBranchLength * 0.3} A ${subLeafR} ${subLeafR * 0.7} 0 1 1 ${cpx + direction * subBranchLength + subLeafR} ${cpy - subBranchLength * 0.3} A ${subLeafR} ${subLeafR * 0.7} 0 1 1 ${cpx + direction * subBranchLength - subLeafR} ${cpy - subBranchLength * 0.3} Z`
        leaves.push(subLeafPath)
      }
    }
  }

  return { trunk: trunkPath, branches, leaves }
}

function generateBirdPath(x: number, y: number, scale: number): string {
  const s = scale
  let path = `M ${x - 18 * s} ${y + 2 * s}`
  path += ` Q ${x - 10 * s} ${y - 12 * s}, ${x} ${y - 3 * s}`
  path += ` Q ${x + 10 * s} ${y - 12 * s}, ${x + 18 * s} ${y + 2 * s}`
  path += ` Q ${x + 10 * s} ${y - 4 * s}, ${x} ${y + 1 * s}`
  path += ` Q ${x - 10 * s} ${y - 4 * s}, ${x - 18 * s} ${y + 2 * s} Z`
  return path
}

function generateFlowerPath(
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
    const petalLength = (10 + random() * 8) * s
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

  const centerR = 4 * s
  const center = `M ${x - centerR} ${y} A ${centerR} ${centerR} 0 1 1 ${x + centerR} ${y} A ${centerR} ${centerR} 0 1 1 ${x - centerR} ${y} Z`

  const stemEndY = y + 25 * s
  const stemCpx = x + (random() - 0.5) * 10
  const stem = `M ${x} ${y + centerR} Q ${stemCpx} ${y + (stemEndY - y) * 0.5}, ${x + (random() - 0.5) * 8} ${stemEndY}`

  return { petals, center, stem }
}

function generateCloudPath(
  x: number,
  y: number,
  width: number,
  height: number,
  random: () => number,
): string {
  const circles = 3 + Math.floor(random() * 3)
  let path = ''

  for (let i = 0; i < circles; i++) {
    const t = circles > 1 ? i / (circles - 1) : 0.5
    const cx = x + t * width - width / 2
    const cy = y + (random() - 0.5) * height * 0.4
    const r = (height / 2) * (0.7 + random() * 0.6)

    if (i === 0) {
      path += `M ${cx - r} ${cy}`
    }
    path += ` A ${r} ${r * 0.6} 0 0 1 ${cx + r} ${cy}`
    path += ` A ${r} ${r * 0.6} 0 0 1 ${cx - r} ${cy}`
  }

  return path
}

function InkCanvas({ poetryData, seed, onReParse, onRefreshSeed }: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const [animPhase, setAnimPhase] = useState(0)
  const animTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(() => {
        if (containerRef.current) {
          const w = containerRef.current.clientWidth
          const h = containerRef.current.clientHeight
          setDimensions({ width: w, height: h })
        }
      }, 100)
    }

    const ro = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      ro.observe(containerRef.current)
    }

    return () => {
      ro.disconnect()
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!poetryData || dimensions.width === 0) return

    const random = createSeededRandom(seed)
    const newElements: CanvasElement[] = []
    const { width, height } = dimensions

    const hasMountain = poetryData.imagery.find(i => i.type === 'mountain')
    const mountainCount = hasMountain ? Math.min(hasMountain.count + 1, 4) : 2
    for (let i = 0; i < mountainCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: `mountain-${i}`,
        x: 0,
        y: height * (0.5 + i * 0.1),
        scale: 1,
        rotation: 0,
        opacity: 0.12 + i * 0.08,
        zIndex: i,
        layer: 'background',
      })
    }

    const hasCloud = poetryData.imagery.find(i => i.type === 'cloud')
    const cloudCount = hasCloud ? Math.min(hasCloud.count + 1, 4) : 0
    for (let i = 0; i < cloudCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'cloud',
        x: width * (0.15 + random() * 0.7),
        y: height * (0.06 + random() * 0.15),
        scale: 0.8 + random() * 0.8,
        rotation: 0,
        opacity: 0.25 + random() * 0.2,
        zIndex: 3 + i,
        layer: 'background',
      })
    }

    const hasMoon = poetryData.imagery.find(i => i.type === 'moon')
    if (hasMoon) {
      newElements.push({
        id: uuidv4(),
        type: 'moon',
        x: width * (0.72 + random() * 0.12),
        y: height * (0.1 + random() * 0.1),
        scale: 0.8 + random() * 0.4,
        rotation: 0,
        opacity: 0.9,
        zIndex: 5,
        layer: 'background',
      })
    }

    const hasWater = poetryData.imagery.find(i => i.type === 'water')
    if (hasWater) {
      newElements.push({
        id: uuidv4(),
        type: 'water',
        x: 0,
        y: height * 0.8,
        scale: 1,
        rotation: 0,
        opacity: 0.4,
        zIndex: 8,
        layer: 'midground',
      })
    }

    const hasTree = poetryData.imagery.find(i => i.type === 'tree')
    const treeCount = hasTree ? Math.min(hasTree.count + 1, 4) : 0
    for (let i = 0; i < treeCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'tree',
        x: width * (0.08 + random() * 0.84),
        y: height * (0.62 + random() * 0.2),
        scale: 0.6 + random() * 0.6,
        rotation: (random() - 0.5) * 0.1,
        opacity: 0.7 + random() * 0.3,
        zIndex: 10 + i,
        layer: 'midground',
      })
    }

    const hasFlower = poetryData.imagery.find(i => i.type === 'flower')
    const flowerCount = hasFlower ? Math.min(hasFlower.count + 2, 5) : 0
    for (let i = 0; i < flowerCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'flower',
        x: width * (0.1 + random() * 0.75),
        y: height * (0.72 + random() * 0.18),
        scale: 0.5 + random() * 0.6,
        rotation: (random() - 0.5) * 0.2,
        opacity: 0.7 + random() * 0.3,
        zIndex: 15 + i,
        layer: 'midground',
      })
    }

    const hasBird = poetryData.imagery.find(i => i.type === 'bird')
    const birdCount = hasBird ? Math.min(hasBird.count + 2, 6) : 0
    for (let i = 0; i < birdCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'bird',
        x: width * (0.15 + random() * 0.6),
        y: height * (0.12 + random() * 0.35),
        scale: 0.4 + random() * 0.5,
        rotation: (random() - 0.5) * 0.3,
        opacity: 0.6 + random() * 0.4,
        zIndex: 20 + i,
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
      zIndex: 30,
      layer: 'text',
    })

    newElements.sort((a, b) => a.zIndex - b.zIndex)
    setElements(newElements)

    animTimerRef.current.forEach(t => clearTimeout(t))
    animTimerRef.current = []
    setAnimPhase(0)

    const t1 = setTimeout(() => setAnimPhase(1), 50)
    const t2 = setTimeout(() => setAnimPhase(2), 350)
    const t3 = setTimeout(() => setAnimPhase(3), 650)
    animTimerRef.current = [t1, t2, t3]

    return () => {
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, elementId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const element = elements.find(el => el.id === elementId)
      if (!element) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

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

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingId) return
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
    },
    [draggingId, getSvgPoint],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY)
    },
    [handlePointerMove],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!draggingId) return
      e.preventDefault()
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    },
    [draggingId, handlePointerMove],
  )

  const handlePointerUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  useEffect(() => {
    if (!draggingId) return

    const handleGlobalMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY)
    }
    const handleGlobalTouchMove = (e: TouchEvent) => {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleGlobalUp = () => {
      setDraggingId(null)
    }

    window.addEventListener('mousemove', handleGlobalMove)
    window.addEventListener('mouseup', handleGlobalUp)
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    window.addEventListener('touchend', handleGlobalUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove)
      window.removeEventListener('mouseup', handleGlobalUp)
      window.removeEventListener('touchmove', handleGlobalTouchMove)
      window.removeEventListener('touchend', handleGlobalUp)
    }
  }, [draggingId, handlePointerMove])

  const exportPNG = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = dimensions.width * dpr
      canvas.height = dimensions.height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#e8ddd0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `poetry-ink-${Date.now()}.png`
      link.href = pngUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [dimensions])

  const renderMountain = useCallback((element: CanvasElement, index: number) => {
    const mountainRandom = createSeededRandom(seed + index * 1000)
    const width = dimensions.width * 1.2
    const height = dimensions.height * (0.3 + mountainRandom() * 0.25)
    const path = generateMountainPath(
      element.x - dimensions.width * 0.1,
      element.y,
      width,
      height,
      mountainRandom,
      6 + Math.floor(mountainRandom() * 4),
    )

    const grayValue = Math.floor(130 + (1 - element.opacity) * 70)
    const fillColor = `rgb(${grayValue}, ${grayValue}, ${grayValue + 8})`

    return (
      <path
        key={element.id}
        d={path}
        fill={fillColor}
        className="canvas-element"
        style={{
          opacity: animPhase >= 1 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
          willChange: 'opacity',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      />
    )
  }, [seed, dimensions, animPhase, handleMouseDown])

  const renderTree = useCallback((element: CanvasElement, index: number) => {
    const treeRandom = createSeededRandom(seed + index * 2000)
    const height = (60 + treeRandom() * 50) * element.scale
    const { trunk, branches, leaves } = generateTreePath(element.x, element.y, height, treeRandom)

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 2 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
          willChange: 'opacity',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      >
        <path d={trunk} fill="#3d2b1e" opacity="0.85" />
        {branches.map((branch, i) => (
          <path
            key={i}
            d={branch}
            fill="none"
            stroke="#3d2b1e"
            strokeWidth={1.5 + element.scale}
            strokeLinecap="round"
            opacity="0.75"
          />
        ))}
        {leaves.map((leaf, i) => (
          <path
            key={`leaf-${i}`}
            d={leaf}
            fill="#4a6741"
            opacity="0.5"
          />
        ))}
      </g>
    )
  }, [seed, animPhase, handleMouseDown])

  const renderBird = useCallback((element: CanvasElement, index: number) => {
    const path = generateBirdPath(element.x, element.y, element.scale)

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 3 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
          willChange: 'opacity',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      >
        <path d={path} fill="#2c1810" opacity={element.opacity} />
      </g>
    )
  }, [animPhase, handleMouseDown])

  const renderMoon = useCallback((element: CanvasElement) => {
    const radius = 28 * element.scale
    const gradientId = `moon-grad-${element.id}`
    const filterId = `moon-blur-${element.id}`

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 1 ? element.opacity : 0,
          transition: 'opacity 0.6s ease-out',
          willChange: 'opacity',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf5" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f5f0e0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e8e0d0" stopOpacity="0.15" />
          </radialGradient>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <circle
          cx={element.x}
          cy={element.y}
          r={radius * 2}
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
        />
        <circle
          cx={element.x}
          cy={element.y}
          r={radius}
          fill="#fffdf5"
          opacity="0.95"
        />
        <circle
          cx={element.x + radius * 0.25}
          cy={element.y - radius * 0.15}
          r={radius * 0.12}
          fill="#e8e0d0"
          opacity="0.35"
        />
        <circle
          cx={element.x - radius * 0.2}
          cy={element.y + radius * 0.25}
          r={radius * 0.08}
          fill="#e8e0d0"
          opacity="0.25"
        />
      </g>
    )
  }, [animPhase, handleMouseDown])

  const renderWater = useCallback((element: CanvasElement) => {
    const waterRandom = createSeededRandom(seed + 5000)
    const waveCount = 6
    const waves = []

    for (let i = 0; i < waveCount; i++) {
      const yOffset = i * 7
      const amplitude = 4 + waterRandom() * 5
      const frequency = 0.015 + waterRandom() * 0.012
      const phase = waterRandom() * Math.PI * 2

      let path = `M 0 ${element.y + yOffset}`
      for (let x = 0; x <= dimensions.width; x += 8) {
        const y = element.y + yOffset + Math.sin(x * frequency + phase) * amplitude
        path += ` L ${x} ${y}`
      }
      waves.push({ path, index: i })
    }

    return (
      <g
        key={element.id}
        style={{
          opacity: animPhase >= 2 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <defs>
          <linearGradient id="water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7a8c99" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5a6c79" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y={element.y}
          width={dimensions.width}
          height={dimensions.height - element.y}
          fill="url(#water-gradient)"
          opacity="0.25"
        />
        {waves.map(({ path, index: i }) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="#6a7c89"
            strokeWidth={1.2}
            opacity={0.25 + i * 0.08}
          />
        ))}
      </g>
    )
  }, [seed, dimensions, animPhase])

  const renderFlower = useCallback((element: CanvasElement, index: number) => {
    const flowerRandom = createSeededRandom(seed + index * 4000)
    const { petals, center, stem } = generateFlowerPath(
      element.x,
      element.y,
      element.scale,
      flowerRandom,
    )

    const petalColors = ['#c95a6b', '#d47a8a', '#b84a5b', '#e89aaa', '#cf6a7b']
    const petalColor = petalColors[index % petalColors.length]

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 3 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
          willChange: 'opacity',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      >
        <path d={stem} fill="none" stroke="#4a6741" strokeWidth={1.5 * element.scale} opacity="0.6" />
        {petals.map((petal, i) => (
          <path key={i} d={petal} fill={petalColor} opacity="0.75" />
        ))}
        <path d={center} fill="#f5d060" opacity="0.9" />
      </g>
    )
  }, [seed, animPhase, handleMouseDown])

  const renderCloud = useCallback((element: CanvasElement, index: number) => {
    const cloudRandom = createSeededRandom(seed + index * 6000)
    const width = (80 + cloudRandom() * 70) * element.scale
    const height = (25 + cloudRandom() * 18) * element.scale
    const path = generateCloudPath(element.x, element.y, width, height, cloudRandom)

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 1 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleMouseDown(e, element.id)}
      >
        <path d={path} fill="#ffffff" opacity={element.opacity} />
      </g>
    )
  }, [seed, animPhase, handleMouseDown])

  const renderPoetryText = useCallback(() => {
    if (!poetryData) return null

    const lines = poetryData.content.split(/[，。？！\n]/).filter(l => l.trim())
    if (lines.length === 0) return null

    const fontSize = Math.min(dimensions.width, dimensions.height) * 0.042
    const lineHeight = fontSize * 2.2
    const columnX = dimensions.width * 0.85

    const textElements: JSX.Element[] = []
    const titleLines = poetryData.title ? [poetryData.title] : []

    let currentY = dimensions.height * 0.12

    if (titleLines.length > 0) {
      textElements.push(
        <text
          key="title"
          x={columnX}
          y={currentY}
          fontSize={fontSize * 0.65}
          fill="#5a3e2b"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-brush)' }}
        >
          {titleLines[0]}
        </text>
      )
      currentY += lineHeight * 0.8
    }

    const contentLines = poetryData.content.split('\n').filter(l => l.trim())
    for (let i = 0; i < contentLines.length; i++) {
      const chars = contentLines[i].replace(/[，。？！、；：\s]/g, '')
      for (let j = 0; j < chars.length; j++) {
        textElements.push(
          <text
            key={`line-${i}-char-${j}`}
            x={columnX - j * fontSize * 1.1}
            y={currentY + i * lineHeight}
            fontSize={fontSize}
            fill="#3d2b1e"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-brush)' }}
          >
            {chars[j]}
          </text>
        )
      }
    }

    const sealSize = fontSize * 1.4
    textElements.push(
      <rect
        key="seal"
        x={columnX + fontSize * 0.5}
        y={currentY + contentLines.length * lineHeight + 5}
        width={sealSize}
        height={sealSize}
        fill="none"
        stroke="#c95a6b"
        strokeWidth="2"
        opacity="0.55"
        rx="3"
      />
    )
    textElements.push(
      <text
        key="seal-text"
        x={columnX + fontSize * 0.5 + sealSize / 2}
        y={currentY + contentLines.length * lineHeight + 5 + sealSize * 0.65}
        fontSize={sealSize * 0.35}
        fill="#c95a6b"
        textAnchor="middle"
        opacity="0.55"
        style={{ fontFamily: 'var(--font-brush)' }}
      >
        诗画
      </text>
    )

    return (
      <g
        key="poetry-text-group"
        className="poetry-text"
        style={{
          opacity: animPhase >= 3 ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
          willChange: 'opacity',
        }}
      >
        {textElements}
      </g>
    )
  }, [poetryData, dimensions, animPhase])

  const renderElement = useCallback((element: CanvasElement, index: number) => {
    if (element.type.startsWith('mountain')) {
      return renderMountain(element, parseInt(element.type.split('-')[1] || '0'))
    }
    if (element.type === 'tree') return renderTree(element, index)
    if (element.type === 'bird') return renderBird(element, index)
    if (element.type === 'moon') return renderMoon(element)
    if (element.type === 'water') return renderWater(element)
    if (element.type === 'flower') return renderFlower(element, index)
    if (element.type === 'cloud') return renderCloud(element, index)
    if (element.type === 'poetry-text') return renderPoetryText()
    return null
  }, [renderMountain, renderTree, renderBird, renderMoon, renderWater, renderFlower, renderCloud, renderPoetryText])

  const renderedElements = useMemo(() => {
    return elements.map((element, index) => renderElement(element, index))
  }, [elements, renderElement])

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
          <filter id="ink-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
          </filter>
        </defs>
        {elements.length > 0 ? (
          renderedElements
        ) : (
          <g>
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2 - 20}
              textAnchor="middle"
              fontSize="20"
              fill="#8b7355"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              请在左侧输入诗词，生成水墨意境
            </text>
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2 + 20}
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
        <button className="control-btn" onClick={exportPNG} title="导出PNG">
          <i className="fa-solid fa-download"></i>
          <span>导出PNG</span>
        </button>
        <button className="control-btn" onClick={onRefreshSeed} title="刷新随机种子">
          <i className="fa-solid fa-shuffle"></i>
          <span>刷新种子</span>
        </button>
        <button className="control-btn" onClick={onReParse} title="重新解析意象">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>重新解析</span>
        </button>
      </div>
    </div>
  )
}

export default memo(InkCanvas)
