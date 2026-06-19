import { useState, useEffect, useRef, useCallback } from 'react'
import useUserStore from '../user/UserStore'
import { Pet } from '../../types'
import PetAvatar from '../../components/PetAvatar'

const GRID_COLS = 8
const GRID_ROWS = 6
const CELL_SIZE = 70

interface InteractionMenuProps {
  onClose: () => void
  onWave: () => void
  onDance: () => void
  onGift: () => void
}

function InteractionMenu({ onClose, onWave, onDance, onGift }: InteractionMenuProps) {
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
  const sendGift = useUserStore((s) => s.sendGift)
  const gifts = useUserStore((s) => s.gifts)
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
    const target = e.target as HTMLElement
    if (!target.closest('.my-pet-container')) return
    e.preventDefault()
    e.stopPropagation()
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
    const target = e.target as HTMLElement
    if (!target.closest('.my-pet-container')) return
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
    if (dragging) return
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

  const handleSendGift = (giftId: string) => {
    if (!showGiftSender) return
    sendGift(showGiftSender.id, giftId)
    setShowGiftSender(null)
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
          cursor: user?.pet ? (dragging ? 'grabbing' : 'grab') : 'default',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.15)',
          touchAction: 'none',
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
              pointerEvents: 'none',
            }}
          >{['🌼', '🌸', '🌺', '🌻', '🌷'][i]}</span>
        ))}

        {displayPets.map((pet) => {
          const pos = getPetPixelPosition(pet)
          const isMyPet = user?.pet?.id === pet.id
          const isAnimating = animatingEvents[pet.id]
          const isDraggingThis = dragging && isMyPet
          return (
            <div
              key={pet.id}
              className={isMyPet ? 'my-pet-container' : ''}
              onClick={(e) => handlePetClick(pet, e)}
              onMouseDown={isMyPet ? handleMouseDown : undefined}
              onTouchStart={isMyPet ? handleTouchStart : undefined}
              style={{
                position: 'absolute',
                left: isDraggingThis && dragPos ? dragPos.x : pos.x,
                top: isDraggingThis && dragPos ? dragPos.y : pos.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isDraggingThis ? 999 : Math.floor(pos.y),
                cursor: isMyPet ? (dragging ? 'grabbing' : 'grab') : 'pointer',
                transition: isDraggingThis ? 'none' : 'left 0.3s ease, top 0.3s ease',
                opacity: isDraggingThis ? 0.6 : 1,
                transitionProperty: 'opacity',
                transitionDuration: '0.15s',
              }}
            >
              {isDraggingThis && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 50,
                  height: 16,
                  background: 'rgba(0,0,0,0.4)',
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
                pointerEvents: 'none',
              }}>
                {pet.ownerName}
              </div>
              {selectedPet?.id === pet.id && (
                <InteractionMenu
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
            pointerEvents: 'none',
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
            pointerEvents: 'none',
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
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700 }}>🎁 送礼物给 {showGiftSender.ownerName} 的宠物</h4>
              <button
                onClick={() => setShowGiftSender(null)}
                style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {user?.inventory.length === 0 || (!user || user.inventory.filter(i => i.quantity > 0).length === 0) ? (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                  还没有礼物，去商店购买吧！
                </p>
              ) : (
                user?.inventory.map((item) => {
                  const gift = gifts.find((g) => g.id === item.giftId)
                  if (!gift || item.quantity <= 0) return null
                  return (
                    <button
                      key={item.giftId}
                      onClick={() => handleSendGift(item.giftId)}
                      className="btn-press"
                      style={{
                        position: 'relative',
                        padding: '12px 8px',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'var(--accent-orange)', color: 'white',
                        fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
                      }}>x{item.quantity}</span>
                      <span style={{ fontSize: 28 }}>{gift.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{gift.name}</span>
                    </button>
                  )
                })
              )}
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
                fontSize: 14,
                fontWeight: 600,
              }}
            >取消</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GardenMap
