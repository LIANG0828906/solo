import { useState, useEffect } from 'react'
import type { Pet } from '../types'

interface PetCardProps {
  pet?: Pet
  onSelect?: (pet: Pet) => void
  selected?: boolean
}

const petTypeLabels: Record<string, string> = {
  dog: '🐶 狗狗',
  cat: '🐱 猫咪',
  other: '🐹 其他'
}

const DEFAULT_PET_AVATAR =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23FAF3E9%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2260%22%20font-size%3D%2250%22%20text-anchor%3D%22middle%22%3E🐾%3C%2Ftext%3E%3C%2Fsvg%3E'

export default function PetCard({ pet, onSelect, selected }: PetCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (pet) {
      const timer = setTimeout(() => setIsLoading(false), 300 + Math.random() * 300)
      return () => clearTimeout(timer)
    }
  }, [pet])

  useEffect(() => {
    setAvatarLoaded(false)
    setImageError(false)
  }, [pet?.avatar])

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }

  const handleImageError = () => {
    setImageError(true)
    setAvatarLoaded(true)
  }

  const handleImageLoad = () => {
    setAvatarLoaded(true)
    setImageError(false)
  }

  if (isLoading || !pet) {
    return (
      <div className="pet-card" style={{ minHeight: '280px' }}>
        <div
          className="skeleton"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            marginBottom: '16px',
            border: '4px solid var(--color-cream)'
          }}
        />
        <div className="skeleton skeleton-line short" style={{ height: '22px', marginBottom: '8px', margin: '0 auto 8px' }} />
        <div className="skeleton skeleton-line" style={{ height: '16px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px', margin: '0 auto 12px' }} />
        <div className="skeleton skeleton-line" style={{ height: '14px', marginBottom: '8px' }} />
        <div className="skeleton skeleton-line medium" style={{ height: '14px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '10px', margin: 'auto' }} />
      </div>
    )
  }

  const avatarSrc = imageError ? DEFAULT_PET_AVATAR : pet.avatar

  return (
    <div
      className={`pet-card`}
      style={{
        border: selected ? '3px solid var(--color-green)' : 'none',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : undefined,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: isExpanded ? '500px' : '320px',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(pet)}
    >
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        {!avatarLoaded && (
          <div
            className="skeleton"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              border: '4px solid var(--color-cream)',
              zIndex: 1
            }}
          />
        )}
        <img
          src={avatarSrc}
          alt={pet.name}
          className="pet-avatar"
          style={{
            transform: isHovered ? 'scale(1.1)' : undefined,
            transition: 'transform 0.3s ease, opacity 0.4s ease',
            opacity: avatarLoaded ? 1 : 0,
            objectFit: imageError ? 'contain' : 'cover',
            background: imageError ? 'var(--color-cream)' : undefined
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {selected && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-green)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(124,179,66,0.4)',
            animation: 'fadeInUp 0.3s ease'
          }}>
            ✓
          </div>
        )}
      </div>

      <div className="pet-name" style={{
        animation: 'fadeInUp 0.4s ease 0.1s both'
      }}>
        {pet.name}
      </div>
      <div className="pet-info" style={{
        animation: 'fadeInUp 0.4s ease 0.2s both'
      }}>
        <strong style={{ color: 'var(--color-dark-brown)' }}>{pet.breed}</strong> · {pet.age}岁
      </div>
      <div className="pet-tags" style={{ justifyContent: 'center', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
        <span className={`pet-tag ${pet.type}`}>
          {petTypeLabels[pet.type]}
        </span>
      </div>

      <div style={{
        marginTop: '8px',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
        maxHeight: isExpanded ? '150px' : '40px',
        opacity: isExpanded ? 1 : 0.9,
        animation: 'fadeInUp 0.4s ease 0.4s both'
      }}>
        <p style={{
          color: 'var(--color-text-light)',
          fontSize: '13px',
          lineHeight: 1.6
        }}>
          {pet.description}
        </p>
        {isExpanded && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--color-bg)',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--color-text-light)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>🐾 宠物编号:</span>
              <span style={{ color: 'var(--color-dark-brown)', fontWeight: 600 }}>#{pet.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>👤 主人ID:</span>
              <span style={{ color: 'var(--color-dark-brown)', fontWeight: 600 }}>{pet.ownerId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🎂 年龄:</span>
              <span style={{ color: 'var(--color-dark-brown)', fontWeight: 600 }}>{pet.age}岁</span>
            </div>
          </div>
        )}
      </div>

      <div className="pet-card-actions" style={{
        animation: 'fadeInUp 0.4s ease 0.5s both'
      }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '12px' }}
          onClick={toggleExpand}
        >
          {isExpanded ? '收起 ▲' : '详情 ▼'}
        </button>
        <button
          className={`btn ${selected ? 'btn-primary' : 'btn-outline'}`}
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
