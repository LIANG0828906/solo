import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
  Zap,
  Shield,
  Radar,
  GripVertical,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import type { CommandType, GamePhase } from '@/core/types'
import { COMMANDS, COMMAND_ORDER, COMMAND_SLOTS } from '@/config/gameConfig'
import { cyberTheme } from '@/styles/theme'
import { useGameStore } from '@/store/useGameStore'
import { sfx } from '@/utils/soundEffects'
import type { LucideIcon } from 'lucide-react'
import { CyberButton } from '@/components/ui/CyberButton'

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowUp,
  ArrowDown,
  Undo2,
  Redo2,
  Zap,
  Shield,
  Radar
}

interface DragItem {
  source: 'library' | 'slot'
  type: CommandType
  fromIndex?: number
}

const VISIBLE_PHASES: GamePhase[] = ['playing', 'paused']

const Panel = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgba(10, 14, 39, 0.94) 0%,
    rgba(20, 16, 40, 0.96) 100%
  );
  border-top: 1.5px solid ${cyberTheme.colors.neonCyan}33;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 15;
  max-height: 440px;

  &::before {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    top: 0;
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

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 74vh;
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
    z-index: 60;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  user-select: none;
  border-bottom: 1px solid ${cyberTheme.colors.neonPurple}22;
`

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  letter-spacing: 0.22em;
  color: ${cyberTheme.colors.neonCyanSoft};
  text-transform: uppercase;

  svg {
    color: ${cyberTheme.colors.neonPurpleSoft};
  }
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${cyberTheme.colors.textMuted};
  font-family: ${cyberTheme.fonts.display};
  font-size: 11px;
  letter-spacing: 0.12em;
`

const Body = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  padding: 16px 28px 28px;
  flex: 1;
  overflow: auto;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    grid-template-columns: 1fr;
    padding: 14px 18px 22px;
  }
`

const Library = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: ${cyberTheme.colors.bgDeep}77;
  border: 1px solid ${cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.notched};
`

const SectionLabel = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 10px;
  letter-spacing: 0.28em;
  color: ${cyberTheme.colors.neonPurpleSoft};
  padding: 4px 10px;
  margin-bottom: 8px;
  border-left: 2px solid ${cyberTheme.colors.neonPurple};
  text-transform: uppercase;
`

const LibraryItem = styled(motion.div)<{ $color: string }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: ${({ $color }) => $color + '0c'};
  border: 1px solid ${({ $color }) => $color + '40'};
  color: ${({ $color }) => $color};
  cursor: grab;
  touch-action: none;
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 160ms ease;

  &:hover {
    background: ${({ $color }) => $color + '1c'};
    border-color: ${({ $color }) => $color + 'bb'};
    box-shadow: inset 0 0 12px ${({ $color }) => $color + '1c'}, 0 0 14px ${({ $color }) => $color + '28'};
    transform: translateX(3px);
  }

  &:active {
    cursor: grabbing;
  }
`

const LibIcon = styled.div`
  display: inline-flex;
  svg {
    filter: drop-shadow(0 0 5px currentColor);
  }
`

