import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { DeviceKey } from '../store'
import { useLayoutStore } from '../store'
import { getContainerStyles } from '../layoutEngine'
import type { Card } from '../utils/randomCards'
import { DeviceFrame, DEVICE_SPECS, type DeviceType } from './DeviceFrame'
import { CardItem } from './CardItem'
import { ContextMenu, makeCardContextMenuItems, type ContextMenuItem } from './ContextMenu'

interface DragState {
  active: boolean
  device: DeviceKey | null
  fromIndex: number
  hoverIndex: number | null
  pointerX: number
  pointerY: number
  ghostEl: HTMLElement | null
}

const INITIAL_DRAG: DragState = {
  active: false,
  device: null,
  fromIndex: -1,
  hoverIndex: null,
  pointerX: 0,
  pointerY: 0,
  ghostEl: null,
}

export const PreviewArea = memo(function PreviewArea() {
  const breakpoints = useLayoutStore((s) => s.breakpoints)
  const grid = useLayoutStore((s) => s.grid)
  const flex = useLayoutStore((s) => s.flex)
  const cardsMap = useLayoutStore((s) => s.cards)
  const addCard = useLayoutStore((s) => s.addCard)
  const removeCard = useLayoutStore((s) => s.removeCard)
  const reorderCard = useLayoutStore((s) => s.reorderCard)
  const transitionKey = useLayoutStore((s) => s.presetTransitionKey)
  const setMobilePanelOpen = useLayoutStore((s) => s.setMobilePanelOpen)

  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const tabletScrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)

  const syncingRef = useRef(false)
  const lastTransitionKeyRef = useRef(transitionKey)

  const [drag, setDrag] = useState<DragState>(INITIAL_DRAG)
  const dragRef = useRef<DragState>(INITIAL_DRAG)
  const [removingIds, setRemovingIds] = useState<Record<DeviceKey, Set<string>>>({
    mobile: new Set(),
    tablet: new Set(),
    desktop: new Set(),
  })

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    items: ContextMenuItem[]
  } | null>(null)

  const [enterAnimation, setEnterAnimation] = useState(false)

  useEffect(() => {
    if (lastTransitionKeyRef.current !== transitionKey) {
      console.log('[PreviewArea] transitionKey changed:', lastTransitionKeyRef.current, '->', transitionKey, ', triggering enterAnimation')
      lastTransitionKeyRef.current = transitionKey
      setEnterAnimation(true)
      const t = window.setTimeout(() => {
        setEnterAnimation(false)
        console.log('[PreviewArea] enterAnimation ended')
      }, 250)
      return () => window.clearTimeout(t)
    }
  }, [transitionKey])

  useEffect(() => {
    if (typeof performance !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('[PreviewArea] rendered at', performance.now().toFixed(2), 'ms')
    }
  })

  const scrollRefByKey = (key: DeviceKey): React.RefObject<HTMLDivElement> => {
    switch (key) {
      case 'mobile':
        return mobileScrollRef
      case 'tablet':
        return tabletScrollRef
      case 'desktop':
        return desktopScrollRef
    }
  }

  const handleScroll = useCallback(
    (device: DeviceKey) => (e: React.UIEvent<HTMLDivElement>) => {
      if (syncingRef.current) {
        syncingRef.current = false
        return
      }
      const scrollTop = (e.target as HTMLDivElement).scrollTop
      console.log('[PreviewArea] handleScroll source:', device, 'scrollTop:', scrollTop)
      syncingRef.current = true
      const others = (['mobile', 'tablet', 'desktop'] as DeviceKey[]).filter(
        (k) => k !== device
      )
      for (const key of others) {
        const ref = scrollRefByKey(key)
        if (ref.current && ref.current.scrollTop !== scrollTop) {
          ref.current.scrollTop = scrollTop
          console.log('[PreviewArea] synced', key, 'to scrollTop:', scrollTop)
        }
      }
      window.setTimeout(() => {
        syncingRef.current = false
      }, 5)
    },
    []
  )

  const containerStyleFor = useCallback(
    (deviceWidth: number): React.CSSProperties => {
      return getContainerStyles({
        grid,
        flex,
        deviceWidth,
        breakpoints,
      })
    },
    [grid, flex, breakpoints]
  )

  const performRemoveCard = useCallback(
    (device: DeviceKey, id: string) => {
      setRemovingIds((prev) => {
        const next = { ...prev }
        const s = new Set(prev[device])
        s.add(id)
        next[device] = s
        return next
      })
      window.setTimeout(() => {
        removeCard(device, id)
        setRemovingIds((prev) => {
          const s = new Set(prev[device])
          s.delete(id)
          return { ...prev, [device]: s }
        })
      }, 200)
    },
    [removeCard]
  )

  const handleCardContextMenu = useCallback(
    (cardId: string, device: DeviceKey, e: React.MouseEvent) => {
      const items = makeCardContextMenuItems({
        onDelete: () => performRemoveCard(device, cardId),
        onReset: () => {
          useLayoutStore.getState().resetCards()
        },
      })
      setContextMenu({ x: e.clientX, y: e.clientY, items })
    },
    [performRemoveCard]
  )

  const handleLongPressTrigger = useCallback(
    (index: number, deviceKey: DeviceKey) => {
      // placeholder, the actual drag start happens in onDragStart
      void index
      void deviceKey
    },
    []
  )

  const handleDragStart = useCallback(
    (
      fromIndex: number,
      deviceKey: DeviceKey,
      _e: React.PointerEvent
    ) => {
      const list = cardsMap[deviceKey]
      if (!list[fromIndex]) return
      dragRef.current = {
        active: true,
        device: deviceKey,
        fromIndex,
        hoverIndex: fromIndex,
        pointerX: 0,
        pointerY: 0,
        ghostEl: null,
      }
      setDrag({ ...dragRef.current })
    },
    [cardsMap]
  )

  const handleDragMove = useCallback((x: number, y: number) => {
    if (!dragRef.current.active) return
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const cardEl = el?.closest('[data-card-index]') as HTMLElement | null
    const hoverDevice = (cardEl?.dataset.device as DeviceKey) || dragRef.current.device
    const hoverIdx = cardEl?.dataset.cardIndex
      ? Number(cardEl.dataset.cardIndex)
      : null

    dragRef.current = {
      ...dragRef.current,
      pointerX: x,
      pointerY: y,
      hoverIndex: hoverIdx,
      device: hoverDevice,
    }
    setDrag({ ...dragRef.current })
  }, [])

  const handleDragEnd = useCallback(() => {
    const state = dragRef.current
    if (state.active && state.device && state.hoverIndex != null) {
      const list = cardsMap[state.device]
      if (state.fromIndex !== state.hoverIndex && list?.length) {
        reorderCard(state.device, state.fromIndex, state.hoverIndex)
      }
    }
    dragRef.current = INITIAL_DRAG
    setDrag(INITIAL_DRAG)
  }, [cardsMap, reorderCard])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      handleDragMove(e.clientX, e.clientY)
    }
    const onUp = () => {
      if (dragRef.current.active) handleDragEnd()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [handleDragMove, handleDragEnd])

  const renderDeviceCards = (device: DeviceKey, deviceType: DeviceType) => {
    const list: Card[] = cardsMap[device] ?? []
    const width = DEVICE_SPECS[deviceType].width
    const style = containerStyleFor(width)
    const animClass = `preview-preset-switch${enterAnimation ? ' active' : ''}`

    const draggingThis = drag.active && drag.device === device

    return (
      <div
        className={`card-container ${animClass}`}
        style={style}
        key={transitionKey}
      >
        {list.map((card, i) => {
          let showDropBefore = false
          let showDropAfter = false
          if (draggingThis && drag.hoverIndex === i) {
            if (i < drag.fromIndex) showDropBefore = true
            else showDropAfter = true
          }

          const isDragging =
            draggingThis && drag.fromIndex === i

          return (
            <React.Fragment key={card.id}>
              {showDropBefore && <div className="drop-indicator" />}
              <CardItem
                card={card}
                index={i}
                deviceKey={device}
                isDragging={isDragging}
                isRemoving={removingIds[device].has(card.id)}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onContextMenu={handleCardContextMenu}
                onLongPressTrigger={handleLongPressTrigger}
                flexBasis={flex.basis}
              />
              {showDropAfter && <div className="drop-indicator" />}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  return (
    <div className="preview-area" onClick={() => setMobilePanelOpen(false)}>
      <div className="preview-section single">
        <DeviceFrame
          device="mobile"
          scrollRef={mobileScrollRef}
          onScroll={handleScroll('mobile')}
          onAddCard={() => addCard('mobile')}
        >
          {renderDeviceCards('mobile', 'mobile')}
        </DeviceFrame>
      </div>

      <div className="preview-section double">
        <div style={{ position: 'relative' }}>
          <DeviceFrame
            device="tablet"
            scrollRef={tabletScrollRef}
            onScroll={handleScroll('tablet')}
            onAddCard={() => addCard('tablet')}
          >
            {renderDeviceCards('tablet', 'tablet')}
          </DeviceFrame>
        </div>
        <div
          style={{
            width: 1,
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden
        >
          <div
            style={{
              width: 1,
              height: '90%',
              background: 'repeating-linear-gradient(to bottom, #E5E7EB 0 4px, transparent 4px 8px)',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <DeviceFrame
            device="desktop"
            scrollRef={desktopScrollRef}
            onScroll={handleScroll('desktop')}
            onAddCard={() => addCard('desktop')}
          >
            {renderDeviceCards('desktop', 'desktop')}
          </DeviceFrame>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
})
