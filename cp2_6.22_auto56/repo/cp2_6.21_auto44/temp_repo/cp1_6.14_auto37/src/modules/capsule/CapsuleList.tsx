import { useState, useEffect, useRef, useCallback } from 'react'
import request from '../../utils/request'
import CapsuleCard, { CapsuleData } from '../../components/CapsuleCard'
import Countdown from '../../components/Countdown'

interface CapsuleListResponse {
  capsules: CapsuleData[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

function CapsuleList() {
  const [capsules, setCapsules] = useState<CapsuleData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedCapsule, setSelectedCapsule] = useState<CapsuleData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [opening, setOpening] = useState(false)
  const [drifting, setDrifting] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'received'>('all')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchCapsules = useCallback(async (pageNum: number, reset = false) => {
    const isFirstPage = pageNum === 1

    if (isFirstPage) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await request.get('/capsules', {
        params: { page: pageNum, pageSize: 12 },
      })
      const result = data as CapsuleListResponse

      if (reset) {
        setCapsules(result.capsules)
      } else {
        setCapsules((prev) => [...prev, ...result.capsules])
      }
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('获取胶囊列表失败:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchCapsules(1, true)
  }, [fetchCapsules, activeTab])

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchCapsules(page + 1)
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
  }, [hasMore, page, loading, loadingMore, fetchCapsules])

  const handleOpenCapsule = async (capsule: CapsuleData) => {
    if (!capsule.isOpenable && !capsule.isOpened) return

    if (!capsule.isOpened) {
      setOpening(true)
      try {
        await request.post(`/capsules/${capsule.id}/open`)
        const updatedCapsule = { ...capsule, isOpened: true, openedAt: new Date().toISOString() }
        setCapsules((prev) =>
          prev.map((c) => (c.id === capsule.id ? updatedCapsule : c))
        )
        setSelectedCapsule(updatedCapsule)
      } catch (error) {
        console.error('开封胶囊失败:', error)
      } finally {
        setOpening(false)
      }
    } else {
      setSelectedCapsule(capsule)
    }
    setShowModal(true)
  }

  const handleDrift = async () => {
    if (!selectedCapsule || !selectedCapsule.isOwner || selectedCapsule.isDrifted) return

    setDrifting(true)
    try {
      await request.post(`/capsules/${selectedCapsule.id}/drift`)
      const updatedCapsule = {
        ...selectedCapsule,
        isDrifted: true,
        driftedAt: new Date().toISOString(),
      }
      setCapsules((prev) =>
        prev.map((c) => (c.id === selectedCapsule.id ? updatedCapsule : c))
      )
      setSelectedCapsule(updatedCapsule)
      alert('漂流瓶已成功送出！')
    } catch (error: any) {
      alert(error.response?.data?.message || '漂流失败，请重试')
    } finally {
      setDrifting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedCapsule(null)
  }

  const filteredCapsules = capsules.filter((c) => {
    if (activeTab === 'mine') return c.isOwner
    if (activeTab === 'received') return !c.isOwner
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container">
      <h1 className="page-title">我的胶囊</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: '全部' },
          { key: 'mine', label: '我创建的' },
          { key: 'received', label: '收到的漂流瓶' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      ) : filteredCapsules.length === 0 ? (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">📭</div>
          <p>暂无胶囊，去创建第一个吧！</p>
        </div>
      ) : (
        <>
          <div className="capsule-grid">
            {filteredCapsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id + capsule.isOwner}
                capsule={capsule}
                onOpen={handleOpenCapsule}
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

      {showModal && selectedCapsule && (
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
                    {selectedCapsule.type === 'text' ? '📝 文字胶囊' : '🖼️ 图片胶囊'}
                    {selectedCapsule.isOwner ? ' · 我的' : ' · 漂流瓶'}
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

                {selectedCapsule.isOpened ? (
                  <>
                    {selectedCapsule.type === 'image' && selectedCapsule.imageUrl ? (
                      <img
                        src={selectedCapsule.imageUrl}
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
                        {selectedCapsule.content}
                      </p>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      开封时间：{formatDate(selectedCapsule.openedAt || selectedCapsule.openDate)}
                    </div>

                    {selectedCapsule.isOwner && !selectedCapsule.isDrifted && (
                      <button
                        className={`btn btn-primary ${drifting ? 'btn-disabled' : ''}`}
                        onClick={handleDrift}
                        disabled={drifting}
                        style={{ width: '100%' }}
                      >
                        {drifting ? '漂流中...' : '🌊 扔出漂流瓶'}
                      </button>
                    )}

                    {selectedCapsule.isOwner && selectedCapsule.isDrifted && (
                      <div style={{ textAlign: 'center', padding: '12px', color: 'var(--success-color)' }}>
                        🌊 已漂流至陌生人手中
                      </div>
                    )}

                    {!selectedCapsule.isOwner && selectedCapsule.reply && (
                      <div className="reply-section">
                        <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>我的回复</h4>
                        <div className="reply-content">{selectedCapsule.reply}</div>
                        <div className="reply-meta">
                          回复于 {formatDate(selectedCapsule.replyAt || '')}
                        </div>
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
                    <Countdown targetDate={selectedCapsule.openDate} size="lg" />
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

export default CapsuleList
