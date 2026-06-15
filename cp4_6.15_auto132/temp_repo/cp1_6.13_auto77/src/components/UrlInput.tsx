import React, { useState, useEffect, useCallback } from 'react'

interface UrlInputProps {
  onAdd: (url: string) => void
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return ''
  }
}

function isValidUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const UrlInput: React.FC<UrlInputProps> = ({ onAdd }) => {
  const [value, setValue] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isValidUrl(value)) {
        setPreviewUrl(value)
      } else {
        setPreviewUrl('')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  const handleAdd = useCallback(() => {
    const trimmed = value.trim()
    if (isValidUrl(trimmed)) {
      onAdd(trimmed)
      setValue('')
      setPreviewUrl('')
    }
  }, [value, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const domain = extractDomain(previewUrl)
  const favicon = previewUrl
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : ''

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="粘贴 URL 链接，例如 https://example.com"
          style={{
            flex: 1,
            height: 52,
            padding: '0 20px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 15,
            outline: 'none',
            transition: 'all 0.25s ease',
            boxShadow: '0 0 8px rgba(100,149,237,0.3)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(100,149,237,0.8)'
            e.currentTarget.style.boxShadow = '0 0 14px rgba(100,149,237,0.6)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
            e.currentTarget.style.boxShadow = '0 0 8px rgba(100,149,237,0.3)'
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            height: 52,
            padding: '0 28px',
            backgroundColor: 'rgba(100,149,237,0.85)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(100,149,237,1)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(100,149,237,0.85)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          添加
        </button>
      </div>

      {previewUrl && domain && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            opacity: 0.75,
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <img
            src={favicon}
            alt=""
            width={20}
            height={20}
            style={{
              borderRadius: 4,
              backgroundColor: '#fff',
            }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = 'hidden'
            }}
          />
          <span style={{ color: '#fff', fontSize: 13 }}>{domain}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 0.75; transform: translateY(0); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.35);
        }
      `}</style>
    </div>
  )
}

export default UrlInput
