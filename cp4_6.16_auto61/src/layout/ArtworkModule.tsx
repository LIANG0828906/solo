import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useStore from '../store/useStore'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Artwork, ArtworkStatus, TransferType } from '../types'

const statusLabels: Record<ArtworkStatus, string> = {
  [ArtworkStatus.IN_STOCK]: '在库',
  [ArtworkStatus.LENT_OUT]: '借出',
  [ArtworkStatus.ON_EXHIBITION]: '展出',
  [ArtworkStatus.DAMAGED]: '损坏'
}

const statusColors: Record<ArtworkStatus, { bg: string; text: string; dot: string }> = {
  [ArtworkStatus.IN_STOCK]: { bg: 'rgba(74, 139, 92, 0.1)', text: '#4A8B5C', dot: '#4A8B5C' },
  [ArtworkStatus.LENT_OUT]: { bg: 'rgba(194, 84, 80, 0.1)', text: '#C25450', dot: '#C25450' },
  [ArtworkStatus.ON_EXHIBITION]: { bg: 'rgba(212, 160, 90, 0.12)', text: '#D4A05A', dot: '#D4A05A' },
  [ArtworkStatus.DAMAGED]: { bg: 'rgba(107, 107, 138, 0.1)', text: '#6B6B8A', dot: '#6B6B8A' }
}

const Toast: React.FC<{ message: string; id: number }> = ({ message }) => (
  <div className="app-toast">{message}</div>
)

