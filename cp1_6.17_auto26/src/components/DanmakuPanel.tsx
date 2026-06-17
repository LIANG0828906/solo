import React, { useEffect, useRef } from 'react'
import { useDashboardStore, type Danmaku as DanmakuType } from '@/stores/dashboardStore'
import './DanmakuPanel.css'

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

interface DanmakuItemProps {
  danmaku: DanmakuType
}

const DanmakuItem: React.FC<DanmakuItemProps> = ({ danmaku }) => {
  return (
    <div className="danmaku-item">
      <img
        src={danmaku.avatar}
        alt={danmaku.nickname}
        className="danmaku-avatar"
      />
      <div className="danmaku-content">
        <div className="danmaku-header">
          <span className="danmaku-nickname">{danmaku.nickname}</span>
        </div>
        <div className="danmaku-text">{danmaku.content}</div>
        <div className="danmaku-time">{formatTime(danmaku.timestamp)}</div>
      </div>
    </div>
  )
}

const DanmakuPanel: React.FC = () => {
  const danmakus = useDashboardStore((state) => state.danmakus)
  const fetchDanmakus = useDashboardStore((state) => state.fetchDanmakus)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDanmakus()
  }, [fetchDanmakus])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [danmakus])

  return (
    <div className="danmaku-panel">
      <div className="panel-header">
        <h3 className="panel-title">实时弹幕</h3>
        <span className="panel-count">{danmakus.length}</span>
      </div>
      <div className="danmaku-list custom-scrollbar" ref={scrollRef}>
        {danmakus.map((danmaku) => (
          <DanmakuItem key={danmaku.id} danmaku={danmaku} />
        ))}
      </div>
    </div>
  )
}

export default DanmakuPanel
