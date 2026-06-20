import React, { useState, useCallback, useRef } from 'react'
import { useGalleryStore } from './store'

const Toolbar: React.FC = () => {
  const filterActive = useGalleryStore((s) => s.filterActive)
  const deleteCurrent = useGalleryStore((s) => s.deleteCurrent)
  const toggleFilter = useGalleryStore((s) => s.toggleFilter)
  const images = useGalleryStore((s) => s.images)
  const currentIndex = useGalleryStore((s) => s.currentIndex)
  const deletedIds = useGalleryStore((s) => s.deletedIds)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [pressedBtn, setPressedBtn] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const visibleImages = images.filter((img) => !deletedIds.has(img.id))
  const hasImages = visibleImages.length > 0

  const handleDeleteClick = useCallback(() => {
    if (!hasImages) return
    setShowConfirm(true)
  }, [hasImages])

  const handleConfirmDelete = useCallback(() => {
    deleteCurrent()
    setShowConfirm(false)
  }, [deleteCurrent])

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(false)
  }, [])

  const handleShareClick = useCallback(async () => {
    if (!hasImages) return
    const currentImg = visibleImages[currentIndex]
    if (!currentImg) return

    try {
      const response = await fetch(currentImg.url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current)
      }
      setShowToast(true)
      toastTimer.current = window.setTimeout(() => {
        setShowToast(false)
        URL.revokeObjectURL(blobUrl)
      }, 2000)

      if (navigator.share) {
        try {
          await navigator.share({
            title: '分享图片',
            files: [new File([blob], 'image.jpg', { type: blob.type })]
          })
        } catch {
          // 用户取消分享，忽略错误
        }
      }
    } catch {
      // 生成 blob URL 失败，忽略
    }
  }, [hasImages, visibleImages, currentIndex])

  const createButton = (
    id: string,
    color: string,
    onClick: () => void,
    icon: React.ReactNode,
    disabled: boolean = false
  ) => (
    <button
      onTouchStart={() => !disabled && setPressedBtn(id)}
      onTouchEnd={() => setPressedBtn(null)}
      onTouchCancel={() => setPressedBtn(null)}
      onMouseDown={() => !disabled && setPressedBtn(id)}
      onMouseUp={() => setPressedBtn(null)}
      onMouseLeave={() => setPressedBtn(null)}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: color,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform: pressedBtn === id ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 150ms ease-out, opacity 150ms ease-out',
        padding: 0,
        position: 'relative'
      }}
    >
      {icon}
    </button>
  )

  const deleteIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 6H5H21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6L18 20C18 20.5304 17.7893 21.0391 17.4142 21.4142C17.0391 21.7893 16.5304 22 16 22H8C7.46957 22 6.96086 21.7893 6.58579 21.4142C6.21071 21.0391 6 20.5304 6 20L5 6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const filterIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 6H20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 12H17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 18H14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )

  const shareIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6L12 2L8 6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2V15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 40,
          background: '#2C2C34',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 20px',
          zIndex: 10
        }}
      >
        {createButton('delete', '#FF4D4D', handleDeleteClick, deleteIcon, !hasImages)}
        {createButton('filter', filterActive ? '#2563EB' : '#4A90D9', toggleFilter, filterIcon, !hasImages)}
        {createButton('share', '#4CAF50', handleShareClick, shareIcon, !hasImages)}
      </div>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              background: '#2C2C34',
              borderRadius: 12,
              padding: 24,
              minWidth: 280,
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: '#FFF', fontSize: 16, marginBottom: 20 }}>确定删除这张图片吗？</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  background: '#555',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  background: '#FF4D4D',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: '#FFF',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            zIndex: 200,
            pointerEvents: 'none',
            animation: 'toastFade 200ms ease-out'
          }}
        >
          图片链接已生成
        </div>
      )}

      <style>{`
        @keyframes toastFade {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}

export default Toolbar
