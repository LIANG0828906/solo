import React, { useCallback, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import * as ICONS from 'lucide-react'
import type { CommandType } from '@/core/types'
import { COMMANDS, COMMAND_ORDER, COMMAND_SLOTS } from '@/config/gameConfig'
import { cyberTheme } from '@/styles/theme'
import { useGameStore } from '@/store/useGameStore'
import { sfx } from '@/utils/soundEffects'
import type { LucideIcon } from 'lucide-react'
import { Trash2, GripVertical, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { CyberButton } from '@/components/ui/CyberButton'

const Panel = styled(motion.div)<{ $collapsed: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgba(10, 14, 39, 0.92) 0%,
    rgba(20, 16, 40, 0.95) 100%
  );
  border-top: 1.5px solid ${cyberTheme.colors.neonCyan}33;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  z-index: 15;
  max-height: ${({ $collapsed }) => ($collapsed ? '52px' : '420px')};
  transition: max-height 350ms cubic-bezier(0.16, 1, 0.3, 1);

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
    opacity: 0.6;
  }

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: ${({ $collapsed }) => ($collapsed ? '52px' : '72vh')};
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    z-index: 50;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(0, 255, 255, 0.03);
  }
`

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 13px;
  letter-spacing: 0.2em;
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
  grid-template-columns: 220px 1fr;
  gap: 18px;
  padding: 8px 24px 24px;
  flex: 1;
  overflow: auto;

  @media (max-width: ${cyberTheme.breakpoints.tablet}px) {
    grid-template-columns: 1fr;
  }
`

const Library = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: ${cyberTheme.colors.bgDeep}66;
  border: 1px solid ${cyberTheme.colors.borderGlow};
  clip-path: ${cyberTheme.clipPaths.notched};
`

const SectionLabel = styled.div`
  font-family: ${cyberTheme.fonts.display};
  font-size: 10px;
  letter-spacing: 0.25em;
  color: ${cyberTheme.colors.neonPurpleSoft};
  padding: 4px 8px;
  margin-bottom: 6px;
  border-left: 2px solid ${cyberTheme.colors.neonPurple};
  text-transform: uppercase;
`

const LibraryItem = styled(motion.div)<{ $color: string; $disabled?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${({ $color }) => $color + '0c'};
  border: 1px solid ${({ $color }) => $color + '40'};
  color: ${({ $color }) => $color};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'grab')};
  touch-action: none;
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 150ms ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover:not([aria-disabled]) {
    background: ${({ $color }) => $color + '18'};
    border-color: ${({ $color }) => $color + 'aa'};
    box-shadow: inset 0 0 10px ${({ $color }) => $color + '18'}, 0 0 10px ${({ $color }) => $color + '22'};
    transform: translateX(2px);
  }

  &:active {
    cursor: grabbing;
  }
`

const LibIcon = styled.div`
  display: inline-flex;
  svg {
    filter: drop-shadow(0 0 4px currentColor);
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
    letter-spacing: 0.15em;
  }
  span:last-of-type {
    font-size: 10px;
    color: ${cyberTheme.colors.textMuted};
    letter-spacing: 0.06em;
    margin-top: 1px;
  }
`

const SlotsArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SlotsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
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
  gap: 10px;
  padding: 14px;
  background: ${cyberTheme.colors.bgDeep}55;
  border: 1px solid ${cyberTheme.colors.neonPurple}33;
  clip-path: ${cyberTheme.clipPaths.sharpCutAll};
`

interface SlotProps {
  $active: boolean
  $isEmpty: boolean
}

const Slot = styled(motion.div)<SlotProps>`
  position: relative;
  min-height: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 6px;
  background: ${({ $active, $isEmpty }) =>
    $active
      ? cyberTheme.colors.neonCyan + '18'
      : $isEmpty
        ? 'rgba(0, 255, 255, 0.03)'
        : 'rgba(139, 0, 255, 0.06)'};
  border: 1.5px solid
    ${({ $active, $isEmpty }) =>
      $active
        ? cyberTheme.colors.neonCyan + 'aa'
        : $isEmpty
          ? cyberTheme.colors.borderGlow
          : cyberTheme.colors.neonPurple + '55'};
  clip-path: ${cyberTheme.clipPaths.notched};
  transition: all 200ms ease;
  box-shadow: ${({ $active }) =>
    $active ? `0 0 20px ${cyberTheme.colors.neonCyan}33, inset 0 0 16px ${cyberTheme.colors.neonCyan}14` : 'none'};
