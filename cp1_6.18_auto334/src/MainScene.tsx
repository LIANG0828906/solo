import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Bottle } from './BottleData'

interface MainSceneProps {
  bottles: Bottle[]
  selectedBottleId: string | null
  flyingBottleId: string | null
  returningBottleId: string | null
  throwingBottleId: string | null
  onSeaClick: (percentX: number, percentY: number) => void
  onBottleClick: (bottleId: string) => void
}

interface Ripple {
  id: number
  x: number
  y: number
}

const BottleSVG = React.memo(function BottleSVG({ color }: { color: string }) {
  return (
    <svg
      className="bottle-svg"
      viewBox="0 0 56 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bottle-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="rgba(30,144,255,0.6)" />
        </linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFE8A8" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M22 4 C22 2, 34 2, 34 4 L34 16 L38 18 C44 20, 48 28, 48 44 L48 68 C48 74, 42 78, 28 78 C14 78, 8 74, 8 68 L8 44 C8 28, 12 20, 18 18 L22 16 Z"
          fill="url(#bottle-glass)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect
          x="23" y="5" width="10" height="12" rx="3"
          fill="rgba(101,67,33,0.85)"
          stroke="rgba(61,41,15,0.95)"
          strokeWidth="0.8"
        />
        <path
          d="M24 5 Q28 2 32 5"
          fill="none"
          stroke="rgba(255,215,0,0.9)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <g opacity="0.9" transform="rotate(-12 28 48)">
          <rect x="18" y="30" width="20" height="32" rx="2" fill="url(#paper)" />
          <line x1="20" y1="37" x2="36" y2="37" stroke="rgba(120,90,30,0.5)" strokeWidth="0.6" />
          <line x1="20" y1="42" x2="36" y2="42" stroke="rgba(120,90,30,0.5)" strokeWidth="0.6" />
          <line x1="20" y1="47" x2="34" y2="47" stroke="rgba(120,90,30,0.5)" strokeWidth="0.6" />
          <line x1="20" y1="52" x2="36" y2="52" stroke="rgba(120,90,30,0.5)" strokeWidth="0.6" />
        </g>
        <path
          d="M12 28 Q14 24 12 20"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M14 42 Q16 38 14 34"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
})

const SceneBottle = React.memo(function SceneBottle({
  bottle,
  isSelected,
  isFlying,
  isReturning,
  isThrowing,
  throwFrom,
  onClick,
}: {
  bottle: Bottle
  isSelected: boolean
  isFlying: boolean
  isReturning: boolean
  isThrowing: boolean
  throwFrom: { x: number; y: number } | null
  onClick: () => void
}) {
  const delay = useMemo(() => ((bottle.x + bottle.y) % 30) / 10, [bottle.x, bottle.y])

  const classNames = ['bottle']
  if (isFlying) classNames.push('flying')
  if (isReturning) classNames.push('returning')
  if (isThrowing) classNames.push('throw-parabola')

  const style: React.CSSProperties & Record<string, string | number | undefined> = {
    left: `${bottle.x}%`,
    top: `${bottle.y}%`,
    transform: `translate(-50%, -70%) rotate(${bottle.rotation}deg)`,
    animationDelay: `${delay}s`,
  }

  if (isThrowing && throwFrom) {
    style['--throw-dx'] = `${throwFrom.x}px`
    style['--throw-dy'] = `${throwFrom.y}px`
  }

  if (isFlying) {
    style.transform = 'translate(-50%, -50%) rotate(0deg)'
  }

  return (
    <div
      className={classNames.join(' ')}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        if (!isFlying && !isReturning && !isThrowing) {
          onClick()
        }
      }}
      role="button"
      aria-label="漂流瓶"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isFlying && !isReturning && !isThrowing) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <BottleSVG color={bottle.color} />
      {bottle.replies.length > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#FFD700',
            color: '#5a4500',
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {bottle.replies.length > 9 ? '9+' : bottle.replies.length}
        </span>
      )}
    </div>
  )
})

export default function MainScene({
  bottles,
  selectedBottleId,
  flyingBottleId,
  returningBottleId,
  throwingBottleId,
  onSeaClick,
  onBottleClick,
}: MainSceneProps) {
  const oceanRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleIdRef = useRef(0)
  const [throwFrom, setThrowFrom] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (throwingBottleId) {
      const rect = oceanRef.current?.getBoundingClientRect()
      if (rect) {
        setThrowFrom({
          x: (rect.width / 2) - (rect.width * 0.5),
          y: -rect.height * 0.4,
        })
      }
      const t = setTimeout(() => setThrowFrom(null), 900)
      return () => clearTimeout(t)
    }
  }, [throwingBottleId])

  const handleSeaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      const rect = oceanRef.current?.getBoundingClientRect()
      if (!rect) return
      const percentX = ((e.clientX - rect.left) / rect.width) * 100
      const percentY = ((e.clientY - rect.top) / rect.height) * 100
      if (percentY < 15) return
      const rippleId = ++rippleIdRef.current
      const newRipple: Ripple = {
        id: rippleId,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      setRipples((prev) => [...prev, newRipple])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId))
      }, 1500)
      onSeaClick(percentX, percentY)
    },
    [onSeaClick],
  )

  return (
    <div className="ocean" ref={oceanRef} onClick={handleSeaClick}>
      <div className="wave-layer" />
      <div className="shimmer" />
      {ripples.map((r) => (
        <React.Fragment key={r.id}>
          <div className="ripple" style={{ left: r.x, top: r.y }} />
          <div className="ripple second" style={{ left: r.x, top: r.y }} />
          <div className="ripple third" style={{ left: r.x, top: r.y }} />
        </React.Fragment>
      ))}
      {bottles.map((bottle) => (
        <SceneBottle
          key={bottle.id}
          bottle={bottle}
          isSelected={selectedBottleId === bottle.id}
          isFlying={flyingBottleId === bottle.id}
          isReturning={returningBottleId === bottle.id}
          isThrowing={throwingBottleId === bottle.id}
          throwFrom={throwingBottleId === bottle.id ? throwFrom : null}
          onClick={() => onBottleClick(bottle.id)}
        />
      ))}
    </div>
  )
}
