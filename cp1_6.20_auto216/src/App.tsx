import { useState, useRef, useCallback } from 'react'
import CompareDashboard from './components/CompareDashboard'

export interface ScrapedResult {
  url: string
  title: string
  description: string
  techStack: string[]
  screenshotUrl: string
  error?: boolean
}

export interface RatingDimension {
  name: string
  scores: Record<string, number>
}

export interface ComparisonData {
  results: ScrapedResult[]
  dimensions: RatingDimension[]
  timestamp: string
}

const DEFAULT_DIMENSIONS: RatingDimension[] = [
  { name: 'UI美观度', scores: {} },
  { name: '功能丰富度', scores: {} },
  { name: '加载速度', scores: {} },
]

function App() {
  const [urls, setUrls] = useState<string[]>([])
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentUrl: '' })
  const [results, setResults] = useState<ScrapedResult[]>([])
  const [dimensions, setDimensions] = useState<RatingDimension[]>(DEFAULT_DIMENSIONS)
  const [shake, setShake] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_URLS = 5
  const isMaxReached = urls.length >= MAX_URLS

  const addUrl = useCallback(() => {
    const trimmed = inputUrl.trim()
    if (!trimmed) return
    if (isMaxReached) {
      setShake(true)
      setTimeout(() => setShake(false), 300)
      return
    }
    let finalUrl = trimmed
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }
    if (urls.includes(finalUrl)) return
    setUrls((prev) => [...prev, finalUrl])
    setInputUrl('')
  }, [inputUrl, urls, isMaxReached])

  const removeUrl = useCallback((index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addUrl()
      }
    },
    [addUrl]
  )

  const startCompare = useCallback(async () => {
    if (urls.length === 0 || loading) return
    setLoading(true)
    setResults([])
    setProgress({ current: 0, total: urls.length, currentUrl: urls[0] })

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })

      if (!response.ok || !response.body) {
        throw new Error('请求失败')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const scrapedResults: ScrapedResult[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                scrapedResults.push(data.result)
                setResults([...scrapedResults])
                setProgress({
                  current: data.index + 1,
                  total: data.total,
                  currentUrl: data.url,
                })
              } else if (data.type === 'complete') {
                setResults(data.results)
                setProgress({
                  current: data.total,
                  total: data.total,
                  currentUrl: '',
                })
              }
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.error('Comparison failed:', err)
    } finally {
      setLoading(false)
    }
  }, [urls, loading])

  const handleExport = useCallback(() => {
    const data: ComparisonData = {
      results,
      dimensions,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `competitor-compare-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [results, dimensions])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data: ComparisonData = JSON.parse(evt.target?.result as string)
        if (data.results && Array.isArray(data.results)) {
          setResults(data.results)
        }
        if (data.dimensions && Array.isArray(data.dimensions)) {
          setDimensions(data.dimensions)
        }
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">竞品对比分析</h1>
          <p className="sidebar-subtitle">输入URL，快速对比竞品网站</p>
        </div>

        <div className="input-section">
          <div className={`input-wrapper ${isMaxReached ? 'disabled' : ''} ${shake ? 'shake' : ''}`}>
            <input
              type="text"
              className="url-input"
              placeholder={isMaxReached ? '已达到最大数量' : '输入竞品网站URL...'}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isMaxReached}
            />
            <button className="add-btn" onClick={addUrl} disabled={isMaxReached}>
              添加
            </button>
          </div>

          <div className="url-tags">
            {urls.map((url, i) => (
              <span className="url-tag" key={i}>
                <span className="url-tag-text" title={url}>
                  {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </span>
                <button className="url-tag-remove" onClick={() => removeUrl(i)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          className="compare-btn"
          onClick={startCompare}
          disabled={urls.length === 0 || loading}
        >
          {loading ? '抓取中...' : '开始对比'}
        </button>

        {loading && (
          <div className="progress-section">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="progress-text">
              正在抓取: {progress.currentUrl}
            </p>
            <p className="progress-count">
              {progress.current} / {progress.total}
            </p>
          </div>
        )}

        <div className="sidebar-actions">
          {results.length > 0 && (
            <button className="action-btn export-btn" onClick={handleExport}>
              导出快照 JSON
            </button>
          )}
          <button className="action-btn import-btn" onClick={() => fileInputRef.current?.click()}>
            导入快照 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </aside>

      <div className="divider" />

      <main className="main-content">
        {results.length > 0 ? (
          <CompareDashboard
            results={results}
            dimensions={dimensions}
            onDimensionsChange={setDimensions}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>在左侧添加竞品URL，点击"开始对比"生成分析仪表盘</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
