import React, { useMemo, useEffect, useState, useRef } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/useGameStore'
import type { Robot, Obstacle, BattleEvent, RobotType, Direction } from '@/core/types'
import { GRID_SIZE, THEME, COMMANDS, METAL_CRATE_HP } from '@/config/gameConfig'
import { cyberTheme } from '@/styles/theme'
import { ParticleBurst } from '@/components/ui/ParticleBurst'
import { directionToDegrees } from '@/utils/gridMath'

interface ArenaProps {
  isPaused?: boolean
}

interface AttackEffect {
  id: string
  path: [number, number][]
  attackerColor: string
  targetX: number
  targetY: number
  explosionTrigger: number
  duration: number
}

const ARENA_PADDING = 16

const RobotSVG: React.FC<{ type: RobotType; color: string }> = ({ type, color }) => {
  const accent = color
  const dark = cyberTheme.colors.bgDeep
  const mid = cyberTheme.colors.bgMid
  if (type === 'scout') {
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="30,7 41,19 41,36 30,48 19,36 19,19" fill={mid} stroke={accent} strokeWidth="1.5" />
        <polygon points="30,13 37,21 37,34 30,42 23,34 23,21" fill={dark} stroke={accent} strokeWidth="1" />
        <circle cx="30" cy="27" r="5" fill={accent} opacity="0.9" />
        <circle cx="30" cy="27" r="2" fill="#fff" />
        <path d="M30 7 L30 2" stroke={accent} strokeWidth="1.5" />
        <circle cx="30" cy="1" r="1.5" fill={accent} />
        <path d="M19 25 L12 25" stroke={accent} strokeWidth="1.5" />
        <path d="M41 25 L48 25" stroke={accent} strokeWidth="1.5" />
        <rect x="15" y="44" width="6" height="9" fill={mid} stroke={accent} strokeWidth="1" />
        <rect x="39" y="44" width="6" height="9" fill={mid} stroke={accent} strokeWidth="1" />
      </svg>
    )
  }
  if (type === 'attacker') {
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="11" width="30" height="33" fill={mid} stroke={accent} strokeWidth="1.5" />
        <rect x="19" y="15" width="22" height="25" fill={dark} stroke={accent} strokeWidth="1" />
        <polygon points="30,18 35,25 30,32 25,25" fill={accent} />
        <polygon points="30,21 32.5,25 30,29 27.5,25" fill={dark} />
        <rect x="6" y="22" width="10" height="5" fill={mid} stroke={accent} strokeWidth="1" />
        <rect x="2" y="23" width="6" height="3" fill={accent} />
        <rect x="44" y="22" width="10" height="5" fill={mid} stroke={accent} strokeWidth="1" />
        <rect x="52" y="23" width="6" height="3" fill={accent} />
        <polygon points="15,44 12,54 20,54 20,44" fill={mid} stroke={accent} strokeWidth="1" />
        <polygon points="45,44 48,54 40,54 40,44" fill={mid} stroke={accent} strokeWidth="1" />
        <circle cx="30" cy="11" r="1.5" fill={accent} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11,18 30,7 49,18 49,42 30,53 11,42" fill={mid} stroke={accent} strokeWidth="2" />
      <polygon points="17,21 30,12 43,21 43,39 30,48 17,39" fill={dark} stroke={accent} strokeWidth="1" />
      <polygon points="24,24 30,20 36,24 36,35 30,39 24,35" fill={accent} opacity="0.5" />
      <rect x="27" y="26" width="6" height="6" fill={accent} />
      <rect x="28.5" y="27.5" width="3" height="3" fill="#fff" />
      <rect x="6" y="25" width="7" height="10" fill={mid} stroke={accent} strokeWidth="1" />
      <rect x="47" y="25" width="7" height="10" fill={mid} stroke={accent} strokeWidth="1" />
      <rect x="2" y="27" width="6" height="6" fill={accent} opacity="0.8" />
      <rect x="52" y="27" width="6" height="6" fill={accent} opacity="0.8" />
    </svg>
  )
}

