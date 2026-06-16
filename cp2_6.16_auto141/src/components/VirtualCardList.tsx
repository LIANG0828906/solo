import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { Card as CardType } from '../types'
import Card from './Card'

interface VirtualCardListProps {
  cards: CardType[]
}

const CARD_HEIGHT = 140
const BUFFER = 5
const MAX_VISIBLE = 40

const VirtualCardList: React.FC<VirtualCardListProps> = ({ cards }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop)
  }, [])

  useEffect(() => {
    setScrollTop(0)
  }, [cards.length])

  const totalHeight = cards.length * CARD_HEIGHT
  const visibleCount = Math.min(MAX_VISIBLE, Math.ceil(400 / CARD_HEIGHT) + BUFFER * 2)
  const startIdx = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER)
  const endIdx = Math.min(cards.length, startIdx + visibleCount)
  const offsetY = startIdx * CARD_HEIGHT

  const visibleCards = cards.slice(startIdx, endIdx)

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ overflowY: 'auto', maxHeight: '60vh', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleCards.map((card, i) => (
            <Card key={card.id} card={card} index={startIdx + i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(VirtualCardList)
