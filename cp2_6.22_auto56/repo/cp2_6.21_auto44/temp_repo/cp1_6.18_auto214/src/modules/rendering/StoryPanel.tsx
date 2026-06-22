import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { gameEngine } from '@/modules/game/GameEngine'
import { ConstellationTemplate } from '@/types'

export const StoryPanel: React.FC = () => {
  const activeConstellation = useGameStore(state => state.activeStoryConstellation)
  const stars = useGameStore(state => state.stars)
  const [isVisible, setIsVisible] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (activeConstellation) {
      setIsVisible(true)
      setCurrentY(0)
    } else {
      setIsVisible(false)
    }
  }, [activeConstellation])

  useEffect(() => {
    if (isVisible && canvasRef.current && activeConstellation) {
      drawConstellation(canvasRef.current, activeConstellation)
    }
  }, [isVisible, activeConstellation])

  const drawConstellation = (canvas: HTMLCanvasElement, constellation: ConstellationTemplate) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    ctx.clearRect(0, 0, width, height)

    const constellationStars = stars.filter(s => constellation.starIds.includes(s.id))

    const positions = constellationStars.map(star => {
      const x = centerX + star.originalPosition.x * 8
      const y = centerY - star.originalPosition.y * 8
      return { x, y }
    })

    ctx.strokeStyle = constellation.themeColor
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.globalAlpha = 0.6

    for (let i = 0; i < positions.length - 1; i++) {
      ctx.beginPath()
      ctx.moveTo(positions[i].x, positions[i].y)
      ctx.lineTo(positions[i + 1].x, positions[i + 1].y)
      ctx.stroke()
    }

    ctx.setLineDash([])
    ctx.globalAlpha = 1

    positions.forEach((pos, index) => {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8)
      gradient.addColorStop(0, constellation.themeColor)
      gradient.addColorStop(0.5, constellation.themeColor + '80')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.save()
    ctx.translate(centerX, centerY)
    const rotation = Date.now() * 0.001
    ctx.rotate(rotation)
    ctx.restore()
  }

  const handleClose = () => {
    gameEngine.closeStory()
  }

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setStartY(clientY)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!panelRef.current) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const diff = startY - clientY
    if (diff < 0) {
      setCurrentY(-diff)
    }
  }

  const handleTouchEnd = () => {
    if (currentY > 100) {
      handleClose()
    } else {
      setCurrentY(0)
    }
  }

  if (!activeConstellation) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <div
        ref={panelRef}
        className="pointer-events-auto w-full max-w-2xl mx-auto mb-8 p-8 rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
        style={{
          background: 'rgba(10, 10, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          transform: `translateY(${isVisible ? currentY : '100%'})`,
          transition: currentY === 0 ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          maxHeight: '70vh',
          overflow: 'hidden'
        }}
        onMouseDown={handleTouchStart}
        onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e)}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: activeConstellation.themeColor }}
            >
              {activeConstellation.name}
            </h2>
            <p className="text-gray-400 text-sm">已解锁</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-110"
            style={{ color: '#FFD700' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <p
              className="text-lg leading-relaxed"
              style={{ color: '#E0E0E0', lineHeight: 1.8 }}
            >
              {activeConstellation.story}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                width: 150,
                height: 150,
                background: 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${activeConstellation.themeColor}40`,
                animation: 'spin 20s linear infinite'
              }}
            >
              <canvas
                ref={canvasRef}
                width={150}
                height={150}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">向下滑动关闭</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
