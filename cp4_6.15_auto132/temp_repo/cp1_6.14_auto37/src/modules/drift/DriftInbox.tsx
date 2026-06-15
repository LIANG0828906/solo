import { useState, useEffect, useRef, useCallback } from 'react'
import request from '../../utils/request'
import CapsuleCard, { CapsuleData } from '../../components/CapsuleCard'
import Countdown from '../../components/Countdown'

interface DriftWithCapsule {
  drift: {
    id: string
    capsuleId: string
    fromUserId: string
    toUserId: string
    createdAt: string
    reply?: string
    replyAt?: string
    replyVisibleAt?: string
  }
  capsule: CapsuleData
  canViewReply: boolean
}

interface DriftListResponse {
  drifts: DriftWithCapsule[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

function DriftInbox() {
  const [drifts, setDrifts] = useState<DriftWithCapsule[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedDrift, setSelectedDrift] = useState<DriftWithCapsule | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [opening, setOpening] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchDrifts = useCallback(async (pageNum: number, reset = false) => {
    const isFirstPage = pageNum === 1

    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await request.get('/drifts', {
        params: { page: pageNum, pageSize: 12 },
      })
      const result = data as DriftListResponse

      if (reset) {
        setDrifts(result.drifts)
      } else {
        setDrifts((prev) => [...prev, ...result.drifts])
      }
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('获取漂流瓶失败:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchDrifts(1, true)
  }, [fetchDrifts])

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchDrifts(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, page, loading, loadingMore, fetchDrifts])

  const handleOpenCapsule = async (drift: DriftWithCapsule) => {
    const { capsule } = drift

    if (!capsule.isOpenable && !capsule.isOpened) return

    if (!capsule.isOpened) {
      setOpening(true)
      try {
        await request.post(`/capsules/${capsule.id}/open`)
        const updatedCapsule = { ...capsule, isOpened: true, openedAt: new Date().toISOString() }
        const updatedDrift = { ...drift, capsule: updatedCapsule }
        setDrifts((prev) =>
          prev.map((d) => (d.drift.id === drift.drift.id ? updatedDrift : d))
        )
        setSelectedDrift(updatedDrift)
      } catch (error) {
        console.error('开封胶囊失败:', error)
      } finally {
        setOpening(false)
      }
    } else {
      setSelectedDrift(drift)
    }
    setShowModal(true)
    setReplyText('')
  }

  const handleReply = async () => {
    if (!selectedDrift || !replyText.trim() || replyText.length > 200) return

    setReplying(true)
    try {
      await request.post(`/drifts/${selectedDrift.drift.id}/reply`, { reply: replyText.trim() })
      const replyVisibleAt = new Date()
      replyVisibleAt.setHours(replyVisibleAt.getHours() + 24)

      const updatedDrift = {
        ...selectedDrift,
        drift: {
          ...selectedDrift.drift,
          reply: replyText.trim(),
          replyAt: new Date().toISOString(),
          replyVisibleAt: replyVisibleAt.toISOString(),
        },
        canViewReply: false,
      }
      setDrifts((prev) =>
        prev.map((d) => (d.drift.id === selectedDrift.drift.id ? updatedDrift : d))
      )
      setSelectedDrift(updatedDrift)
      setReplyText('')
      alert('回复成功！发送方将在24小时后看到您的回复。')
    } catch (error: any) {
      alert(error.response?.data?.message || '回复失败，请重试')
    } finally {
      setReplying(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDrift(null)
    setReplyText('')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeUntilVisible = (dateStr: string) => {
    const target = new Date(dateStr).getTime()
    const now = new Date().getTime()
    const diff = target - now
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}小时${minutes}分钟`
  }

  return (
    <div className="container">
      <h1 className="page-title">漂流收件箱</h1>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      ) : drifts.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">📭</div>
          <p>还没有收到漂流瓶</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            系统会随机将其他用户的漂流瓶发送给您，每天最多3个
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            共收到 {drifts.length} 个漂流瓶
          </p>
          <div className="capsule-grid">
            {drifts.map((drift) => (
              <CapsuleCard
                key={drift.drift.id}
                capsule={drift.capsule}
                onOpen={() => handleOpenCapsule(drift)}
              />
            ))}
          </div>

          {loadingMore && (
            <div className="loading" style={{ padding: '20px' }}>
              <div className="loading-spinner" />
            </div>
          )}

          {hasMore && !loadingMore && <div ref={sentinelRef} style={{ height: '20px' }} />}
        </>
      )}

      {showModal && selectedDrift && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className={`modal-content glass-card ${opening ? 'opening' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {opening ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'pulse 0.5s ease-in-out infinite' }}>
                  📬
                </div>
                <h3>正在开封...</h3>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span className="capsule-type-badge" style={{ marginBottom: 0 }}>
                    🌊 漂流瓶 · {selectedDrift.capsule.type === 'text' ? '文字' : '图片'}
                  </span>
                  <button
                    onClick={closeModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>

                {selectedDrift.capsule.isOpened ? (
                  <>
                    {selectedDrift.capsule.type === 'image' && selectedDrift.capsule.imageUrl ? (
                      <img
                        src={selectedDrift.capsule.imageUrl}
                        alt="胶囊内容"
                        style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
                      />
                    ) : (
                      <p
                        style={{
                          fontSize: '16px',
                          lineHeight: '1.8',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'pre-wrap',
                          marginBottom: '16px',
                        }}
                      >
                        {selectedDrift.capsule.content}
                      </p>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      收到时间：{formatDate(selectedDrift.drift.createdAt)}
                      <br />
                      开封时间：{formatDate(selectedDrift.capsule.openedAt || selectedDrift.capsule.openDate)}
                    </div>

                    {selectedDrift.drift.reply ? (
                      <div className="reply-section">
                        <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>我的回复</h4>
                        <div className="reply-content">{selectedDrift.drift.reply}</div>
                        <div className="reply-meta">
                          回复于 {formatDate(selectedDrift.drift.replyAt || '')}
                          {!selectedDrift.canViewReply && selectedDrift.drift.replyVisibleAt && (
                            <span style={{ marginLeft: '12px' }}>
                              · {getTimeUntilVisible(selectedDrift.drift.replyVisibleAt)}后对方可见
                            </span>
                          )}
                          {selectedDrift.canViewReply && (
                            <span style={{ marginLeft: '12px', color: 'var(--success-color)' }}>
                              · 对方已可见
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="reply-section">
                        <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>
                          匿名回复
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {replyText.length}/200
                          </span>
                        </h4>
                        <textarea
                          className="reply-input"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="写下你的回复（200字以内）..."
                          maxLength={200}
                          disabled={replying}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          回复将在24小时后对发送方可见
                        </div>
                        <button
                          className={`btn btn-primary ${replying ? 'btn-disabled' : ''}`}
                          onClick={handleReply}
                          disabled={replying || !replyText.trim()}
                          style={{ width: '100%' }}
                        >
                          {replying ? '发送中...' : '发送回复'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
                    <h3 style={{ marginBottom: '16px' }}>胶囊还未开封</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      距离开封还有
                    </p>
                    <Countdown targetDate={selectedDrift.capsule.openDate} size="lg" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DriftInbox