`

const SlotIndex = styled.div<{ $active: boolean }>`
  position: absolute;
  top: 4px;
  left: 6px;
  font-family: ${cyberTheme.fonts.display};
  font-size: 9px;
  letter-spacing: 0.2em;
  color: ${({ $active }) => ($active ? cyberTheme.colors.neonCyan : cyberTheme.colors.textMuted)};
`

const SlotContent = styled(motion.div)<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 4px 2px;
  cursor: grab;
  touch-action: none;
  width: 100%;
  color: ${({ $color }) => $color};

  svg {
    filter: drop-shadow(0 0 4px ${({ $color }) => $color + 'aa'});
  }

  span {
    font-family: ${cyberTheme.fonts.display};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
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
  opacity: 0.6;
`

const SlotCommandLabel = styled.div`
  font-size: 9px;
  color: ${cyberTheme.colors.textSecondary};
  letter-spacing: 0.08em;
  margin-top: 2px;
`

const DeleteBtn = styled.button`
  position: absolute;
  top: 3px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${cyberTheme.colors.neonRedSoft}88;
  background: transparent;
  opacity: 0;
  transition: all 150ms ease;

  &:hover {
    opacity: 1;
    color: ${cyberTheme.colors.neonRedSoft};
    transform: scale(1.1);
  }
`

const SlotWrapper = styled.div`
  position: relative;
  &:hover ${DeleteBtn} {
    opacity: 0.85;
  }
`

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
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

const DragGhost = styled(motion.div)<{ $color: string }>`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${({ $color }) => $color + '22'};
  border: 1.5px solid ${({ $color }) => $color + '99'};
  color: ${({ $color }) => $color};
  clip-path: ${cyberTheme.clipPaths.notched};
  font-family: ${cyberTheme.fonts.display};
  font-size: 12px;
  letter-spacing: 0.12em;
  box-shadow: 0 8px 24px ${({ $color }) => $color + '33'};
  backdrop-filter: blur(4px);
`

const DragPlaceholder = styled(motion.div)`
  border: 2px dashed ${cyberTheme.colors.neonCyan}88;
  border-radius: 0;
  clip-path: ${cyberTheme.clipPaths.notched};
  background: ${cyberTheme.colors.neonCyan}10;
`

interface DragItem {
  source: 'library' | 'slot'
  type: CommandType
  fromIndex?: number
}

