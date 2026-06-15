import { useState, useEffect, useRef, useCallback } from 'react'
import type { Exhibit, Danmaku } from '../types'
import './DanmakuOverlay.css'

interface DanmakuItem extends Danmaku {
  x: number
  y: number
  speed: number
  top: number
}

function DanmakuOverlay({ exhibit, onClose }: { exhibit: Exhibit; onClose: () => void }) {
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([])
  const [activeDanmaku, setActiveDanmaku] = useState<DanmakuItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const lastSpawnRef = useRef(0)

  const loadDanmaku = useCallback(async () => {
    if (!exhibit.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/exhibits/${exhibit.id}/danmaku`)
      const data = await res.json()
      setDanmakuList(data)
    } catch (error) {
      console.error('加载弹幕失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [exhibit.id])

  useEffect(() => {
    loadDanmaku()
  }, [loadDanmaku])

  const spawnDanmaku = useCallback(() => {
    if (!containerRef.current || danmakuList.length === 0) return

    const containerHeight = containerRef.current.offsetHeight
    const randomDanmaku = danmakuList[Math.floor(Math.random() * danmakuList.length)]
    const top = Math.random() * (containerHeight - 40) + 20

    const newItem: DanmakuItem = {
      ...randomDanmaku,
      x: containerRef.current.offsetWidth,
      y: 0,
      speed: 2 + Math.random() * 2,
      top,
    }

    setActiveDanmaku(prev => [...prev, newItem])
  }, [danmakuList])

  useEffect(() => {
    if (!containerRef.current || danmakuList.length === 0) return

    const animate = (timestamp: number) => {
      if (timestamp - lastSpawnRef.current > 2000) {
        spawnDanmaku()
        lastSpawnRef.current = timestamp
      }

      setActiveDanmaku(prev =>
        prev
          .map(item => ({ ...item, x: item.x - item.speed }))
          .filter(item => item.x > -300)
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [danmakuList, spawnDanmaku])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    try {
      const res = await fetch('/api/danmaku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibit_id: exhibit.id,
          content: inputValue,
          user_name: userName || '匿名访客',
          color: '#ffffff',
        }),
      })

      if (res.ok) {
        const newDanmaku = await res.json()
        setDanmakuList(prev => [newDanmaku, ...prev])
        setInputValue('')
      }
    } catch (error) {
      console.error('发送弹幕失败:', error)
    }
  }

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/danmaku/${id}/like`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setDanmakuList(prev => prev.map(d => d.id === id ? updated : d))
        setActiveDanmaku(prev => prev.map(d => d.id === id ? { ...d, likes: updated.likes } : d))
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleReport = async (id: string) => {
    if (confirm('确定要举报这条弹幕吗？')) {
      try {
        await fetch(`/api/danmaku/${id}/report`, { method: 'POST' })
        alert('举报已提交')
      } catch (error) {
        console.error('举报失败:', error)
      }
    }
  }

  return (
    <div className="danmaku-overlay">
      <button className="close-btn" onClick={onClose}>×</button>
      
      <div className="danmaku-header glass-panel">
        <h3 className="danmaku-title">
          <span className="danmaku-icon">💬</span>
          {exhibit.title} - 弹幕
        </h3>
      </div>

      <div className="danmaku-container" ref={containerRef}>
        {isLoading ? (
          <div className="danmaku-loading">加载弹幕中...</div>
        ) : (
          activeDanmaku.map(item => (
            <div
              key={item.id}
              className="danmaku-item"
              style={{
                left: `${item.x}px`,
                top: `${item.top}px`,
                color: item.color,
              }}
            >
              <span className="danmaku-content">{item.content}</span>
              <button 
                className="danmaku-like"
                onClick={(e) => { e.stopPropagation(); handleLike(item.id) }}
                title="点赞"
              >
                👍 {item.likes}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="danmaku-input-area glass-panel">
        <input
          type="text"
          className="name-input"
          placeholder="昵称"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          maxLength={10}
        />
        <input
          type="text"
          className="danmaku-input"
          placeholder="发送弹幕..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          maxLength={50}
        />
        <button className="btn-primary send-btn" onClick={handleSend}>
          发送
        </button>
      </div>

      <div className="danmaku-list-panel glass-panel">
        <h4 className="list-panel-title">弹幕列表</h4>
        <div className="danmaku-list">
          {danmakuList.length === 0 ? (
            <p className="no-danmaku">暂无弹幕，来发第一条吧！</p>
          ) : (
            danmakuList.slice(0, 10).map(item => (
              <div key={item.id} className="danmaku-list-item">
                <span className="danmaku-user">{item.user_name}:</span>
                <span className="danmaku-text">{item.content}</span>
                <div className="danmaku-actions">
                  <button onClick={() => handleLike(item.id)} className="action-btn">
                    👍 {item.likes}
                  </button>
                  <button onClick={() => handleReport(item.id)} className="action-btn">
                    🚩
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DanmakuOverlay
