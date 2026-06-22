import { useState, useEffect } from 'react'
import { getBottlesByUser, deleteBottle } from './api/bottle'
import type { Bottle } from './App'

interface PagePersonalProps {
  userId: string
  caughtBottles: Bottle[]
  onRemoveBottle: (bottleId: string) => void
  onGoBack: () => void
}

function PagePersonal({ userId, caughtBottles, onRemoveBottle, onGoBack }: PagePersonalProps) {
  const [myBottles, setMyBottles] = useState<Bottle[]>([])
  const [activeTab, setActiveTab] = useState<'caught' | 'my'>('caught')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const loadMyBottles = async () => {
      try {
        const bottles = await getBottlesByUser(userId)
        setMyBottles(bottles)
      } catch (error) {
        console.error('Failed to load my bottles:', error)
      }
    }
    loadMyBottles()
  }, [userId])

  const handleDelete = async (bottleId: string) => {
    setDeletingId(bottleId)
    try {
      await deleteBottle(bottleId)
      setMyBottles(prev => prev.filter(b => b.id !== bottleId))
    } catch (error) {
      console.error('Failed to delete bottle:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const currentBottles = activeTab === 'caught' ? caughtBottles : myBottles
  const isMyBottleTab = activeTab === 'my'

  const previewText = (text: string) => {
    const stripped = text.replace(/\s+/g, '')
    return stripped.length > 10 ? stripped.slice(0, 10) + '...' : stripped
  }

  const totalFeedback = (bottle: Bottle) => {
    return bottle.feedbackEmoji.encourage + bottle.feedbackEmoji.speechlessness
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #a2d2ff 0%, #1a3a5c 100%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <button
            onClick={onGoBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'all 300ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            ←
          </button>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'white',
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            🏠 个人中心
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('caught')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid transparent',
              background: activeTab === 'caught' ? '#ffd166' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'caught' ? '#1a3a5c' : 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms ease-out'
            }}
          >
            🎣 捞到的瓶子 ({caughtBottles.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid transparent',
              background: activeTab === 'my' ? '#ffd166' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'my' ? '#1a3a5c' : 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 300ms ease-out'
            }}
          >
            ✉️ 我的投放 ({myBottles.length})
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '32px'
        }}
      >
        {currentBottles.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌊</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              {isMyBottleTab ? '还没有投放过瓶子' : '还没有捞到瓶子'}
            </p>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              {isMyBottleTab ? '去主页投放你的第一个灵感吧！' : '去主页试试打捞吧！'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentBottles.map((bottle, index) => (
              <div
                key={bottle.id}
                onClick={() => setExpandedId(expandedId === bottle.id ? null : bottle.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 300ms ease-out',
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                  boxShadow: '0 4px 15px rgba(26, 58, 92, 0.1)',
                  opacity: deletingId === bottle.id ? 0.5 : 1,
                  transform: deletingId === bottle.id ? 'scale(0.95)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (deletingId !== bottle.id) {
                    e.currentTarget.style.transform = 'translateX(5px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 58, 92, 0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (deletingId !== bottle.id) {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(26, 58, 92, 0.1)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>🍾</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1a3a5c',
                        marginBottom: '4px'
                      }}
                    >
                      {previewText(bottle.text)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'rgba(26, 58, 92, 0.5)',
                        display: 'flex',
                        gap: '12px'
                      }}
                    >
                      <span>📅 {new Date(bottle.createdAt).toLocaleDateString('zh-CN')}</span>
                      <span>💪 {bottle.feedbackEmoji.encourage}</span>
                      <span>😓 {bottle.feedbackEmoji.speechlessness}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        background: '#ffd166',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a3a5c'
                      }}
                    >
                      {totalFeedback(bottle)} 反馈
                    </div>
                    <span
                      style={{
                        fontSize: '20px',
                        transition: 'transform 300ms ease-out',
                        transform: expandedId === bottle.id ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {expandedId === bottle.id && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(162, 210, 255, 0.5)',
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                  >
                    {bottle.imageUrl && (
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src={bottle.imageUrl}
                          alt="Bottle image"
                          style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'cover',
                            borderRadius: '12px'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: '16px',
                        lineHeight: 1.8,
                        color: '#1a3a5c',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {bottle.text}
                    </p>

                    {isMyBottleTab && (
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(bottle.id)
                          }}
                          disabled={deletingId === bottle.id}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '2px solid #ff6b6b',
                            background: 'transparent',
                            color: '#ff6b6b',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: deletingId === bottle.id ? 'not-allowed' : 'pointer',
                            transition: 'all 300ms ease-out'
                          }}
                          onMouseEnter={(e) => {
                            if (deletingId !== bottle.id) {
                              e.currentTarget.style.background = '#ff6b6b'
                              e.currentTarget.style.color = 'white'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#ff6b6b'
                          }}
                        >
                          {deletingId === bottle.id ? '删除中...' : '🗑️ 删除'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PagePersonal
