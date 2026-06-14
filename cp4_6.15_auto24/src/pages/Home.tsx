import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box, Layers, Sun, Moon, RotateCcw, Ruler, CornerUpRight, Atom, Tag, X
} from 'lucide-react'
import MoleculeViewer from '@/MoleculeViewer'
import InfoPanel from '@/InfoPanel'
import { parseMoleculeAsync, SAMPLE_MOLECULES } from '@/moleculeParser'
import { useMoleculeStore, type DisplayMode, type MeasureMode, type BackgroundTheme } from '@/store'

const DISPLAY_MODES: Array<{ value: DisplayMode; label: string }> = [
  { value: 'ball-stick', label: '球棍模型' },
  { value: 'wireframe', label: '线框模型' },
  { value: 'space-filling', label: '空间填充' },
]

const MEASURE_MODES: Array<{ value: MeasureMode; label: string }> = [
  { value: 'none', label: '选择' },
  { value: 'distance', label: '距离' },
  { value: 'angle', label: '键角' },
  { value: 'dihedral', label: '二面角' },
]

const BACKGROUND_THEMES: Array<{ value: BackgroundTheme; label: string; color?: string }> = [
  { value: 'dark', label: '深色', color: '#1a1a2e' },
  { value: 'light', label: '浅色', color: '#f5f5f5' },
  { value: 'custom', label: '自定义' },
]

