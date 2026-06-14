import { useState } from 'react'
import type { Pet } from '../types'

interface PetCardProps {
  pet: Pet
  onSelect?: (pet: Pet) => void
  selected?: boolean
}

const petTypeLabels: Record<string, string> = {
  dog: '🐶 狗狗',
  cat: '🐱 猫咪',
  other: '🐹 其他'
}

export default function PetCard({ pet, onSelect, selected }: PetCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`pet-card`}
      style={{
        border: selected ? '3px solid var(--color-green)' : 'none',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(pet)}
    >
      <img
        src={pet.avatar}
        alt={pet.name}
        className="pet-avatar"
        style={{
          transform: isHovered ? 'scale(1.1)' : undefined,
          transition: 'transform 0.3s ease'
        }}
      />
      <div className="pet-name">{pet.name}</div>
      <div className="pet-info">
        {pet.breed} · {pet.age}岁
      </div>
      <div className="pet-tags" style={{ justifyContent: 'center' }}>
        <span className={`pet-tag ${pet.type}`}>
          {petTypeLabels[pet.type]}
        </span>
      </div>
      <p style={{
        color: 'var(--color-text-light)',
        fontSize: '13px',
        marginTop: '8px',
        lineHeight: 1.6
      }}>
        {pet.description}
      </p>
      <div className="pet-card-actions">
        <button
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '13px' }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(pet)
          }}
        >
          {selected ? '✓ 已选择' : '选择寄养'}
        </button>
      </div>
    </div>
  )
}
