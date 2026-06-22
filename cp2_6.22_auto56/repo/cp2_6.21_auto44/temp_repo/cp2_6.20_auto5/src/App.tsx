import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import ColorPicker from './components/ColorPicker'
import SwatchList from './components/SwatchList'
import SchemeLibrary from './components/SchemeLibrary'
import ShareModal from './components/ShareModal'
import type { ColorData, ColorScheme, HarmonyScheme } from './types'
import { generateAllHarmonySchemes, hexToColorData, generateId } from './utils/colorHarmony'
import { schemeApi } from './services/api'

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [currentColor, setCurrentColor] = useState<ColorData>(() =>
    hexToColorData('#667EEA')
  )
  const [currentColors, setCurrentColors] = useState<ColorData[]>([])
  const [schemes, setSchemes] = useState<ColorScheme[]>([])
  const [schemeName, setSchemeName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [toast, setToast] = useState({ show: false, message: '' })
  const [shareScheme, setShareScheme] = useState<ColorScheme | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)

  const harmonySchemes: HarmonyScheme[] = useMemo(() => {
    return generateAllHarmonySchemes(currentColor)
  }, [currentColor])

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }, [])

  const loadSchemesFromApi = useCallback(async () => {
    try {
      const response = await schemeApi.getSchemes()
      setSchemes(response.data)
      setApiAvailable(true)
    } catch {
      setApiAvailable(false)
      const saved = localStorage.getItem('color-palette-schemes')
      if (saved) {
        try {
          setSchemes(JSON.parse(saved))
        } catch {
          setSchemes([])
        }
      }
    }
  }, [])

  useEffect(() => {
    loadSchemesFromApi()
  }, [loadSchemesFromApi])

  useEffect(() => {
    if (!apiAvailable && schemes.length > 0) {
      localStorage.setItem('color-palette-schemes', JSON.stringify(schemes))
    }
  }, [schemes, apiAvailable])

  useEffect(() => {
    const colorParam = searchParams.get('color')
    if (colorParam) {
      try {
        const data = JSON.parse(atob(colorParam))
        const name = data.n || data.name || '分享的方案'
        const colors = data.c || data.colors || []
        const schemeTags = data.t || data.tags || []

        if (Array.isArray(colors) && colors.length > 0) {
          const parsedColors = colors.map((hex: string) => hexToColorData(hex))
          setCurrentColors(parsedColors)
          setSchemeName(name)
          setTags(schemeTags)
          showToast('已加载分享的配色方案！')
        } else {
          showToast('分享链接中没有有效的颜色数据')
        }
      } catch {
        showToast('分享链接无效')
      }
    }
  }, [searchParams, showToast])

  const handleAddColor = useCallback(
    (color: ColorData) => {
      if (currentColors.length >= 5) {
        showToast('调色板最多只能有5个颜色')
        return
      }
      setCurrentColors((prev) => [...prev, { ...color, id: generateId() }])
    },
    [currentColors.length, showToast]
  )

  const handleDeleteColor = useCallback((id: string) => {
    setCurrentColors((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const handleReorderColors = useCallback((colors: ColorData[]) => {
    setCurrentColors(colors)
  }, [])

  const handleApplyHarmony = useCallback((colors: ColorData[]) => {
    setCurrentColors(colors.map((c) => ({ ...c, id: generateId() })))
  }, [])

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const handleSaveScheme = useCallback(async () => {
    if (!schemeName.trim()) {
      showToast('请输入方案名称')
      return
    }
    if (currentColors.length === 0) {
      showToast('请至少添加一个颜色')
      return
    }

    const newScheme: ColorScheme = {
      id: generateId(),
      name: schemeName.trim(),
      colors: currentColors,
      tags: [...tags],
      createdAt: Date.now()
    }

    if (apiAvailable) {
      try {
        await schemeApi.createScheme(newScheme)
        const response = await schemeApi.getSchemes()
        setSchemes(response.data)
      } catch {
        setSchemes((prev) => [...prev, newScheme])
      }
    } else {
      setSchemes((prev) => [...prev, newScheme])
    }

    setSchemeName('')
    setTags([])
    showToast('方案保存成功！')
  }, [schemeName, currentColors, tags, showToast, apiAvailable])

  const handleApplyScheme = useCallback(
    (scheme: ColorScheme) => {
      setCurrentColors(scheme.colors.map((c) => ({ ...c, id: generateId() })))
      navigate('/')
      showToast(`已应用方案：${scheme.name}`)
    },
    [navigate, showToast]
  )

  const handleDeleteScheme = useCallback(
    async (id: string) => {
      if (apiAvailable) {
        try {
          await schemeApi.deleteScheme(id)
          const response = await schemeApi.getSchemes()
          setSchemes(response.data)
        } catch {
          setSchemes((prev) => prev.filter((s) => s.id !== id))
        }
      } else {
        setSchemes((prev) => prev.filter((s) => s.id !== id))
      }
      showToast('方案已删除')
    },
    [showToast, apiAvailable]
  )

  const handleExport = useCallback((scheme: ColorScheme) => {
    setShareScheme(scheme)
  }, [])

  const handleShare = useCallback((scheme: ColorScheme) => {
    setShareScheme(scheme)
  }, [])

  return (
    <div className="app-container">
      <nav className="nav glass">
        <button
          className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          调色板
        </button>
        <button
          className={`nav-btn ${location.pathname === '/library' ? 'active' : ''}`}
          onClick={() => navigate('/library')}
        >
          方案库 ({schemes.length})
        </button>
      </nav>

      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.message}</div>

      <Routes>
        <Route
          path="/"
          element={
            <div className="main-content">
              <ColorPicker
                color={currentColor}
                onChange={setCurrentColor}
                onAddColor={handleAddColor}
              />

              <SwatchList
                colors={currentColors}
                onReorder={handleReorderColors}
                onDelete={handleDeleteColor}
              />

              <div className="glass harmony-section">
                <h3>智能配色方案</h3>
                <div className="harmony-grid">
                  {harmonySchemes.map((scheme) => (
                    <div
                      key={scheme.type}
                      className="harmony-card glass"
                      onClick={() => handleApplyHarmony(scheme.colors)}
                    >
                      <h4>{scheme.name}</h4>
                      <div className="harmony-preview">
                        {scheme.colors.map((c) => (
                          <div key={c.id} style={{ backgroundColor: c.hex }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass save-section">
                <input
                  type="text"
                  placeholder="方案名称..."
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                />
                <div
                  className="tags-input"
                  style={{ flex: 1, minWidth: 200 }}
                >
                  {tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="添加标签（回车确认）..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    onBlur={handleAddTag}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveScheme}
                >
                  保存方案
                </button>
                {currentColors.length > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      handleShare({
                        id: generateId(),
                        name: schemeName || '未命名方案',
                        colors: currentColors,
                        tags,
                        createdAt: Date.now()
                      })
                    }
                  >
                    分享当前调色板
                  </button>
                )}
              </div>
            </div>
          }
        />

        <Route
          path="/library"
          element={
            <SchemeLibrary
              schemes={schemes}
              onApply={handleApplyScheme}
              onDelete={handleDeleteScheme}
              onExport={handleExport}
              onShare={handleShare}
            />
          }
        />
      </Routes>

      <ShareModal
        scheme={shareScheme}
        onClose={() => setShareScheme(null)}
        onToast={showToast}
      />
    </div>
  )
}

export default App
