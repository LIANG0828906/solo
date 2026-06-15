import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ResourceType, BuildingType, RESOURCE_COLORS, RESOURCE_NAMES, BUILDING_COSTS, BUILDING_NAMES } from '../types'
import { resourceManager, ResourceMap } from './resource-manager'
import { CollectEvent } from '../App'

interface Particle {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  color: string
  progress: number
}

interface PendingAnimation {
  resource: ResourceType
  from: number
  to: number
  startTime: number
}

interface ResourceUIProps {
  onBuild: (type: BuildingType) => boolean
  chunkAnimKey: number
  collectEvents: CollectEvent[]
  onCollectEventConsumed: (timestamp: number) => void
}

const ResourceIcon: React.FC<{ type: ResourceType; size?: number }> = ({ type, size = 24 }) => {
  const color = RESOURCE_COLORS[type]
  switch (type) {
    case 'wood':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="9" ry="6" fill={color} />
          <ellipse cx="12" cy="12" rx="6" ry="4" fill="#A0522D" />
          <ellipse cx="12" cy="12" rx="3" ry="2" fill={color} />
        </svg>
      )
    case 'stone':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <polygon points="4,16 8,6 16,5 20,12 18,20 6,20" fill={color} />
          <polygon points="8,12 12,8 16,11 14,16 9,16" fill="#A0A0A0" />
        </svg>
      )
    case 'metal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill={color} />
          <circle cx="9" cy="9" r="3" fill="#E8E8E8" opacity="0.6" />
        </svg>
      )
    case 'food':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <polygon points="12,3 18,20 6,20" fill={color} />
          <polygon points="12,8 15,18 9,18" fill="#32CD32" />
        </svg>
      )
  }
}

