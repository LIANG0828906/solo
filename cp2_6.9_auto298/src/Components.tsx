import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { JointComponent, JointType, Position } from './JoinCore'
import { detectJoint, animateJoint } from './JoinCore'
import { playClickSound, playErrorSound } from './Utils'

interface WoodBlockProps {
  component: JointComponent
  tenon: JointComponent
  tolerance: number
  onAttach: (id: string, position: Position) => void
  onError: (id: string) => void
  workbenchRef: React.RefObject<HTMLDivElement>
}

interface ToolIconProps {
  type: 'chisel' | 'plane' | 'saw' | 'hammer' | 'ruler' | 'square'
}

interface DiagramProps {
  jointType: JointType
  scale: number
  onScaleChange: (scale: number) => void
}

export function WoodBlock({
  component,
  tenon,
  tolerance,
  onAttach,
  onError,
  workbenchRef
}: WoodBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isGlowing, setIsGlowing] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const blockRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (component.attached) return
    e.preventDefault()
    setIsDragging(true)

    const rect = blockRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [component.attached])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || component.attached) return

    const workbenchRect = workbenchRef.current?.getBoundingClientRect()
    if (!workbenchRect || !blockRef.current) return

    const newX = e.clientX - workbenchRect.left - dragOffset.x
    const newY = e.clientY - workbenchRect.top - dragOffset.y

    const clampedX = Math.max(0, Math.min(newX, workbenchRect.width - component.size.width))
    const clampedY = Math.max(0, Math.min(newY, workbenchRect.height - component.size.height))

    blockRef.current.style.left = `${clampedX}px`
    blockRef.current.style.top = `${clampedY}px`
    blockRef.current.style.transform = `rotate(${component.position.angle}deg)`
  }, [isDragging, component.attached, component.position.angle, component.size, dragOffset, workbenchRef])

  const handleMouseUp = useCallback(() => {
    if (!isDragging || component.attached || !blockRef.current) return

    setIsDragging(false)

    const workbenchRect = workbenchRef.current?.getBoundingClientRect()
    const blockRect = blockRef.current.getBoundingClientRect()

    if (!workbenchRect) return

    const currentPosition: Position = {
      x: blockRect.left - workbenchRect.left,
      y: blockRect.top - workbenchRect.top,
      angle: component.position.angle
    }

    const tempComponent = { ...component, position: currentPosition }
    const result = detectJoint(tempComponent, tenon, tolerance)

    if (result.success && result.snappedPosition) {
      const anim = animateJoint(component)
      if (anim.glow) {
        setIsGlowing(true)
        setTimeout(() => setIsGlowing(false), 500)
      }
      playClickSound()
      onAttach(component.id, result.snappedPosition)
    } else {
      setIsShaking(true)
      playErrorSound()
      onError(component.id)
      setTimeout(() => setIsShaking(false), 300)
    }
  }, [isDragging, component, tenon, tolerance, onAttach, onError, workbenchRef])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const getBlockPath = () => {
    const { width, height } = component.size

    if (component.type === 'tenon') {
      switch (component.jointType) {
        case 'straight':
          return (
            <g>
              <rect x="0" y="0" width={width} height={height} fill="url(#woodGradient)" rx="4" />
              <rect x={width - 30} y={height / 4} width="30" height={height / 2} fill="url(#woodGradientLight)" rx="2" />
            </g>
          )
        case 'dovetail':
          return (
            <g>
              <rect x="0" y="0" width={width - 30} height={height} fill="url(#woodGradient)" rx="4" />
              <polygon
                points={`${width - 30},${height * 0.2} ${width},${height * 0.1} ${width},${height * 0.9} ${width - 30},${height * 0.8}`}
                fill="url(#woodGradientLight)"
              />
            </g>
          )
        case 'corner':
          return (
            <g>
              <rect x="0" y="0" width={width} height={height} fill="url(#woodGradient)" rx="4" />
              <polygon
                points={`${width - 25},${height * 0.15} ${width},${height * 0.15} ${width},${height * 0.5} ${width - 25},${height * 0.5}`}
                fill="url(#woodGradientLight)"
              />
              <polygon
                points={`${width * 0.5},${height - 25} ${width},${height - 25} ${width},${height} ${width * 0.5},${height}`}
                fill="url(#woodGradientLight)"
              />
            </g>
          )
      }
    } else {
      switch (component.jointType) {
        case 'straight':
          return (
            <g>
              <rect x="0" y="0" width={width} height={height} fill="url(#woodGradient)" rx="4" />
              <rect x="0" y={height / 4} width="30" height={height / 2} fill="#5d4037" rx="2" />
            </g>
          )
        case 'dovetail':
          return (
            <g>
              <rect x="30" y="0" width={width - 30} height={height} fill="url(#woodGradient)" rx="4" />
              <polygon
                points={`30,${height * 0.1} 0,${height * 0.2} 0,${height * 0.8} 30,${height * 0.9}`}
                fill="#5d4037"
              />
            </g>
          )
        case 'corner':
          return (
            <g>
              <rect x="0" y="0" width={width} height={height} fill="url(#woodGradient)" rx="4" />
              <polygon
                points={`0,${height * 0.15} 25,${height * 0.15} 25,${height * 0.5} 0,${height * 0.5}`}
                fill="#5d4037"
              />
              <polygon
                points={`0,${height - 25} ${width * 0.5},${height - 25} ${width * 0.5},${height} 0,${height}`}
                fill="#5d4037"
              />
            </g>
          )
      }
    }
  }

  return (
    <motion.div
      ref={blockRef}
      className={`wood-component ${isDragging ? 'dragging' : ''} ${component.attached ? 'attached' : ''} ${isGlowing ? 'gold-glow' : ''} ${isShaking ? 'error-shake' : ''}`}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        transform: `rotate(${component.position.angle}deg)`,
        zIndex: isDragging ? 1000 : component.attached ? 10 : 1
      }}
      animate={component.attached ? {
        left: component.position.x,
        top: component.position.y,
        rotate: component.position.angle,
        scale: [1, 1.05, 1]
      } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onMouseDown={handleMouseDown}
    >
      <svg
        width={component.size.width}
        height={component.size.height}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8d6e63" />
            <stop offset="25%" stopColor="#a1887f" />
            <stop offset="50%" stopColor="#d4a373" />
            <stop offset="75%" stopColor="#a1887f" />
            <stop offset="100%" stopColor="#8d6e63" />
          </linearGradient>
          <linearGradient id="woodGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a1887f" />
            <stop offset="50%" stopColor="#d4a373" />
            <stop offset="100%" stopColor="#a1887f" />
          </linearGradient>
        </defs>
        {getBlockPath()}
        <line x1="10" y1="10" x2={component.size.width - 10} y2="10" stroke="#6d4c41" strokeWidth="0.5" opacity="0.3" />
        <line x1="10" y1={component.size.height / 2} x2={component.size.width - 10} y2={component.size.height / 2} stroke="#6d4c41" strokeWidth="0.5" opacity="0.3" />
        <line x1="10" y1={component.size.height - 10} x2={component.size.width - 10} y2={component.size.height - 10} stroke="#6d4c41" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </motion.div>
  )
}

