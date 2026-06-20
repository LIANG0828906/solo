import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { cyberTheme } from '@/styles/theme'
import { useGameStore } from '@/store/useGameStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CyberButton } from './CyberButton'

const Container = styled(motion.div)`
  padding: 16px 24px;
  background: linear-gradient(
    180deg,
    rgba(10, 14, 39, 0.8) 0%,
    rgba(20, 16, 40, 0.95) 100%
  );
  border-top: 1.5px solid ${cyberTheme.colors.neonPurple}44;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${cyberTheme.colors.neonPurple} 50%,
      transparent 100%
    );
    opacity: 0.6;
  }
`

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`

const Title = styled.span`
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  letter-spacing: 0.18em;
  color: ${cyberTheme.colors.neonPurpleSoft};
  text-transform: uppercase;
`

const Stats = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 12px;
  letter-spacing: 0.1em;
  color: ${cyberTheme.colors.textSecondary};
`

const TrackWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

const NavBtn = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${cyberTheme.colors.bgDeep}88;
  border: 1px solid ${cyberTheme.colors.borderGlow};
  color: ${cyberTheme.colors.textSecondary};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 150ms ease;

  &:hover:not(:disabled) {
    color: ${cyberTheme.colors.neonCyan};
    border-color: ${cyberTheme.colors.neonCyan}88;
    box-shadow: inset 0 0 8px ${cyberTheme.colors.neonCyan}22;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`

const Track = styled.div<{ $hovering: boolean }>`
  position: relative;
  flex: 1;
  height: 44px;
  cursor: pointer;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 255, 0.04) 0%,
    rgba(139, 0, 255, 0.06) 100%
  );
  border: 1px solid ${({ $hovering }) =>
    $hovering ? cyberTheme.colors.neonCyan + '99' : cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: border-color 150ms ease;
  overflow: hidden;
`

const Ruler = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  height: 8px;
  display: flex;
  padding: 0 12px;
  pointer-events: none;

  &::before,
  &::after,
  span {
    content: '';
    flex: 1;
    margin: 0 2px;
    border-left: 1px solid ${cyberTheme.colors.textMuted}55;
    position: relative;

    &::after {
      content: attr(data-label);
      position: absolute;
      top: 9px;
      left: -4px;
      font-family: ${cyberTheme.fonts.display};
      font-size: 10px;
      letter-spacing: 0.1em;
      color: ${cyberTheme.colors.textMuted};
    }
  }
`

const Progress = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    ${cyberTheme.colors.neonCyan}22 0%,
    ${cyberTheme.colors.neonPurple}33 100%
  );
  border-right: 1.5px solid ${cyberTheme.colors.neonCyan};
  box-shadow: 4px 0 16px ${cyberTheme.colors.neonCyan}55;
  pointer-events: none;
  transition: width 80ms linear;
`

const SlotMarkers = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 12px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 2px;
  pointer-events: none;
`

const Slot = styled.div<{ $active: boolean }>`
  flex: 1;
  height: 6px;
  background: ${({ $active }) =>
    $active ? cyberTheme.colors.neonCyan : 'rgba(139, 176, 255, 0.15)'};
  clip-path: polygon(2px 0, calc(100% - 2px) 0, 100% 100%, 0 100%);
  transition: all 150ms ease;
  box-shadow: ${({ $active }) => ($active ? `0 0 8px ${cyberTheme.colors.neonCyan}` : 'none')};
`

const Tooltip = styled.div`
  position: absolute;
  bottom: 48px;
  transform: translateX(-50%);
  padding: 6px 10px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 11px;
  letter-spacing: 0.08em;
  color: ${cyberTheme.colors.neonCyan};
  background: ${cyberTheme.colors.bgDeep}ee;
  border: 1px solid ${cyberTheme.colors.neonCyan}66;
  clip-path: ${cyberTheme.clipPaths.notched};
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 0 12px ${cyberTheme.colors.neonCyan}33;
`

