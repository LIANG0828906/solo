import { useState, useCallback, useEffect, useMemo, memo } from 'react'
import PoetryInput from './components/PoetryInput'
import InkCanvas from './components/InkCanvas'
import { parsePoetry, type PoetryData } from './utils/parsePoetry'

interface HistoryItem {
  id: string
  title: string
  content: string
}

const DEFAULT_HISTORY: HistoryItem[] = [
  { id: '1', title: '静夜思', content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。' },
  { id: '2', title: '春晓', content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。' },
  { id: '3', title: '登鹳雀楼', content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。' },
]

function App() {
  const [poetryData, setPoetryData] = useState<PoetryData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(DEFAULT_HISTORY)
  const [seed, setSeed] = useState(() => Date.now())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [inputText, setInputText] = useState('')

  const handleGenerate = useCallback((text: string) => {
    const data = parsePoetry(text)
    setPoetryData(data)
    setSeed(Date.now())
    setInputText(text)
    setMobileOpen(false)

    setHistory(prev => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        title: data.title,
        content: text,
      }
      const filtered = prev.filter(item => item.title !== data.title)
      return [newItem, ...filtered].slice(0, 5)
    })
  }, [])

  const handleReParse = useCallback(() => {
    if (inputText) {
      const data = parsePoetry(inputText)
      setPoetryData(data)
    }
    setSeed(Date.now())
  }, [inputText])

  const handleRefreshSeed = useCallback(() => {
    setSeed(Date.now())
  }, [])

  const handleHistoryClick = useCallback((item: HistoryItem) => {
    const data = parsePoetry(item.content)
    setPoetryData(data)
    setInputText(item.content)
    setSeed(Date.now())
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="app-container">
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="菜单"
      >
        <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
      </button>

      <div
        className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <PoetryInput
        className={`input-panel ${mobileOpen ? 'mobile-open' : ''}`}
        onGenerate={handleGenerate}
        history={history}
        onHistoryClick={handleHistoryClick}
        defaultText={inputText}
      />

      <div className="canvas-area">
        <InkCanvas
          poetryData={poetryData}
          seed={seed}
          onReParse={handleReParse}
          onRefreshSeed={handleRefreshSeed}
        />
      </div>
    </div>
  )
}

export default App
