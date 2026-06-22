import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useColorStore } from '../store'
import { colorblindLabels } from '../utils/colorblind'
import { formatDate } from '../utils/colorUtils'
import type { ColorblindMode } from '../types'

export default function DetailPanel() {
  const selectedScheme = useColorStore((state) => state.selectedScheme)
  const selectScheme = useColorStore((state) => state.selectScheme)
  const removeFavorite = useColorStore((state) => state.removeFavorite)
  const updateFavoriteName = useColorStore((state) => state.updateFavoriteName)
  const colorblindMode = useColorStore((state) => state.colorblindMode)
  const setColorblindMode = useColorStore((state) => state.setColorblindMode)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')

  const gradientPreview = useMemo(() => {
    if (!selectedScheme) return ''
    const colors = selectedScheme.colors
    return `linear-gradient(135deg, ${colors.join(', ')})`
  }, [selectedScheme])

  const handleCopyColor = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleExportCSS = () => {
    if (!selectedScheme) return
    const cssVars = selectedScheme.colors
      .map((color, i) => `  --color-${i + 1}: ${color};`)
      .join('\n')
    const css = `:root {\n${cssVars}\n}`
    navigator.clipboard.writeText(css)
  }

  const handleStartEdit = () => {
    if (!selectedScheme) return
    setTempName(selectedScheme.name)
    setEditingName(true)
  }

  const handleSaveName = () => {
    if (!selectedScheme || !tempName.trim()) return
    updateFavoriteName(selectedScheme.id, tempName.trim())
    setEditingName(false)
  }

  const handleDelete = () => {
    if (!selectedScheme) return
    if (confirm('确定要删除这个配色方案吗？')) {
      removeFavorite(selectedScheme.id)
    }
  }

  return (
    <AnimatePresence>
      {selectedScheme && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: 320,
            backgroundColor: 'rgba(30, 30, 30, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderLeft: '1px solid var(--border-color)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: 20,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>方案详情</h2>
            <button
              onClick={() => selectScheme(null)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--accent-primary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>
            ) : (
              <div
                onClick={handleStartEdit}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  margin: '-4px -8px'
                }}
              >
                {selectedScheme.name}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>点击编辑</span>
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              创建时间：{formatDate(selectedScheme.createdAt)}
            </div>

            <div
              style={{
                width: '100%',
                height: 120,
                borderRadius: 12,
                background: gradientPreview,
                boxShadow: 'var(--shadow-sm)'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>色值</h3>
              {selectedScheme.colors.map((color, index) => (
                <motion.div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}
                  whileHover={{ backgroundColor: '#333' }}
                  onClick={() => handleCopyColor(color, index)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: color
                    }}
                  />
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}>{color}</div>
                  <div style={{ fontSize: 12, color: copiedIndex === index ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                    {copiedIndex === index ? '已复制' : '点击复制'}
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={handleExportCSS}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--accent-success)',
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              导出为 CSS 变量
            </button>

            <button
              onClick={handleDelete}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #ff4444',
                backgroundColor: 'transparent',
                color: '#ff4444',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              删除方案
            </button>
          </div>

          <div style={{
            padding: 20,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>色盲模式模拟</label>
            <select
              value={colorblindMode}
              onChange={(e) => setColorblindMode(e.target.value as ColorblindMode)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.entries(colorblindLabels).map(([mode, label]) => (
                <option key={mode} value={mode}>{label}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
