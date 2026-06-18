import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { AppState } from '../store/store'
import { deleteHistoryAction, setCurrentPoemAction, applyStyleAction, loadHistoryAction } from '../store/store'
import type { HistoryItem } from '../modules/history/HistoryModule'
import { formatDate, deleteFromHistory, clearHistory, loadHistory } from '../modules/history/HistoryModule'
import { bgOptions, fontOptions, decorationOptions, applyStyleConfig } from '../modules/styling/StyleModule'
import type { StyleConfig, DecorationType } from '../modules/styling/StyleModule'

function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>
}

function DecorationLayer({ type, animate }: { type: DecorationType; animate: boolean }) {
  if (type === 'none') return null

  const renderDecoration = () => {
    switch (type) {
      case 'seal':
        return <div className="seal" style={{ width: 48, height: 48, fontSize: 24 }}>诗印</div>
      case 'petals':
        return (
          <div className="petal-container" style={{ width: 60, height: 60 }}>
            <div className="petal p1" style={{ width: 14, height: 14 }}></div>
            <div className="petal p2" style={{ width: 12, height: 12 }}></div>
            <div className="petal p3" style={{ width: 10, height: 10 }}></div>
            <div className="petal p4" style={{ width: 14, height: 14 }}></div>
          </div>
        )
      case 'birds':
        return (
          <div className="bird-silhouette" style={{ fontSize: 20 }}>
            <span style={{ transform: 'rotate(-15deg)', display: 'inline-block' }}>⊶</span>
          </div>
        )
      default:
        return null
    }
  }

  const positions = ['tl', 'tr', 'bl', 'br'] as const
  const count = type === 'petals' ? 4 : type === 'seal' ? 1 : 2
  const usedPositions = positions.slice(0, count)

  return (
    <>
      {usedPositions.map((pos) => (
        <div
          key={`${type}-${pos}`}
          className={`decoration-corner ${pos} ${animate ? 'animate' : ''}`}
          style={{ width: 60, height: 60 }}
        >
          {renderDecoration()}
        </div>
      ))}
    </>
  )
}

function HistoryCard({
  item,
  onClick
}: {
  item: HistoryItem
  onClick: () => void
}) {
  const bgColor = bgOptions[item.style.background].color
  const bgPattern = bgOptions[item.style.background].pattern

  return (
    <div className="history-card" onClick={onClick}>
      <div
        className="history-card-thumb"
        style={{
          background: bgColor,
          backgroundImage: bgPattern
        }}
      >
        <div className="history-card-text" style={{ fontFamily: fontOptions[item.style.font].family }}>
          {item.poem.lines[0]}
        </div>
      </div>
      <div className="history-card-info">
        <div className="history-card-keyword">题·{item.poem.keyword}</div>
        <div className="history-card-author">—— {item.poem.author}</div>
        <div className="history-card-date">{formatDate(item.createdAt)}</div>
      </div>
    </div>
  )
}

function DetailModal({
  item,
  onClose,
  onDelete
}: {
  item: HistoryItem
  onClose: () => void
  onDelete: () => void
}) {
  const [animateDeco, setAnimateDeco] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setAnimateDeco(false), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const cssVars = useMemo(() => applyStyleConfig(item.style), [item.style])
  const styleObj = {
    '--poem-font-family': cssVars['--poem-font-family'],
    '--bg-color': cssVars['--bg-color'],
    '--bg-texture': cssVars['--bg-texture']
  } as React.CSSProperties

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick}>
      <div className="detail-modal">
        <button className="detail-close" onClick={onClose}>×</button>
        <button className="detail-delete" onClick={onDelete}>删除</button>
        <div className="poem-card" style={styleObj}>
          <DecorationLayer type={item.style.decoration} animate={animateDeco} />
          <div className="poem-content">
            {item.poem.lines.map((line, idx) => (
              <div key={idx} className="poem-line">
                {line}
              </div>
            ))}
          </div>
          <div className="poem-meta">
            <div className="poem-keyword">题·{item.poem.keyword}</div>
            <div className="poem-type">
              {item.poem.lineType === 'seven' ? '七言' : '五言'}绝句
            </div>
            <div className="poem-author">—— {item.poem.author}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items } = useSelector((state: AppState) => state.history)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    dispatch(loadHistoryAction(loadHistory()))
  }, [dispatch])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleCardClick = (item: HistoryItem) => {
    setSelectedItem(item)
  }

  const handleEdit = () => {
    if (selectedItem) {
      dispatch(setCurrentPoemAction(selectedItem.poem))
      dispatch(applyStyleAction(selectedItem.style))
      navigate('/create')
    }
  }

  const handleDelete = () => {
    if (!selectedItem) return
    if (!confirm('确定要删除这首诗吗？')) return

    deleteFromHistory(selectedItem.id)
    dispatch(deleteHistoryAction(selectedItem.id))
    setSelectedItem(null)
    showToast('已删除')
  }

  const handleClearAll = () => {
    if (items.length === 0) return
    if (!confirm(`确定要清空全部 ${items.length} 条记录吗？此操作不可恢复。`)) return

    clearHistory()
    dispatch(loadHistoryAction([]))
    showToast('已清空全部记录')
  }

  return (
    <div className="history-page">
      {toast && <Toast message={toast} />}

      <div className="history-header">
        <div className="history-title">历史佳作</div>
        <div className="history-actions">
          {items.length > 0 && (
            <button onClick={handleClearAll}>清空全部</button>
          )}
          <button onClick={() => navigate('/create')}>前往创作</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">✧</div>
          <div className="history-empty-text">暂无收藏作品</div>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
            快去创作你的第一首诗吧
          </div>
        </div>
      ) : (
        <div className="history-grid">
          {items.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