export function ToolIcon({ type }: ToolIconProps) {
  const icons: Record<string, JSX.Element> = {
    chisel: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="12" y="2" width="8" height="20" fill="#d4a373" rx="1" />
        <polygon points="10,22 22,22 18,30 14,30" fill="#a1887f" />
        <rect x="14" y="4" width="4" height="16" fill="#8d6e63" />
      </svg>
    ),
    plane: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="12" width="28" height="12" fill="#8d6e63" rx="2" />
        <rect x="6" y="8" width="8" height="8" fill="#d4a373" rx="1" />
        <rect x="18" y="6" width="10" height="8" fill="#d4a373" rx="1" />
        <rect x="4" y="22" width="24" height="2" fill="#5d4037" />
      </svg>
    ),
    saw: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="4" width="4" height="24" fill="#d4a373" rx="1" />
        <polygon points="6,8 28,14 28,18 6,24" fill="#a1887f" />
        <path d="M8,14 L10,12 L12,14 L14,12 L16,14 L18,12 L20,14 L22,12 L24,14 L26,12" stroke="#5d4037" strokeWidth="1" fill="none" />
      </svg>
    ),
    hammer: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="14" y="12" width="4" height="18" fill="#d4a373" rx="1" />
        <rect x="6" y="6" width="20" height="8" fill="#a1887f" rx="2" />
        <rect x="8" y="8" width="4" height="4" fill="#8d6e63" />
        <rect x="20" y="8" width="4" height="4" fill="#8d6e63" />
      </svg>
    ),
    ruler: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="12" width="28" height="8" fill="#d4a373" rx="1" />
        <line x1="6" y1="12" x2="6" y2="16" stroke="#5d4037" strokeWidth="1" />
        <line x1="10" y1="12" x2="10" y2="14" stroke="#5d4037" strokeWidth="1" />
        <line x1="14" y1="12" x2="14" y2="16" stroke="#5d4037" strokeWidth="1" />
        <line x1="18" y1="12" x2="18" y2="14" stroke="#5d4037" strokeWidth="1" />
        <line x1="22" y1="12" x2="22" y2="16" stroke="#5d4037" strokeWidth="1" />
        <line x1="26" y1="12" x2="26" y2="14" stroke="#5d4037" strokeWidth="1" />
      </svg>
    ),
    square: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="4" height="24" fill="#a1887f" rx="1" />
        <rect x="4" y="4" width="20" height="4" fill="#a1887f" rx="1" />
        <rect x="6" y="6" width="2" height="18" fill="#d4a373" />
        <rect x="8" y="6" width="14" height="2" fill="#d4a373" />
      </svg>
    )
  }

  return (
    <div className="tool-icon" title={type}>
      {icons[type]}
    </div>
  )
}

