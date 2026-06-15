import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ExhibitionScene from '../modules/exhibition/ExhibitionScene'
import ArtworkModal from '../components/ArtworkModal'
import { useExhibitionStore } from '../modules/exhibition/useExhibitionStore'
import { useAuthStore } from '../modules/auth/useAuthStore'
import type { Artwork } from '../types'

const WALL_NAMES = ['北墙', '东墙', '南墙', '西墙']

export default function GalleryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentExhibition,
    currentArtwork,
    artworks,
    setCurrentExhibition,
    clearCurrentExhibition,
    setCurrentArtwork,
    uploadArtwork,
    deleteArtwork,
    fetchExhibitionArtworks,
  } = useExhibitionStore()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedWall, setSelectedWall] = useState(0)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      if (!id) return
      const ok = await setCurrentExhibition(id)
      setLoading(false)
    }
    init()
    return () => {
      clearCurrentExhibition()
      setCurrentArtwork(null)
    }
  }, [id])

  const isOwner = user?.id === currentExhibition?.ownerId

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('只支持 JPG / PNG / WebP 格式')
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !id) return
    if (!isAuthenticated) {
      navigate('/auth?mode=login')
      return
    }
    if (!title.trim()) {
      alert('请填写作品标题')
      return
    }
    setUploading(true)
    const finalAuthor = author.trim() || (user?.username || '未知艺术家')
    const artwork = await uploadArtwork(id, selectedFile, title.trim(), finalAuthor, description.trim(), selectedWall)
    setUploading(false)
    if (artwork) {
      setShowUpload(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setTitle('')
      setAuthor('')
      setDescription('')
      setSelectedWall(0)
      await fetchExhibitionArtworks(id)
    }
  }

  const handleDeleteArtwork = async (artworkId: string) => {
    const ok = await deleteArtwork(artworkId)
    if (ok) {
      setCurrentArtwork(null)
    }
  }

  const exhibitionArtworks = id ? (artworks[id] || []) : []
  const wallArtworkCounts = [0, 1, 2, 3].map(
    wi => exhibitionArtworks.filter(a => a.wallIndex === wi).length
  )

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '16px',
        }}
      >
        加载展厅中...
      </div>
    )
  }

  if (!currentExhibition) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px', opacity: 0.5 }}>🔍</div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px', color: '#333' }}>展厅不存在</h3>
          <Link
            to="/galleries"
            style={{ color: '#6366F1', textDecoration: 'underline' }}
          >
            返回展厅列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <ExhibitionScene exhibition={currentExhibition} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '24px',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          maxWidth: '320px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'gap: 8px', marginBottom: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', background: currentExhibition.colorScheme.primary,
          }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>{currentExhibition.name}</h2>
            <p style={{ fontSize: '12px', color: '#888' }}>
              {currentExhibition.ownerName} 的展厅 · {exhibitionArtworks.length} 件作品</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>
          {isOwner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
              <span>🔒</span>
              <span>你是展厅主人，可拖拽调整作品位置</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🖱️</span>
              <span>拖拽旋转视角 · 点击作品查看详情</span>
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <button
          onClick={() => setShowUpload(true)}
          style={{
            position: 'absolute',
            top: '80px',
            right: '24px',
            padding: '14px 24px',
            borderRadius: '100px',
            background: '#1A1A1A',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'all 0.3s',
            zIndex: 10,
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
          上传作品
        </button>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '100px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {WALL_NAMES.map((name, i) => (
          <div
            key={i}
            style={{
              padding: '8px 16px',
              borderRadius: '100px',
              background: 'transparent',
              color: '#444',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span>{name}</span>
            <span
              style={{
                padding: '1px 7px',
                borderRadius: '100px',
                background: 'rgba(99,102,241,0.15',
                color: '#6366F1',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {wallArtworkCounts[i]}
            </span>
          </div>
        ))}
      </div>

      {currentArtwork && (
        <ArtworkModal
          artwork={currentArtwork}
          onClose={() => setCurrentArtwork(null)}
          onDelete={isOwner ? handleDeleteArtwork : undefined}
          isOwner={isOwner}
        />
      )}

      {showUpload && (
        <div
          onClick={() => setShowUpload(false)}
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>上传艺术作品</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
              支持 JPG / PNG / WebP，单张最大 5MB
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #d5d5d5',
                borderRadius: '16px',
                padding: previewUrl ? '16px' : '40px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '20px',
                background: '#fafafa',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.background = 'rgba(99,102,241,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d5d5d5'
                e.currentTarget.style.background = '#fafafa'
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '240px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🖼️</div>
                  <div style={{ fontSize: '15px', color: '#333', fontWeight: 500, marginBottom: '4px' }}>
                    点击或拖拽图片到此处
                  </div>
                  <div style={{ fontSize: '13px', color: '#aaa' }}>
                    JPG / PNG / WebP · 最大 5MB
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>
                  作品标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：清晨的森林"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    background: '#fafafa',
                    transition: 'border-color 0.2s',
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
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>
                  作者
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={user?.username || '留空使用用户名'}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    background: '#fafafa',
                    transition: 'border-color 0.2s',
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
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>
                  作品描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述作品的创作灵感、技巧或背景..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    background: '#fafafa',
                    transition: 'border-color 0.2s',
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
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>
                  放置墙面
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {WALL_NAMES.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedWall(i)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: selectedWall === i ? '2px solid #6366F1' : '1px solid #e5e5e5',
                        background: selectedWall === i ? 'rgba(99,102,241,0.06)' : '#fafafa',
                        color: selectedWall === i ? '#6366F1' : '#444',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setTitle('')
                  setAuthor('')
                  setDescription('')
                  setSelectedWall(0)
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !title.trim() || uploading}
                style={{
                  padding: '12px 28px',
                  borderRadius: '100px',
                  background: (selectedFile && title.trim() && !uploading) ? '#6366F1' : '#ccc',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: (selectedFile && title.trim() && !uploading) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedFile && title.trim() && !uploading) e.currentTarget.style.background = '#5558E8'
                }}
                onMouseLeave={(e) => {
                  if (selectedFile && title.trim() && !uploading) e.currentTarget.style.background = '#6366F1'
                }}
              >
                  {uploading ? '上传中...' : '上传作品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
