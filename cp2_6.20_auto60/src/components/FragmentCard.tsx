import React from 'react'
import type { Fragment, Rarity } from '../types'
import { ElementIcon } from './ElementIcon'
import { elementColors } from '../utils/gemUtils'

interface FragmentCardProps {
  fragment: Fragment
  onClick?: () => void
  onDragStart?: (e: React.DragEvent, fragment: Fragment) => void
  draggable?: boolean
}

const SolidStar: React.FC<{ filled: boolean; color: string }> = ({ filled, color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"
      fill={filled ? color : 'rgba(255,255,255,0.15)'}
      stroke={filled ? color : 'rgba(255,255,255,0.2)'}
      strokeWidth="0.5"
    />
  </svg>
)

const RarityStars: React.FC<{ rarity: Rarity; color: string }> = ({ rarity, color }) => (
  <span style={{ display: 'inline-flex', gap: '1px', alignItems: 'center' }}>
    {Array.from({ length: 5 }, (_, i) => (
      <SolidStar key={i} filled={i < rarity} color={color} />
    ))}
  </span>
)

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
        <div className="fragment-rarity">
          <RarityStars rarity={fragment.rarity} color={color} />
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
