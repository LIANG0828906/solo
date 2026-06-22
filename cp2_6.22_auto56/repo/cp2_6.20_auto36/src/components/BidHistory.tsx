import { motion } from 'framer-motion'
import { format } from 'date-fns'
import type { Bid } from '../types'

interface BidHistoryProps {
  bids: Bid[]
  highestBid?: number
}

const BidHistory = ({ bids, highestBid }: BidHistoryProps) => {
  const sortedBids = [...bids].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const maxAmount = highestBid || Math.max(...bids.map((b) => b.amount), 0)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#2d4a3e',
          margin: '0 0 20px 0',
        }}
      >
        出价历史
      </h3>

      {sortedBids.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#999',
            fontSize: '14px',
          }}
        >
          暂无出价记录
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ position: 'relative' }}
        >
          <div
            style={{
              position: 'absolute',
              left: '24px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              backgroundColor: '#e8e3de',
            }}
          />

          {sortedBids.map((bid, index) => {
            const isHighest = bid.amount === maxAmount
            return (
              <motion.div
                key={bid.id}
                variants={item}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '12px 0',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `2px solid ${isHighest ? '#c9a96e' : '#e8e3de'}`,
                      backgroundColor: '#f5f0eb',
                    }}
                  >
                    {bid.userAvatar ? (
                      <img
                        src={bid.userAvatar}
                        alt={bid.userName}
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
                          backgroundColor: isHighest ? '#c9a96e' : '#ddd',
                          color: isHighest ? '#2d4a3e' : '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                        }}
                      >
                        {bid.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2d4a3e',
                      }}
                    >
                      {bid.userName}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#999',
                      }}
                    >
                      {format(new Date(bid.time), 'MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: isHighest ? '#c9a96e' : '#2d4a3e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ¥{bid.amount.toLocaleString()}
                    {isHighest && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 300 }}
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          backgroundColor: 'rgba(201, 169, 110, 0.15)',
                          color: '#c9a96e',
                          borderRadius: '10px',
                          fontWeight: '500',
                        }}
                      >
                        最高出价
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

export default BidHistory
