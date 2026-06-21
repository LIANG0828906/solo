import React, { useReducer, useEffect, useCallback, useRef } from 'react'
import FilterPanel from './components/FilterPanel'
import ImagePreview from './components/ImagePreview'
import type { ImagePreviewRef } from './components/ImagePreview'
import { defaultFilters, applyFilters, generateCSSString } from './utils/filterEngine'
import type { FilterState } from './utils/filterEngine'

type FilterAction =
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'RESET' }
  | { type: 'LOAD_FROM_STORAGE'; payload: FilterState }

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, ...action.payload }
    case 'RESET':
      return { ...defaultFilters }
    case 'LOAD_FROM_STORAGE':
      return { ...action.payload }
    default:
      return state
  }
}

const STORAGE_KEY = 'css-filter-palette-presets'

const App: React.FC = () => {
  const [filters, dispatch] = useReducer(filterReducer, defaultFilters)
  const imagePreviewRef = useRef<ImagePreviewRef>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          const validFilters: FilterState = {
            blur: typeof parsed.blur === 'number' ? parsed.blur : defaultFilters.blur,
            brightness: typeof parsed.brightness === 'number' ? parsed.brightness : defaultFilters.brightness,
            contrast: typeof parsed.contrast === 'number' ? parsed.contrast : defaultFilters.contrast,
            hueRotate: typeof parsed.hueRotate === 'number' ? parsed.hueRotate : defaultFilters.hueRotate,
            saturate: typeof parsed.saturate === 'number' ? parsed.saturate : defaultFilters.saturate,
            grayscale: typeof parsed.grayscale === 'number' ? parsed.grayscale : defaultFilters.grayscale,
          }
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: validFilters })
        }
      } catch (e) {
        console.error('加载本地预设失败:', e)
      }
    }
  }, [])

  const filterStyle = applyFilters(filters)

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const handleCopyCSS = useCallback(async () => {
    const cssString = generateCSSString(filters)
    try {
      await navigator.clipboard.writeText(cssString)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [filters])

  const handleDownloadImage = useCallback(() => {
    imagePreviewRef.current?.downloadImage()
  }, [])

  const handleSavePreset = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  return (
    <div className="app-container">
      <FilterPanel
        filters={filters}
        dispatch={dispatch}
        onReset={handleReset}
        onCopyCSS={handleCopyCSS}
        onDownloadImage={handleDownloadImage}
        onSavePreset={handleSavePreset}
      />
      <ImagePreview ref={imagePreviewRef} filterStyle={filterStyle} filters={filters} />

      <style>{`
        .app-container {
          display: flex;
          gap: 40px;
          align-items: flex-start;
          max-width: 1200px;
          width: 100%;
        }

        @media (max-width: 1200px) {
          .app-container {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default App
