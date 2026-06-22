import React from 'react'
import type { Rune, SlotType } from '../../types'
import { elementColors, slotNames } from '../../utils/gemUtils'
import { ElementIcon } from '../../components/ElementIcon'
import './RuneSlot.css'

interface RuneSlotProps {
  slotType: SlotType
  rune: Rune | null
  onDrop: (rune: Rune) => void
  onRemove: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const RuneSlot: React.FC<RuneSlotProps> = ({
  slotType,
  rune,
  onDrop,
  onRemove,
  position,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const runeData = e.dataTransfer.getData('rune')
      if (!runeData) return
      const droppedRune = JSON.parse(runeData) as Rune
      if (droppedRune.slotType === slotType) {
        onDrop(droppedRune)
      }
    } catch (err) {
      console.error('Drop error:', err)
    }
  }

  return (
    <div
      className={`rune-slot ${rune ? 'filled' : ''} position-${position || 'default'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => rune && onRemove()}
      style={{
        '--slot-color': rune ? elementColors[rune.element] : 'rgba(201, 163, 74, 0.5)',
      } as React.CSSProperties}
    >
      {rune ? (
        <div className="slot-rune">
          <ElementIcon element={rune.element} size={28} />
          <div className="slot-rune-name">{rune.name}</div>
        </div>
      ) : (
        <div className="slot-placeholder">
          <span className="slot-icon">
            {slotType === 'weapon' && '⚔️'}
            {slotType === 'offhand' && '🛡️'}
            {slotType === 'helmet' && '⛑️'}
            {slotType === 'chest' && '👕'}
            {slotType === 'bracers' && '🥊'}
            {slotType === 'ring' && '💍'}
          </span>
          <span className="slot-label">{slotNames[slotType]}</span>
        </div>
      )}
      {rune && (
        <div className="slot-tooltip">
          <div className="tooltip-name">{rune.name}</div>
          <div className="tooltip-rarity" style={{ color: elementColors[rune.element] }}>
            {'★'.repeat(rune.rarity)}
          </div>
          {rune.stats.attack && <div>攻击 +{rune.stats.attack}</div>}
          {rune.stats.defense && <div>防御 +{rune.stats.defense}</div>}
          {rune.stats.health && <div>生命 +{rune.stats.health}</div>}
          {rune.stats.critRate && <div>暴击 +{rune.stats.critRate}%</div>}
          {rune.stats.specialEffect && <div className="tooltip-effect">{rune.stats.specialEffect}</div>}
        </div>
      )}
    </div>
  )
}
