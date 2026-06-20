import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PoetryData, ImageryItem } from '../utils/parsePoetry'

interface CanvasElement {
  id: string
  type: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  zIndex: number
}

interface InkCanvasProps {
  poetryData: PoetryData | null
  seed: number
  onReParse: () => void
  onRefreshSeed: () => void
}

function seededRandom(seed: number) {
  let s = seed
  return function () {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
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
  const peakCount = Math.floor(segments / 2) + 1

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

    const jitter = (random() - 0.5) * height * 0.1
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
): { trunk: string; branches: string[] } {
  const trunkWidth = height * 0.08
  let trunkPath = `M ${x - trunkWidth / 2} ${y}`
  trunkPath += ` Q ${x + (random() - 0.5) * trunkWidth} ${y - height * 0.5}`
  trunkPath += ` ${x - trunkWidth / 4} ${y - height}`
  trunkPath += ` L ${x + trunkWidth / 4} ${y - height}`
  trunkPath += ` Q ${x + (random() - 0.5) * trunkWidth} ${y - height * 0.5}`
  trunkPath += ` ${x + trunkWidth / 2} ${y} Z`

  const branches: string[] = []
  const branchCount = 3 + Math.floor(random() * 3)
  for (let i = 0; i < branchCount; i++) {
    const branchY = y - height * (0.3 + (i / branchCount) * 0.6)
    const direction = random() > 0.5 ? 1 : -1
    const branchLength = height * (0.2 + random() * 0.3)
    const startX = x + direction * trunkWidth * 0.3
    const endX = startX + direction * branchLength
    const endY = branchY - branchLength * 0.3 + (random() - 0.5) * 10

    let branchPath = `M ${startX} ${branchY}`
    const cpx = (startX + endX) / 2 + (random() - 0.5) * 20
    const cpy = (branchY + endY) / 2 - 10 - random() * 10
    branchPath += ` Q ${cpx} ${cpy}, ${endX} ${endY}`

    branches.push(branchPath)

    if (random() > 0.4) {
      const subBranchLength = branchLength * 0.5
      let subBranchPath = `M ${cpx} ${cpy}`
      subBranchPath += ` Q ${cpx + direction * subBranchLength * 0.5} ${cpy - subBranchLength * 0.4}`
      subBranchPath += ` ${cpx + direction * subBranchLength} ${cpy - subBranchLength * 0.3}`
      branches.push(subBranchPath)
    }
  }

  return { trunk: trunkPath, branches }
}

function generateBirdPath(x: number, y: number, scale: number): string {
  const s = scale
  let path = `M ${x - 15 * s} ${y}`
  path += ` Q ${x - 8 * s} ${y - 10 * s}, ${x} ${y - 2 * s}`
  path += ` Q ${x + 8 * s} ${y - 10 * s}, ${x + 15 * s} ${y}`
  path += ` Q ${x + 8 * s} ${y + 2 * s}, ${x} ${y + 1 * s}`
  path += ` Q ${x - 8 * s} ${y + 2 * s}, ${x - 15 * s} ${y} Z`
  return path
}

function generateFlowerPath(
  x: number,
  y: number,
  scale: number,
  random: () => number,
): { petals: string[]; center: string } {
  const petalCount = 5 + Math.floor(random() * 3)
  const petals: string[] = []
  const s = scale

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2
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

  const center = `M ${x - 4 * s} ${y - 4 * s} Q ${x + 4 * s} ${y - 4 * s}, ${x + 4 * s} ${y + 4 * s} Q ${x - 4 * s} ${y + 4 * s}, ${x - 4 * s} ${y - 4 * s} Z`

  return { petals, center }
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
    const cx = x + (i / (circles - 1)) * width - width / 2
    const cy = y + (random() - 0.5) * height * 0.3
    const r = (height / 2) * (0.7 + random() * 0.6)

    if (i === 0) {
      path += `M ${cx - r} ${cy}`
    }
    path += ` A ${r} ${r * 0.7} 0 0 1 ${cx + r} ${cy}`
    path += ` A ${r} ${r * 0.7} 0 0 1 ${cx - r} ${cy}`
  }

  return path
}