const MetalCrateSVG: React.FC<{ hp: number }> = ({ hp }) => {
  const hpRatio = hp / METAL_CRATE_HP
  const rustOpacity = 1 - hpRatio
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="48" height="48" fill="#3a4252" stroke="#5a6478" strokeWidth="2" />
      <rect x="6" y="6" width="48" height="48" fill="#8b4513" opacity={rustOpacity * 0.4} />
      <path d="M6 6 L54 54 M54 6 L6 54" stroke="#4a5264" strokeWidth="1.5" />
      <rect x="12" y="12" width="36" height="36" fill="none" stroke="#6a7488" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="12" cy="12" r="2" fill="#5a6478" />
      <circle cx="48" cy="12" r="2" fill="#5a6478" />
      <circle cx="12" cy="48" r="2" fill="#5a6478" />
      <circle cx="48" cy="48" r="2" fill="#5a6478" />
      <rect x="24" y="26" width="12" height="8" fill="#5a6478" stroke="#7a8498" strokeWidth="0.5" />
    </svg>
  )
}

const EnergySupplySVG: React.FC = () => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="energyGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00FF88" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="30" cy="30" r="26" fill="url(#energyGlow)" />
    <polygon points="30,10 44,26 38,26 38,50 22,50 22,26 16,26" fill="#00FF88" stroke="#66FFB8" strokeWidth="1.5" />
    <polygon points="30,16 38,26 34,26 34,44 26,44 26,26 22,26" fill="#00AA55" opacity="0.5" />
    <circle cx="30" cy="30" r="3" fill="#fff" opacity="0.8" />
  </svg>
)

const ArenaOuter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: ${ARENA_PADDING}px;
  box-sizing: border-box;
`

const ArenaContainer = styled(motion.div)<{ $isPaused: boolean }>`
  position: relative;
  aspect-ratio: 1 / 1;
  max-width: 100%;
  max-height: 100%;
  width: min(100%, 100%);
  border: 2px solid ${cyberTheme.colors.neonCyan}66;
  background: ${cyberTheme.colors.bgDeep};
  box-shadow:
    0 0 32px ${cyberTheme.colors.neonCyan}33,
    inset 0 0 64px rgba(0, 0, 0, 0.5);
  clip-path: ${cyberTheme.clipPaths.sharpCutAll};
  overflow: hidden;
  transition:
    filter 500ms ease,
    backdrop-filter 500ms ease;
  filter: ${({ $isPaused }) => ($isPaused ? 'grayscale(0.7) brightness(0.65)' : 'none')};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(0deg, ${cyberTheme.colors.gridLine} 1px, transparent 1px),
      linear-gradient(90deg, ${cyberTheme.colors.gridLine} 1px, transparent 1px);
    background-size: calc(100% / ${GRID_SIZE}) calc(100% / ${GRID_SIZE});
    animation: gridPulse 3s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, ${cyberTheme.colors.neonPurple}14 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, ${cyberTheme.colors.neonCyan}10 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  @keyframes gridPulse {
    0%,
    100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }
`

const GridContent = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
`

const RobotWrap = styled(motion.div)<{ $cellSize: number }>`
  position: absolute;
  width: ${({ $cellSize }) => $cellSize}px;
  height: ${({ $cellSize }) => $cellSize}px;
  will-change: transform;
  z-index: 10;
`

const RobotBody = styled(motion.div)<{ $direction: Direction; $isHit: boolean }>`
  width: 100%;
  height: 100%;
  padding: 10%;
  box-sizing: border-box;
  transform: rotate(${({ $direction }) => directionToDegrees($direction)}deg);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  filter: ${({ $isHit }) =>
    $isHit
      ? 'drop-shadow(0 0 12px #FF0033) drop-shadow(0 0 24px #FF0033aa)'
      : 'drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor66)'};

  svg {
    width: 100%;
    height: 100%;
  }
`

const TrailGhost = styled.div<{ $cellSize: number; $opacity: number; $direction: Direction }>`
  position: absolute;
  width: ${({ $cellSize }) => $cellSize}px;
  height: ${({ $cellSize }) => $cellSize}px;
  padding: 10%;
  box-sizing: border-box;
  opacity: ${({ $opacity }) => $opacity};
  transform: rotate(${({ $direction }) => directionToDegrees($direction)}deg);
  pointer-events: none;
  z-index: 5;
  filter: blur(2px);

  svg {
    width: 100%;
    height: 100%;
  }
`

const HpBarWrap = styled.div`
  position: absolute;
  top: -14%;
  left: 15%;
  right: 15%;
  height: 10%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
  overflow: hidden;
`

const HpBarFill = styled.div<{ $hpPercent: number; $isPlayer: boolean }>`
  height: 100%;
  width: ${({ $hpPercent }) => Math.max(0, Math.min(100, $hpPercent))}%;
  background: ${({ $isPlayer }) =>
    $isPlayer
      ? 'linear-gradient(90deg, #00FF88, #00FFCC)'
      : 'linear-gradient(90deg, #FF0033, #FF6685)'};
  box-shadow: 0 0 8px
    ${({ $isPlayer }) => ($isPlayer ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 0, 51, 0.6)')};
  transition: width 0ms step-end;
`

