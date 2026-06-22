import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CountdownTimer from '../components/CountdownTimer'
import { CardSkeleton, TextSkeleton } from '../components/Skeleton'
import { useAuctionStore } from '../store/auctionStore'
import type { Auction } from '../types'

interface AnimatedNumberProps {
  value: number
  color: string
}

const AnimatedNumber = ({ value, color }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsAnimating(false)
      }, 200)
      prevValueRef.current = value
      return () => clearTimeout(timer)
    }
  }, [value])

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={displayValue}
          initial={{ y: 20, opacity: 0, filter: 'blur(2px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -20, opacity: 0, filter: 'blur(2px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color,
            lineHeight: '36px',
          }}
        >
          {displayValue}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const AuctionList = () => {
  const navigate = useNavigate()
  const { auctions, fetchAuctions } = useAuctionStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuctions()
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [fetchAuctions])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const renderAuctionCard = (auction: Auction) => (
    <motion.div
      key={auction.id}
      variants={item}
      whileHover={{
        y: -4,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.14)',
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/auction/${auction.id}`)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56%',
          overflow: 'hidden',
          backgroundColor: '#e8e3de',
        }}
      >
        <img
          src={`https://picsum.photos/seed/auction-${auction.id}/800/450`}
          alt={auction.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor:
              auction.status === 'ongoing'
                ? 'rgba(45, 74, 62, 0.9)'
                : auction.status === 'upcoming'
                ? 'rgba(201, 169, 110, 0.9)'
                : 'rgba(136, 136, 136, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
          }}
        >
          {auction.status === 'ongoing' ? '🔥 进行中' : auction.status === 'upcoming' ? '⏰ 即将开始' : '✅ 已结束'}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#2d4a3e',
            margin: '0 0 12px 0',
            lineHeight: 1.3,
          }}
        >
          {auction.name}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#888',
            margin: '0 0 20px 0',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {auction.description}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderTop: '1px solid #f0ebe6',
            marginBottom: '20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <AnimatedNumber value={auction.itemCount} color="#c9a96e" />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>拍品数量</div>
          </div>
          <div style={{ width: '1px', height: '40px', backgroundColor: '#f0ebe6' }} />
          <div style={{ textAlign: 'center' }}>
            <AnimatedNumber value={auction.items.reduce((sum, item) => sum + item.bidCount, 0)} color="#2d4a3e" />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>出价次数</div>
          </div>
          <div style={{ width: '1px', height: '40px', backgroundColor: '#f0ebe6' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c9a96e' }}>
              ¥{auction.items.reduce((sum, item) => sum + item.currentPrice, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>总价值</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CountdownTimer endTime={new Date(auction.endTime)} />
        </div>
      </div>
    </motion.div>
  )

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56%',
              backgroundColor: '#e0dbd6',
            }}
          />
          <div style={{ padding: '24px' }}>
            <TextSkeleton height={24} width="70%" style={{ marginBottom: '12px' }} />
            <div style={{ marginBottom: '20px' }}>
              <TextSkeleton height={16} count={2} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid #f0ebe6',
                marginBottom: '20px',
              }}
            >
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ textAlign: 'center' }}>
                  <TextSkeleton height={28} width={60} />
                  <div style={{ height: '16px' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CardSkeleton />
            </div>
          </div>
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <div style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              textAlign: 'center',
              marginBottom: '60px',
            }}
          >
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#2d4a3e',
                margin: '0 0 16px 0',
                letterSpacing: '2px',
              }}
            >
              臻品阁 <span style={{ color: '#c9a96e' }}>拍卖行</span>
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#888',
                margin: 0,
              }}
            >
              发现稀世珍藏，参与实时竞拍，尽在臻品阁
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '32px',
            }}
            className={loading ? '' : ''}
          >
            {loading ? (
              renderSkeletons()
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                style={{
                  display: 'contents',
                }}
              >
                {auctions.map(renderAuctionCard)}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionList
