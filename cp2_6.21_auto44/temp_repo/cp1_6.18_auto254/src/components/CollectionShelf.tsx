import React, { useState, useRef, useEffect } from 'react'
import { CraftedItem } from '../types'
import {
  QUALITY_COLORS,
  QUALITY_NAMES,
  ITEM_TYPE_NAMES,
  generateItemIconSVG,
  CollectionManager
} from '../Collection'
import { RUNE_DATA } from '../Rune'

interface CollectionShelfProps {
  items: CraftedItem[]
}

const CollectionShelf: React.FC<CollectionShelfProps> = ({ items }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const collectionManager = new CollectionManager()
  collectionManager.setItems(items)

  const visibleCount = 6
  const needsVirtualScroll = items.length > 12

  const visibleItems = needsVirtualScroll
    ? items.slice(scrollOffset, scrollOffset + visibleCount)
    : items.slice(0, Math.min(items.length, 12))

  const maxScroll = Math.max(0, items.length - visibleCount)

  const handleWheel = (e: React.WheelEvent) => {
    if (!needsVirtualScroll) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 : -1
    setScrollOffset((prev) => Math.max(0, Math.min(maxScroll, prev + delta)))
  }

  const getItemStats = (item: CraftedItem): string[] => {
    const stats: string[] = []
    if (item.attack !== undefined) stats.push(`攻击: ${item.attack}`)
    if (item.defense !== undefined) stats.push(`防御: ${item.defense}`)
    if (item.elementDamage !== undefined) stats.push(`元素伤害: ${item.elementDamage}`)
    if (item.elementResistance !== undefined) stats.push(`元素抗性: ${item.elementResistance}`)
    if (item.cooldownReduction !== undefined) stats.push(`冷却缩减: ${item.cooldownReduction}%`)
    return stats
  }

  return (
    <div
      className="collection-shelf"
      style={{
        position: 'absolute',
        left: '20px',
        top: '80px',
        width: '240px',
        zIndex: 10
      }}
    >
      <h3
        style={{
          color: '#FFB300',
          fontSize: '16px',
          marginBottom: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          letterSpacing: '1px'
        }}
      >
        收藏架 ({items.length})
      </h3>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          padding: '10px',
          background: 'rgba(30, 30, 30, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: needsVirtualScroll ? '480px' : 'none',
          overflowY: needsVirtualScroll ? 'hidden' : 'visible'
        }}
      >
        {visibleItems.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '30px 10px',
              color: '#666',
              fontSize: '12px'
            }}
          >
            还没有藏品
            <br />
            开始锻造吧！
          </div>
        ) : (
          visibleItems.map((item) => {
            const elementColor = RUNE_DATA[item.primaryElement]?.color || '#FFF'
            const qualityColor = QUALITY_COLORS[item.quality]
            const isHovered = hoveredItem === item.id

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: '100px',
                  height: '140px',
                  borderRadius: '8px',
                  background: '#2C2C2C',
                  border: `1px solid ${isHovered ? elementColor : '#5D5D5D'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? `0 4px 20px ${elementColor}40`
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: qualityColor
                  }}
                />

                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    marginTop: '10px',
                    marginBottom: '6px'
                  }}
                  dangerouslySetInnerHTML={{ __html: generateItemIconSVG(item) }}
                />

                <div
                  style={{
                    fontSize: '11px',
                    color: qualityColor,
                    fontWeight: 'bold',
                    marginBottom: '2px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: '#888',
                    marginBottom: '4px'
                  }}
                >
                  {QUALITY_NAMES[item.quality]}
                </div>

                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.95)',
                      border: `1px solid ${qualityColor}`,
                      borderRadius: '6px',
                      padding: '8px',
                      width: '140px',
                      zIndex: 100,
                      pointerEvents: 'none',
                      fontSize: '11px',
                      color: '#ddd'
                    }}
                  >
                    <div
                      style={{
                        color: qualityColor,
                        fontWeight: 'bold',
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      类型: {ITEM_TYPE_NAMES[item.type]}
                    </div>
                    {getItemStats(item).map((stat, i) => (
                      <div key={i} style={{ color: '#aaa' }}>
                        {stat}
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '10px',
                        color: '#666',
                        textAlign: 'center'
                      }}
                    >
                      {item.temperature}°C
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {needsVirtualScroll && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => setScrollOffset((p) => Math.max(0, p - 1))}
            disabled={scrollOffset === 0}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: '1px solid #555',
              background: scrollOffset === 0 ? '#333' : '#444',
              color: scrollOffset === 0 ? '#666' : '#fff',
              cursor: scrollOffset === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↑
          </button>
          <span style={{ color: '#888', fontSize: '12px' }}>
            {scrollOffset + 1}-{Math.min(scrollOffset + visibleCount, items.length)} / {items.length}
          </span>
          <button
            onClick={() => setScrollOffset((p) => Math.min(maxScroll, p + 1))}
            disabled={scrollOffset >= maxScroll}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: '1px solid #555',
              background: scrollOffset >= maxScroll ? '#333' : '#444',
              color: scrollOffset >= maxScroll ? '#666' : '#fff',
              cursor: scrollOffset >= maxScroll ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ↓
          </button>
        </div>
      )}
    </div>
  )
}

export default CollectionShelf
