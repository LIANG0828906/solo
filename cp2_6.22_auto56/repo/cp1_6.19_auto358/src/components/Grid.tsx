import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AxialCoord } from '@/game/types'
import {
  GRID_COLS,
  GRID_ROWS,
  HEX_SIZE,
  TOWER_CONFIG,
  TowerType,
  ArmorType,
  PATH_COORDS,
} from '@/game/types'
import {
  axialToPixel,
  hexCorners,
  isOnPath,
  getGridBounds,
} from '@/game/physics'
import { useGameStore } from '@/store/gameStore'

interface GridProps {
  scale: number
  offsetX: number
  offsetY: number
}

export default function Grid({ scale, offsetX, offsetY }: GridProps) {
  const {
    towers,
    deployTower,
    selectedTowerType,
    deployAnimations,
    gameTime,
  } = useGameStore()

  const bounds = useMemo(() => getGridBounds(GRID_COLS, GRID_ROWS), [])
  const width = bounds.maxX - bounds.minX + 40
  const height = bounds.maxY - bounds.minY + 40

  const cells = useMemo(() => {
    const result: Array<{ q: number; r: number; x: number; y: number; path: string; onPath: boolean }> = []
    for (let q = 0; q < GRID_COLS; q++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const { x, y } = axialToPixel(q, r)
        const path = hexCorners(x, y, HEX_SIZE - 1)
        result.push({ q, r, x, y, path, onPath: isOnPath(q, r) })
      }
    }
    return result
  }, [])

  const pathPoints = useMemo(() => {
    return PATH_COORDS.map((p: AxialCoord) => {
      const { x, y } = axialToPixel(p.q, p.r)
      return `${x},${y}`
    }).join(' ')
  }, [])

  const towerMap = useMemo(() => {
    const map = new Map<string, typeof towers[number]>()
    for (const t of towers) map.set(`${t.q}_${t.r}`, t)
    return map
  }, [towers])

  const handleCellClick = (q: number, r: number) => {
    deployTower(q, r)
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${bounds.minX - 20} ${bounds.minY - 20} ${width} ${height}`}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        transformOrigin: '0 0',
      }}
    >
      <defs>
        {Object.entries(TOWER_CONFIG).map(([type, cfg]) => (
          <radialGradient key={type} id={`waveGrad-${type}`}>
            <stop offset="0%" stopColor={cfg.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id="shieldGrad">
          <stop offset="0%" stopColor="#ab47bc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ab47bc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {cells.map(({ q, r, x, y, path, onPath }) => {
        const key = `${q}_${r}`
        const tower = towerMap.get(key)
        const cfg = TOWER_CONFIG[selectedTowerType]
        const canDeploy = !onPath && !tower
        return (
          <motion.g
            key={key}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15, delay: ((q * GRID_ROWS + r) * 0.0008) % 0.3 }}
          >
            <polygon
              points={path}
              fill={onPath ? '#151533' : 'transparent'}
              stroke="#1a1a3a"
              strokeWidth="0.8"
              style={{
                cursor: canDeploy ? 'pointer' : 'not-allowed',
                transition: 'fill 0.15s',
              }}
              onMouseEnter={(e) => {
                if (canDeploy) {
                  ;(e.currentTarget as SVGPolygonElement).setAttribute('fill', '#3a3a8a')
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as SVGPolygonElement).setAttribute(
                  'fill',
                  onPath ? '#151533' : 'transparent'
                )
              }}
              onClick={() => canDeploy && handleCellClick(q, r)}
            />

            {tower && (
              <g>
                <circle
                  cx={x}
                  cy={y}
                  r={HEX_SIZE * 0.55}
                  fill={tower.color}
                  opacity={0.2}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={HEX_SIZE * 0.38}
                  fill={tower.color}
                  opacity={0.9}
                  stroke="#fff"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
                {tower.type !== TowerType.SHIELD ? (
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#0a0a1a"
                    fontWeight="bold"
                    style={{ fontFamily: "'Courier New', monospace" }}
                  >
                    {TOWER_CONFIG[tower.type].label}
                  </text>
                ) : (
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    ◈
                  </text>
                )}
                {tower.type === TowerType.SHIELD && (
                  <text
                    x={x}
                    y={y + HEX_SIZE * 0.55 + 8}
                    textAnchor="middle"
                    fontSize="6.5"
                    fill="#ab47bc"
                    style={{ fontFamily: "'Courier New', monospace" }}
                  >
                    {Math.round(tower.reflectionRate * 100)}%
                  </text>
                )}
              </g>
            )}
          </motion.g>
        )
      })}

      <polyline
        points={pathPoints}
        fill="none"
        stroke="#4fc3f7"
        strokeOpacity="0.15"
        strokeWidth="3"
        strokeDasharray="4 3"
      />

      <AnimatePresence>
        {deployAnimations.map(anim => {
          const progress = Math.min(1, (gameTime - anim.startTime) / 0.2)
          return (
            <motion.circle
              key={anim.id}
              cx={anim.x}
              cy={anim.y}
              r={progress * HEX_SIZE}
              fill="none"
              stroke={anim.color}
              strokeWidth="2"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 - progress }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )
        })}
      </AnimatePresence>

      {Array.from(towerMap.values()).map(tower => (
        <text
          key={`label-${tower.id}`}
          style={{ display: 'none' }}
        >
          {tower.type}
        </text>
      ))}

      <g style={{ display: 'none' }}>
        <ArmorTypePlaceholder />
      </g>
    </svg>
  )
}

function ArmorTypePlaceholder() {
  return (
    <>
      <span>{ArmorType.LIGHT}</span>
      <span>{ArmorType.HEAVY}</span>
    </>
  )
}