const ShieldAura = styled(motion.div)`
  position: absolute;
  inset: -15%;
  border: 2px solid ${cyberTheme.colors.neonGreen};
  border-radius: 50%;
  box-shadow:
    0 0 16px ${cyberTheme.colors.neonGreen}88,
    inset 0 0 16px ${cyberTheme.colors.neonGreen}44;
  pointer-events: none;
  opacity: 0.7;
`

const RadarScan = styled(motion.div)`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.25) 40deg,
    transparent 80deg
  );
  border-radius: 50%;
  mix-blend-mode: screen;
`

const CommandBubble = styled(motion.div)<{ $color: string }>`
  position: absolute;
  top: -38%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: ${({ $color }) => $color};
  background: rgba(10, 14, 39, 0.9);
  border: 1px solid ${({ $color }) => $color}88;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 8px) 100%, 0 100%, 0 6px);
  white-space: nowrap;
  box-shadow: 0 0 12px ${({ $color }) => $color}44;
  z-index: 20;
`

const ObstacleWrap = styled.div<{ $cellSize: number }>`
  position: absolute;
  width: ${({ $cellSize }) => $cellSize}px;
  height: ${({ $cellSize }) => $cellSize}px;
  padding: 8%;
  box-sizing: border-box;
  z-index: 8;

  svg {
    width: 100%;
    height: 100%;
  }
`

const EnergyPulse = styled.div`
  position: absolute;
  inset: -5%;
  border-radius: 50%;
  background: radial-gradient(circle, ${cyberTheme.colors.neonGreen}22 0%, transparent 70%);
  animation: energyPulseAnim 1.8s ease-in-out infinite;
  pointer-events: none;

  @keyframes energyPulseAnim {
    0%,
    100% {
      transform: scale(0.9);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.15);
      opacity: 1;
    }
  }
`

const CrateHpBar = styled.div`
  position: absolute;
  bottom: -4%;
  left: 20%;
  right: 20%;
  height: 8%;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
`

const CrateHpFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  background: linear-gradient(90deg, #a06030, #d08040);
  transition: width 0ms step-end;
`

const BulletPath = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 30;
`

const BulletCore = styled(motion.div)<{ $color: string; $size: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow:
    0 0 ${({ $size }) => $size * 2}px ${({ $color }) => $color},
    0 0 ${({ $size }) => $size * 4}px ${({ $color }) => $color}aa;
  will-change: transform;
`

const BulletTrail = styled(motion.div)<{ $color: string; $size: number; $delay: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 ${({ $size }) => $size * 2}px ${({ $color }) => $color}88;
  opacity: 0.6;
  will-change: transform;
`

const HitFlash = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(255, 0, 51, 0.35);
  pointer-events: none;
  mix-blend-mode: screen;
`

const getSteppedHpPercent = (hp: number, maxHp: number): number => {
  if (maxHp <= 0) return 0
  const ratio = hp / maxHp
  if (ratio > 0.875) return 100
  if (ratio > 0.75) return 87.5
  if (ratio > 0.625) return 75
  if (ratio > 0.5) return 62.5
  if (ratio > 0.375) return 50
  if (ratio > 0.25) return 37.5
  if (ratio > 0.125) return 25
  if (ratio > 0) return 12.5
  return 0
}

export const Arena: React.FC<ArenaProps> = ({ isPaused = false }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(48)
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([])
  const explosionTriggerRef = useRef(0)
  const prevAttackEventsRef = useRef<Set<string>>(new Set())

  const { robots, latestSnapshot, phase } = useGameStore()
  const obstacles = latestSnapshot?.obstacles ?? []
  const events = latestSnapshot?.events ?? []
  const activeRobotId = latestSnapshot?.activeRobotId
  const currentTurn = latestSnapshot?.turn ?? 0

  const paused = isPaused || phase === 'paused'

  useEffect(() => {
    const updateCellSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const size = Math.floor(Math.min(rect.width, rect.height) / GRID_SIZE)
      setCellSize(Math.max(size, 24))
    }
    updateCellSize()
    const ro = new ResizeObserver(updateCellSize)
    if (containerRef.current) {
      ro.observe(containerRef.current)
    }
    window.addEventListener('resize', updateCellSize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateCellSize)
    }
  }, [])

  useEffect(() => {
    const attackEvents = events.filter((e): e is Extract<BattleEvent, { type: 'attack' }> => e.type === 'attack')
    const newEffects: AttackEffect[] = []

    attackEvents.forEach((ev) => {
      const key = `${ev.turn}-${ev.attackerId}-${ev.targetId}-${ev.damage}`
      if (!prevAttackEventsRef.current.has(key)) {
        prevAttackEventsRef.current.add(key)
        const attacker = robots.find((r) => r.id === ev.attackerId)
        explosionTriggerRef.current += 1
        newEffects.push({
          id: key,
          path: ev.bulletPath,
          attackerColor: attacker?.color ?? '#FF0033',
          targetX: ev.bulletPath[ev.bulletPath.length - 1]?.[0] ?? 0,
          targetY: ev.bulletPath[ev.bulletPath.length - 1]?.[1] ?? 0,
          explosionTrigger: explosionTriggerRef.current,
          duration: 450
        })
      }
    })

    if (newEffects.length > 0) {
      setAttackEffects((prev) => [...prev, ...newEffects])
    }

    const cleanup = setTimeout(() => {
      setAttackEffects((prev) => prev.filter((e) => !newEffects.find((n) => n.id === e.id)))
    }, 1200)

    return () => clearTimeout(cleanup)
  }, [events, robots])

  const activeCommandLabel = useMemo(() => {
    if (!activeRobotId) return null
    const robot = robots.find((r) => r.id === activeRobotId)
    if (!robot) return null
    const cmdIndex = latestSnapshot?.executingIndex ?? 0
    const cmd = robot.commands[cmdIndex]
    if (!cmd) return null
    return COMMANDS[cmd]
  }, [activeRobotId, robots, latestSnapshot])

  const bulletPositions = useMemo(() => {
    return attackEffects.map((eff) => {
      const path = eff.path
      if (path.length < 2) return null
      const xs = path.map((p) => (p[0] + 0.5) * cellSize)
      const ys = path.map((p) => (p[1] + 0.5) * cellSize)
      return {
        ...eff,
        xs,
        ys,
        startX: xs[0],
        startY: ys[0],
        endX: xs[xs.length - 1],
        endY: ys[ys.length - 1]
      }
    }).filter(Boolean) as Array<AttackEffect & { xs: number[]; ys: number[]; startX: number; startY: number; endX: number; endY: number }>
  }, [attackEffects, cellSize])

  return (
    <ArenaOuter>
      <ArenaContainer
        ref={containerRef}
        $isPaused={paused}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GridContent>
          {robots.map((robot) =>
            robot.trail.map((t, idx) => {
              const maxTurn = Math.max(...robot.trail.map((tr) => tr.turn), currentTurn)
              const age = maxTurn - t.turn
              const opacity = Math.max(0, 0.35 - age * 0.15)
              if (opacity <= 0) return null
              return (
                <TrailGhost
                  key={`trail-${robot.id}-${idx}`}
                  $cellSize={cellSize}
                  $opacity={opacity}
                  $direction={robot.direction}
                  style={{
                    color: robot.color,
                    transform: `translate(${t.x * cellSize}px, ${t.y * cellSize}px) rotate(${directionToDegrees(robot.direction)}deg)`
                  }}
                >
                  <RobotSVG type={robot.type} color={robot.color} />
                </TrailGhost>
              )
            })
          )}

          {obstacles.map((obs) => (
            <ObstacleWrap
              key={obs.id}
              $cellSize={cellSize}
              style={{ transform: `translate(${obs.x * cellSize}px, ${obs.y * cellSize}px)` }}
            >
              {obs.type === 'metalCrate' ? (
                <>
                  <MetalCrateSVG hp={obs.hp ?? METAL_CRATE_HP} />
                  <CrateHpBar>
                    <CrateHpFill $percent={((obs.hp ?? METAL_CRATE_HP) / METAL_CRATE_HP) * 100} />
                  </CrateHpBar>
                </>
              ) : (
                <>
                  <EnergyPulse />
                  <EnergySupplySVG />
                </>
              )}
            </ObstacleWrap>
          ))}

          {robots.map((robot) => {
            const hpPercent = getSteppedHpPercent(robot.hp, robot.stats.maxHp)
            const isActive = activeRobotId === robot.id
            const showCommandBubble = isActive && activeCommandLabel

            return (
              <RobotWrap
                key={robot.id}
                $cellSize={cellSize}
                animate={{
                  x: robot.x * cellSize,
                  y: robot.y * cellSize,
                  scale: isActive ? 1.06 : 1
                }}
                transition={{
                  x: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  y: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.2 }
                }}
                style={{ color: robot.color }}
              >
                {robot.isDefending && (
                  <ShieldAura
                    animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.5, 0.85, 0.5] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {robot.scannedEnemies.length > 0 && (
                  <RadarScan
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                <RobotBody
                  $direction={robot.direction}
                  $isHit={robot.isHit}
                  animate={
                    robot.isHit
                      ? {
                          x: [0, -4, 4, -3, 3, 0],
                          filter: [
                            'drop-shadow(0 0 12px #FF0033) drop-shadow(0 0 24px #FF0033aa)',
                            'drop-shadow(0 0 20px #FF0033) drop-shadow(0 0 40px #FF0033dd)',
                            'drop-shadow(0 0 12px #FF0033) drop-shadow(0 0 24px #FF0033aa)'
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: robot.isHit ? 0.35 : 0 }}
                >
                  <AnimatePresence>
                    {robot.isHit && (
                      <HitFlash
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.9, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                      />
                    )}
                  </AnimatePresence>
                  <RobotSVG type={robot.type} color={robot.color} />
                </RobotBody>

                <HpBarWrap key={`hp-${robot.id}-${robot.hp}`}>
                  <HpBarFill $hpPercent={hpPercent} $isPlayer={robot.isPlayer} />
                </HpBarWrap>

                <AnimatePresence>
                  {showCommandBubble && (
                    <CommandBubble
                      $color={activeCommandLabel!.color}
                      initial={{ opacity: 0, y: -8, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      {activeCommandLabel!.label}
                    </CommandBubble>
                  )}
                </AnimatePresence>
              </RobotWrap>
            )
          })}

          <BulletPath>
            {bulletPositions.map((bp, bpIdx) => {
              const bulletSize = Math.max(cellSize * 0.22, 8)
              const trailCount = 6
              const key = bp.id

              const pathPoints = bp.xs.map((x, i) => ({ x, y: bp.ys[i] }))

              return (
                <React.Fragment key={key}>
                  {Array.from({ length: trailCount }).map((_, i) => {
                    const delay = (i + 1) * 0.035
                    const size = bulletSize * (1 - i * 0.12)
                    return (
                      <BulletTrail
                        key={`${key}-trail-${i}`}
                        $color={bp.attackerColor}
                        $size={Math.max(size, 3)}
                        $delay={delay}
                        initial={{ x: bp.startX - size / 2, y: bp.startY - size / 2, opacity: 0 }}
                        animate={(() => {
                          const points = pathPoints.map((p, idx) => ({
                            x: p.x - size / 2,
                            y: p.y - size / 2
                          }))
                          return { x: points.map((p) => p.x), y: points.map((p) => p.y) }
                        })()}
                        transition={{
                          duration: bp.duration / 1000,
                          delay,
                          ease: 'linear'
                        }}
                        style={{ opacity: 0.5 - i * 0.07 }}
                      />
                    )
                  })}

                  <BulletCore
                    key={`${key}-core`}
                    $color={bp.attackerColor}
                    $size={bulletSize}
                    initial={{ x: bp.startX - bulletSize / 2, y: bp.startY - bulletSize / 2 }}
                    animate={(() => {
                      const points = pathPoints.map((p) => ({
                        x: p.x - bulletSize / 2,
                        y: p.y - bulletSize / 2
                      }))
                      return { x: points.map((p) => p.x), y: points.map((p) => p.y) }
                    })()}
                    transition={{
                      duration: bp.duration / 1000,
                      ease: 'linear'
                    }}
                  />

                  <ParticleBurst
                    x={(bp.targetX + 0.5 * cellSize) * 0 + bp.endX}
                    y={bp.endY}
                    color="#FF6600"
                    count={32}
                    spread={cellSize * 1.6}
                    trigger={bp.explosionTrigger}
                    sizeRange={[3, 8]}
                  />
                  <ParticleBurst
                    x={bp.endX}
                    y={bp.endY}
                    color="#FFCC00"
                    count={18}
                    spread={cellSize * 0.9}
                    trigger={bp.explosionTrigger + 0.0001}
                    sizeRange={[2, 5]}
                  />
                  <ParticleBurst
                    x={bp.endX}
                    y={bp.endY}
                    color="#FF3300"
                    count={14}
                    spread={cellSize * 0.5}
                    trigger={bp.explosionTrigger + 0.0002}
                    sizeRange={[2, 4]}
                  />
                </React.Fragment>
              )
            })}
          </BulletPath>
        </GridContent>
      </ArenaContainer>
    </ArenaOuter>
  )
}