export function StructureDiagram({ jointType, scale, onScaleChange }: DiagramProps) {
  const diagrams: Record<JointType, JSX.Element> = {
    straight: (
      <svg viewBox="0 0 200 150" width="100%" height="100%">
        <defs>
          <pattern id="diagHatch" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#6d4c41" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect x="20" y="50" width="60" height="50" fill="none" stroke="#5d4037" strokeWidth="2" />
        <rect x="70" y="65" width="25" height="20" fill="url(#diagHatch)" stroke="#5d4037" strokeWidth="1" />
        <rect x="110" y="50" width="60" height="50" fill="none" stroke="#5d4037" strokeWidth="2" />
        <rect x="110" y="65" width="25" height="20" fill="#5d4037" stroke="#5d4037" strokeWidth="1" />
        <line x1="95" y1="40" x2="95" y2="30" stroke="#5d4037" strokeWidth="1" />
        <line x1="95" y1="30" x2="75" y2="30" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow)" />
        <line x1="95" y1="30" x2="115" y2="30" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4" fill="#5d4037" />
          </marker>
        </defs>
        <text x="50" y="120" fontSize="10" fill="#5d4037" textAnchor="middle">榫头</text>
        <text x="150" y="120" fontSize="10" fill="#5d4037" textAnchor="middle">卯眼</text>
      </svg>
    ),
    dovetail: (
      <svg viewBox="0 0 200 150" width="100%" height="100%">
        <defs>
          <pattern id="diagHatch2" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#6d4c41" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect x="20" y="50" width="55" height="50" fill="none" stroke="#5d4037" strokeWidth="2" />
        <polygon points="75,55 95,45 95,105 75,95" fill="url(#diagHatch2)" stroke="#5d4037" strokeWidth="1" />
        <rect x="105" y="50" width="55" height="50" fill="none" stroke="#5d4037" strokeWidth="2" />
        <polygon points="105,45 85,55 85,95 105,105" fill="#5d4037" stroke="#5d4037" strokeWidth="1" />
        <line x1="95" y1="35" x2="95" y2="25" stroke="#5d4037" strokeWidth="1" />
        <line x1="95" y1="25" x2="70" y2="25" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow2)" />
        <line x1="95" y1="25" x2="120" y2="25" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow2)" />
        <defs>
          <marker id="arrow2" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4" fill="#5d4037" />
          </marker>
        </defs>
        <text x="47" y="120" fontSize="10" fill="#5d4037" textAnchor="middle">燕尾榫</text>
        <text x="143" y="120" fontSize="10" fill="#5d4037" textAnchor="middle">燕尾槽</text>
      </svg>
    ),
    corner: (
      <svg viewBox="0 0 200 150" width="100%" height="100%">
        <defs>
          <pattern id="diagHatch3" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#6d4c41" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect x="30" y="20" width="50" height="70" fill="none" stroke="#5d4037" strokeWidth="2" />
        <polygon points="50,90 70,90 70,110 50,110" fill="url(#diagHatch3)" stroke="#5d4037" strokeWidth="1" />
        <rect x="80" y="60" width="70" height="50" fill="none" stroke="#5d4037" strokeWidth="2" />
        <polygon points="80,80 80,100 50,100 50,80" fill="url(#diagHatch3)" stroke="#5d4037" strokeWidth="1" />
        <rect x="30" y="90" width="50" height="40" fill="none" stroke="#5d4037" strokeWidth="2" transform="translate(0, 0)" />
        <polygon points="80,90 100,90 100,110 80,110" fill="url(#diagHatch3)" stroke="#5d4037" strokeWidth="1" />
        <line x1="80" y1="55" x2="80" y2="45" stroke="#5d4037" strokeWidth="1" />
        <line x1="80" y1="45" x2="55" y2="45" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow3)" />
        <line x1="80" y1="45" x2="105" y2="45" stroke="#5d4037" strokeWidth="1" markerEnd="url(#arrow3)" />
        <defs>
          <marker id="arrow3" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4" fill="#5d4037" />
          </marker>
        </defs>
        <text x="55" y="145" fontSize="10" fill="#5d4037" textAnchor="middle">竖向构件</text>
        <text x="115" y="145" fontSize="10" fill="#5d4037" textAnchor="middle">横向构件</text>
      </svg>
    )
  }

  return (
    <div className="diagram-panel">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[#5d4037]">结构分解图</span>
        <div className="flex gap-1">
          <button
            className="brass-button text-xs px-2 py-1"
            onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
          >
            −
          </button>
          <span className="text-xs text-[#5d4037] w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            className="brass-button text-xs px-2 py-1"
            onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {diagrams[jointType]}
      </div>
    </div>
  )
}

