import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useGameStore, 
  Defense, 
  Enemy, 
  Position,
  MAP_WIDTH, 
  MAP_HEIGHT, 
  FORTRESS_POSITION, 
  FORTRESS_RADIUS,
  DEFENSE_CONFIGS,
  ENEMY_CONFIGS,
  DefenseType
} from '../store/gameStore'

interface SandTableProps {
  onPlaceDefense: (type: DefenseType, position: Position) => boolean
}

interface PanState {
  isPanning: boolean
  startX: number
  startY: number
  translateX: number
  translateY: number
}

interface DragState {
  isDragging: boolean
  type: DefenseType | null
  position: Position | null
}

const SandTable: React.FC<SandTableProps> = memo(({ onPlaceDefense }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const { 
    defenses, 
    enemies, 
    removeMode,
    removeDefense,
    fortressHealth,
    maxFortressHealth
  } = useGameStore()

  const [pan, setPan] = useState<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0
  })

  const [scale, setScale] = useState(1)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    type: null,
    position: null
  })

  const [placementFlash, setPlacementFlash] = useState<string | null>(null)
  const [hitEffects, setHitEffects] = useState<{ id: string; x: number; y: number }[]>([])

  const getSVGPoint = useCallback((clientX: number, clientY: number): Position => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const x = (clientX - rect.left - pan.translateX) / scale
    const y = (clientY - rect.top - pan.translateY) / scale
    return { x, y }
  }, [pan.translateX, pan.translateY, scale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 1) {
      e.preventDefault()
      setPan(prev => ({
        ...prev,
        isPanning: true,
        startX: e.clientX - prev.translateX,
        startY: e.clientY - prev.translateY
      }))
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (pan.isPanning) {
      setPan(prev => ({
        ...prev,
        translateX: e.clientX - prev.startX,
        translateY: e.clientY - prev.startY
      }))
    }
    
    if (dragState.isDragging) {
      const point = getSVGPoint(e.clientX, e.clientY)
      setDragState(prev => ({
        ...prev,
        position: point
      }))
    }
  }, [pan.isPanning, dragState.isDragging, getSVGPoint])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (pan.isPanning) {
      setPan(prev => ({ ...prev, isPanning: false }))
    }
    
    if (dragState.isDragging && dragState.type && dragState.position) {
      const point = getSVGPoint(e.clientX, e.clientY)
      if (point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT) {
        const success = onPlaceDefense(dragState.type, point)
        if (success) {
          const newId = Math.random().toString(36).substr(2, 9)
          setPlacementFlash(newId)
          setTimeout(() => setPlacementFlash(null), 300)
        }
      }
      setDragState({ isDragging: false, type: null, position: null })
    }
  }, [pan.isPanning, dragState, getSVGPoint, onPlaceDefense])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 2))
  }, [])

  const handleDefenseClick = useCallback((e: React.MouseEvent, defenseId: string) => {
    e.stopPropagation()
    if (removeMode) {
      removeDefense(defenseId)
    }
  }, [removeMode, removeDefense])

  useEffect(() => {
    const handleDragStart = (e: CustomEvent) => {
      const { type } = e.detail
      setDragState({
        isDragging: true,
        type,
        position: null
      })
    }

    const handleDragEnd = () => {
      setDragState({ isDragging: false, type: null, position: null })
    }

    window.addEventListener('defenseDragStart' as any, handleDragStart)
    window.addEventListener('defenseDragEnd' as any, handleDragEnd)

    return () => {
      window.removeEventListener('defenseDragStart' as any, handleDragStart)
      window.removeEventListener('defenseDragEnd' as any, handleDragEnd)
    }
  }, [])

  useEffect(() => {
    if (enemies.length > 0) {
      const interval = setInterval(() => {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)]
        if (randomEnemy && randomEnemy.health > 0) {
          const effectId = `${randomEnemy.id}-${Date.now()}`
          setHitEffects(prev => [...prev, {
            id: effectId,
            x: randomEnemy.position.x,
            y: randomEnemy.position.y
          }])
          setTimeout(() => {
            setHitEffects(prev => prev.filter(e => e.id !== effectId))
          }, 500)
        }
      }, 300)
      return () => clearInterval(interval)
    }
  }, [enemies])

  const healthPercentage = (fortressHealth / maxFortressHealth) * 100

  const sandPatternId = useMemo(() => 'sand-pattern-' + Math.random().toString(36).substr(2, 9), [])

  const renderFortress = useMemo(() => (
    <g>
      <circle
        cx={FORTRESS_POSITION.x}
        cy={FORTRESS_POSITION.y}
        r={FORTRESS_RADIUS + 10}
        fill="none"
        stroke="#3d2817"
        strokeWidth="3"
        strokeDasharray="5,5"
      />
      <motion.circle
        cx={FORTRESS_POSITION.x}
        cy={FORTRESS_POSITION.y}
        r={FORTRESS_RADIUS}
        fill="url(#fortressGradient)"
        stroke="#3d2817"
        strokeWidth="4"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      />
      <text
        x={FORTRESS_POSITION.x}
        y={FORTRESS_POSITION.y - 10}
        textAnchor="middle"
        fill="#f5e6d3"
        fontSize="14"
        fontWeight="bold"
        style={{ userSelect: 'none' }}
      >
        烽燧
      </text>
      <rect
        x={FORTRESS_POSITION.x - 30}
        y={FORTRESS_POSITION.y + 5}
        width="60"
        height="8"
        fill="#3d2817"
        rx="0"
      />
      <rect
        x={FORTRESS_POSITION.x - 28}
        y={FORTRESS_POSITION.y + 7}
        width={56 * (fortressHealth / maxFortressHealth)}
        height="4"
        fill={healthPercentage > 60 ? '#4e9a5c' : healthPercentage > 30 ? '#c4a04e' : '#c45c4e'}
        rx="0"
      />
    </g>
  ), [fortressHealth, maxFortressHealth, healthPercentage])

  const renderDefenses = useMemo(() => defenses.map((defense: Defense) => {
    const config = DEFENSE_CONFIGS[defense.type]
    const isFlashing = placementFlash === defense.id
    
    return (
      <motion.g
        key={defense.id}
        onClick={(e) => handleDefenseClick(e, defense.id)}
        style={{ cursor: removeMode ? 'not-allowed' : 'pointer' }}
        initial={isFlashing ? { scale: 0 } : false}
        animate={isFlashing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {defense.type === 'arrowTower' && (
          <circle
            cx={defense.position.x}
            cy={defense.position.y}
            r={config.range}
            fill="rgba(184, 151, 90, 0.1)"
            stroke="rgba(107, 66, 38, 0.3)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}
        
        <rect
          x={defense.position.x - 18}
          y={defense.position.y - 18}
          width="36"
          height="36"
          fill={defense.type === 'palisade' ? '#8b6914' : defense.type === 'arrowTower' ? '#6b4226' : '#a08050'}
          stroke="#3d2817"
          strokeWidth="2"
          rx="0"
        />
        
        <text
          x={defense.position.x}
          y={defense.position.y + 5}
          textAnchor="middle"
          fontSize="18"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {config.icon}
        </text>
        
        <rect
          x={defense.position.x - 15}
          y={defense.position.y - 25}
          width="30"
          height="4"
          fill="#3d2817"
          rx="0"
        />
        <rect
          x={defense.position.x - 14}
          y={defense.position.y - 24}
          width={28 * (defense.health / defense.maxHealth)}
          height="2"
          fill="#70c080"
          rx="0"
        />
      </motion.g>
    )
  }), [defenses, placementFlash, removeMode, handleDefenseClick])

  const renderEnemies = useMemo(() => enemies.map((enemy: Enemy) => {
    const config = ENEMY_CONFIGS[enemy.type]
    
    return (
      <g key={enemy.id}>
        <defs>
          <marker
            id={`arrow-${enemy.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(196, 92, 78, 0.6)" />
          </marker>
        </defs>
        
        <line
          x1={enemy.position.x}
          y1={enemy.position.y}
          x2={enemy.targetPosition.x}
          y2={enemy.targetPosition.y}
          stroke="rgba(196, 92, 78, 0.4)"
          strokeWidth="2"
          strokeDasharray="5,5"
          markerEnd={`url(#arrow-${enemy.id})`}
        />
        
        <motion.g
          animate={{
            x: enemy.position.x,
            y: enemy.position.y
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
        >
          <circle
            cx={0}
            cy={0}
            r="18"
            fill={enemy.type === 'cavalry' ? '#8b3a3a' : '#6b4226'}
            stroke="#3d2817"
            strokeWidth="2"
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontSize="16"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {enemy.type === 'cavalry' ? '🐎' : '🏴‍☠️'}
          </text>
          
          <rect
            x={-15}
            y={-28}
            width="30"
            height="4"
            fill="#3d2817"
            rx="0"
          />
          <rect
            x={-14}
            y={-27}
            width={28 * (enemy.health / enemy.maxHealth)}
            height="2"
            fill="#e07060"
            rx="0"
          />
          
          <text
            x={0}
            y={-35}
            textAnchor="middle"
            fill="#3d2817"
            fontSize="10"
            fontWeight="bold"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {config.name}
          </text>
        </motion.g>
      </g>
    )
  }), [enemies])

  const renderDragPreview = useMemo(() => {
    if (!dragState.isDragging || !dragState.type || !dragState.position) return null
    
    const config = DEFENSE_CONFIGS[dragState.type]
    const isValid = dragState.position.x >= 0 && 
                    dragState.position.x <= MAP_WIDTH && 
                    dragState.position.y >= 0 && 
                    dragState.position.y <= MAP_HEIGHT
    
    return (
      <motion.g
        animate={{
          x: dragState.position.x,
          y: dragState.position.y
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.02 }}
        style={{ pointerEvents: 'none' }}
      >
        {dragState.type === 'arrowTower' && (
          <circle
            cx={0}
            cy={0}
            r={config.range}
            fill={isValid ? 'rgba(78, 154, 92, 0.1)' : 'rgba(196, 92, 78, 0.1)'}
            stroke={isValid ? 'rgba(78, 154, 92, 0.5)' : 'rgba(196, 92, 78, 0.5)'}
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}
        <rect
          x={-18}
          y={-18}
          width="36"
          height="36"
          fill={isValid ? '#8b6914' : '#8b3a3a'}
          stroke="#3d2817"
          strokeWidth="2"
          opacity="0.8"
          rx="0"
        />
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fontSize="18"
          opacity="0.8"
          style={{ userSelect: 'none' }}
        >
          {config.icon}
        </text>
      </motion.g>
    )
  }, [dragState])

  const renderHitEffects = useMemo(() => hitEffects.map(effect => (
    <motion.g
      key={effect.id}
      initial={{ scale: 0.5, opacity: 1 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ pointerEvents: 'none' }}
    >
      <circle
        cx={effect.x}
        cy={effect.y}
        r="15"
        fill="none"
        stroke="#ffd700"
        strokeWidth="3"
      />
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <line
            key={i}
            x1={effect.x}
            y1={effect.y}
            x2={effect.x + Math.cos(angle) * 20}
            y2={effect.y + Math.sin(angle) * 20}
            stroke="#ffd700"
            strokeWidth="2"
          />
        )
      })}
    </motion.g>
  )), [hitEffects])

  return (
    <div className="sand-table-wrapper">
      <svg
        ref={svgRef}
        className="sand-table-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id={sandPatternId} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#d4b896" />
            {[...Array(20)].map((_, i) => (
              <circle
                key={i}
                cx={Math.random() * 100}
                cy={Math.random() * 100}
                r={Math.random() * 2 + 0.5}
                fill={`rgba(107, 66, 38, ${Math.random() * 0.3 + 0.1})`}
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <path
                key={`line-${i}`}
                d={`M ${Math.random() * 100} ${Math.random() * 100} Q ${Math.random() * 100} ${Math.random() * 100} ${Math.random() * 100} ${Math.random() * 100}`}
                fill="none"
                stroke={`rgba(107, 66, 38, ${Math.random() * 0.15 + 0.05})`}
                strokeWidth={Math.random() * 2 + 1}
              />
            ))}
          </pattern>
          
          <radialGradient id="fortressGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b6914" />
            <stop offset="70%" stopColor="#6b4226" />
            <stop offset="100%" stopColor="#3d2817" />
          </radialGradient>
          
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        <g transform={`translate(${pan.translateX}, ${pan.translateY}) scale(${scale})`}>
          <rect
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            fill={`url(#${sandPatternId})`}
            stroke="#6b4226"
            strokeWidth="3"
          />

          <rect
            x={5}
            y={5}
            width={MAP_WIDTH - 10}
            height={MAP_HEIGHT - 10}
            fill="none"
            stroke="#3d2817"
            strokeWidth="1"
            strokeDasharray="10,5"
          />

          {renderFortress}
          {renderDefenses}
          {renderEnemies}
          {renderDragPreview}
          {renderHitEffects}

          <AnimatePresence>
            {enemies.map(enemy => (
              enemy.health <= 0 && (
                <motion.g
                  key={`death-${enemy.id}`}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0, opacity: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2
                    const dist = 20
                    return (
                      <motion.circle
                        key={i}
                        cx={enemy.position.x}
                        cy={enemy.position.y}
                        r="4"
                        fill="#c45c4e"
                        animate={{
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    )
                  })}
                </motion.g>
              )
            ))}
          </AnimatePresence>
        </g>

        <g transform={`translate(10, ${MAP_HEIGHT - 30})`}>
          <rect x="0" y="0" width="120" height="25" fill="rgba(61, 40, 23, 0.8)" rx="0" />
          <text x="60" y="18" textAnchor="middle" fill="#f5e6d3" fontSize="12">
            缩放: {Math.round(scale * 100)}%
          </text>
        </g>
      </svg>
    </div>
  )
})

SandTable.displayName = 'SandTable'

export default SandTable