export const CommandPanel: React.FC = () => {
  const { playerCommands, setPlayerCommand, clearPlayerCommands, moveCommand, phase, currentCommandIndex, applyPlayerCommands } =
    useGameStore()
  const [collapsed, setCollapsed] = useState(false)
  const [dragging, setDragging] = useState<DragItem | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const slotRefs = useMemo(() => Array(COMMAND_SLOTS).fill(null).map(() => React.createRef<HTMLDivElement>()), [])

  const activeIndex = phase === 'playing' || phase === 'paused' || phase === 'ended' ? currentCommandIndex : -1
  const editable = phase !== 'ended'

  const handleLibDragStart = useCallback(
    (e: React.PointerEvent, type: CommandType) => {
      if (!editable) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      setDragging({ source: 'library', type })
      setDragPos({ x: e.clientX, y: e.clientY })
    },
    [editable]
  )

  const handleSlotDragStart = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (!editable) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      const cmd = playerCommands[idx]
      if (!cmd) return
      setDragging({ source: 'slot', type: cmd, fromIndex: idx })
      setDragPos({ x: e.clientX, y: e.clientY })
    },
    [editable, playerCommands]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setDragPos({ x: e.clientX, y: e.clientY })
    },
    [dragging]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      let targetIdx = -1
      slotRefs.forEach((ref, idx) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          targetIdx = idx
        }
      })

      if (targetIdx >= 0) {
        if (dragging.source === 'library') {
          sfx.place()
          setPlayerCommand(targetIdx, dragging.type)
        } else if (dragging.fromIndex !== undefined && dragging.fromIndex !== targetIdx) {
          sfx.place()
          moveCommand(dragging.fromIndex, targetIdx)
        }
      }
      setDragging(null)
    },
    [dragging, slotRefs, setPlayerCommand, moveCommand]
  )

  useEffectOnDoc(() => {
    const onMove = (e: PointerEvent) => dragging && setDragPos({ x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      let targetIdx = -1
      slotRefs.forEach((ref, idx) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          targetIdx = idx
        }
      })
      if (targetIdx >= 0) {
        if (dragging.source === 'library') {
          sfx.place()
          setPlayerCommand(targetIdx, dragging.type)
        } else if (dragging.fromIndex !== undefined && dragging.fromIndex !== targetIdx) {
          sfx.place()
          moveCommand(dragging.fromIndex, targetIdx)
        }
      }
      setDragging(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, slotRefs, setPlayerCommand, moveCommand])

  const currentDraggingCmd = dragging ? COMMANDS[dragging.type] : null

  return (
    <Panel
      $collapsed={collapsed}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      layout
    >
      <Header onClick={() => setCollapsed((c) => !c)}>
        <HeaderTitle>
          <GripVertical size={16} /> 指令编辑器 · COMMAND MATRIX
        </HeaderTitle>
        <HeaderRight onClick={(e) => e.stopPropagation()}>
          {phase === 'paused' && (
            <span style={{ color: cyberTheme.colors.neonGold }}>
              <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: -2 }} /> 指令变更 · 下一回合生效
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
            清空
          </CyberButton>
          {editable && (
            <CyberButton
              size="sm"
              variant="secondary"
              onClick={() => {
                applyPlayerCommands()
                sfx.place()
              }}
            >
              应用
            </CyberButton>
          )}
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </HeaderRight>
      </Header>

      {!collapsed && (
        <Body>
          <Library>
            <SectionLabel>◢ 指令库 / LIBRARY</SectionLabel>
            {COMMAND_ORDER.map((key) => {
              const cmd = COMMANDS[key]
              const IconComp = (ICONS as unknown as Record<string, LucideIcon>)[cmd.icon]
              return (
                <LibraryItem
                  key={cmd.type}
                  $color={cmd.color}
                  $disabled={!editable}
                  aria-disabled={!editable}
                  onPointerDown={(e) => handleLibDragStart(e, cmd.type)}
                  whileHover={editable ? { x: 3 } : undefined}
                >
                  <LibIcon>{IconComp && <IconComp size={18} />}</LibIcon>
                  <LibText>
                    <span>{cmd.label}</span>
                    <span>{cmd.labelCn} · {cmd.description}</span>
                  </LibText>
                </LibraryItem>
              )
            })}
          </Library>

          <SlotsArea>
            <SlotsHeader>
              <SlotsTitle>◢ 序列槽位 / SEQUENCE SLOTS · {COMMAND_SLOTS} STEPS / TURN</SlotsTitle>
              <Tip>
                <AlertTriangle size={12} /> 从左侧拖拽指令 · 槽位可拖动重排序 · 悬停删除
              </Tip>
            </SlotsHeader>

            <SlotsRow layout>
              {playerCommands.map((cmd, idx) => {
                const cmdMeta = cmd ? COMMANDS[cmd] : null
                const IconComp = cmdMeta
                  ? ((ICONS as unknown as Record<string, LucideIcon>)[cmdMeta.icon] as LucideIcon)
                  : null
                const isActive = idx === activeIndex
                const isEmpty = !cmdMeta
                return (
                  <SlotWrapper key={idx} ref={slotRefs[idx] as unknown as React.RefObject<HTMLDivElement>}>
                    <Slot
                      layout
                      $active={isActive}
                      $isEmpty={isEmpty}
                      animate={isActive ? { scale: [1, 1.04, 1], transition: { duration: 0.45, repeat: Infinity, repeatType: 'mirror' as const, repeatDelay: 0.6 } } : {}}
                    >
                      <SlotIndex $active={isActive}>0{idx + 1}</SlotIndex>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {cmdMeta && IconComp ? (
                          <SlotContent
                            key={cmd + idx}
                            $color={cmdMeta.color}
                            layout
                            initial={{ opacity: 0, y: -8, scale: 0.85 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.7 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                            onPointerDown={(e) => handleSlotDragStart(e, idx)}
                          >
                            <IconComp size={22} />
                            <span>{cmdMeta.label}</span>
                            <SlotCommandLabel>{cmdMeta.labelCn}</SlotCommandLabel>
                          </SlotContent>
                        ) : (
                          <EmptyHint>
                            ◇ 空槽位<br />拖入指令
                          </EmptyHint>
                        )}
                      </AnimatePresence>
                      <DeleteBtn
                        onClick={(e) => {
                          e.stopPropagation()
                          sfx.click()
                          setPlayerCommand(idx, null)
                        }}
                        disabled={isEmpty || !editable}
                      >
                        <Trash2 size={12} />
                      </DeleteBtn>
                    </Slot>
                    {dragging && (
                      <DragPlaceholder
                        layoutId="placeholder"
                        style={{ position: 'absolute', inset: 0, opacity: 0 }}
                      />
                    )}
                  </SlotWrapper>
                )
              })}
            </SlotsRow>

            <InfoRow>
              <Tip>
                执行顺序：从左到右 · 每个槽位内按机器人<b style={{ color: cyberTheme.colors.neonCyan }}>速度值</b>排序行动
              </Tip>
              <div
                style={{
                  fontFamily: cyberTheme.fonts.display,
                  fontSize: 11,