interface CompassProgressProps {
  progress: number
  total: number
}

export function CompassProgress({ progress, total }: CompassProgressProps) {
  const percentage = (progress / total) * 100
  const circumference = 2 * Math.PI * 34
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const rotation = (progress / total) * 360

  return (
    <div className="compass-progress">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle className="compass-ring" cx="40" cy="40" r="34" />
        <circle
          className="compass-progress-ring"
          cx="40"
          cy="40"
          r="34"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
        <circle cx="40" cy="40" r="4" fill="#5d4037" />
        {[0, 90, 180, 270].map((angle, i) => (
          <line
            key={i}
            x1="40"
            y1="12"
            x2="40"
            y2="16"
            stroke="#6d4c41"
            strokeWidth="2"
            transform={`rotate(${angle}, 40, 40)`}
          />
        ))}
      </svg>
      <div
        className="compass-needle"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#ffd54f] brush-font">
          {progress}/{total}
        </span>
      </div>
    </div>
  )
}

interface SuccessScrollProps {
  time: string
  attempts: number
  code: string
  onClose: () => void
  onTestStress: () => void
}

export function SuccessScroll({
  time,
  attempts,
  code,
  onClose,
  onTestStress
}: SuccessScrollProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="success-scroll linen-texture p-8 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h2 className="brush-font text-4xl text-[#5d4037] mb-4">
              卯榫合拢
            </h2>
            <div className="text-6xl mb-6">🏯</div>
            <p className="brush-font text-2xl text-[#5d4037] mb-6">
              结构稳固，历久弥新
            </p>
            <div className="bg-[#f5e6c8] rounded-lg p-4 mb-6 border-2 border-[#6d4c41]">
              <div className="grid grid-cols-2 gap-4 text-[#5d4037]">
                <div>
                  <p className="text-sm opacity-70">耗时</p>
                  <p className="text-xl font-bold">{time}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">尝试</p>
                  <p className="text-xl font-bold">{attempts}次</p>
                </div>
              </div>
            </div>
            <div className="code-display mb-6" title="点击复制">
              {code}
            </div>
            <div className="flex gap-4 justify-center">
              <button className="brass-button" onClick={onTestStress}>
                检测受力
              </button>
              <button className="brass-button" onClick={onClose}>
                继续探索
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface CrackEffectProps {
  show: boolean
  cracks: { x: number; y: number; length: number; angle: number }[]
}

export function CrackEffect({ show, cracks }: CrackEffectProps) {
  if (!show) return null

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
      {cracks.map((crack, i) => (
        <line
          key={i}
          x1={`${crack.x * 100}%`}
          y1={`${crack.y * 100}%`}
          x2={`${crack.x * 100 + (crack.length / 900) * 100 * Math.cos((crack.angle * Math.PI) / 180)}%`}
          y2={`${crack.y * 100 + (crack.length / 400) * 100 * Math.sin((crack.angle * Math.PI) / 180)}%`}
          stroke="#3e2723"
          strokeWidth="2"
          className="crack-line"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  )
}

interface ParticleExplosionProps {
  particles: { id: string; tx: number; ty: number; delay: number }[]
  centerX: number
  centerY: number
}

export function ParticleExplosion({ particles, centerX, centerY }: ParticleExplosionProps) {
  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: centerX,
            top: centerY,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animationDelay: `${p.delay}s`
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}

interface GlueEffectProps {
  show: boolean
}

export function GlueEffect({ show }: GlueEffectProps) {
  if (!show) return null

  return (
    <>
      <div
        className="glue-effect"
        style={{
          left: '45%',
          top: '30%',
          width: '10%',
          height: '3px'
        }}
      />
      <div
        className="glue-effect"
        style={{
          left: '45%',
          top: '50%',
          width: '10%',
          height: '3px'
        }}
      />
      <div
        className="glue-effect"
        style={{
          left: '45%',
          top: '70%',
          width: '10%',
          height: '3px'
        }}
      />
    </>
  )
}
