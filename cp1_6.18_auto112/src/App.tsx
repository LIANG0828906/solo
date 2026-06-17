import { TextInput } from './components/TextInput'
import { SentimentChart } from './components/SentimentChart'
import { ReadabilityPanel } from './components/ReadabilityPanel'
import { useAnalysisStore } from './stores/analysisStore'

function App() {
  const { result, status } = useAnalysisStore()

  const handleExport = () => {
    if (!result) return

    const exportData = {
      exportedAt: new Date().toISOString(),
      sentences: result.sentiment.sentences.map(s => ({
        text: s.text,
        sentimentScore: s.sentimentScore,
        sentimentLabel: s.sentimentLabel,
        toneTags: s.toneTags
      })),
      overallSentiment: result.sentiment.overallScore,
      readability: {
        fleschKincaid: result.readability.fleschKincaid,
        fleschKincaidGrade: result.readability.fleschKincaidGrade,
        wordCount: result.readability.wordCount,
        sentenceCount: result.readability.sentenceCount,
        syllableCount: result.readability.syllableCount,
        avgWordLength: result.readability.avgWordLength
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-analysis-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canExport = status === 'success' && result !== null

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">📊 文本情感分析器</h1>
        <p className="app-subtitle">快速分析英文文本的语气、情感倾向与可读性指数</p>
      </header>

      <div className="main-layout">
        <div className="left-panel">
          <TextInput />
          <SentimentChart />
          
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={!canExport}
          >
            📥 导出分析报告 (JSON)
          </button>
        </div>

        <div className="right-panel">
          <ReadabilityPanel />
        </div>
      </div>
    </div>
  )
}

export default App
