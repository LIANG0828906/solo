import { useState, useCallback } from 'react'
import UploadPanel from './components/UploadPanel'
import EditorPanel from './components/EditorPanel'
import PreviewArea from './components/PreviewArea'

export interface FontWeight {
  name: string
  weight: number
  style: string
  fontUrl: string
}

export interface FontData {
  id: string
  name: string
  weights: FontWeight[]
  file?: File
}

export interface TypographyParams {
  fontSize: number
  lineHeight: number
  letterSpacing: number
  paragraphWidth: number
  sampleText: string
  language: 'zh' | 'en'
}

export interface CompareState {
  enabled: boolean
  compareFontId: string | null
  splitRatio: number
}

const sampleTexts = {
  zh: '设计是解决问题的艺术。优秀的排版能够让信息更清晰地传达给受众。每一个字符的选择，每一行间距的调整，都影响着读者的阅读体验。在数字时代，字体的选择变得前所未有的丰富，但好的设计始终追求的是清晰、优雅与功能性的完美结合。',
  en: 'Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing, and adjusting the space between pairs of letters.'
}

const defaultParams: TypographyParams = {
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphWidth: 100,
  sampleText: sampleTexts.zh,
  language: 'zh'
}

export default function App() {
  const [fonts, setFonts] = useState<FontData[]>([])
  const [params, setParams] = useState<TypographyParams>(defaultParams)
  const [compare, setCompare] = useState<CompareState>({
    enabled: false,
    compareFontId: null,
    splitRatio: 0.5
  })
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0)

  const handleFontUpload = useCallback((font: FontData) => {
    setFonts(prev => {
      const exists = prev.find(f => f.name === font.name)
      if (exists) {
        return prev.map(f => f.name === font.name ? font : f)
      }
      return [...prev, font]
    })
  }, [])

  const handleParamsChange = useCallback((newParams: Partial<TypographyParams>) => {
    setParams(prev => ({ ...prev, ...newParams }))
  }, [])

  const handleLanguageChange = useCallback((lang: 'zh' | 'en') => {
    setParams(prev => ({
      ...prev,
      language: lang,
      sampleText: sampleTexts[lang]
    }))
  }, [])

  const toggleCompare = useCallback(() => {
    setCompare(prev => ({
      ...prev,
      enabled: !prev.enabled,
      compareFontId: !prev.enabled && fonts.length > 1 ? fonts[1].id : null
    }))
  }, [fonts])

  const setCompareFont = useCallback((fontId: string) => {
    setCompare(prev => ({ ...prev, compareFontId: fontId }))
  }, [])

  const setSplitRatio = useCallback((ratio: number) => {
    setCompare(prev => ({ ...prev, splitRatio: ratio }))
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>
          <i className="fas fa-font"></i>
          字体预览与排版测试工具
        </h1>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          <i className="fas fa-palette"></i> 设计师专用
        </div>
      </header>

      <main className="app-main">
        <section className="preview-section">
          <UploadPanel onFontUpload={handleFontUpload} />

          {fonts.length > 0 && (
            <div className="fonts-header">
              <h2>字重预览</h2>
              <span className="font-count">{fonts[0].weights.length} 个字重</span>
            </div>
          )}

          <PreviewArea
            fonts={fonts}
            params={params}
            compare={compare}
            selectedWeightIndex={selectedWeightIndex}
            onWeightSelect={setSelectedWeightIndex}
            onSplitRatioChange={setSplitRatio}
          />
        </section>

        <aside className="editor-section">
          <EditorPanel
            params={params}
            onChange={handleParamsChange}
            onLanguageChange={handleLanguageChange}
            compareEnabled={compare.enabled}
            onToggleCompare={toggleCompare}
            fonts={fonts}
            compareFontId={compare.compareFontId}
            onCompareFontChange={setCompareFont}
          />
        </aside>
      </main>

      <button
        className="floating-btn"
        onClick={() => setMobilePanelOpen(true)}
      >
        <i className="fas fa-sliders-h"></i>
      </button>

      <div
        className={`mobile-panel-overlay ${mobilePanelOpen ? 'open' : ''}`}
        onClick={() => setMobilePanelOpen(false)}
      />

      <div className={`mobile-panel ${mobilePanelOpen ? 'open' : ''}`}>
        <button
          className="mobile-panel-close"
          onClick={() => setMobilePanelOpen(false)}
        >
          <i className="fas fa-times"></i>
        </button>
        <EditorPanel
          params={params}
          onChange={handleParamsChange}
          onLanguageChange={handleLanguageChange}
          compareEnabled={compare.enabled}
          onToggleCompare={toggleCompare}
          fonts={fonts}
          compareFontId={compare.compareFontId}
          onCompareFontChange={setCompareFont}
        />
      </div>
    </div>
  )
}
