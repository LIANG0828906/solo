import React, { useState } from 'react'
import { Share2, Link, Check } from 'lucide-react'
import { PALETTE_COLORS } from './Palette'

interface ShareBarProps {
  gridData: string[][]
}

const GRID_SIZE = 16

const encodeGridData = (gridData: string[][]): string => {
  const colorToIndex = new Map(PALETTE_COLORS.map((c, i) => [c, i]))
  const indices: number[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = gridData[y]?.[x] || '#FFFFFF'
      indices.push(colorToIndex.get(color) ?? 11)
    }
  }
  const bytes = new Uint8Array(Math.ceil(indices.length / 2))
  for (let i = 0; i < indices.length; i += 2) {
    bytes[i / 2] = (indices[i] << 4) | (indices[i + 1] ?? 0)
  }
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

export const decodeGridData = (encoded: string): string[][] | null => {
  try {
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const indices: number[] = []
    for (let i = 0; i < bytes.length; i++) {
      indices.push((bytes[i] >> 4) & 0x0f)
      indices.push(bytes[i] & 0x0f)
    }
    const gridData: string[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: string[] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = indices[y * GRID_SIZE + x]
        row.push(PALETTE_COLORS[idx] ?? '#FFFFFF')
      }
      gridData.push(row)
    }
    return gridData
  } catch {
    return null
  }
}

const ShareBar: React.FC<ShareBarProps> = ({ gridData }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const generateLink = () => {
    const encoded = encodeGridData(gridData)
    const url = `${window.location.origin}${window.location.pathname}?art=${encoded}`
    window.history.replaceState({}, '', url)
    return url
  }

  const handleCopy = async () => {
    const url = generateLink()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.2s ease-out',
            transform: 'scale(1)',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
        >
          <Share2 size={18} />
          <span className="share-text">分享涂鸦</span>
        </button>

        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: `translateY(-50%) translateX(${isExpanded ? '10px' : '-20px'})`,
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? 'visible' : 'hidden',
            transition: 'all 0.2s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.filter = 'brightness(1)'
            }}
          >
            <Link size={16} />
            <span className="share-text">生成链接</span>
          </button>
        </div>
      </div>

      {showToast && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '12px',
            padding: '10px 18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.2s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          <Check size={16} />
          链接已复制到剪贴板
        </div>
      )}
    </div>
  )
}

export default ShareBar