function InkCanvas({ poetryData, seed, onReParse, onRefreshSeed }: InkCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [animPhase, setAnimPhase] = useState(0)

  const random = useMemo(() => seededRandom(seed), [seed])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!poetryData || dimensions.width === 0) return

    const newElements: CanvasElement[] = []
    const { width, height } = dimensions

    const hasMountain = poetryData.imagery.find(i => i.type === 'mountain')
    const mountainCount = hasMountain ? Math.min(hasMountain.count + 1, 4) : 2
    for (let i = 0; i < mountainCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: `mountain-${i}`,
        x: 0,
        y: height * (0.5 + i * 0.12),
        scale: 1,
        rotation: 0,
        opacity: 0.15 + i * 0.1,
        zIndex: i,
      })
    }

    const hasTree = poetryData.imagery.find(i => i.type === 'tree')
    const treeCount = hasTree ? Math.min(hasTree.count + 1, 4) : 0
    for (let i = 0; i < treeCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'tree',
        x: width * (0.1 + random() * 0.8),
        y: height * (0.65 + random() * 0.2),
        scale: 0.6 + random() * 0.6,
        rotation: (random() - 0.5) * 0.1,
        opacity: 0.7 + random() * 0.3,
        zIndex: 10 + i,
      })
    }

    const hasBird = poetryData.imagery.find(i => i.type === 'bird')
    const birdCount = hasBird ? Math.min(hasBird.count + 2, 6) : 0
    for (let i = 0; i < birdCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'bird',
        x: width * (0.2 + random() * 0.6),
        y: height * (0.15 + random() * 0.35),
        scale: 0.5 + random() * 0.5,
        rotation: (random() - 0.5) * 0.3,
        opacity: 0.6 + random() * 0.4,
        zIndex: 20 + i,
      })
    }

    const hasMoon = poetryData.imagery.find(i => i.type === 'moon')
    if (hasMoon) {
      newElements.push({
        id: uuidv4(),
        type: 'moon',
        x: width * (0.7 + random() * 0.15),
        y: height * (0.12 + random() * 0.1),
        scale: 0.8 + random() * 0.4,
        rotation: 0,
        opacity: 0.9,
        zIndex: 5,
      })
    }

    const hasWater = poetryData.imagery.find(i => i.type === 'water')
    if (hasWater) {
      newElements.push({
        id: uuidv4(),
        type: 'water',
        x: 0,
        y: height * 0.82,
        scale: 1,
        rotation: 0,
        opacity: 0.4,
        zIndex: 8,
      })
    }

    const hasFlower = poetryData.imagery.find(i => i.type === 'flower')
    const flowerCount = hasFlower ? Math.min(hasFlower.count + 2, 5) : 0
    for (let i = 0; i < flowerCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'flower',
        x: width * (0.1 + random() * 0.8),
        y: height * (0.75 + random() * 0.15),
        scale: 0.6 + random() * 0.6,
        rotation: (random() - 0.5) * 0.2,
        opacity: 0.7 + random() * 0.3,
        zIndex: 15 + i,
      })
    }

    const hasCloud = poetryData.imagery.find(i => i.type === 'cloud')
    const cloudCount = hasCloud ? Math.min(hasCloud.count + 1, 4) : 0
    for (let i = 0; i < cloudCount; i++) {
      newElements.push({
        id: uuidv4(),
        type: 'cloud',
        x: width * (0.2 + random() * 0.6),
        y: height * (0.08 + random() * 0.15),
        scale: 0.8 + random() * 0.8,
        rotation: 0,
        opacity: 0.3 + random() * 0.2,
        zIndex: 3 + i,
      })
    }

    newElements.sort((a, b) => a.zIndex - b.zIndex)
    setElements(newElements)

    setAnimPhase(0)
    setTimeout(() => setAnimPhase(1), 100)
    setTimeout(() => setAnimPhase(2), 400)
    setTimeout(() => setAnimPhase(3), 700)
  }, [poetryData, seed, dimensions])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault()
      const element = elements.find(el => el.id === elementId)
      if (!element) return

      const svg = svgRef.current
      if (!svg) return

      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

      setDraggingId(elementId)
      setDragOffset({
        x: svgP.x - element.x,
        y: svgP.y - element.y,
      })
    },
    [elements],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId) return

      const svg = svgRef.current
      if (!svg) return

      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

      setElements(prev =>
        prev.map(el =>
          el.id === draggingId
            ? { ...el, x: svgP.x - dragOffset.x, y: svgP.y - dragOffset.y }
            : el,
        ),
      )
    },
    [draggingId, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, elementId: string) => {
      e.preventDefault()
      const touch = e.touches[0]
      const element = elements.find(el => el.id === elementId)
      if (!element) return

      const svg = svgRef.current
      if (!svg) return

      const pt = svg.createSVGPoint()
      pt.x = touch.clientX
      pt.y = touch.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

      setDraggingId(elementId)
      setDragOffset({
        x: svgP.x - element.x,
        y: svgP.y - element.y,
      })
    },
    [elements],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!draggingId) return

      const touch = e.touches[0]
      const svg = svgRef.current
      if (!svg) return

      const pt = svg.createSVGPoint()
      pt.x = touch.clientX
      pt.y = touch.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

      setElements(prev =>
        prev.map(el =>
          el.id === draggingId
            ? { ...el, x: svgP.x - dragOffset.x, y: svgP.y - dragOffset.y }
            : el,
        ),
      )
    },
    [draggingId, dragOffset],
  )

  const handleTouchEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const exportPNG = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = dimensions.width * scale
      canvas.height = dimensions.height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#e8ddd0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)

      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `poetry-ink-${Date.now()}.png`
      link.href = pngUrl
      link.click()

      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [dimensions])

  const renderMountain = (element: CanvasElement, index: number) => {
    const mountainRandom = seededRandom(seed + index * 1000)
    const width = dimensions.width * 1.2
    const height = dimensions.height * (0.3 + mountainRandom() * 0.2)
    const path = generateMountainPath(
      element.x - dimensions.width * 0.1,
      element.y,
      width,
      height,
      mountainRandom,
      6 + Math.floor(mountainRandom() * 4),
    )

    const grayValue = Math.floor(120 + (1 - element.opacity) * 80)
    const fillColor = `rgb(${grayValue}, ${grayValue}, ${grayValue + 10})`

    return (
      <path
        key={element.id}
        d={path}
        fill={fillColor}
        opacity={element.opacity}
        className="canvas-element"
        style={{
          animationDelay: `${0}ms`,
          opacity: animPhase >= 1 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      />
    )
  }

  const renderTree = (element: CanvasElement, index: number) => {
    const treeRandom = seededRandom(seed + index * 2000)
    const height = (60 + treeRandom() * 40) * element.scale
    const { trunk, branches } = generateTreePath(element.x, element.y, height, treeRandom)

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 2 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={trunk} fill="#3d2b1e" opacity="0.8" />
        {branches.map((branch, i) => (
          <path
            key={i}
            d={branch}
            fill="none"
            stroke="#3d2b1e"
            strokeWidth={2 * element.scale}
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}
      </g>
    )
  }

  const renderBird = (element: CanvasElement, index: number) => {
    const birdRandom = seededRandom(seed + index * 3000)
    const path = generateBirdPath(element.x, element.y, element.scale)
    const wingOffset = birdRandom() * Math.PI * 2

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 3 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={path} fill="#2c1810" opacity={element.opacity} />
        <path
          d={generateBirdPath(element.x, element.y - 3 * element.scale, element.scale * 0.8)}
          fill="#2c1810"
          opacity={element.opacity * 0.5}
          style={{
            transformOrigin: `${element.x}px ${element.y}px`,
          }}
        />
      </g>
    )
  }

  const renderMoon = (element: CanvasElement) => {
    const radius = 25 * element.scale
    const gradientId = `moon-gradient-${element.id}`

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 1 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf5" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f5f0e0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e8e0d0" stopOpacity="0.2" />
          </radialGradient>
          <filter id={`blur-${element.id}`}>
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle
          cx={element.x}
          cy={element.y}
          r={radius * 1.8}
          fill={`url(#${gradientId})`}
          filter={`url(#blur-${element.id})`}
        />
        <circle
          cx={element.x}
          cy={element.y}
          r={radius}
          fill="#fffdf5"
          opacity="0.95"
        />
        <circle
          cx={element.x + radius * 0.3}
          cy={element.y - radius * 0.2}
          r={radius * 0.15}
          fill="#e8e0d0"
          opacity="0.4"
        />
      </g>
    )
  }

  const renderWater = (element: CanvasElement) => {
    const waveCount = 5
    const waves = []
    const waterRandom = seededRandom(seed + 5000)

    for (let i = 0; i < waveCount; i++) {
      const yOffset = i * 8
      const amplitude = 5 + waterRandom() * 5
      const frequency = 0.02 + waterRandom() * 0.01
      const phase = waterRandom() * Math.PI * 2

      let path = `M 0 ${element.y + yOffset}`
      for (let x = 0; x <= dimensions.width; x += 10) {
        const y = element.y + yOffset + Math.sin(x * frequency + phase) * amplitude
        path += ` L ${x} ${y}`
      }
      waves.push(path)
    }

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 2 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <rect
          x="0"
          y={element.y}
          width={dimensions.width}
          height={dimensions.height - element.y}
          fill="url(#water-gradient)"
          opacity="0.3"
        />
        <defs>
          <linearGradient id="water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7a8c99" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5a6c79" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {waves.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="#6a7c89"
            strokeWidth={1.5}
            opacity={0.3 + i * 0.1}
          />
        ))}
      </g>
    )
  }

  const renderFlower = (element: CanvasElement, index: number) => {
    const flowerRandom = seededRandom(seed + index * 4000)
    const { petals, center } = generateFlowerPath(
      element.x,
      element.y,
      element.scale,
      flowerRandom,
    )

    const petalColors = ['#c95a6b', '#d47a8a', '#b84a5b', '#e89aaa']
    const petalColor = petalColors[index % petalColors.length]

    return (
      <g
        key={element.id}
        className="canvas-element"
        style={{
          opacity: animPhase >= 3 ? element.opacity : 0,
          transition: 'opacity 0.5s ease-out',
        }}
        onMouseDown={e => handleMouseDown(e, element.id)}
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        {petals.map((petal, i) => (
          <path key={i} d={petal} fill={petalColor} opacity="0.8" />
        ))}
        <path d={center} fill="#f5d060" />
      </g>
    )
  }

  const renderCloud = (element: CanvasElement, index: number) => {
    const cloudRandom = seededRandom(seed + index * 6000)
    const width = (80 + cloudRandom() * 60) * element.scale
    const height = (25 + cloudRandom() * 15) * element.scale
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
        onTouchStart={e => handleTouchStart(e, element.id)}
      >
        <path d={path} fill="#ffffff" opacity={element.opacity} />
      </g>
    )
  }

  const renderPoetryText = () => {
    if (!poetryData) return null

    const lines = poetryData.content.split('\n').filter(l => l.trim())
    const fontSize = Math.min(dimensions.width, dimensions.height) * 0.045
    const lineHeight = fontSize * 1.8
    const startX = dimensions.width * 0.82
    const startY = dimensions.height * 0.15

    return (
      <g
        className="poetry-text"
        style={{
          opacity: animPhase >= 3 ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <text
          x={startX}
          y={startY - fontSize * 1.5}
          fontSize={fontSize * 0.7}
          fill="#5a3e2b"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-brush)' }}
        >
          {poetryData.title}
        </text>
        {lines.map((line, i) => (
          <text
            key={i}
            x={startX}
            y={startY + i * lineHeight}
            fontSize={fontSize}
            fill="#3d2b1e"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-brush)' }}
          >
            {line}
          </text>
        ))}
        <rect
          x={startX - fontSize * 0.8}
          y={startY - fontSize * 2.5}
          width={fontSize * 1.6}
          height={fontSize * 1.6}
          fill="none"
          stroke="#c95a6b"
          strokeWidth="2"
          opacity="0.6"
          rx="4"
        />
      </g>
    )
  }

  const renderElements = () => {
    const mountains: JSX.Element[] = []
    const trees: JSX.Element[] = []
    const birds: JSX.Element[] = []
    const flowers: JSX.Element[] = []
    const clouds: JSX.Element[] = []
    let moon: JSX.Element | null = null
    let water: JSX.Element | null = null

    let mountainIndex = 0
    let treeIndex = 0
    let birdIndex = 0
    let flowerIndex = 0
    let cloudIndex = 0

    elements.forEach(element => {
      if (element.type.startsWith('mountain')) {
        mountains.push(renderMountain(element, mountainIndex++))
      } else if (element.type === 'tree') {
        trees.push(renderTree(element, treeIndex++))
      } else if (element.type === 'bird') {
        birds.push(renderBird(element, birdIndex++))
      } else if (element.type === 'moon') {
        moon = renderMoon(element)
      } else if (element.type === 'water') {
        water = renderWater(element)
      } else if (element.type === 'flower') {
        flowers.push(renderFlower(element, flowerIndex++))
      } else if (element.type === 'cloud') {
        clouds.push(renderCloud(element, cloudIndex++))
      }
    })

    return (
      <>
        {clouds}
        {moon}
        {mountains}
        {water}
        {trees}
        {flowers}
        {birds}
        {renderPoetryText()}
      </>
    )
  }

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      <svg
        ref={svgRef}
        className="ink-svg"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {elements.length > 0 ? (
          renderElements()
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
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i>
              输入诗词，点击生成按钮
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

export default InkCanvas
