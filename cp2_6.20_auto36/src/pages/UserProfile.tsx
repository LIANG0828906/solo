import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { TextSkeleton } from '../components/Skeleton'
import { useAuctionStore } from '../store/auctionStore'
import type { AuctionItem, Bid } from '../types'

type TabType = 'ongoing' | 'ended' | 'favorites'

interface Particle {
  id: number
  x: number
  y: number
}

const UserProfile = () => {
  const navigate = useNavigate()
  const { currentUser, auctions, favorites, toggleFavorite } = useAuctionStore()

  const [activeTab, setActiveTab] = useState<TabType>('ongoing')
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const [favoriteParticles, setFavoriteParticles] = useState<Record<string, Particle[]>>({})
  const particleIdRef = { current: 0 }

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const allItems: (AuctionItem & { auctionEndTime: Date; auctionStatus: string })[] = auctions.flatMap((auction) =>
    auction.items.map((item) => ({
      ...item,
      auctionEndTime: auction.endTime,
      auctionStatus: auction.status,
    }))
  )

  const myBidItems = allItems.filter((item) =>
    item.bids.some((bid) => bid.userId === currentUser.id)
  )

  const ongoingBids = myBidItems.filter(
    (item) => new Date(item.auctionEndTime).getTime() > Date.now()
  )

  const endedBids = myBidItems.filter(
    (item) => new Date(item.auctionEndTime).getTime() <= Date.now()
  )

  const favoriteItems = allItems.filter((item) => favorites.includes(item.id))

  const isHighestBidder = (item: AuctionItem) => {
    if (item.bids.length === 0) return false
    return item.bids[item.bids.length - 1].userId === currentUser.id
  }

  const myLastBid = (item: AuctionItem): Bid | undefined => {
    const userBidsOnItem = item.bids.filter((b) => b.userId === currentUser.id)
    return userBidsOnItem[userBidsOnItem.length - 1]
  }

  const tabs: { key: TabType; label: string; icon: string; count: number }[] = [
    { key: 'ongoing', label: '进行中', icon: '🔥', count: ongoingBids.length },
    { key: 'ended', label: '已结束', icon: '✅', count: endedBids.length },
    { key: 'favorites', label: '我的收藏', icon: '❤️', count: favoriteItems.length },
  ]

  const handleTabChange = (tab: TabType) => {
    const tabOrder: TabType[] = ['ongoing', 'ended', 'favorites']
    const oldIdx = tabOrder.indexOf(activeTab)
    const newIdx = tabOrder.indexOf(tab)
    setDirection(newIdx > oldIdx ? 1 : -1)
    setActiveTab(tab)
  }

  const handleFavoriteClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    toggleFavorite(itemId)

    if (favorites.includes(itemId)) {
      return
    }

    const newParticles: Particle[] = []
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80 - 30,
      })
    }
    setFavoriteParticles((prev) => ({ ...prev, [itemId]: newParticles }))

    setTimeout(() => {
      setFavoriteParticles((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    }, 900)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 30 : -30,
      opacity: 0,
    }),
  }

  const renderBidCard = (item: AuctionItem & { auctionEndTime: Date; auctionStatus: string }, isEnded: boolean) => {
    const myBid = myLastBid(item)
    const isWinning = isHighestBidder(item)

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={() => navigate(`/auction/${item.auctionId}`)}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            minHeight: '140px',
          }}
        >
          <div
            style={{
              width: '180px',
              minWidth: '180px',
              overflow: 'hidden',
              backgroundColor: '#e8e3de',
              position: 'relative',
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {!isEnded && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: isWinning ? 'rgba(39, 174, 96, 0.9)' : 'rgba(201, 169, 110, 0.9)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {isWinning ? '🏆 领先中' : '⏳ 竞拍中'}
              </div>
            )}
            {isEnded && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: isWinning ? 'rgba(201, 169, 110, 0.95)' : 'rgba(136, 136, 136, 0.9)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {isWinning ? '🎉 已中标' : '❌ 未中标'}
              </div>
            )}
          </div>

          <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2d4a3e',
                  margin: '0 0 8px 0',
                  lineHeight: 1.4,
                }}
              >
                {item.name}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#888',
                  margin: '0 0 12px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                }}
              >
                {item.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>我的出价</div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: myBid?.amount === item.currentPrice ? 'bold' : '600',
                      color: myBid?.amount === item.currentPrice ? '#c9a96e' : '#2d4a3e',
                    }}
                  >
                    {myBid ? `¥${myBid.amount.toLocaleString()}` : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>当前最高</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#c9a96e' }}>
                    ¥{item.currentPrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>出价人数</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2d4a3e' }}>
                    {item.bidCount}人
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#3d5a4e' }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/auction/${item.auctionId}`)
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#2d4a3e',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isEnded ? '查看详情' : '继续出价'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderFavoriteCard = (item: AuctionItem & { auctionEndTime: Date; auctionStatus: string }) => {
    const isFav = favorites.includes(item.id)
    const particles = favoriteParticles[item.id] || []
    const heights = ['200px', '240px', '280px', '220px', '260px', '300px']
    const randomHeight = heights[item.id.charCodeAt(item.id.length - 1) % heights.length]

    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4 }}
        className="masonry-item"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.2s ease',
        }}
        whileHover={{ y: -6, scale: 1.02 }}
        onClick={() => navigate(`/auction/${item.auctionId}`)}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: randomHeight,
            backgroundColor: '#e8e3de',
            overflow: 'hidden',
          }}
        >
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => handleFavoriteClick(e, item.id)}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 10,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            }}
          >
            <motion.span
              animate={{
                scale: isFav ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.35 }}
            >
              {isFav ? '❤️' : '🤍'}
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.2,
                  x: p.x,
                  y: p.y,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  right: '30px',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                {['💕', '💖', '💗', '💘'][p.id % 4]}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div style={{ padding: '14px 16px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#2d4a3e',
              margin: '0 0 6px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888' }}>当前价</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c9a96e' }}>
                ¥{item.currentPrice.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>出价</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d4a3e' }}>
                {item.bidCount}人
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderBidList = (items: (AuctionItem & { auctionEndTime: Date; auctionStatus: string })[], isEnded: boolean) => {
    if (items.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {isEnded ? '📦' : '🎯'}
          </div>
          <h3 style={{ fontSize: '20px', color: '#2d4a3e', margin: '0 0 8px 0' }}>
            {isEnded ? '暂无已结束的竞拍' : '暂无进行中的竞拍'}
          </h3>
          <p style={{ color: '#888', margin: '0 0 24px 0' }}>
            {isEnded ? '您参加的竞拍都还在进行中' : '去拍卖会发现心仪的拍品吧'}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              backgroundColor: '#c9a96e',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
            }}
          >
            去逛逛拍卖会
          </motion.button>
        </motion.div>
      )
    }

    return (
      <div className="single-column-layout">
        {items.map((item) => renderBidCard(item, isEnded))}
      </div>
    )
  }

  const renderFavorites = () => {
    if (favoriteItems.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💝</div>
          <h3 style={{ fontSize: '20px', color: '#2d4a3e', margin: '0 0 8px 0' }}>
            还没有收藏任何拍品
          </h3>
          <p style={{ color: '#888', margin: '0 0 24px 0' }}>
            在拍卖会中点击心形按钮收藏喜欢的拍品
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              backgroundColor: '#c9a96e',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
            }}
          >
            去发现好物
          </motion.button>
        </motion.div>
      )
    }

    return (
      <div className="masonry-container">
        {favoriteItems.map(renderFavoriteCard)}
      </div>
    )
  }

  const renderTabContent = () => {
    if (activeTab === 'ongoing') return renderBidList(ongoingBids, false)
    if (activeTab === 'ended') return renderBidList(endedBids, true)
    return renderFavorites()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <div style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px 40px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #c9a96e',
                backgroundColor: '#f5f0eb',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(201, 169, 110, 0.3)',
              }}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#c9a96e',
                    color: '#2d4a3e',
                    fontSize: '36px',
                    fontWeight: 'bold',
                  }}
                >
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </motion.div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#2d4a3e',
                  margin: '0 0 8px 0',
                }}
              >
                {currentUser.name}
              </h1>
              <p style={{ fontSize: '14px', color: '#888', margin: '0 0 12px 0' }}>
                ID: {currentUser.id} · 臻品阁尊贵会员
              </p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#c9a96e' }}>
                    {myBidItems.length}
                  </span>
                  <span style={{ fontSize: '13px', color: '#888', marginLeft: '6px' }}>参与竞拍</span>
                </div>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d4a3e' }}>
                    {favoriteItems.length}
                  </span>
                  <span style={{ fontSize: '13px', color: '#888', marginLeft: '6px' }}>收藏拍品</span>
                </div>
                <div>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#27ae60' }}>
                    {endedBids.filter((i) => isHighestBidder(i)).length}
                  </span>
                  <span style={{ fontSize: '13px', color: '#888', marginLeft: '6px' }}>成功中标</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.05, borderColor: '#c9a96e' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: '2px solid #e8e3de',
                  backgroundColor: '#fff',
                  color: '#2d4a3e',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                编辑资料
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#b9995e' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#c9a96e',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                去拍卖
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '8px',
              marginBottom: '32px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
              display: 'inline-flex',
              gap: '4px',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <motion.button
                  key={tab.key}
                  whileHover={!isActive ? { backgroundColor: '#f5f0eb' } : {}}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTabChange(tab.key)}
                  style={{
                    position: 'relative',
                    padding: '12px 28px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '15px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#2d4a3e' : '#888',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 1,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '14px',
                        backgroundColor: '#f5f0eb',
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <motion.span
                    key={tab.count}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      padding: '2px 10px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: isActive ? '#c9a96e' : '#e8e3de',
                      color: isActive ? '#fff' : '#888',
                    }}
                  >
                    {tab.count}
                  </motion.span>
                </motion.button>
              )
            })}
          </motion.div>

          {loading ? (
            <div className="single-column-layout">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    minHeight: '140px',
                  }}
                >
                  <div
                    style={{
                      width: '180px',
                      minWidth: '180px',
                      backgroundColor: '#e0dbd6',
                    }}
                  />
                  <div style={{ padding: '16px 20px', flex: 1 }}>
                    <TextSkeleton height={20} width="60%" style={{ marginBottom: '12px' }} />
                    <TextSkeleton count={2} style={{ marginBottom: '20px' }} />
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <TextSkeleton width={80} height={24} />
                      <TextSkeleton width={80} height={24} />
                      <TextSkeleton width={80} height={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.25 },
                }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
