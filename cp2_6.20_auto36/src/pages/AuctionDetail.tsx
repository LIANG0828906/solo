import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import BidHistory from '../components/BidHistory'
import CountdownTimer from '../components/CountdownTimer'
import ImageModal from '../components/ImageModal'
import { CardSkeleton, TextSkeleton } from '../components/Skeleton'
import { useAuctionStore } from '../store/auctionStore'
import type { AuctionItem } from '../types'

type ViewMode = 'list' | 'detail'

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentAuction, fetchAuctionDetail, fetchItemDetail, placeBid } = useAuctionStore()

  const [loading, setLoading] = useState(true)
  const [itemLoading, setItemLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState(false)
  const [showRocket, setShowRocket] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      setTimeout(() => {
        fetchAuctionDetail(id)
        setLoading(false)
      }, 600)
    }
  }, [id, fetchAuctionDetail])

  const handleSelectItem = (item: AuctionItem) => {
    setItemLoading(true)
    setViewMode('detail')
    setTimeout(() => {
      fetchItemDetail(id!, item.id)
      setSelectedItem(item)
      setBidAmount('')
      setBidError('')
      setBidSuccess(false)
      setItemLoading(false)
    }, 400)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setBidAmount('')
    setBidError('')
    setBidSuccess(false)
  }

  const minBidAmount = useMemo(() => {
    if (!selectedItem) return 0
    return selectedItem.currentPrice + Math.ceil(selectedItem.currentPrice * 0.01)
  }, [selectedItem])

  const handleBid = () => {
    if (!selectedItem || !id) return

    const amount = parseInt(bidAmount, 10)
    if (isNaN(amount) || amount <= selectedItem.currentPrice) {
      setBidError('出价不足')
      return
    }

    setBidError('')
    const success = placeBid(id, selectedItem.id, amount)
    if (success) {
      setBidSuccess(true)
      setShowRocket(true)
      setTimeout(() => setBidSuccess(false), 1000)
      setTimeout(() => setShowRocket(false), 1000)
      setBidAmount('')
    }
  }

  const quickBidOptions = useMemo(() => {
    if (!selectedItem) return []
    const base = selectedItem.currentPrice
    return [
      Math.ceil(base * 1.02),
      Math.ceil(base * 1.05),
      Math.ceil(base * 1.1),
    ]
  }, [selectedItem])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb' }}>
      <Navbar />

      <div style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#2d4a3e',
              marginBottom: '24px',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            ← 返回拍卖会列表
          </motion.button>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              <CardSkeleton />
            </div>
          ) : currentAuction ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '32px 40px',
                  marginBottom: '32px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '24px',
                }}
              >
                <div style={{ flex: '1 1 400px' }}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(201, 169, 110, 0.15)',
                        color: '#c9a96e',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '12px',
                      }}
                    >
                      {currentAuction.status === 'ongoing' ? '🔥 拍卖会进行中' : currentAuction.status === 'upcoming' ? '⏰ 即将开始' : '✅ 已结束'}
                    </div>
                    <h1
                      style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#2d4a3e',
                        margin: '0 0 12px 0',
                        lineHeight: 1.2,
                      }}
                    >
                      {currentAuction.name}
                    </h1>
                    <p style={{ fontSize: '15px', color: '#888', margin: '0 0 20px 0', lineHeight: 1.7 }}>
                      {currentAuction.description}
                    </p>
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>拍品总数</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#c9a96e' }}>
                          {currentAuction.itemCount} 件
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>出价总数</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d4a3e' }}>
                          {currentAuction.items.reduce((s, i) => s + i.bidCount, 0)} 次
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <CountdownTimer endTime={new Date(currentAuction.endTime)} />
                </motion.div>
              </motion.div>

              <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#2d4a3e',
                        margin: '0 0 24px 0',
                      }}
                    >
                      🎨 全部拍品
                    </h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px',
                      }}
                    >
                      {currentAuction.items.map((item) => (
                        <ItemCard key={item.id} item={item} onSelect={() => handleSelectItem(item)} />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.button
                      whileHover={{ x: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleBackToList}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#2d4a3e',
                        marginBottom: '24px',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      ← 返回拍品列表
                    </motion.button>

                    {itemLoading || !selectedItem ? (
                      <div className="two-column-layout">
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '20px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              paddingTop: '75%',
                              backgroundColor: '#e0dbd6',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '20px',
                            padding: '32px',
                          }}
                        >
                          <TextSkeleton height={28} width="80%" style={{ marginBottom: '16px' }} />
                          <TextSkeleton count={3} style={{ marginBottom: '24px' }} />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '16px 0',
                              borderTop: '1px solid #f0ebe6',
                              borderBottom: '1px solid #f0ebe6',
                              marginBottom: '24px',
                            }}
                          >
                            <TextSkeleton width={100} height={32} />
                            <TextSkeleton width={100} height={32} />
                          </div>
                          <TextSkeleton height={20} width="50%" style={{ marginBottom: '12px' }} />
                          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="two-column-layout">
                        <div>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                              cursor: 'zoom-in',
                            }}
                            onClick={() => setImageModalOpen(true)}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '75%',
                                backgroundColor: '#e8e3de',
                              }}
                            >
                              <img
                                src={selectedItem.image}
                                alt={selectedItem.name}
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
                                  bottom: '16px',
                                  right: '16px',
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  color: '#fff',
                                  fontSize: '12px',
                                  backdropFilter: 'blur(8px)',
                                }}
                              >
                                🔍 点击放大查看
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                          }}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '20px',
                              padding: '32px',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            }}
                          >
                            <h2
                              style={{
                                fontSize: '26px',
                                fontWeight: '800',
                                color: '#2d4a3e',
                                margin: '0 0 12px 0',
                                lineHeight: 1.3,
                              }}
                            >
                              {selectedItem.name}
                            </h2>
                            <p
                              style={{
                                fontSize: '15px',
                                color: '#888',
                                margin: '0 0 24px 0',
                                lineHeight: 1.7,
                              }}
                            >
                              {selectedItem.description}
                            </p>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                padding: '20px 0',
                                borderTop: '1px solid #f0ebe6',
                                borderBottom: '1px solid #f0ebe6',
                                marginBottom: '24px',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>起拍价</div>
                                <div style={{ fontSize: '20px', fontWeight: '600', color: '#2d4a3e' }}>
                                  ¥{selectedItem.startingPrice.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>当前最高价</div>
                                <div
                                  style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#c9a96e',
                                  }}
                                >
                                  ✨ ¥{selectedItem.currentPrice.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>出价人数</div>
                                <div style={{ fontSize: '20px', fontWeight: '600', color: '#2d4a3e' }}>
                                  {selectedItem.bidCount} 人
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>最小加价</div>
                                <div style={{ fontSize: '20px', fontWeight: '600', color: '#2d4a3e' }}>
                                  ¥{Math.ceil(selectedItem.currentPrice * 0.01).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#2d4a3e',
                                  marginBottom: '10px',
                                }}
                              >
                                您的出价
                              </label>
                              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <input
                                  type="number"
                                  value={bidAmount}
                                  onChange={(e) => {
                                    setBidAmount(e.target.value)
                                    setBidError('')
                                  }}
                                  placeholder={`最低 ¥${minBidAmount.toLocaleString()}`}
                                  min={minBidAmount}
                                  style={{
                                    flex: 1,
                                    padding: '14px 20px',
                                    border: `2px solid ${bidError ? '#e74c3c' : '#e8e3de'}`,
                                    borderRadius: '12px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    backgroundColor: '#faf7f4',
                                    color: '#2d4a3e',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                  }}
                                  onFocus={(e) => {
                                    if (!bidError) {
                                      e.target.style.borderColor = '#c9a96e'
                                      e.target.style.boxShadow = '0 0 0 4px rgba(201, 169, 110, 0.1)'
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (!bidError) {
                                      e.target.style.borderColor = '#e8e3de'
                                      e.target.style.boxShadow = 'none'
                                    }
                                  }}
                                />
                                <motion.button
                                  whileHover={bidError ? {} : { scale: 1.02, backgroundColor: '#b9995e' }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={handleBid}
                                  disabled={bidError !== '' || !bidAmount}
                                  className={bidSuccess ? 'bid-success-glow' : ''}
                                  style={{
                                    position: 'relative',
                                    padding: '14px 32px',
                                    borderRadius: '12px',
                                    backgroundColor: bidError ? '#ccc' : '#c9a96e',
                                    color: '#ffffff',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: bidError || !bidAmount ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {bidSuccess ? '✓ 出价成功！' : '🚀 立即出价'}
                                  <AnimatePresence>
                                    {showRocket && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, y: -60, scale: 1.2 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        style={{
                                          position: 'absolute',
                                          bottom: '100%',
                                          left: '50%',
                                          transform: 'translateX(-50%)',
                                          fontSize: '28px',
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        🚀
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>
                              <AnimatePresence>
                                {bidError && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                      fontSize: '13px',
                                      color: '#e74c3c',
                                      fontWeight: '500',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    ⚠️ {bidError}，出价必须高于当前最高价 ¥{selectedItem.currentPrice.toLocaleString()}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#888' }}>快捷出价：</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {quickBidOptions.map((amount, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ scale: 1.05, borderColor: '#c9a96e' }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setBidAmount(String(amount))}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '2px solid #e8e3de',
                                    backgroundColor: '#faf7f4',
                                    color: '#2d4a3e',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  +¥{(amount - selectedItem.currentPrice).toLocaleString()}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>

                          <BidHistory bids={selectedItem.bids} highestBid={selectedItem.currentPrice} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 40px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
              <h2 style={{ fontSize: '24px', color: '#2d4a3e', margin: '0 0 8px 0' }}>拍卖会不存在</h2>
              <p style={{ color: '#888', margin: '0 0 24px 0' }}>该拍卖会可能已被删除或您访问的链接无效</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 32px',
                  borderRadius: '12px',
                  backgroundColor: '#c9a96e',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                返回首页
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedItem?.image || ''}
        imageAlt={selectedItem?.name}
      />
    </div>
  )
}

export default AuctionDetail