const LibText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  span:first-of-type {
    font-family: ${cyberTheme.fonts.display};
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  span:last-of-type {
    font-size: 10px;
    color: ${cyberTheme.colors.textMuted};
    letter-spacing: 0.06em;
    margin-top: 2px;
  }
`

const SlotsArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SlotsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  flex-wrap: wrap;
  gap: 8px;
`

const SlotsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 11px;
  letter-spacing: 0.2em;
  color: ${cyberTheme.colors.textSecondary};
  text-transform: uppercase;
`

const SlotsRow = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(${COMMAND_SLOTS}, 1fr);
  gap: 12px;
  padding: 18px;
  background: ${cyberTheme.colors.bgDeep}66;
  border: 1px solid ${cyberTheme.colors.neonPurple}44;
  clip-path: ${cyberTheme.clipPaths.sharpCutAll};
`

interface SlotProps {
  $hovered: boolean
  $isEmpty: boolean
}

const Slot = styled(motion.div)<SlotProps>`
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 6px;
  background: ${({ $hovered, $isEmpty }) =>
    $hovered
      ? cyberTheme.colors.neonCyan + '22'
      : $isEmpty
        ? 'rgba(0, 255, 255, 0.04)'
        : 'rgba(139, 0, 255, 0.08)'};
  border: 1.5px solid
    ${({ $hovered, $isEmpty }) =>
      $hovered
        ? cyberTheme.colors.neonCyan + 'dd'
        : $isEmpty
          ? cyberTheme.colors.borderGlow
          : cyberTheme.colors.neonPurple + '66'};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 220ms ease;
  box-shadow: ${({ $hovered }) =>
    $hovered
      ? `0 0 28px ${cyberTheme.colors.neonCyan}55, inset 0 0 20px ${cyberTheme.colors.neonCyan}22`
      : 'none'};
`

const SlotIndex = styled.div`
  position: absolute;
  top: 5px;
  left: 8px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 9px;
  letter-spacing: 0.2em;
  color: ${cyberTheme.colors.textMuted};
`

interface SlotContentProps {
  $color: string
}

const SlotContent = styled(motion.div)<SlotContentProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px 4px 2px;
  cursor: grab;
  touch-action: none;
  width: 100%;
  color: ${({ $color }) => $color};

  svg {
    filter: drop-shadow(0 0 5px ${({ $color }) => $color + 'cc'});
  }

  span {
    font-family: ${cyberTheme.fonts.display};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: ${({ $color }) => $color};
    text-align: center;
  }

  &:active {
    cursor: grabbing;
  }
`

const EmptyHint = styled.div`
  font-family: ${cyberTheme.fonts.body};
  font-size: 10px;
  color: ${cyberTheme.colors.textMuted};
  letter-spacing: 0.1em;
  text-align: center;
  opacity: 0.65;
  line-height: 1.5;
`

const SlotCommandLabel = styled.div`
  font-size: 9px;
  color: ${cyberTheme.colors.textSecondary};
  letter-spacing: 0.08em;
  margin-top: 2px;
`

const DeleteBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 5px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${cyberTheme.colors.neonRedSoft}88;
  background: transparent;
  border: none;
  padding: 0;
  opacity: 0;
  transition: all 160ms ease;
  cursor: pointer;

  &:hover {
    opacity: 1;
    color: ${cyberTheme.colors.neonRedSoft};
    transform: scale(1.15);
  }
`

const SlotWrapper = styled.div`
  position: relative;
  &:hover ${DeleteBtn} {
    opacity: 0.9;
  }
`

const PulseGlow = styled(motion.div)<{ $delay: number }>`
  position: absolute;
  inset: -2px;
  pointer-events: none;
  clip-path: ${cyberTheme.clipPaths.notched};
  border: 2px solid ${cyberTheme.colors.neonCyan};
  box-shadow:
    0 0 14px ${cyberTheme.colors.neonCyan}aa,
    inset 0 0 12px ${cyberTheme.colors.neonCyan}55;
  opacity: 0;
`

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 4px;
  flex-wrap: wrap;
  gap: 8px;
`

const Tip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${cyberTheme.colors.textMuted};

  svg {
    color: ${cyberTheme.colors.neonGold}aa;
  }
`

interface DragGhostProps {
  $color: string
}

const DragGhost = styled(motion.div)<DragGhostProps>`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: ${({ $color }) => $color + '28'};
  border: 1.5px solid ${({ $color }) => $color + 'aa'};
  color: ${({ $color }) => $color};
  clip-path: ${cyberTheme.clipPaths.notched};
  font-family: ${cyberTheme.fonts.display};
  font-size: 12px;
  letter-spacing: 0.14em;
  box-shadow: 0 10px 28px ${({ $color }) => $color + '44'};
  backdrop-filter: blur(6px);
  opacity: 0.6;
`

export const CommandPanel: React.FC = () => {
  const {
    playerCommands,
    setPlayerCommand,
    clearPlayerCommands,
    moveCommand,
    applyPlayerCommands,
    phase
  } = useGameStore()

  const [dragging, setDragging] = useState<DragItem | null>(null)
  const [dragPos, setDragPos] = useState({ x: -9999, y: -9999 })
  const [hoveredSlot, setHoveredSlot] = useState<number>(-1)
  const [animatingIndex, setAnimatingIndex] = useState<number>(-1)

  const slotRefs = useMemo(
    () => Array(COMMAND_SLOTS).fill(null).map(() => React.createRef<HTMLDivElement>()),
    []
  )
  const draggingRef = useRef<DragItem | null>(null)
  const hoveredRef = useRef<number>(-1)

  useEffect(() => {
    draggingRef.current = dragging
  }, [dragging])

  useEffect(() => {
    hoveredRef.current = hoveredSlot
  }, [hoveredSlot])

  const shouldRender = VISIBLE_PHASES.includes(phase)

  const checkHoveredSlot = useCallback((clientX: number, clientY: number): number => {
    let targetIdx = -1
    slotRefs.forEach((ref, idx) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        targetIdx = idx
      }
    })
    return targetIdx
  }, [slotRefs])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const currentDragging = draggingRef.current
      if (!currentDragging) return
      setDragPos({ x: e.clientX, y: e.clientY })
      const idx = checkHoveredSlot(e.clientX, e.clientY)
      if (idx !== hoveredRef.current) {
        if (idx !== -1 && hoveredRef.current === -1) {
          sfx.hover()
        }
        setHoveredSlot(idx)
        hoveredRef.current = idx
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      const currentDragging = draggingRef.current
      if (!currentDragging) return
      const targetIdx = checkHoveredSlot(e.clientX, e.clientY)

      if (targetIdx >= 0) {
        if (currentDragging.source === 'library') {
          sfx.place()
          setPlayerCommand(targetIdx, currentDragging.type)
          setAnimatingIndex(targetIdx)
          setTimeout(() => setAnimatingIndex(-1), 500)
        } else if (
          currentDragging.fromIndex !== undefined &&
          currentDragging.fromIndex !== targetIdx
        ) {
          sfx.place()
          moveCommand(currentDragging.fromIndex, targetIdx)
          setAnimatingIndex(targetIdx)
          setTimeout(() => setAnimatingIndex(-1), 500)
        }
      }

      setDragging(null)
      draggingRef.current = null
      setHoveredSlot(-1)
      hoveredRef.current = -1
      setDragPos({ x: -9999, y: -9999 })
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [checkHoveredSlot, setPlayerCommand, moveCommand])

  const handleLibDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, type: CommandType) => {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      setDragging({ source: 'library', type })
      draggingRef.current = { source: 'library', type }
      setDragPos({ x: e.clientX, y: e.clientY })
    },
    []
  )

  const handleSlotDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
      const cmd = playerCommands[idx]
      if (!cmd) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      setDragging({ source: 'slot', type: cmd, fromIndex: idx })
      draggingRef.current = { source: 'slot', type: cmd, fromIndex: idx }
      setDragPos({ x: e.clientX, y: e.clientY })
    },
    [playerCommands]
  )

  const currentDraggingCmd = dragging ? COMMANDS[dragging.type] : null
  const draggingIcon = currentDraggingCmd ? ICON_MAP[currentDraggingCmd.icon] : null

  if (!shouldRender) {
    return null
  }

  return (
    <>
      <Panel
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <Header>
          <HeaderTitle>
            <GripVertical size={16} /> 指令编辑器 · COMMAND MATRIX
          </HeaderTitle>
          <HeaderRight>
            {phase === 'paused' && (
              <span style={{ color: cyberTheme.colors.neonGold, whiteSpace: 'nowrap' }}>
                <AlertTriangle
                  size={12}
                  style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }}
                />
                指令变更 · 下一回合生效
              </span>
            )}
            <CyberButton
              size="sm"
              variant="ghost"
              leftIcon={<Trash2 size={12} />}
              onClick={() => {
                clearPlayerCommands()
                sfx.click()
              }}
            >
              CLEAR
            </CyberButton>
            <CyberButton
              size="sm"
              variant="secondary"
              onClick={() => {
                applyPlayerCommands()
                sfx.place()
              }}
            >
              APPLY
            </CyberButton>
          </HeaderRight>
        </Header>

        <Body>
          <Library>
            <SectionLabel>◢ 指令库 / LIBRARY</SectionLabel>
            {COMMAND_ORDER.map((key) => {
              const cmd = COMMANDS[key]
              const IconComp = ICON_MAP[cmd.icon]
              return (
                <LibraryItem
                  key={cmd.type}
                  $color={cmd.color}
                  onPointerDown={(e) => handleLibDragStart(e, cmd.type)}
                  whileHover={{ x: 4 }}
                  onMouseEnter={() => sfx.hover()}
                >
                  <LibIcon>{IconComp && <IconComp size={19} />}</LibIcon>
                  <LibText>
                    <span>{cmd.label}</span>
                    <span>
                      {cmd.labelCn} · {cmd.description}
                    </span>
                  </LibText>
                </LibraryItem>
              )
            })}
          </Library>

          <SlotsArea>
            <SlotsHeader>
              <SlotsTitle>
                ◢ 序列槽位 / SEQUENCE SLOTS · {COMMAND_SLOTS} STEPS / TURN
              </SlotsTitle>
              <Tip>
                <AlertTriangle size={12} /> 从左侧拖拽指令 · 槽位间拖动重排序 · 悬停删除
              </Tip>
            </SlotsHeader>

            <SlotsRow>
              {playerCommands.map((cmd, idx) => {
                const cmdMeta = cmd ? COMMANDS[cmd] : null
                const IconComp = cmdMeta ? ICON_MAP[cmdMeta.icon] : null
                const isHovered = idx === hoveredSlot
                const isAnimating = idx === animatingIndex
                const isEmpty = !cmdMeta
                return (
                  <SlotWrapper
                    key={idx}
                    ref={slotRefs[idx] as unknown as React.RefObject<HTMLDivElement>}
                  >
                    <Slot
                      $hovered={isHovered}
                      $isEmpty={isEmpty}
                      animate={
                        isAnimating
                          ? {
                              scale: [1, 1.12, 1],
                              transition: { type: 'spring', stiffness: 500, damping: 22 }
                            }
                          : {}
                      }
                    >
                      <PulseGlow
                        $delay={idx * 0.18}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [1, 1.02, 1]
                        }}
                        transition={{
                          duration: 1.8,
                          delay: idx * 0.18,
                          repeat: Infinity,
                          repeatDelay: (COMMAND_SLOTS - idx - 1) * 0.18 + 0.2,
                          ease: 'easeInOut'
                        }}
                      />
                      <SlotIndex>0{idx + 1}</SlotIndex>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {cmdMeta && IconComp ? (
                          <SlotContent
                            key={cmd + idx}
                            $color={cmdMeta.color}
                            layout
                            initial={{ opacity: 0, y: -10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 14, scale: 0.65 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            onPointerDown={(e) => handleSlotDragStart(e, idx)}
                            onMouseEnter={() => sfx.hover()}
                          >
                            <IconComp size={24} />
                            <span>{cmdMeta.label}</span>
                            <SlotCommandLabel>{cmdMeta.labelCn}</SlotCommandLabel>
                          </SlotContent>
                        ) : (
                          <EmptyHint>
                            ◇ 空槽位
                            <br />
                            拖入指令
                          </EmptyHint>
                        )}
                      </AnimatePresence>
                      <DeleteBtn
                        onClick={(e) => {
                          e.stopPropagation()
                          sfx.click()
                          setPlayerCommand(idx, null)
                        }}
                        disabled={isEmpty}
                        style={{ opacity: isEmpty ? 0 : undefined, pointerEvents: isEmpty ? 'none' : undefined }}
                      >
                        <Trash2 size={12} />
                      </DeleteBtn>
                    </Slot>
                  </SlotWrapper>
                )
              })}
            </SlotsRow>

            <InfoRow>
              <Tip>
                执行顺序：从左到右 · 槽位 0→5 循环 · 同一槽位内按机器人
                <b style={{ color: cyberTheme.colors.neonCyan, margin: '0 3px' }}>速度值</b>
                排序行动
              </Tip>
              <div
                style={{
                  fontFamily: cyberTheme.fonts.display,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: cyberTheme.colors.textMuted
                }}
              >
                ◤ SLOT QUEUE: 01 → 02 → 03 → 04 → 05 → 06 ◥
              </div>
            </InfoRow>
          </SlotsArea>
        </Body>
      </Panel>

      <AnimatePresence>
        {dragging && currentDraggingCmd && draggingIcon && (
          <DragGhost
            $color={currentDraggingCmd.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 0.6,
              scale: 1,
              x: dragPos.x + 14,
              y: dragPos.y + 14
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 600, damping: 26 }}
          >
            {(() => {
              const GhostIcon = draggingIcon
              return <GhostIcon size={18} />
            })()}
            <span>{currentDraggingCmd.label}</span>
            <span
              style={{
                color: currentDraggingCmd.color + 'aa',
                fontSize: 10,
                letterSpacing: '0.08em'
              }}
            >
              {currentDraggingCmd.labelCn}
            </span>
          </DragGhost>
        )}
      </AnimatePresence>
    </>
  )
}
