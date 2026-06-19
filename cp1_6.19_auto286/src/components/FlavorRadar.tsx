import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRecipeStore } from '../store/useRecipeStore'

interface FlavorProfile {
  acidity: number
  bitterness: number
  sweetness: number
  body: number
  aroma: number
}

interface Drink {
  id: string
  name: string
  flavor: FlavorProfile
}

interface FlavorRadarProps {
  drinks?: Drink[]
  showCompare?: boolean
}

const CX = 150
const CY = 150
const MAX_R = 110
const DIMS: (keyof FlavorProfile)[] = ['acidity', 'bitterness', 'sweetness', 'body', 'aroma']
const ANGLES = [-90, -18, 54, 126, 198]
const LABELS = ['酸度', '苦度', '甜度', '醇厚度', '香气']
const COLORS = ['#E74C3C', '#3498DB', '#2ECC71']

const DIRS = ANGLES.map(a => ({
  x: Math.cos((a * Math.PI) / 180),
  y: Math.sin((a * Math.PI) / 180)
}))

function vertex(dirIdx: number, radius: number) {
  return {
    x: CX + radius * DIRS[dirIdx].x,
    y: CY + radius * DIRS[dirIdx].y
  }
}

const FlavorRadar: React.FC<FlavorRadarProps> = React.memo(({ drinks, showCompare }) => {
  const savedDrinks = useRecipeStore(s => s.savedDrinks)
  const compareIds = useRecipeStore(s => s.compareIds)

  const activeDrinks = useMemo<Drink[]>(() => {
    if (showCompare && compareIds.length > 0) {
      return savedDrinks
        .filter((d: Drink) => compareIds.includes(d.id))
        .slice(0, 3)
    }
    if (drinks && drinks.length > 0) {
      return drinks.slice(0, 3)
    }
    return []
  }, [showCompare, compareIds, savedDrinks, drinks])

  const gridPolygons = useMemo(() => {
    return [0.33, 0.66, 1].map(scale =>
      DIMS.map((_, i) => {
        const v = vertex(i, MAX_R * scale)
        return `${v.x},${v.y}`
      }).join(' ')
    )
  }, [])

  const axisVertices = useMemo(
    () => DIMS.map((_, i) => vertex(i, MAX_R)),
    []
  )

  const labelData = useMemo(
    () =>
      DIMS.map((_, i) => {
        const pos = vertex(i, MAX_R + 20)
        const dx = DIRS[i].x
        const dy = DIRS[i].y
        const anchor = dx > 0.1 ? 'start' : dx < -0.1 ? 'end' : 'middle'
        const baseline =
          dy < -0.1 ? 'auto' : dy > 0.1 ? 'hanging' : 'central'
        return { label: LABELS[i], x: pos.x, y: pos.y, anchor, baseline }
      }),
    []
  )

  const dataPolygons = useMemo(() => {
    return activeDrinks.map((drink, drinkIdx) => {
      const pts = DIMS.map((dim, i) => vertex(i, (drink.flavor[dim] / 100) * MAX_R))
      return {
        drinkIdx,
        points: pts,
        pointStr: pts.map(p => `${p.x},${p.y}`).join(' '),
        color: COLORS[drinkIdx]
      }
    })
  }, [activeDrinks])

  const gradients = useMemo(() => {
    const result: {
      id: string
      x1: number
      y1: number
      x2: number
      y2: number
      color: string
    }[] = []
    dataPolygons.forEach(({ drinkIdx, points, color }) => {
      points.forEach((p, axisIdx) => {
        result.push({
          id: `grad-${drinkIdx}-${axisIdx}`,
          x1: p.x,
          y1: p.y,
          x2: CX,
          y2: CY,
          color
        })
      })
    })
    return result
  }, [dataPolygons])

  return (
    <div
      style={{
        width: 300,
        height: 300,
        border: '2px dashed white',
        borderRadius: 0
      }}
    >
      <svg width={300} height={300} viewBox="0 0 300 300">
        <defs>
          {gradients.map(g => (
            <linearGradient
              key={g.id}
              id={g.id}
              gradientUnits="userSpaceOnUse"
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
            >
              <stop offset="0%" stopColor={g.color} />
              <stop offset="100%" stopColor={g.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(255,248,220,0.2)"
            strokeWidth={1}
          />
        ))}

        {axisVertices.map((v, i) => (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={v.x}
            y2={v.y}
            stroke="rgba(255,248,220,0.3)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {labelData.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            dominantBaseline={l.baseline}
            fontFamily="'Press Start 2P'"
            fontSize={8}
            fill="#FFF8DC"
          >
            {l.label}
          </text>
        ))}

        {dataPolygons.map(({ drinkIdx, pointStr, points, color }) => (
          <React.Fragment key={drinkIdx}>
            {points.map((p, axisIdx) => (
              <line
                key={`gl-${drinkIdx}-${axisIdx}`}
                x1={p.x}
                y1={p.y}
                x2={CX}
                y2={CY}
                stroke={`url(#grad-${drinkIdx}-${axisIdx})`}
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.6}
              />
            ))}

            <motion.polygon
              points={pointStr}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeOpacity={0.8}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />

            {points.map((p, axisIdx) => (
              <circle
                key={`dp-${drinkIdx}-${axisIdx}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={color}
                stroke="white"
                strokeWidth={1}
              />
            ))}
          </React.Fragment>
        ))}
      </svg>
    </div>
  )
})

FlavorRadar.displayName = 'FlavorRadar'

export default FlavorRadar
