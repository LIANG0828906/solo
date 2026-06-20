import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useColorState } from '@ColorModule/ColorStateContext'
import type { SavedScheme } from '@ColorModule/types'
import './CollectionsDrawer.css'

interface SchemeCardProps {
  scheme: SavedScheme
  onLoad: () => void
  onDelete: () => void
}

const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, onLoad, onDelete }) => {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="scheme-card"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button className="scheme-card-main" onClick={onLoad}>
        <div
          className="scheme-preview"
          style={{
            background: `linear-gradient(90deg, ${scheme.previewColors.join(', ')})`,
          }}
        />
        <div className="scheme-info">
          <h4 className="scheme-name">{scheme.name}</h4>
          <p className="scheme-date">
            {format(scheme.createdAt, 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
        <div className="scheme-params">
          <span>H: {scheme.params.hueRotate}°</span>
          <span>S: {scheme.params.saturation > 0 ? '+' : ''}{scheme.params.saturation}</span>
          <span>B: {scheme.params.brightness > 0 ? '+' : ''}{scheme.params.brightness}</span>
          <span>C: {scheme.params.contrast > 0 ? '+' : ''}{scheme.params.contrast}</span>
        </div>
      </button>
      {showDelete && (
        <button className="delete-scheme-btn" onClick={onDelete}>
          ×
        </button>
      )}
    </div>
  )
}

const CollectionsDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { savedSchemes, loadScheme, deleteScheme, playClickSound } = useColorState()
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        playClickSound()
      }
    }

    const handleSchemeSaved = () => {
      setIsOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('schemeSaved', handleSchemeSaved)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('schemeSaved', handleSchemeSaved)
    }
  }, [isOpen, playClickSound])

  return (
    <>
      <button
        className={`drawer-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen)
          playClickSound()
        }}
      >
        <svg
          className="drawer-icon"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="drawer-label">我的收藏夹</span>
        {savedSchemes.length > 0 && (
          <span className="drawer-badge">{savedSchemes.length}</span>
        )}
      </button>

      <div
        ref={drawerRef}
        className={`collections-drawer ${isOpen ? 'open' : ''}`}
      >
        <div className="drawer-header">
          <h3 className="drawer-title">调色方案收藏夹</h3>
          <p className="drawer-subtitle">
            共 {savedSchemes.length} 个方案 · 点击卡片加载
          </p>
        </div>

        <div className="drawer-content">
          {savedSchemes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 4L28 16L40 16L30 24L34 36L24 28L14 36L18 24L8 16L20 16L24 4Z"
                    stroke="url(#emptyGradient)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="empty-text">暂无收藏方案</p>
              <p className="empty-hint">调整参数后点击"保存当前方案"添加</p>
            </div>
          ) : (
            <div className="schemes-grid">
              {[...savedSchemes].reverse().map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onLoad={() => {
                    loadScheme(scheme)
                    playClickSound()
                    const event = new CustomEvent('schemeLoaded', { detail: scheme })
                    window.dispatchEvent(event)
                  }}
                  onDelete={() => {
                    deleteScheme(scheme.id)
                    playClickSound()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => {
            setIsOpen(false)
            playClickSound()
          }}
        />
      )}
    </>
  )
}

export default CollectionsDrawer
