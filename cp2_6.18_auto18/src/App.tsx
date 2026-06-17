import { useState, useEffect } from 'react'
import ColorPicker from '@/modules/colorPicker'
import ComponentPreview from '@/modules/componentPreview'
import { copyCSSToClipboard, generateCSSVariables } from '@/modules/codeExport'
import { useColorStore } from '@/store/useColorStore'
import type { SavedScheme } from '@/store/useColorStore'
import { Star, Copy, ChevronUp, Trash2 } from 'lucide-react'

function Toast() {
  const toastMessage = useColorStore(s => s.toastMessage)
  const toastVisible = useColorStore(s => s.toastVisible)

  if (!toastVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1A1A2E',
        color: '#fff',
        padding: '10px 24px',
        borderRadius: 8,
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 9999,
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      {toastMessage}
    </div>
  )
}

function CodeExportPanel() {
  const colorScheme = useColorStore(s => s.colorScheme)
  const showToast = useColorStore(s => s.showToast)
  const [code, setCode] = useState('')

  useEffect(() => {
    setCode(generateCSSVariables())
  }, [colorScheme])

  const handleCopy = async () => {
    await copyCSSToClipboard()
    showToast('已复制!')
  }

  return (
    <div
      style={{
        background: '#1A1A2E',
        borderRadius: 12,
        padding: '16px',
        width: '100%',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>CSS 变量代码</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <Copy size={14} />
          复制
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          color: '#A5F3FC',
          fontSize: '12px',
          lineHeight: 1.7,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: 180,
          overflow: 'auto',
        }}
      >
        {code}
      </pre>
    </div>
  )
}

function FavoritesSidebar() {
  const savedSchemes = useColorStore(s => s.savedSchemes)
  const removeScheme = useColorStore(s => s.removeScheme)
  const applyScheme = useColorStore(s => s.applyScheme)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 180px)',
        paddingRight: '4px',
      }}
    >
      {savedSchemes.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', padding: '20px 0' }}>
          暂无收藏方案
        </div>
      )}
      {savedSchemes.map((scheme: SavedScheme) => (
        <div
          key={scheme.id}
          onClick={() => applyScheme(scheme)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
            transition: 'box-shadow 0.3s ease, transform 0.15s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: scheme.primary,
              flexShrink: 0,
              transition: 'background 0.3s ease',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scheme.name}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>
              {scheme.primary.toUpperCase()}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); removeScheme(scheme.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '2px', display: 'flex', transition: 'color 0.3s ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const isStarred = useColorStore(s => s.isStarred)
  const toggleStar = useColorStore(s => s.toggleStar)
  const showToast = useColorStore(s => s.showToast)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleExport = async () => {
    await copyCSSToClipboard()
    showToast('已复制!')
  }

  const handleStar = () => {
    toggleStar()
    if (!isStarred) {
      showToast('已收藏配色方案')
    }
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#E8ECF1', padding: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A2E', margin: 0 }}>ColorHarmony</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>交互式配色方案探索工具</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <ColorPicker />
          </div>

          <div style={{ background: '#F0F0F5', borderRadius: 16, padding: 24, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>组件预览</span>
              <button
                onClick={handleStar}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', transition: 'color 0.3s ease' }}
              >
                <Star size={22} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#CCCCCC'} />
              </button>
            </div>
            <ComponentPreview />
          </div>

          <CodeExportPanel />

          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: '#F4F4F9',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '14px',
              color: '#1A1A2E',
              fontWeight: 600,
            }}
          >
            <ChevronUp size={16} style={{ transform: mobileDrawerOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }} />
            收藏方案
          </button>

          {mobileDrawerOpen && (
            <div style={{ background: '#F4F4F9', borderRadius: 12, padding: 16, maxHeight: 300, overflow: 'auto' }}>
              <FavoritesSidebar />
            </div>
          )}
        </div>
        <Toast />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E8ECF1', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A2E', margin: 0 }}>ColorHarmony</h1>
        <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '4px' }}>交互式配色方案探索工具</span>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '0 24px 24px', minHeight: 0 }}>
        <div
          style={{
            width: 340,
            flexShrink: 0,
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E', marginBottom: '16px' }}>取色面板</div>
          <ColorPicker />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 480,
            background: '#F0F0F5',
            borderRadius: 16,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>组件预览</span>
            <button
              onClick={handleStar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                transition: 'color 0.3s ease',
              }}
            >
              <Star size={24} fill={isStarred ? '#FFD700' : 'none'} color={isStarred ? '#FFD700' : '#CCCCCC'} />
            </button>
          </div>
          <ComponentPreview />
          <CodeExportPanel />
          <button
            onClick={handleExport}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              background: '#1A1A2E',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.3s ease',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Copy size={16} />
            导出CSS变量
          </button>
        </div>

        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: '#F4F4F9',
            borderRadius: 12,
            padding: 16,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginBottom: '12px' }}>
            收藏方案
          </div>
          <FavoritesSidebar />
        </div>
      </div>
      <Toast />
    </div>
  )
}
