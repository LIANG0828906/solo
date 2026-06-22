import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Swords, Users, Clock, Pause, Play, SkipForward } from 'lucide-react'
import { cyberTheme } from '@/styles/theme'
import { CyberButton } from './CyberButton'
import { useGameStore } from '@/store/useGameStore'

const BarContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(
    90deg,
    ${cyberTheme.colors.bgDeep} 0%,
    ${cyberTheme.colors.bgMid} 50%,
    ${cyberTheme.colors.bgDeep} 100%
  );
  border-bottom: 1.5px solid ${cyberTheme.colors.neonCyan}33;
  clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 16px 100%);
  z-index: 20;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${cyberTheme.colors.neonCyan} 30%,
      ${cyberTheme.colors.neonPurple} 70%,
      transparent 100%
    );
    opacity: 0.7;
  }
`

const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
`

const StatItem = styled.div<{ $accent?: string; $pulse?: boolean }>(
  ({ $accent = cyberTheme.colors.neonCyan, $pulse }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: cyberTheme.fonts.display,
    fontSize: 14,
    letterSpacing: '0.06em',
    color: cyberTheme.colors.textPrimary,
    svg: {
      color: $accent,
      filter: `drop-shadow(0 0 4px ${$accent})`,
      animation: $pulse ? 'glowPulse 1s ease-in-out infinite' : undefined
    }
  })
)

const StatValue = styled.span<{ $color?: string; $flash?: boolean }>(
  ({ $color, $flash }) => ({
    fontFamily: cyberTheme.fonts.display,
    fontWeight: 900,
    fontSize: 20,
    color: $color ?? cyberTheme.colors.neonCyan,
    textShadow: `0 0 8px ${$color ?? cyberTheme.colors.neonCyan}88`,
    minWidth: 32,
    textAlign: 'center',
    animation: $flash ? 'flicker 0.4s ease-in-out infinite' : undefined
  })
)

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const TurnLabel = styled.div`
  font-family: ${cyberTheme.fonts.body};
  font-size: 11px;
  color: ${cyberTheme.colors.textMuted};
  letter-spacing: 0.15em;
  text-transform: uppercase;
`

const TURN_SECONDS = 30

export const StatusBar: React.FC = () => {
  const {
    phase,
    turn,
    robots,
    countdown,
    setCountdown,
    pauseGame,
    resumeGame,
    startGame,
    currentCommandIndex
  } = useGameStore()

  const [cd, setCd] = useState(TURN_SECONDS)

  useEffect(() => {
    setCd(TURN_SECONDS)
  }, [turn])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => {
      setCd((prev) => {
        const n = Math.max(0, prev - 1)
        setCountdown(n)
        return n
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase, setCountdown])

  useEffect(() => {
    if (cd === 0 && phase === 'playing') {
      setCd(TURN_SECONDS)
    }
  }, [cd, phase])

  void countdown

  const alive = robots.filter((r) => r.hp > 0).length
  const total = robots.length || 4
  const displayTurn = Math.max(1, turn)
  const isFlash = cd <= 3 && phase === 'playing'
  const cdColor = cd <= 3 ? cyberTheme.colors.neonRed : cyberTheme.colors.neonCyanSoft

  return (
    <BarContainer>
      <StatGroup>
        <StatItem $accent={cyberTheme.colors.neonCyan}>
          <Swords size={18} />
          <div>
            <TurnLabel>回合 TURN</TurnLabel>
            <StatValue>
              {String(displayTurn).padStart(2, '0')}
              <span style={{ fontSize: 13, opacity: 0.5, marginLeft: 4 }}>
                / SLOT {(currentCommandIndex + 1).toString().padStart(2, '0')}
              </span>
            </StatValue>
          </div>
        </StatItem>

        <StatItem $accent={cyberTheme.colors.neonPurpleSoft}>
          <Users size={18} />
          <div>
            <TurnLabel>存活 SURVIVORS</TurnLabel>
            <StatValue $color={cyberTheme.colors.neonPurpleSoft}>
              {alive}<span style={{ fontSize: 13, opacity: 0.5, marginLeft: 2 }}>/{total}</span>
            </StatValue>
          </div>
        </StatItem>

        <StatItem $accent={cdColor} $pulse={isFlash}>
          <Clock size={18} />
          <div>
            <TurnLabel>倒计时 CLOCK</TurnLabel>
            <StatValue $color={cdColor} $flash={isFlash}>
              {String(cd).padStart(2, '0')}s
            </StatValue>
          </div>
        </StatItem>
      </StatGroup>

      <ActionGroup>
        {phase === 'playing' && turn === 1 && currentCommandIndex === -1 && (
          <CyberButton size="md" variant="primary" leftIcon={<Play size={16} />} onClick={startGame}>
            开始首回合
          </CyberButton>
        )}
        {phase === 'playing' && (
          <CyberButton
            size="md"
            variant="secondary"
            leftIcon={<Pause size={16} />}
            onClick={pauseGame}
          >
            暂停
          </CyberButton>
        )}
        {phase === 'paused' && (
          <CyberButton size="md" variant="primary" leftIcon={<Play size={16} />} onClick={resumeGame}>
            继续
          </CyberButton>
        )}
        {(phase === 'playing' || phase === 'paused') && (
          <CyberButton
            size="md"
            variant="ghost"
            leftIcon={<SkipForward size={16} />}
            onClick={() => {}}
            disabled
          >
            快进
          </CyberButton>
        )}
      </ActionGroup>
    </BarContainer>
  )
}