export const Timeline: React.FC = () => {
  const { replaySnapshots, replayIndex, gotoReplayIndex, phase, turn, currentCommandIndex } =
    useGameStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)
  const [hoverPos, setHoverPos] = useState<number | null>(null)

  const total = replaySnapshots.length
  const pct = total > 1 ? (replayIndex / (total - 1)) * 100 : 0

  const currentTurn = Math.max(1, turn)
  const currentSlot = Math.max(0, currentCommandIndex + 1)

  const computeIndex = useCallback(
    (clientX: number) => {
      if (!trackRef.current || total <= 1) return 0
      const rect = trackRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(ratio * (total - 1))
    },
    [total]
  )

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      const idx = computeIndex(e.clientX)
      setHoverPos(idx)
    },
    [computeIndex]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const idx = computeIndex(e.clientX)
      const t0 = performance.now()
      gotoReplayIndex(idx)
      const delta = performance.now() - t0
      if (delta > 200) {
        // eslint-disable-next-line no-console
        console.warn(`[Timeline] 响应延迟 ${delta.toFixed(0)}ms 超过 200ms 阈值`)
      }
    },
    [computeIndex, gotoReplayIndex]
  )

  const [dragging, setDragging] = useState(false)
  const rafIdRef = useRef<number | null>(null)
  const pendingIdxRef = useRef<number | null>(null)

  const commitGoto = useCallback(() => {
    rafIdRef.current = null
    const idx = pendingIdxRef.current
    if (idx === null) return
    pendingIdxRef.current = null
    const t0 = performance.now()
    gotoReplayIndex(idx)
    const delta = performance.now() - t0
    if (delta > 200) {
      // eslint-disable-next-line no-console
      console.warn(`[Timeline] 响应延迟 ${delta.toFixed(0)}ms 超过 200ms 阈值`)
    }
  }, [gotoReplayIndex])

  const scheduleGoto = useCallback(
    (idx: number) => {
      pendingIdxRef.current = idx
      if (rafIdRef.current !== null) return
      rafIdRef.current = requestAnimationFrame(commitGoto)
    },
    [commitGoto]
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      const idx = computeIndex(e.clientX)
      scheduleGoto(idx)
    }
    const onUp = () => {
      setDragging(false)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      const idx = pendingIdxRef.current
      if (idx !== null) {
        pendingIdxRef.current = null
        gotoReplayIndex(idx)
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [dragging, computeIndex, scheduleGoto, gotoReplayIndex])

  if (phase !== 'ended' && phase !== 'replay') return null

  const totalTurns = total > 0 ? Math.max(1, replaySnapshots[total - 1]?.turn ?? 1) : 1

  return (
    <Container initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <LabelRow>
        <Title>◢ 回放时间轴 / REPLAY TIMELINE ◣</Title>
        <Stats>
          TURN {currentTurn}/{totalTurns} · SLOT {currentSlot}/6 · FRAME{' '}
          {(replayIndex + 1).toString().padStart(3, '0')}/{total.toString().padStart(3, '0')}
        </Stats>
      </LabelRow>

      <TrackWrap>
        <NavBtn
          onClick={() => gotoReplayIndex(Math.max(0, replayIndex - 1))}
          disabled={replayIndex === 0}
        >
          <ChevronLeft size={16} />
        </NavBtn>

        <Track
          ref={trackRef}
          $hovering={hovering}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => {
            setHovering(false)
            setHoverPos(null)
          }}
          onMouseMove={handleMove}
          onClick={handleClick}
          onMouseDown={() => setDragging(true)}
        >
          <Progress style={{ width: `${pct}%` }} />
          <Ruler>
            {Array.from({ length: Math.min(8, Math.max(1, totalTurns)) }).map((_, i) => (
              <span
                key={i}
                data-label={Math.round((i * totalTurns) / Math.max(1, Math.min(8, totalTurns) - 1)) || 1}
              />
            ))}
          </Ruler>
          <SlotMarkers>
            {Array.from({ length: 6 }).map((_, i) => (
              <Slot key={i} $active={i < currentSlot} />
            ))}
          </SlotMarkers>
          {hoverPos !== null && total > 0 && (
            <Tooltip
              style={{
                left: `${total > 1 ? (hoverPos / (total - 1)) * 100 : 0}%`
              }}
            >
              帧 {hoverPos + 1} / TURN {(replaySnapshots[hoverPos]?.turn ?? 0) + 1}
            </Tooltip>
          )}
        </Track>

        <NavBtn
          onClick={() => gotoReplayIndex(Math.min(total - 1, replayIndex + 1))}
          disabled={replayIndex >= total - 1}
        >
          <ChevronRight size={16} />
        </NavBtn>
      </TrackWrap>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
        <CyberButton
          size="sm"
          variant="ghost"
          onClick={() => gotoReplayIndex(0)}
          disabled={total === 0}
        >
          开头
        </CyberButton>
        <CyberButton
          size="sm"
          variant="ghost"
          onClick={() => gotoReplayIndex(total - 1)}
          disabled={total === 0}
        >
          结尾
        </CyberButton>
      </div>
    </Container>
  )
}
