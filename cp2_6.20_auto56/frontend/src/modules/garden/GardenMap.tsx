import { useState, useEffect, useRef, useCallback } from 'react'
import useUserStore from '../user/UserStore'
import { Pet } from '../../types'
import PetAvatar from '../../components/PetAvatar'

const GRID_COLS = 8
const GRID_ROWS = 6
const CELL_SIZE = 70

interface InteractionMenuProps {
  pet: Pet
  onClose: () => void
  onWave: () => void
  onDance: () => void
  onGift: () => void
}

function InteractionMenu({ pet, onClose, onWave, onDance, onGift }: InteractionMenuProps) {
  return (
    <div style={{
      position: 'absolute',
      top: -80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      borderRadius: 12,
      padding: 8,
      display: 'flex',
      gap: 6,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 50,
      animation: 'fade-drop 0.2s ease-out',
    }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onWave}
        className="btn-press"
        style={{
          padding: '8px 10px',
          border: 'none',
          borderRadius: 8,
          background: '#fff3e0',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >👋</button>
      <button
        onClick={onDance}
        className="btn-press"
        style={{
          padding: '8px 10px',
          border: 'none',
          borderRadius: 8,
          background: '#fce4ec',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >💃</button>
      <button
        onClick={onGift}
        className="btn-press"
        style={{
          padding: '8px 10px',
          border: 'none',
          borderRadius: 8,
          background: '#e3f2fd',
          cursor: 'pointer',
          fontSize: 16,
        }}
      >🎁</button>
      <button
        onClick={onClose}
        className="btn-press"
        style={{
          padding: '8px 10px',
          border: 'none',
          borderRadius: 8,
          background: '#f5f5f5',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >✕</button>
    </div>
  )
}

function GardenMap() {
  const user = useUserStore((s) => s.user)
  const gardenPets = useUserStore((s) => s.gardenPets)
  const gardenEvents = useUserStore((s) => s.gardenEvents)
  const movePet = useUserStore((s) => s.movePet)
  const sendGardenEvent = useUserStore((s) => s.sendGardenEvent)
  const socket = useUserStore((s) => s.socket)

  const [isMobile, setIsMobile] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [showGiftSender, setShowGiftSender] = useState<Pet | null>(null)
  const [animatingEvents, setAnimatingEvents] = useState<Record<string, string>>({})
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (socket && user?.pet) {
      socket.emit('join_garden', { petId: user.pet.id })
      return () => {
        socket.emit('leave_garden', { petId: user.pet!.id })
      }
    }
  }, [socket, user?.pet])

  useEffect(() => {
    const newAnimations: Record<string, string> = {}
    gardenEvents.forEach((e) => {
      if (e.type === 'wave') newAnimations[e.fromPetId] = 'wave'
      if (e.type === 'dance') newAnimations[e.fromPetId] = 'dance'
    })
    setAnimatingEvents(newAnimations)
  }, [gardenEvents])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!user?.pet) return
    e.preventDefault()
    setDragging(true)
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      setDragPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }, [user?.pet])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    if (!dragging || !dragPos || !user?.pet) {
      setDragging(false)
      setDragPos(null)
      return
    }
    const cellX = Math.round(dragPos.x / CELL_SIZE - 0.5)
    const cellY = Math.round(dragPos.y / (CELL_SIZE * (isMobile ? 1 : 0.6)) - 0.5)
    const clampedX = Math.max(0, Math.min(GRID_COLS - 1, cellX))
    const clampedY = Math.max(0, Math.min(GRID_ROWS - 1, cellY))
    movePet(clampedX, clampedY)
    setDragging(false)
    setDragPos(null)
  }, [dragging, dragPos, user?.pet, isMobile, movePet])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!user?.pet) return
    const touch = e.touches[0]
    setDragging(true)
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      setDragPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    }
  }, [user?.pet])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || !mapRef.current) return
    const touch = e.touches[0]
    const rect = mapRef.current.getBoundingClientRect()
    setDragPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    })
  }, [dragging])

  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  const getPetPixelPosition = (pet: Pet) => {
    if (isMobile) {
      return {
        x: pet.position.x * CELL_SIZE + CELL_SIZE / 2,
        y: pet.position.y * CELL_SIZE + CELL_SIZE / 2,
      }
    }
    return {
      x: pet.position.x * CELL_SIZE + CELL_SIZE / 2,
      y: pet.position.y * CELL_SIZE * 0.6 + CELL_SIZE / 2,
    }
  }

  const allPets: Pet[] = [...gardenPets]
  if (user?.pet) {
    const idx = allPets.findIndex((p) => p.id === user.pet!.id)
    if (idx === -1) allPets.push(user.pet)
    else allPets[idx] = user.pet
  }

  const displayPets = allPets.slice(0, 50)
  const simplifiedCount = allPets.length - 50

  const handlePetClick = (pet: Pet, e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.pet && pet.id !== user.pet.id) {
      setSelectedPet(pet)
    }
  }

  const handleWave = () => {
    if (!user?.pet || !selectedPet) return
    sendGardenEvent({ type: 'wave', fromPetId: user.pet.id, toPetId: selectedPet.id })
    setSelectedPet(null)
  }

  const handleDance = () => {
    if (!user?.pet || !selectedPet) return
    sendGardenEvent({ type: 'dance', fromPetId: user.pet.id, toPetId: selectedPet.id })
    setSelectedPet(null)
  }

  const handleGiftClick = () => {
    if (selectedPet) {
      setShowGiftSender(selectedPet)
      setSelectedPet(null)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>🌳 共享花园</h3>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          在线: {allPets.length} 只宠物
        </span>
      </div>

      <div
        ref={mapRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setSelectedPet(null)}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: GRID_COLS * CELL_SIZE,
          height: isMobile ? GRID_ROWS * CELL_SIZE : GRID_ROWS * CELL_SIZE * 0.6 + CELL_SIZE * 0.4,
          margin: '0 auto',
          background: isMobile
            ? 'linear-gradient(135deg, #7ec4a0, #5aa87e)'
            : 'linear-gradient(135deg, #7ec4a0 0%, #5aa87e 50%, #4a946e 100%)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          cursor: user?.pet ? 'grab' : 'default',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {[...Array(GRID_ROWS)].map((_, row) =>
          [...Array(GRID_COLS)].map((_, col) => {
            const isDark = (row + col) % 2 === 0
            if (isMobile) {
              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    position: 'absolute',
                    left: col * CELL_SIZE,
                    top: row * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: isDark ? 'rgba(0,0,0,0.05)' : 'transparent',
                  }}
                />
              )
            }
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE * 0.6,
                  width: CELL_SIZE,
                  height: CELL_SIZE * 0.6,
                  background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)',
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
            )
          })
        )}

        {!isMobile && [...Array(5)].map((_, i) => (
          <span
            key={`flower-${i}`}
            style={{
              position: 'absolute',
              fontSize: 16,
              left: `${[10, 35, 55, 75, 90][i]}%`,
              top: `${[20, 60, 30, 70, 45][i]}%`,
              opacity: 0.7,
            }}
          >{['🌼', '🌸', '🌺', '🌻', '🌷'][i]}</span>
        ))}

        {displayPets.map((pet) => {
          const pos = getPetPixelPosition(pet)
          const isMyPet = user?.pet?.id === pet.id
          const isAnimating = animatingEvents[pet.id]
          return (
            <div
              key={pet.id}
              onClick={(e) => handlePetClick(pet, e)}
              onMouseDown={isMyPet ? handleMouseDown : undefined}
              onTouchStart={isMyPet ? handleTouchStart : undefined}
              style={{
                position: 'absolute',
                left: dragging && isMyPet && dragPos ? dragPos.x : pos.x,
                top: dragging && isMyPet && dragPos ? dragPos.y : pos.y,
                transform: 'translate(-50%, -50%)',
                zIndex: Math.floor(pos.y),
                cursor: isMyPet ? (dragging ? 'grabbing' : 'grab') : 'pointer',
                transition: dragging && isMyPet ? 'none' : 'left 0.3s ease, top 0.3s ease',
              }}
            >
              {dragging && isMyPet && (
                <div style={{
                  position: 'absolute',
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 50,
                  height: 16,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '50%',
                  filter: 'blur(4px)',
                }} />
              )}
              <div style={{
                position: 'relative',
                animation: isAnimating === 'dance' ? 'jump-spin 1s ease-in-out infinite' : undefined,
              }}>
                <PetAvatar pet={pet} size={isMyPet ? 56 : 48} showEffects={false} />
                {isAnimating === 'wave' && (
                  <span style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    fontSize: 20,
                    animation: 'jump-spin 0.5s ease-in-out',
                  }}>👋</span>
                )}
              </div>
              <div style={{
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: isMyPet ? 'var(--accent-orange)' : 'rgba(255,255,255,0.95)',
                color: isMyPet ? 'white' : 'var(--text-primary)',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>
                {pet.ownerName}
              </div>
              {selectedPet?.id === pet.id && (
                <InteractionMenu
                  pet={pet}
                  onClose={() => setSelectedPet(null)}
                  onWave={handleWave}
                  onDance={handleDance}
                  onGift={handleGiftClick}
                />
              )}
            </div>
          )
        })}

        {simplifiedCount > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 10px',
            borderRadius: 10,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}>
            还有 {simplifiedCount} 只宠物...
          </div>
        )}

        {!isMobile && user?.pet && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 10px',
            borderRadius: 10,
            fontSize: 10,
            color: 'var(--text-secondary)',
          }}>
            💡 拖动你的宠物移动位置
          </div>
        )}
      </div>

      {showGiftSender && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowGiftSender(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: 350,
          }}>
            <h4 style={{ marginBottom: 12 }}>选择礼物送给 {showGiftSender.ownerName} 的宠物</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {user?.inventory.map((item) => {
                const gift = useUserStore.getState().gifts.find((g) => g.id === item.giftId)
                if (!gift || item.quantity <= 0) return null
                return (
                  <button
                    key={item.giftId}
                    onClick={() => {
                      useUserStore.getState().sendGift(showGiftSender.id, item.giftId)
                      setShowGiftSender(null)
                    }}
                    className="btn-press"
                    style={{
                      padding: '10px 14px',
                      border: 'none',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: 70,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{gift.icon}</span>
                    <span style={{ fontSize: 10 }}>{gift.name}</span>
                    <span style={{ fontSize: 9, color: 'var(--accent-orange)' }}>x{item.quantity}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowGiftSender(null)}
              style={{
                width: '100%',
                padding: 10,
                border: 'none',
                borderRadius: 8,
                background: '#f5f5f5',
                cursor: 'pointer',
              }}
            >取消</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GardenMap
