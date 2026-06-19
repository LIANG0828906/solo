import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuctionStore } from '../store/auctionStore'
import type { AuctionItem } from '../types'

interface ItemCardProps {
  item: AuctionItem
  onSelect?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
}

const ItemCard = ({ item, onSelect }: ItemCardProps) => {
  const navigate = useNavigate()
  const { favorites, toggleFavorite } = useAuctionStore()
  const isFavorite = favorites.includes(item.id)
  const [particles, setParticles] = useState<Particle[]>([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const particleIdRef = useRef(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleCardClick = () => {
    if (onSelect) {
      onSelect()
    } else {
      navigate(`/auction/${item.auctionId}`)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(item.id)

    if (!isFavorite) {
      const newParticles: Particle[] = []
      for (let i = 0; i < 6; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60 - 20,
        })
      }
      setParticles(newParticles)

      setTimeout(() => {
        setParticles([])
      }, 800)
    }
  }

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05, boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)' }}
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%',
          overflow: 'hidden',
          backgroundColor: '#f0ebe6',
        }}
      >
        {isVisible && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            src={item.image}
            alt={item.name}
            onLoad={() => setImageLoaded(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {!imageLoaded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#e8e3de',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #ddd',
                borderTopColor: '#c9a96e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <motion.span
            animate={{
              scale: isFavorite ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            style={{
              color: isFavorite ? '#e74c3c' : '#999',
            }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: particle.x,
                y: particle.y,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                fontSize: '14px',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              💕
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: '16px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#2d4a3e',
            margin: '0 0 8px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              当前价格
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#c9a96e',
              }}
            >
              ¥{item.currentPrice.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              出价人数
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2d4a3e',
              }}
            >
              {item.bidCount}人
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ItemCard
