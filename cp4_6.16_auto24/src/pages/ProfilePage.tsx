import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../modules/auth/useAuthStore'
import { useExhibitionStore } from '../modules/exhibition/useExhibitionStore'
import { COLOR_SCHEMES } from '../types'
import type { Exhibition } from '../types'

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { exhibitions, fetchAllExhibitions, createExhibition, deleteExhibition, artworks, fetchExhibitionArtworks } = useExhibitionStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedScheme, setSelectedScheme] = useState(1)
  const [artworkCounts, setArtworkCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login')
      return
    }
  }, [isAuthenticated])

  useEffect(() => {
    const init = async () => {
      await fetchAllExhibitions()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const countWorks = async () => {
      const counts: Record<string, number> = {}
      for (const exh of myExhibitions) {
        const aws = await fetchExhibitionArtworks(exh.id)
        counts[exh.id] = aws.length
      }
      setArtworkCounts(counts)
    }
    countWorks()
  }, [exhibitions])

  if (!isAuthenticated || !user) return null

  const myExhibitions = exhibitions.filter(e => e.ownerId === user.id)
  const totalArtworks = Object.values(artworkCounts).reduce((a, b) => a + b, 0)

  const handleCreate = async () => {
    if (!newName.trim()) return
    const exh = await createExhibition(user.id, user.username, newName.trim(), selectedScheme)
    if (exh) {
      setShowCreateModal(false)
      setNewName('')
      setSelectedScheme(1)
      navigate(`/gallery/${exh.id}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此展厅？所有作品将被永久删除。')) {
      await deleteExhibition(id)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
        <div
          style={{
        padding: '36px',
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #f0f0f0',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            }}
          >
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{user.username}</h1>
            <p style={{ fontSize: '14px', color: '#888' }}>{user.email}</p>
            <p style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
              加入于 {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '40px', marginRight: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{myExhibitions.length}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>展厅</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>{totalArtworks}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>作品</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            borderRadius: '100px',
            border: '1px solid #e5e5e5',
            color: '#666',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#EF4444'
            e.currentTarget.style.color = '#EF4444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e5e5'
            e.currentTarget.style.color = '#666'
          }}
        >
          退出登录
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600 }}>我的展厅</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '100px',
            background: '#1A1A1A',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
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
          <span>＋</span>
          创建展厅
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
      ) : myExhibitions.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #f0f0f0',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.4 }}>🏛️</div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>你还没有展厅</h3>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>创建你的第一个虚拟艺术馆吧！</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 28px',
              borderRadius: '100px',
              background: '#6366F1',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            创建展厅
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myExhibitions.map((exh: Exhibition) => (
            <Link
              key={exh.id}
              to={`/gallery/${exh.id}`}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '20px 24px',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${exh.colorScheme.primary}30, ${exh.colorScheme.accent}50)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '24px',
                      background: '#fff',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: '#1A1A1A' }}>
                    {exh.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🖼️</span>
                      {artworkCounts[exh.id] || 0} 件作品
                    </span>
                    <span style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          background: exh.colorScheme.primary,
                          display: 'inline-block',
                        }}
                      />
                      {exh.colorScheme.name}
                    </span>
                    <span style={{ fontSize: '13px', color: '#aaa' }}>
                      更新于 {formatDate(exh.updatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(exh.id)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  删除
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

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
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '28px' }}>为你的艺术作品打造专属的虚拟展览空间</p>

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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
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
                style={{ padding: '12px 24px', borderRadius: '100px', color: '#666', fontSize: '14px', fontWeight: 500 }}
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
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
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
    </div>
  )
}
