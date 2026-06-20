import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCalcStore } from '../store/useCalcStore'
import { evaluatePolynomial } from '../utils/fitCurve'

interface InkRipple {
  id: string
  x: number
  y: number
  color: string
}

const CANVAS_PADDING = 60

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [dataRange, setDataRange] = useState({ xMin: 0, xMax: 10, yMin: 0, yMax: 10 })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [ripples, setRipples] = useState<InkRipple[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  const {
    points,
    fitResult,
    addPoint,
    updatePoint,
    deletePoint,
    setEditingPointId,
    selectedColor
  } = useCalcStore()

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({
          width: rect.width,
          height: rect.height
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (points.length === 0) {
      setDataRange({ xMin: 0, xMax: 10, yMin: 0, yMax: 10 })
      return
    }

    const xVals = points.map(p => p.x)
    const yVals = points.map(p => p.y)
    let xMin = Math.min(...xVals) - 1
    let xMax = Math.max(...xVals) + 1
    let yMin = Math.min(...yVals) - 1
    let yMax = Math.max(...yVals) + 1

    if (fitResult && fitResult.coefficients.some(c => Math.abs(c) > 1e-6)) {
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 100) {
        const y = evaluatePolynomial(fitResult.coefficients, x)
        yMin = Math.min(yMin, y - 1)
        yMax = Math.max(yMax, y + 1)
      }
    }

    xMin = Math.max(0, xMin)
    yMin = Math.max(0, yMin)

    setDataRange({ xMin, xMax, yMin, yMax })
  }, [points, fitResult])

  const addInkRipple = useCallback((x: number, y: number, color: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setRipples(prev => [...prev, { id, x, y, color }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 800)
  }, [])

  const toCanvasX = useCallback((x: number) => {
    const { xMin, xMax } = dataRange
    const drawWidth = canvasSize.width - 2 * CANVAS_PADDING
    return CANVAS_PADDING + ((x - xMin) / (xMax - xMin)) * drawWidth
  }, [dataRange, canvasSize.width])

  const toCanvasY = useCallback((y: number) => {
    const { yMin, yMax } = dataRange
    const drawHeight = canvasSize.height - 2 * CANVAS_PADDING
    return canvasSize.height - CANVAS_PADDING - ((y - yMin) / (yMax - yMin)) * drawHeight
  }, [dataRange, canvasSize.height])

  const fromCanvasX = useCallback((canvasX: number) => {
    const { xMin, xMax } = dataRange
    const drawWidth = canvasSize.width - 2 * CANVAS_PADDING
    return xMin + ((canvasX - CANVAS_PADDING) / drawWidth) * (xMax - xMin)
  }, [dataRange, canvasSize.width])

  const fromCanvasY = useCallback((canvasY: number) => {
    const { yMin, yMax } = dataRange
    const drawHeight = canvasSize.height - 2 * CANVAS_PADDING
    return yMin + ((canvasSize.height - CANVAS_PADDING - canvasY) / drawHeight) * (yMax - yMin)
  }, [dataRange, canvasSize.height])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (draggingId) return

    const target = e.target as HTMLElement
    if (target.closest('.data-point')) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    if (
      canvasX < CANVAS_PADDING ||
      canvasX > canvasSize.width - CANVAS_PADDING ||
      canvasY < CANVAS_PADDING ||
      canvasY > canvasSize.height - CANVAS_PADDING
    ) {
      return
    }

    const x = parseFloat(fromCanvasX(canvasX).toFixed(2))
    const y = parseFloat(fromCanvasY(canvasY).toFixed(2))

    addPoint(x, y)
    addInkRipple(canvasX, canvasY, selectedColor)
  }, [draggingId, canvasSize, fromCanvasX, fromCanvasY, addPoint, addInkRipple, selectedColor])

  const handleMouseDown = useCallback((e: React.MouseEvent, pointId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingId(pointId)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    const boundedX = Math.max(CANVAS_PADDING, Math.min(canvasSize.width - CANVAS_PADDING, canvasX))
    const boundedY = Math.max(CANVAS_PADDING, Math.min(canvasSize.height - CANVAS_PADDING, canvasY))

    const x = parseFloat(fromCanvasX(boundedX).toFixed(2))
    const y = parseFloat(fromCanvasY(boundedY).toFixed(2))

    updatePoint(draggingId, x, y)
  }, [draggingId, canvasSize, fromCanvasX, fromCanvasY, updatePoint])

  const handleMouseUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, pointId: string) => {
    e.preventDefault()
    e.stopPropagation()
    deletePoint(pointId)
  }, [deletePoint])

  const handleDoubleClick = useCallback((e: React.MouseEvent, pointId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingPointId(pointId)
  }, [setEditingPointId])

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const generateCurvePath = useCallback(() => {
    if (!fitResult || !fitResult.coefficients.some(c => Math.abs(c) > 1e-6)) {
      return ''
    }

    const { xMin, xMax } = dataRange
    const step = (xMax - xMin) / 200
    const points: string[] = []

    for (let x = xMin; x <= xMax; x += step) {
      const y = evaluatePolynomial(fitResult.coefficients, x)
      const canvasX = toCanvasX(x)
      const canvasY = toCanvasY(y)

      if (canvasY >= CANVAS_PADDING && canvasY <= canvasSize.height - CANVAS_PADDING) {
        points.push(`${canvasX},${canvasY}`)
      }
    }

    return points.length > 1 ? `M ${points.join(' L ')}` : ''
  }, [fitResult, dataRange, toCanvasX, toCanvasY, canvasSize.height])

  const gridLines = useCallback(() => {
    const lines = []
    const { xMin, xMax, yMin, yMax } = dataRange

    const xStep = Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 5)))
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const canvasX = toCanvasX(x)
      lines.push(
        <line
          key={`x-${x}`}
          x1={canvasX}
          y1={CANVAS_PADDING}
          x2={canvasX}
          y2={canvasSize.height - CANVAS_PADDING}
          stroke="rgba(58, 58, 58, 0.08)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      )
      lines.push(
        <text
          key={`x-label-${x}`}
          x={canvasX}
          y={canvasSize.height - CANVAS_PADDING + 20}
          textAnchor="middle"
          fill="rgba(58, 58, 58, 0.5)"
          fontSize="11"
          fontFamily="serif"
        >
          {x.toFixed(1)}
        </text>
      )
    }

    const yStep = Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 5)))
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const canvasY = toCanvasY(y)
      lines.push(
        <line
          key={`y-${y}`}
          x1={CANVAS_PADDING}
          y1={canvasY}
          x2={canvasSize.width - CANVAS_PADDING}
          y2={canvasY}
          stroke="rgba(58, 58, 58, 0.08)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      )
      lines.push(
        <text
          key={`y-label-${y}`}
          x={CANVAS_PADDING - 12}
          y={canvasY + 4}
          textAnchor="end"
          fill="rgba(58, 58, 58, 0.5)"
          fontSize="11"
          fontFamily="serif"
        >
          {y.toFixed(1)}
        </text>
      )
    }

    return lines
  }, [dataRange, toCanvasX, toCanvasY, canvasSize])

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '30px',
          background: '#f5f5f0',
          borderRadius: '8px',
          boxShadow: `
            inset 0 0 60px rgba(58, 58, 58, 0.05),
            0 8px 32px rgba(58, 58, 58, 0.15)
          `,
          border: '1px solid rgba(58, 58, 58, 0.1)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 10% 20%, rgba(74, 124, 89, 0.03) 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(192, 57, 43, 0.03) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(58, 58, 58, 0.02) 0%, transparent 60%)
            `,
            pointerEvents: 'none'
          }}
        />
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          position: 'relative',
          zIndex: 1,
          cursor: draggingId ? 'grabbing' : 'crosshair'
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      >
        <line
          x1={CANVAS_PADDING}
          y1={canvasSize.height - CANVAS_PADDING}
          x2={canvasSize.width - CANVAS_PADDING}
          y2={canvasSize.height - CANVAS_PADDING}
          stroke="#3a3a3a"
          strokeWidth="2"
        />
        <line
          x1={CANVAS_PADDING}
          y1={CANVAS_PADDING}
          x2={CANVAS_PADDING}
          y2={canvasSize.height - CANVAS_PADDING}
          stroke="#3a3a3a"
          strokeWidth="2"
        />

        <polygon
          points={`${canvasSize.width - CANVAS_PADDING},${canvasSize.height - CANVAS_PADDING} ${canvasSize.width - CANVAS_PADDING - 8},${canvasSize.height - CANVAS_PADDING - 4} ${canvasSize.width - CANVAS_PADDING - 8},${canvasSize.height - CANVAS_PADDING + 4}`}
          fill="#3a3a3a"
        />
        <polygon
          points={`${CANVAS_PADDING},${CANVAS_PADDING} ${CANVAS_PADDING - 4},${CANVAS_PADDING + 8} ${CANVAS_PADDING + 4},${CANVAS_PADDING + 8}`}
          fill="#3a3a3a"
        />

        <text
          x={canvasSize.width - CANVAS_PADDING + 15}
          y={canvasSize.height - CANVAS_PADDING + 5}
          fill="#3a3a3a"
          fontSize="14"
          fontFamily="serif"
          fontWeight="bold"
        >
          x
        </text>
        <text
          x={CANVAS_PADDING - 5}
          y={CANVAS_PADDING - 10}
          fill="#3a3a3a"
          fontSize="14"
          fontFamily="serif"
          fontWeight="bold"
        >
          y
        </text>

        {gridLines()}

        {fitResult && generateCurvePath() && (
          <>
            <motion.path
              key={`shadow-${fitResult.equation}-${points.length}`}
              d={generateCurvePath()}
              fill="none"
              stroke="rgba(58, 58, 58, 0.1)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <motion.path
              key={`curve-${fitResult.equation}-${points.length}`}
              d={generateCurvePath()}
              fill="none"
              stroke="#3a3a3a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </>
        )}

        <AnimatePresence>
          {points.map((point) => {
            const cx = toCanvasX(point.x)
            const cy = toCanvasY(point.y)
            const isHovered = hoveredPoint === point.id
            const isDragging = draggingId === point.id

            return (
              <g
                key={point.id}
                className="data-point"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, point.id)}
                onContextMenu={(e) => handleContextMenu(e, point.id)}
                onDoubleClick={(e) => handleDoubleClick(e, point.id)}
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isHovered || isDragging ? 16 : 12}
                  fill={point.color}
                  fillOpacity={0.85}
                  stroke={point.color}
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isDragging ? 1.3 : (isHovered ? 1.15 : 1),
                    opacity: 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25
                  }}
                  style={{
                    filter: isHovered || isDragging
                      ? `drop-shadow(0 0 10px ${point.color})`
                      : `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`
                  }}
                />

                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isHovered || isDragging ? 6 : 4}
                  fill="#f5f5f0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                />

                {isHovered && !isDragging && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <rect
                      x={cx - 45}
                      y={cy - 45}
                      width="90"
                      height="28"
                      rx="6"
                      fill="rgba(58, 58, 58, 0.9)"
                    />
                    <text
                      x={cx}
                      y={cy - 27}
                      textAnchor="middle"
                      fill="#f5f5f0"
                      fontSize="12"
                      fontFamily="serif"
                    >
                      ({point.x.toFixed(1)}, {point.y.toFixed(1)})
                    </text>
                  </motion.g>
                )}
              </g>
            )
          })}
        </AnimatePresence>

        <AnimatePresence>
          {ripples.map((ripple) => (
            <g key={ripple.id}>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`${ripple.id}-${i}`}
                  cx={ripple.x}
                  cy={ripple.y}
                  r={5}
                  fill="none"
                  stroke={ripple.color}
                  strokeWidth={2 - i * 0.5}
                  initial={{ scale: 0, opacity: 0.6 - i * 0.15 }}
                  animate={{
                    scale: [1, 4 + i * 2],
                    opacity: [0.6 - i * 0.15, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                    delay: i * 0.15
                  }}
                />
              ))}
            </g>
          ))}
        </AnimatePresence>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#3a3a3a',
          letterSpacing: '8px',
          fontFamily: 'STKaiti, KaiTi, serif',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        墨韵算筹
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '40px',
          fontSize: '12px',
          color: 'rgba(58, 58, 58, 0.4)',
          fontFamily: 'serif',
          fontStyle: 'italic'
        }}
      >
        点击画布放置算筹 · 运筹帷幄之中，决胜千里之外
      </div>
    </div>
  )
}
