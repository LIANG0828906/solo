import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Exhibition } from '../types'
import { COLOR_SCHEMES } from '../types'
import { useExhibitionStore } from '../modules/exhibition/useExhibitionStore'
import { useAuthStore } from '../modules/auth/useAuthStore'

export default function GalleryListPage() {
  const { exhibitions, fetchAllExhibitions, createExhibition, deleteExhibition, fetchExhibitionArtworks, artworks } = useExhibitionStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedScheme, setSelectedScheme] = useState(1)
  const [artworkCounts, setArtworkCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const exhs = (await fetchAllExhibitions()) || []
      const counts: Record<string, number> = {}
      for (const exh of exhs) {
        const aws = (await fetchExhibitionArtworks(exh.id)) || []
        counts[exh.id] = aws.length
      }
      setArtworkCounts(counts)
      setLoading(false)
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    if (!isAuthenticated || !user) {
      navigate('/auth?mode=register')
      return
    }
    const exh = await createExhibition(user.id, user.username, newName.trim(), selectedScheme)
    if (exh) {
      setShowCreateModal(false)
      setNewName('')
      setSelectedScheme(1)
      setArtworkCounts(prev => ({ ...prev, [exh.id]: 0 }))
      navigate(`/gallery/${exh.id}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (confirm('确定要删除这个展厅吗？所有作品将被永久删除。')) {
      await deleteExhibition(id)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-1px' }}>
              展厅广场
            </h1>
            <p style={{ fontSize: '15px', color: '#666' }}>
              探索艺术爱好者们精心打造的虚拟展览空间
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/auth?mode=register')
                return
              }
              setShowCreateModal(true)
            }}
            style={{
              padding: '14px 28px',
              borderRadius: '100px',
              background: '#1A1A1A',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1A1A1A'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '18px' }}>＋</span>
            创建展厅
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#999', fontSize: '14px' }}>
            加载中...
          </div>
        ) : exhibitions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '100px 20px',
              background: '#fff',
              borderRadius: '24px',
              border: '1px solid #f0f0f0',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '24px', opacity: 0.5 }}>🏛️</div>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '10px', color: '#333' }}>
              还没有任何展厅
            </h3>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '28px' }}>
              创建你的第一个虚拟艺术馆，开启艺术展示之旅
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth?mode=register')
                  return
                }
                setShowCreateModal(true)
              }}
              style={{
                padding: '14px 32px',
                borderRadius: '100px',
                background: '#6366F1',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              创建第一个展厅
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {exhibitions.map((exh: Exhibition) => {
              const myExhibitions = exhibitions.filter(e => e.ownerId === user?.id)
              const isOwner = user?.id === exh.ownerId
              return (
                <Link
                  key={exh.id}
                  to={`/gallery/${exh.id}`}
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.3s ease',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      height: '180px',
                      background: `linear-gradient(135deg, ${exh.colorScheme.primary}20 0%, ${exh.colorScheme.accent}30 100%), ${exh.colorScheme.bgColor}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '120px',
                          height: '80px',
                          background: '#fff',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            right: '10px',
                            bottom: '10px',
                            background: `linear-gradient(135deg, ${exh.colorScheme.primary}40, ${exh.colorScheme.accent}60)`,
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#444',
                      }}
                    >
                      {artworkCounts[exh.id] || 0} 件作品
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: exh.colorScheme.primary,
                      }}
                    />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#1A1A1A' }}>
                      {exh.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366F1, #EC4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {exh.ownerName[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', color: '#666' }}>{exh.ownerName}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{formatDate(exh.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            background: exh.colorScheme.primary,
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#888' }}>{exh.colorScheme.name}</span>
                      </div>
                      {isOwner && (
                        <button
                          onClick={(e) => handleDelete(e, exh.id)}
                          style={{
                            fontSize: '12px',
                            color: '#EF4444',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '32px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>创建新展厅</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '28px' }}>
              为你的艺术作品打造专属的虚拟展览空间
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '10px', color: '#333' }}>
                展厅名称
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：我的油画作品集"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  fontSize: '15px',
                  transition: 'border-color 0.2s',
                  background: '#fafafa',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1'
                  e.currentTarget.style.background = '#fff'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                  e.currentTarget.style.background = '#fafafa'
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#333' }}>
                选择主题配色
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px',
                }}
              >
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => setSelectedScheme(scheme.id)}
                    style={{
                      padding: '4px',
                      borderRadius: '12px',
                      border: selectedScheme === scheme.id ? '2px solid #6366F1' : '2px solid transparent',
                      background: selectedScheme === scheme.id ? 'rgba(99,102,241,0.06)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '1',
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.accent})`,
                        marginBottom: '4px',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {scheme.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                style={{
                  padding: '12px 28px',
                  borderRadius: '100px',
                  background: newName.trim() ? '#6366F1' : '#ccc',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => {
                  if (newName.trim()) e.currentTarget.style.background = '#5558E8'
                }}
                onMouseLeave={(e) => {
                  if (newName.trim()) e.currentTarget.style.background = '#6366F1'
                }}
              >
                创建展厅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