const SwipeConfirm: React.FC<{
  onConfirm: () => void
  onCancel: () => void
}> = ({ onConfirm, onCancel }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [sliderX, setSliderX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [shake, setShake] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const startXRef = useRef(0)
  const trackWidthRef = useRef(0)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  useEffect(() => {
    if (trackRef.current) {
      trackWidthRef.current = trackRef.current.offsetWidth
    }
  }, [])

  const handleStart = (clientX: number) => {
    if (confirmed) return
    setIsDragging(true)
    startXRef.current = clientX - sliderX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging || confirmed) return
    const newX = Math.max(0, Math.min(
      clientX - startXRef.current,
      trackWidthRef.current - 56
    ))
    setSliderX(newX)
  }

  const handleEnd = () => {
    if (!isDragging || confirmed) return
    setIsDragging(false)
    const threshold = trackWidthRef.current - 80
    if (sliderX >= threshold) {
      setConfirmed(true)
      setSliderX(trackWidthRef.current - 56)
      setTimeout(() => {
        onConfirm()
      }, 200)
    } else {
      triggerShake()
      setSliderX(0)
    }
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 16
      }}>
        <p style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          marginBottom: 4
        }}>
          确认作品归还
        </p>
        <p style={{
          fontSize: 12,
          color: 'var(--color-text-muted)'
        }}>
          滑动右侧按钮至最右端确认
        </p>
      </div>

      <div
        ref={trackRef}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        style={{
          position: 'relative',
          height: 52,
          background: 'var(--color-warm-white-dim)',
          borderRadius: 26,
          overflow: 'hidden',
          cursor: 'pointer',
          userSelect: 'none',
          animation: shake ? 'shake 0.5s var(--ease-standard)' : undefined,
          border: '1px solid rgba(26, 26, 62, 0.06)'
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em',
          fontWeight: 500,
          transition: 'opacity 0.2s var(--ease-standard)',
          opacity: sliderX > 20 ? 0 : 1
        }}>
          → 滑动确认归还 →
        </div>

        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: confirmed
              ? 'linear-gradient(135deg, #4A8B5C 0%, #6DB37E 100%)'
              : 'linear-gradient(135deg, #D4A05A 0%, #E4B068 100%)',
            boxShadow: '0 2px 8px rgba(26, 26, 62, 0.15)',
            transform: `translateX(${sliderX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s var(--ease-standard)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 18
          }}
        >
          {confirmed ? '✓' : '→'}
        </div>

        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: sliderX + 28,
          background: confirmed
            ? 'linear-gradient(90deg, rgba(74, 139, 92, 0.2) 0%, rgba(74, 139, 92, 0.05) 100%)'
            : 'linear-gradient(90deg, rgba(212, 160, 90, 0.18) 0%, rgba(212, 160, 90, 0.02) 100%)',
          borderRadius: 26,
          transition: isDragging ? 'none' : 'width 0.3s var(--ease-standard)',
          pointerEvents: 'none'
        }} />
      </div>

      <button
        onClick={onCancel}
        style={{
          width: '100%',
          marginTop: 12,
          padding: '10px 0',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          transition: 'color 0.2s var(--ease-standard)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
      >
        取消
      </button>
    </div>
  )
}

const ImageUploader: React.FC<{
  currentImage?: string
  onImageChange: (dataUrl: string | undefined) => void
  showToast: (msg: string) => void
}> = ({ currentImage, onImageChange, showToast }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | undefined>(currentImage)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setPreview(currentImage)
  }, [currentImage])

  const validateAndProcess = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      showToast('仅支持 JPG 或 PNG 格式')
      return false
    }
    const maxSize = 8 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('图片大小不能超过 8MB')
      return false
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      onImageChange(dataUrl)
      showToast('图片已上传')
    }
    reader.readAsDataURL(file)
    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndProcess(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndProcess(file)
  }

  const handleRemove = () => {
    setPreview(undefined)
    onImageChange(undefined)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        width: '100%',
        height: 140,
        borderRadius: 'var(--radius-md)',
        border: `2px dashed ${isDragging ? 'var(--color-amber-gold)' : 'var(--color-border)'}`,
        background: isDragging ? 'rgba(212, 160, 90, 0.04)' : 'var(--color-warm-white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'all 0.2s var(--ease-standard)',
        cursor: 'pointer'
      }}
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="预览"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove() }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(26, 26, 62, 0.8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'all 0.2s var(--ease-standard)'
            }}
          >
            ×
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 28,
            marginBottom: 6,
            color: 'var(--color-text-muted)',
            opacity: 0.6
          }}>
            ⧉
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            marginBottom: 2
          }}>
            点击或拖拽上传作品图片
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            opacity: 0.7
          }}>
            JPG / PNG · 最大 8MB
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}

const CreateArtworkModal: React.FC<{
  onClose: () => void
  showToast: (msg: string) => void
}> = ({ onClose, showToast }) => {
  const { addArtwork } = useStore()
  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [material, setMaterial] = useState('')
  const [status, setStatus] = useState<ArtworkStatus>(ArtworkStatus.IN_STOCK)
  const [image, setImage] = useState<string | undefined>(undefined)

  const handleSubmit = () => {
    if (!name.trim() || !artist.trim()) {
      showToast('请填写作品名称和艺术家')
      return
    }
    addArtwork({
      name: name.trim(),
      artist: artist.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      material: material.trim(),
      image,
      status
    })
    showToast('作品已添加')
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 62, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 0.35s var(--ease-standard)'
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>添加新作品</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          将作品录入作品库
        </p>

        <div style={{ marginBottom: 16 }}>
          <label className="label-text">作品图片</label>
          <ImageUploader
            currentImage={image}
            onImageChange={setImage}
            showToast={showToast}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="label-text">作品名称 *</label>
          <input
            className="input-field"
            placeholder="如：霓虹都市·雨夜"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label-text">艺术家 *</label>
            <input
              className="input-field"
              placeholder="艺术家姓名"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">创作年份</label>
            <input
              className="input-field"
              type="number"
              placeholder="2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="label-text">材质</label>
          <input
            className="input-field"
            placeholder="如：布面丙烯、纸本水墨..."
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label className="label-text">当前状态</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(statusLabels) as ArtworkStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.2s var(--ease-standard)',
                  background: status === s ? statusColors[s].bg : 'var(--color-warm-white)',
                  color: status === s ? statusColors[s].text : 'var(--color-text-secondary)',
                  border: `1px solid ${status === s ? statusColors[s].dot : 'var(--color-border)'}`
                }}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>添加作品</button>
        </div>
      </div>
    </div>
  )
}

const LendModal: React.FC<{
  artwork: Artwork
  onClose: () => void
  showToast: (msg: string) => void
}> = ({ artwork, onClose, showToast }) => {
  const { lendArtwork } = useStore()
  const [institution, setInstitution] = useState('')
  const [lendDate, setLendDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!institution.trim() || !lendDate || !expectedReturnDate) {
      showToast('请填写完整借出信息')
      return
    }
    lendArtwork(artwork.id, {
      date: lendDate,
      institution: institution.trim(),
      expectedReturnDate,
      notes: notes.trim() || undefined
    })
    showToast('作品已登记借出')
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 62, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          width: '100%',
          maxWidth: 440,
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 0.35s var(--ease-standard)'
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>作品借出登记</h2>
        <p style={{
          fontSize: 13,
          color: 'var(--color-text-muted)',
          marginBottom: 6
        }}>
          {artwork.name}
        </p>
        <p style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          opacity: 0.8,
          marginBottom: 20
        }}>
          by {artwork.artist}
        </p>

        <div style={{ marginBottom: 14 }}>
          <label className="label-text">借入机构 *</label>
          <input
            className="input-field"
            placeholder="博物馆/画廊/机构名称"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="label-text">借出日期 *</label>
            <input
              type="date"
              className="input-field"
              value={lendDate}
              onChange={(e) => setLendDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">预计归还 *</label>
            <input
              type="date"
              className="input-field"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label className="label-text">备注</label>
          <textarea
            className="input-field"
            placeholder="展览名称、特殊要求等..."
            style={{ resize: 'vertical', minHeight: 70 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>确认借出</button>
        </div>
      </div>
    </div>
  )
}

const ArtworkDetailModal: React.FC<{
  artwork: Artwork
  onClose: () => void
  showToast: (msg: string) => void
}> = ({ artwork, onClose, showToast }) => {
  const { returnArtwork } = useStore()
  const [showLendModal, setShowLendModal] = useState(false)
  const [showReturnConfirm, setShowReturnConfirm] = useState<string | null>(null)
  const touchStartY = useRef<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 300)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      if (deltaY > 100) {
        handleClose()
      }
    }
    touchStartY.current = null
  }

  const activeLendRecord = artwork.transferRecords.find(
    r => r.type === TransferType.LEND && !r.returned
  )

  const handleReturnConfirm = (transferId: string) => {
    returnArtwork(artwork.id, transferId)
    setShowReturnConfirm(null)
    showToast('作品已归还入库')
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 62, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          animation: isClosing ? 'slideDown 0.3s var(--ease-standard) forwards' : 'slideUp 0.4s var(--ease-standard)',
          marginTop: 'auto'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 8px',
          display: window.innerWidth <= 480 ? 'flex' : 'none'
        }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-border)'
          }} />
        </div>

        <div style={{ padding: '16px 32px 32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8
              }}>
                <h2 style={{ fontSize: 24, fontWeight: 600 }}>{artwork.name}</h2>
                <span style={{
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 50,
                  background: statusColors[artwork.status].bg,
                  color: statusColors[artwork.status].text,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusColors[artwork.status].dot
                  }} />
                  {statusLabels[artwork.status]}
                </span>
              </div>
              <p style={{
                fontSize: 14,
                color: 'var(--color-text-secondary)'
              }}>
                {artwork.artist} · {artwork.year}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 22,
                transition: 'all 0.2s var(--ease-standard)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(26, 26, 62, 0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 280px) 1fr',
            gap: 28,
            marginBottom: 28
          }}>
            {artwork.image ? (
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: 'var(--color-warm-white-dim)'
              }}>
                <img
                  src={artwork.image}
                  alt={artwork.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-warm-white-dim) 0%, rgba(26, 26, 62, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 40,
                opacity: 0.5
              }}>
                ⧉
              </div>
            )}

            <div>
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.05em',
                  marginBottom: 4
                }}>
                  材质
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {artwork.material || '—'}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.05em',
                  marginBottom: 4
                }}>
                  入库时间
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {format(parseISO(artwork.createdAt), 'yyyy年M月d日', { locale: zhCN })}
                </div>
              </div>

              {artwork.status === ArtworkStatus.IN_STOCK && (
                <button
                  className="btn-primary"
                  onClick={() => setShowLendModal(true)}
                  style={{ width: '100%' }}
                >
                  发起借出
                </button>
              )}

              {artwork.status === ArtworkStatus.LENT_OUT && activeLendRecord && !showReturnConfirm && (
                <div style={{
                  padding: 16,
                  background: 'rgba(194, 84, 80, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(194, 84, 80, 0.12)'
                }}>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    marginBottom: 4
                  }}>
                    当前借入机构
                  </div>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    marginBottom: 10
                  }}>
                    {activeLendRecord.institution}
                  </div>
                  {activeLendRecord.expectedReturnDate && (
                    <div style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      marginBottom: 12
                    }}>
                      预计归还：{format(parseISO(activeLendRecord.expectedReturnDate), 'yyyy年M月d日', { locale: zhCN })}
                    </div>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => setShowReturnConfirm(activeLendRecord.id)}
                    style={{ width: '100%', background: 'var(--color-success)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#5DA06E' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-success)' }}
                  >
                    作品已归还
                  </button>
                </div>
              )}

              {showReturnConfirm && (
                <SwipeConfirm
                  onConfirm={() => handleReturnConfirm(showReturnConfirm)}
                  onCancel={() => setShowReturnConfirm(null)}
                />
              )}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.04em',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: '1px solid var(--color-border-light)'
            }}>
              流转记录
            </div>

            {artwork.transferRecords.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: 'var(--color-text-muted)',
                fontSize: 13
              }}>
                暂无流转记录
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  bottom: 6,
                  width: 2,
                  background: 'linear-gradient(180deg, var(--color-border) 0%, var(--color-border-light) 100%)',
                  borderRadius: 1
                }} />
                {[...artwork.transferRecords].reverse().map((record, idx) => (
                  <div
                    key={record.id}
                    style={{
                      position: 'relative',
                      paddingBottom: idx < artwork.transferRecords.length - 1 ? 24 : 0,
                      animation: `fadeIn 0.4s var(--ease-standard) both`,
                      animationDelay: `${idx * 80}ms`
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: -20,
                      top: 4,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: record.type === TransferType.LEND
                        ? 'var(--color-danger)'
                        : 'var(--color-success)',
                      border: '3px solid white',
                      boxShadow: '0 1px 4px rgba(26, 26, 62, 0.15)'
                    }} />
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      marginBottom: 4
                    }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: record.type === TransferType.LEND
                          ? 'var(--color-danger)'
                          : 'var(--color-success)',
                        letterSpacing: '0.03em'
                      }}>
                        {record.type === TransferType.LEND ? '借出' : '归还'}
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--color-text-muted)'
                      }}>
                        {format(parseISO(record.date), 'yyyy.MM.dd', { locale: zhCN })}
                      </span>
                    </div>
                    {record.institution && (
                      <div style={{
                        fontSize: 13,
                        color: 'var(--color-text-primary)',
                        marginBottom: 2
                      }}>
                        {record.institution}
                      </div>
                    )}
                    {record.notes && (
                      <div style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5
                      }}>
                        {record.notes}
                      </div>
                    )}
                    {record.type === TransferType.LEND && record.expectedReturnDate && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        marginTop: 2
                      }}>
                        预计归还：{format(parseISO(record.expectedReturnDate), 'yyyy.MM.dd', { locale: zhCN })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLendModal && (
        <LendModal
          artwork={artwork}
          onClose={() => setShowLendModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

const FilterBar: React.FC<{
  statusFilter: ArtworkStatus | 'all'
  artistFilter: string
  searchQuery: string
  artists: string[]
  onStatusChange: (s: ArtworkStatus | 'all') => void
  onArtistChange: (a: string) => void
  onSearchChange: (q: string) => void
}> = ({
  statusFilter,
  artistFilter,
  searchQuery,
  artists,
  onStatusChange,
  onArtistChange,
  onSearchChange
}) => {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="input-field" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          cursor: 'text'
        }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>⌕</span>
          <input
            placeholder="搜索作品名称、艺术家..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: 14,
              background: 'transparent'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onStatusChange('all')}
          style={{
            padding: '7px 14px',
            borderRadius: 50,
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.2s var(--ease-standard)',
            background: statusFilter === 'all' ? 'var(--color-indigo-deep)' : 'transparent',
            color: statusFilter === 'all' ? 'white' : 'var(--color-text-secondary)',
            border: `1px solid ${statusFilter === 'all' ? 'var(--color-indigo-deep)' : 'var(--color-border)'}`
          }}
        >
          全部
        </button>
        {(Object.keys(statusLabels) as ArtworkStatus[]).map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            style={{
              padding: '7px 14px',
              borderRadius: 50,
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s var(--ease-standard)',
              background: statusFilter === s ? statusColors[s].bg : 'transparent',
              color: statusFilter === s ? statusColors[s].text : 'var(--color-text-secondary)',
              border: `1px solid ${statusFilter === s ? statusColors[s].dot : 'var(--color-border)'}`
            }}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      <select
        className="input-field"
        style={{ width: 'auto', minWidth: 140, fontSize: 13 }}
        value={artistFilter}
        onChange={(e) => onArtistChange(e.target.value)}
      >
        <option value="">全部艺术家</option>
        {artists.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}

const ArtworkCard: React.FC<{
  artwork: Artwork
  onClick: () => void
  index: number
}> = ({ artwork, onClick, index }) => {
  return (
    <div
      onClick={onClick}
      className="card-hover fade-in-item"
      style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: `${index * 40}ms`
      }}
    >
      <div style={{
        aspectRatio: '4/3',
        background: 'linear-gradient(135deg, var(--color-warm-white-dim) 0%, rgba(26, 26, 62, 0.06) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {artwork.image ? (
          <img
            src={artwork.image}
            alt={artwork.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s var(--ease-standard)'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 36,
            opacity: 0.4
          }}>
            ⧉
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '3px 10px',
          borderRadius: 50,
          fontSize: 11,
          fontWeight: 500,
          background: statusColors[artwork.status].bg,
          color: statusColors[artwork.status].text,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: statusColors[artwork.status].dot
          }} />
          {statusLabels[artwork.status]}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {artwork.name}
        </div>
        <div style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          marginBottom: 6
        }}>
          {artwork.artist} · {artwork.year}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {artwork.material || '—'}
        </div>
      </div>
    </div>
  )
}

const ArtworkModule: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { artworks, exhibitions } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ArtworkStatus | 'all'>('all')
  const [artistFilter, setArtistFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])
  const [filterKey, setFilterKey] = useState(0)

  const showToast = (message: string) => {
    const toastId = Date.now()
    setToasts(prev => [...prev, { id: toastId, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }, 2500)
  }

  const artists = useMemo(() => {
    return [...new Set(artworks.map(a => a.artist))].sort()
  }, [artworks])

  const filteredArtworks = useMemo(() => {
    let result = [...artworks]
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    if (artistFilter) {
      result = result.filter(a => a.artist === artistFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.material.toLowerCase().includes(q)
      )
    }
    return result
  }, [artworks, statusFilter, artistFilter, searchQuery, filterKey])

  useEffect(() => {
    setFilterKey(k => k + 1)
  }, [statusFilter, artistFilter, searchQuery])

  const selectedArtwork = id
    ? artworks.find(a => a.id === id)
    : null

  return (
    <div style={{ padding: 32, maxWidth: 1600, margin: '0 auto' }} className="main-content">
      {toasts.map(t => <Toast key={t.id} message={t.message} id={t.id} />)}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
            作品库
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            共 {artworks.length} 件作品 · {filteredArtworks.length} 件匹配
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + 添加作品
        </button>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        artistFilter={artistFilter}
        searchQuery={searchQuery}
        artists={artists}
        onStatusChange={setStatusFilter}
        onArtistChange={setArtistFilter}
        onSearchChange={setSearchQuery}
      />

      {filteredArtworks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 80,
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 12,
            color: 'var(--color-text-muted)',
            opacity: 0.5
          }}>
            ⧉
          </div>
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            marginBottom: 16
          }}>
            没有找到匹配的作品
          </p>
          <button className="btn-ghost" onClick={() => {
            setStatusFilter('all')
            setArtistFilter('')
            setSearchQuery('')
          }}>
            清除筛选条件
          </button>
        </div>
      ) : (
        <div
          key={filterKey}
          className="artwork-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20
          }}
        >
          {filteredArtworks.map((artwork, idx) => (
            <ArtworkCard
              key={`${artwork.id}-${filterKey}`}
              artwork={artwork}
              onClick={() => navigate(`/artworks/${artwork.id}`)}
              index={idx}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateArtworkModal
          onClose={() => setShowCreateModal(false)}
          showToast={showToast}
        />
      )}

      {selectedArtwork && (
        <ArtworkDetailModal
          artwork={selectedArtwork}
          onClose={() => navigate('/artworks')}
          showToast={showToast}
        />
      )}
    </div>
  )
}

export default ArtworkModule
