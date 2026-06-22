import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Item, User, Item as ItemType, itemApi, favoriteApi, exchangeApi } from '../api'
import LazyImage from '../components/LazyImage'

interface DetailProps {
  user: User | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Detail({ user }: DetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<ItemType | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [myItems, setMyItems] = useState<ItemType[]>([])
  const [selectedMyItemId, setSelectedMyItemId] = useState('')
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [loadingMyItems, setLoadingMyItems] = useState(false)

  const loadDetail = async () => {
    if (!id) return
    try {
      const data = await itemApi.get(id)
      setItem(data.item)
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 404) {
        alert('物品不存在')
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const handleLike = async () => {
    if (!item || liked || likeLoading) return
    setLikeLoading(true)
    try {
      const data = await itemApi.like(item.id)
      setItem(prev => prev ? { ...prev, likes: data.likes } : prev)
      setLiked(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!item || favLoading) return
    if (!user) {
      alert('请先登录')
      navigate('/login')
      return
    }
    setFavLoading(true)
    try {
      if (item.isFavorited) {
        await favoriteApi.remove(item.id)
        setItem(prev => prev ? { ...prev, isFavorited: false } : prev)
      } else {
        await favoriteApi.add(item.id)
        setItem(prev => prev ? { ...prev, isFavorited: true } : prev)
      }
    } catch (err) {
      console.error(err)
      alert('操作失败')
    } finally {
      setFavLoading(false)
    }
  }

  const openExchangeModal = async () => {
    if (!user) {
      alert('请先登录')
      navigate('/login')
      return
    }
    setShowExchangeModal(true)
    setLoadingMyItems(true)
    try {
      const data = await itemApi.getUserItems(user.id)
      const available = (data.items || []).filter((it: Item) => it.status === 'available')
      setMyItems(available)
      if (available.length > 0) {
        setSelectedMyItemId(available[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMyItems(false)
    }
  }

  const handleExchangeSubmit = async () => {
    if (!item || !selectedMyItemId || exchangeLoading) return
    setExchangeLoading(true)
    try {
      await exchangeApi.create({
        fromItemId: selectedMyItemId,
        toItemId: item.id
      })
      alert('交换请求已发送！')
      setShowExchangeModal(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || '发送失败，请重试'
      alert(msg)
    } finally {
      setExchangeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>加载中...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>物品不存在</div>
      </div>
    )
  }

  const isOwner = user && user.id === item.userId
  const photos = item.photos || []

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
        <div style={{ position: 'relative', background: '#000' }}>
          {photos.length > 0 ? (
            <>
              <div style={{
                aspectRatio: '16 / 9',
                maxHeight: '480px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <LazyImage
                  src={photos[photoIndex]}
                  alt={item.name}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: 'var(--warm-brown)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: 'var(--warm-brown)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ›
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        style={{
                          width: i === photoIndex ? '24px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.5)'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ aspectRatio: '16 / 9', maxHeight: '480px', background: 'var(--cream-dark)' }} />
          )}
          {item.status === 'exchanged' && (
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
              <span className="badge badge-completed" style={{ fontSize: '14px', padding: '6px 16px' }}>
                已交换
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--warm-brown)',
                marginBottom: '12px'
              }}>
                {item.name}
              </h1>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge" style={{
                  background: 'rgba(139, 111, 71, 0.12)',
                  color: 'var(--warm-coffee-dark)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  padding: '6px 14px'
                }}>
                  {item.category}
                </span>
                <span className="badge" style={{
                  background: 'rgba(212, 167, 106, 0.2)',
                  color: 'var(--warm-coffee-dark)',
                  border: '1px solid rgba(212, 167, 106, 0.3)',
                  fontSize: '13px',
                  padding: '6px 14px'
                }}>
                  {item.condition}
                </span>
                <span className="badge" style={{
                  background: 'rgba(168, 137, 94, 0.1)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  padding: '6px 14px'
                }}>
                  📍 {item.city}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            background: 'var(--cream)',
            borderRadius: '16px',
            marginBottom: '28px'
          }}>
            {item.author?.avatar ? (
              <img src={item.author.avatar} alt="" style={{
                width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover'
              }} />
            ) : (
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--warm-coffee) 0%, var(--warm-coffee-light) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '18px', fontWeight: 600
              }}>
                {item.author?.nickname?.[0] || '?'}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--warm-brown)' }}>
                {item.author?.nickname || '匿名用户'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                发布于 {formatDate(item.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--warm-brown)',
              marginBottom: '16px'
            }}>
              📖 物品故事
            </h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 2,
              whiteSpace: 'pre-wrap',
              background: 'var(--cream)',
              padding: '24px',
              borderRadius: '16px'
            }}>
              {item.story}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={handleLike}
              disabled={liked || likeLoading}
              style={{ gap: '8px' }}
            >
              <span style={liked ? { color: '#F56C6C' } : {}}>{liked ? '❤️' : '🤍'}</span>
              <span>{item.likes}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleFavorite}
              disabled={favLoading}
              style={{ gap: '8px' }}
            >
              <span>{item.isFavorited ? '⭐' : '☆'}</span>
              <span>{item.isFavorited ? '已收藏' : '收藏'}</span>
            </button>
            {user && !isOwner && item.status === 'available' && (
              <button
                className="btn btn-primary"
                onClick={openExchangeModal}
                style={{ marginLeft: 'auto', gap: '8px' }}
              >
                <span>🔄</span>
                <span>发起交换</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showExchangeModal && (
        <div className="modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warm-brown)' }}>
                发起交换
              </h2>
              <button onClick={() => setShowExchangeModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '24px', color: 'var(--text-muted)', padding: '4px'
              }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px',
                background: 'var(--cream)',
                borderRadius: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  对方物品
                </div>
                <div style={{ fontWeight: 600, color: 'var(--warm-brown)' }}>{item.name}</div>
              </div>

              <label className="label">选择你的物品</label>
              {loadingMyItems ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  加载中...
                </div>
              ) : myItems.length > 0 ? (
                <select
                  className="select"
                  value={selectedMyItemId}
                  onChange={e => setSelectedMyItemId(e.target.value)}
                >
                  {myItems.map(it => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '20px',
                  background: 'var(--cream)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px'
                }}>
                  你还没有可交换的物品，先去发布一件吧～
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowExchangeModal(false)}
                style={{ flex: 1 }}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExchangeSubmit}
                disabled={myItems.length === 0 || !selectedMyItemId || exchangeLoading}
                style={{ flex: 1 }}
              >
                {exchangeLoading ? '发送中...' : '确认交换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Detail