const AnimatedNumber: React.FC<{ value: number; color: string; pendingAnim?: PendingAnimation }> = ({ value, color, pendingAnim }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const animRef = useRef<number | null>(null)
  const lastAnimTimestamp = useRef<number>(0)

  useEffect(() => {
    if (pendingAnim && pendingAnim.startTime > lastAnimTimestamp.current) {
      lastAnimTimestamp.current = pendingAnim.startTime

      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }

      const startValue = pendingAnim.from
      const endValue = pendingAnim.to
      const duration = 300

      const delay = Math.max(0, pendingAnim.startTime - performance.now())

      setTimeout(() => {
        const animStartTime = performance.now()
        const animate = (currentTime: number) => {
          const elapsed = currentTime - animStartTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplayValue(Math.round(startValue + (endValue - startValue) * eased))
          if (progress < 1) {
            animRef.current = requestAnimationFrame(animate)
          } else {
            setDisplayValue(endValue)
          }
        }
        animRef.current = requestAnimationFrame(animate)
      }, delay)
    } else if (!pendingAnim) {
      setDisplayValue(value)
    }
  }, [pendingAnim, value])

  return (
    <span
      style={{
        color,
        fontWeight: 'bold',
        fontSize: '18px',
        minWidth: '32px',
        textAlign: 'left',
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      {displayValue}
    </span>
  )
}

export const ResourceUI: React.FC<ResourceUIProps> = ({ onBuild, chunkAnimKey, collectEvents, onCollectEventConsumed }) => {
  const [resources, setResources] = useState<ResourceMap>(resourceManager.getResources())
  const [particles, setParticles] = useState<Particle[]>([])
  const [slideAnim, setSlideAnim] = useState(false)
  const [pressedButton, setPressedButton] = useState<string | null>(null)
  const [pendingAnims, setPendingAnims] = useState<Record<ResourceType, PendingAnimation | undefined>>({
    wood: undefined, stone: undefined, metal: undefined, food: undefined
  })
  const particleIdRef = useRef(0)
  const resourceRefs = useRef<Record<ResourceType, HTMLDivElement | null>>({
    wood: null, stone: null, metal: null, food: null
  })
  const processedTimestamps = useRef<Set<number>>(new Set())

  useEffect(() => {
    setSlideAnim(true)
    const timer = setTimeout(() => setSlideAnim(false), 300)
    return () => clearTimeout(timer)
  }, [chunkAnimKey])

  useEffect(() => {
    const unsubscribe = resourceManager.addListener(() => {
      setResources(resourceManager.getResources())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    for (const event of collectEvents) {
      if (processedTimestamps.current.has(event.timestamp)) continue
      processedTimestamps.current.add(event.timestamp)

      setPendingAnims((prev) => ({
        ...prev,
        [event.resourceType]: {
          resource: event.resourceType,
          from: event.from,
          to: event.to,
          startTime: event.timestamp
        }
      }))

      spawnCollectParticles(event.resourceType, event.timestamp)

      const ts = event.timestamp
      setTimeout(() => {
        setPendingAnims((prev) => {
          const current = prev[event.resourceType]
          if (current && current.startTime === ts) {
            return { ...prev, [event.resourceType]: undefined }
          }
          return prev
        })
        processedTimestamps.current.delete(ts)
        onCollectEventConsumed(ts)
      }, 500)
    }
  }, [collectEvents])

  const spawnCollectParticles = useCallback((resourceType: ResourceType, startTime: number) => {
    const targetEl = resourceRefs.current[resourceType]
    if (!targetEl) return

    const rect = targetEl.getBoundingClientRect()
    const targetX = rect.left + rect.width / 2
    const targetY = rect.top + rect.height / 2
    const color = RESOURCE_COLORS[resourceType]

    const count = 10 + Math.floor(Math.random() * 11)
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 200
      const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 200
      newParticles.push({
        id: particleIdRef.current++,
        x: startX,
        y: startY,
        targetX,
        targetY,
        color,
        progress: 0
      })
    }

    const startDelay = Math.max(0, startTime - performance.now())

    setTimeout(() => {
      setParticles((prev) => [...prev, ...newParticles])

      const animStartTime = performance.now()
      const duration = 600

      const animate = (currentTime: number) => {
        const elapsed = currentTime - animStartTime
        const progress = Math.min(elapsed / duration, 1)

        setParticles((prev) =>
          prev
            .map((p) => {
              if (newParticles.find((np) => np.id === p.id)) {
                return { ...p, progress }
              }
              return p
            })
            .filter((p) => p.progress < 1 || !newParticles.find((np) => np.id === p.id))
        )

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)))
        }
      }
      requestAnimationFrame(animate)
    }, startDelay)
  }, [onCollectEventConsumed])

  const handleBuild = useCallback((type: BuildingType) => {
    setPressedButton(type)
    setTimeout(() => setPressedButton(null), 100)
    onBuild(type)
  }, [onBuild])

  const resourceTypes: ResourceType[] = ['wood', 'stone', 'metal', 'food']
  const buildingTypes: BuildingType[] = ['tower', 'warehouse', 'workshop', 'wall']

  return (
    <>
      <div
        className="resource-panel"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 100,
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid #00d4ff',
          transform: slideAnim ? 'translateX(-120%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          {resourceTypes.map((type) => (
            <div
              key={type}
              ref={(el) => { resourceRefs.current[type] = el }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ResourceIcon type={type} size={24} />
              <AnimatedNumber
                value={resources[type]}
                color={RESOURCE_COLORS[type]}
                pendingAnim={pendingAnims[type]}
              />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {RESOURCE_NAMES[type]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="building-panel"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid #00d4ff',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '90vw'
        }}
      >
        {buildingTypes.map((type) => {
          const costs = BUILDING_COSTS[type]
          const canAfford = resourceManager.canBuild(type)
          return (
            <button
              key={type}
              onClick={() => handleBuild(type)}
              disabled={!canAfford}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #00d4ff',
                background: canAfford ? 'transparent' : 'rgba(255,0,0,0.1)',
                borderColor: canAfford ? '#00d4ff' : '#ff4444',
                color: canAfford ? '#fff' : '#888',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s ease',
                transform: pressedButton === type ? 'scale(0.95)' : 'scale(1)',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                if (canAfford) {
                  e.currentTarget.style.background = '#00d4ff'
                  e.currentTarget.style.color = '#1a1a2e'
                }
              }}
              onMouseLeave={(e) => {
                if (canAfford) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#fff'
                }
              }}
            >
              <div style={{ marginBottom: '4px', fontWeight: 600 }}>
                {BUILDING_NAMES[type]}
              </div>
              <div style={{ fontSize: '11px', display: 'flex', gap: '6px', justifyContent: 'center', opacity: 0.8 }}>
                {Object.entries(costs).map(([res, amt]) => (
                  <span key={res} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ResourceIcon type={res as ResourceType} size={12} />
                    {amt}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid #00d4ff',
          color: '#fff',
          fontSize: '13px',
          lineHeight: 1.6
        }}
      >
        <div style={{ color: '#00d4ff', fontWeight: 600, marginBottom: '8px' }}>操作说明</div>
        <div>WASD - 切换区块</div>
        <div>鼠标拖拽 - 旋转视角</div>
        <div>滚轮 - 缩放</div>
        <div>点击资源 - 采集</div>
      </div>

      {particles.map((p) => {
        const eased = 1 - Math.pow(1 - p.progress, 3)
        const x = p.x + (p.targetX - p.x) * eased
        const y = p.y + (p.targetY - p.y) * eased - eased * (1 - eased) * 100
        const opacity = p.progress < 0.9 ? 1 : (1 - p.progress) * 10
        return (
          <div
            key={p.id}
            style={{
              position: 'fixed',
              left: x - 4,
              top: y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              pointerEvents: 'none',
              zIndex: 999,
              opacity,
              transform: `scale(${1 - p.progress * 0.5})`
            }}
          />
        )
      })}

      <style>{`
        @media (max-width: 768px) {
          .resource-panel {
            top: 10px !important;
            left: 10px !important;
            right: 10px !important;
            padding: 12px !important;
          }
          .building-panel {
            bottom: 10px !important;
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
            padding: 12px !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
          .building-panel button {
            flex: 1 1 45% !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </>
  )
}
