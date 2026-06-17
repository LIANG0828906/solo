import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore, type GiftRecord } from '@/stores/dashboardStore'
import './GiftPanel.css'

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

interface GiftItemProps {
  record: GiftRecord
  isNew: boolean
}

const GiftItem: React.FC<GiftItemProps> = ({ record, isNew }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`gift-item ${isNew ? 'gift-flash' : ''}`}
    >
      <img
        src={record.avatar}
        alt={record.nickname}
        className="gift-avatar"
      />
      <div className="gift-info">
        <div className="gift-nickname">{record.nickname}</div>
        <div className="gift-detail">
          <img
            src={record.giftIcon}
            alt={record.giftName}
            className="gift-icon"
          />
          <span className="gift-name">{record.giftName}</span>
          <span className="gift-count">x{record.count}</span>
        </div>
      </div>
      <div className="gift-time">{formatTime(record.timestamp)}</div>
    </motion.div>
  )
}

const GiftPanel: React.FC = () => {
  const giftRecords = useDashboardStore((state) => state.giftRecords)
  const fetchGiftRecords = useDashboardStore((state) => state.fetchGiftRecords)
  const [newRecordId, setNewRecordId] = useState<string | null>(null)

  useEffect(() => {
    fetchGiftRecords()
  }, [fetchGiftRecords])

  useEffect(() => {
    if (giftRecords.length > 0) {
      const latestId = giftRecords[0].id
      setNewRecordId(latestId)
      const timer = setTimeout(() => setNewRecordId(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [giftRecords])

  return (
    <div className="gift-panel">
      <div className="panel-header">
        <h3 className="panel-title">礼物动态</h3>
        <span className="panel-count">{giftRecords.length}</span>
      </div>
      <div className="gift-list custom-scrollbar">
        <AnimatePresence initial={false}>
          {giftRecords.map((record) => (
            <GiftItem
              key={record.id}
              record={record}
              isNew={record.id === newRecordId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GiftPanel
