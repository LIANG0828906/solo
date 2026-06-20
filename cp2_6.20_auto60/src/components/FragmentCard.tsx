import React from 'react'
import type { Fragment } from '../types'
import { ElementIcon } from './ElementIcon'
import { elementColors, rarityStars } from '../utils/gemUtils'

interface FragmentCardProps {
  fragment: Fragment
  onClick?: () => void
  onDragStart?: (e: React.DragEvent, fragment: Fragment) => void
  draggable?: boolean
}

export const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  onClick,
  onDragStart,
  draggable = true,
}) => {
  const color = elementColors[fragment.element]

  return (
    <div
      className="fragment-card"
      onClick={onClick}
      draggable={draggable && fragment.count > 0}
      onDragStart={(e) => onDragStart?.(e, fragment)}
      style={{
        '--element-color': color,
      } as React.CSSProperties}
    >
      <div className="fragment-card-inner">
        <div className="fragment-icon-container">
          <ElementIcon element={fragment.element} size={40} />
        </div>
        <div className="fragment-name">{fragment.name}</div>
        <div className="fragment-rarity" style={{ color }}>
          {rarityStars(fragment.rarity)}
        </div>
        <div className="fragment-stats">
          {fragment.baseStats.attack && <span>攻击 +{fragment.baseStats.attack}</span>}
          {fragment.baseStats.defense && <span>防御 +{fragment.baseStats.defense}</span>}
          {fragment.baseStats.health && <span>生命 +{fragment.baseStats.health}</span>}
          {fragment.baseStats.critRate && <span>暴击 +{fragment.baseStats.critRate}%</span>}
        </div>
        <div className="fragment-count">
          数量: <span className="count-number">{fragment.count}</span>
        </div>
      </div>
    </div>
  )
}