export default function Home() {
  const [isDragging, setIsDragging] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showMeasureMenu, setShowMeasureMenu] = useState(false)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [showSamples, setShowSamples] = useState(false)
  const [showCustomBg, setShowCustomBg] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetViewerRef = useRef<(() => void) | null>(null)

  const setMoleculeData = useMoleculeStore((s) => s.setMoleculeData)
  const setIsParsing = useMoleculeStore((s) => s.setIsParsing)
  const setParsingError = useMoleculeStore((s) => s.setParsingError)
  const displayMode = useMoleculeStore((s) => s.displayMode)
  const setDisplayMode = useMoleculeStore((s) => s.setDisplayMode)
  const measureMode = useMoleculeStore((s) => s.measureMode)
  const setMeasureMode = useMoleculeStore((s) => s.setMeasureMode)
  const backgroundTheme = useMoleculeStore((s) => s.backgroundTheme)
  const setBackgroundTheme = useMoleculeStore((s) => s.setBackgroundTheme)
  const setCustomBgColor = useMoleculeStore((s) => s.setCustomBgColor)
  const customBgColor = useMoleculeStore((s) => s.customBgColor)
  const showLabels = useMoleculeStore((s) => s.showLabels)
  const setShowLabels = useMoleculeStore((s) => s.setShowLabels)
  const isParsing = useMoleculeStore((s) => s.isParsing)
  const moleculeData = useMoleculeStore((s) => s.moleculeData)
  const selectedAtomIds = useMoleculeStore((s) => s.selectedAtomIds)
  const setHighlightedAtom = useMoleculeStore((s) => s.setHighlightedAtom)
  const setHighlightedBond = useMoleculeStore((s) => s.setHighlightedBond)
  const parsingError = useMoleculeStore((s) => s.parsingError)

  const handleFile = useCallback(async (file: File) => {
    if (!file) return
    setIsParsing(true)
    setParsingError(null)
    try {
      const text = await file.text()
      const data = await parseMoleculeAsync(text, file.name)
      setMoleculeData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '解析失败'
      setParsingError(message)
    } finally {
      setIsParsing(false)
    }
  }, [setIsParsing, setParsingError, setMoleculeData])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  const handleSampleSelect = useCallback((sampleIdx: number) => {
    const sample = SAMPLE_MOLECULES[sampleIdx]
    setMoleculeData(sample.data)
    setShowSamples(false)
  }, [setMoleculeData])

  const handleReset = useCallback(() => {
    if (resetViewerRef.current) {
      resetViewerRef.current()
    }
  }, [])

  const handleBgSelect = useCallback((theme: BackgroundTheme) => {
    setBackgroundTheme(theme)
    setShowBgPicker(false)
    if (theme === 'custom') {
      setShowCustomBg(true)
    } else {
      setShowCustomBg(false)
    }
  }, [setBackgroundTheme])

  const handleSetReset = useCallback((fn: () => void) => {
    resetViewerRef.current = fn
  }, [])

  const closeAllMenus = useCallback(() => {
    setShowModeMenu(false)
    setShowBgPicker(false)
    setShowMeasureMenu(false)
    setShowSamples(false)
    setShowCustomBg(false)
  }, [])

  useEffect(() => {
    return () => {
      setHighlightedAtom(null)
      setHighlightedBond(null)
    }
  }, [setHighlightedAtom, setHighlightedBond])

  const modeLabel = DISPLAY_MODES.find((m) => m.value === displayMode)?.label || displayMode
  const measureLabel = MEASURE_MODES.find((m) => m.value === measureMode)?.label || measureMode
  const maxAtoms =
    measureMode === 'distance' ? 2 :
    measureMode === 'angle' ? 3 :
    measureMode === 'dihedral' ? 4 : 0

  if (!moleculeData) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-8">
            <div
              className={`w-full max-w-xl flex flex-col items-center justify-center gap-6 p-12 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                isDragging ? 'border-solid' : 'border-dashed upload-pulse'
              }`}
              style={{
                borderColor: isDragging ? '#e94560' : 'rgba(233, 69, 96, 0.4)',
                backgroundColor: isDragging ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdb,.sdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Box size={64} style={{ color: '#e94560' }} />
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#e0e0e0' }}>
                  拖拽分子文件到此处
                </h2>
                <p className="text-sm opacity-60 mb-4" style={{ color: '#e0e0e0' }}>
                  支持 PDB 和 SDF 格式
                </p>
                <button
                  className="px-6 py-2 rounded-lg font-medium btn-transition"
                  style={{ backgroundColor: '#0f3460', color: '#e0e0e0' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  或点击选择文件
                </button>
              </div>
            </div>
            {parsingError && (
              <div className="text-sm" style={{ color: '#ef4444' }}>
                {parsingError}
              </div>
            )}
            {isParsing && (
              <div className="text-sm" style={{ color: '#e0e0e0', opacity: 0.7 }}>
                正在解析...
              </div>
            )}
            <div className="w-full max-w-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium" style={{ color: '#e0e0e0' }}>
                  示例分子
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SAMPLE_MOLECULES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSampleSelect(idx)}
                    className="p-3 rounded-lg text-left btn-transition"
                    style={{ backgroundColor: '#16213e', color: '#e0e0e0' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0f3460'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#16213e'
                    }}
                  >
                    <Atom size={20} style={{ color: '#e94560', marginBottom: '6px' }} />
                    <div className="text-sm font-medium">{sample.name}</div>
                    <div className="text-xs opacity-60">{sample.data.formula}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="relative flex-1 flex flex-col md:w-[70%]">
        <div className="absolute top-3 left-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="glass-toolbar rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => { setShowModeMenu(!showModeMenu); setShowBgPicker(false); setShowMeasureMenu(false); setShowCustomBg(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
                style={{ backgroundColor: '#0f3460', color: '#e0e0e0' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a4a8a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f3460' }}
              >
                <Layers size={16} />
                <span>{modeLabel}</span>
              </button>
              {showModeMenu && (
                <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg animate-fade-in" style={{ backgroundColor: '#16213e', minWidth: '140px' }}>
                  {DISPLAY_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => { setDisplayMode(mode.value); setShowModeMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm btn-transition"
                      style={{
                        color: '#e0e0e0',
                        backgroundColor: displayMode === mode.value ? '#0f3460' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (displayMode !== mode.value) e.currentTarget.style.backgroundColor = '#0f3460' }}
                      onMouseLeave={(e) => { if (displayMode !== mode.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowMeasureMenu(!showMeasureMenu); setShowModeMenu(false); setShowBgPicker(false); setShowCustomBg(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
                style={{
                  backgroundColor: measureMode !== 'none' ? '#e94560' : '#0f3460',
                  color: '#e0e0e0'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = measureMode !== 'none' ? '#d63d56' : '#1a4a8a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = measureMode !== 'none' ? '#e94560' : '#0f3460' }}
              >
                {measureMode === 'distance' ? <Ruler size={16} /> :
                 measureMode === 'angle' || measureMode === 'dihedral' ? <CornerUpRight size={16} /> :
                 <Ruler size={16} />}
                <span>{measureLabel}</span>
                {maxAtoms > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    {selectedAtomIds.length}/{maxAtoms}
                  </span>
                )}
              </button>
              {showMeasureMenu && (
                <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg animate-fade-in" style={{ backgroundColor: '#16213e', minWidth: '100px' }}>
                  {MEASURE_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => { setMeasureMode(mode.value); setShowMeasureMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm btn-transition"
                      style={{
                        color: '#e0e0e0',
                        backgroundColor: measureMode === mode.value ? '#e94560' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (measureMode !== mode.value) e.currentTarget.style.backgroundColor = '#0f3460' }}
                      onMouseLeave={(e) => { if (measureMode !== mode.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowBgPicker(!showBgPicker); setShowModeMenu(false); setShowMeasureMenu(false); setShowCustomBg(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
                style={{ backgroundColor: '#0f3460', color: '#e0e0e0' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a4a8a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f3460' }}
              >
                {backgroundTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span>背景</span>
              </button>
              {showBgPicker && (
                <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg animate-fade-in" style={{ backgroundColor: '#16213e', minWidth: '100px' }}>
                  {BACKGROUND_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => handleBgSelect(theme.value)}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 btn-transition"
                      style={{
                        color: '#e0e0e0',
                        backgroundColor: backgroundTheme === theme.value ? '#0f3460' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (backgroundTheme !== theme.value) e.currentTarget.style.backgroundColor = '#0f3460' }}
                      onMouseLeave={(e) => { if (backgroundTheme !== theme.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {theme.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                      )}
                      {theme.label}
                    </button>
                  ))}
                </div>
              )}
              {showCustomBg && (
                <div className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-lg animate-fade-in" style={{ backgroundColor: '#16213e' }}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      style={{ border: 'none', backgroundColor: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="px-2 py-1 text-xs rounded"
                      style={{ backgroundColor: '#1a1a2e', border: '1px solid #0f3460', color: '#e0e0e0' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
              style={{
                backgroundColor: showLabels ? '#e94560' : '#0f3460',
                color: '#e0e0e0'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showLabels ? '#d63d56' : '#1a4a8a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showLabels ? '#e94560' : '#0f3460' }}
            >
              <Tag size={16} />
              <span>标签</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
              style={{ backgroundColor: '#0f3460', color: '#e0e0e0' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a4a8a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f3460' }}
            >
              <RotateCcw size={16} />
              <span>重置</span>
            </button>

            <div className="ml-auto relative">
              <button
                onClick={() => { setShowSamples(!showSamples); setShowModeMenu(false); setShowBgPicker(false); setShowMeasureMenu(false); setShowCustomBg(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-transition"
                style={{ backgroundColor: '#0f3460', color: '#e0e0e0' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a4a8a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f3460' }}
              >
                <Atom size={16} />
                <span>示例</span>
              </button>
              {showSamples && (
                <div className="absolute top-full right-0 mt-1 p-2 rounded-lg shadow-lg animate-fade-in" style={{ backgroundColor: '#16213e', minWidth: '180px' }}>
                  {SAMPLE_MOLECULES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSampleSelect(idx)}
                      className="w-full px-3 py-2 text-left text-sm btn-transition rounded"
                      style={{ color: '#e0e0e0' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f3460' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <div className="font-medium">{sample.name}</div>
                      <div className="text-xs opacity-60">{sample.data.formula}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { setMoleculeData(null); closeAllMenus() }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm btn-transition"
              style={{ color: '#e94560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative" onClick={closeAllMenus}>
          {isParsing && (
            <div className="absolute inset-0 flex items-center justify-center z-20" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)' }}>
              <div className="text-lg" style={{ color: '#e0e0e0' }}>正在解析...</div>
            </div>
          )}
          <MoleculeViewer onReset={handleSetReset} />
        </div>
      </div>

      <div className="w-full md:w-[30%] md:min-w-[300px] md:max-w-[400px] border-l" style={{ borderColor: '#0f3460', height: '100%' }}>
        <InfoPanel />
      </div>
    </div>
  )
}
