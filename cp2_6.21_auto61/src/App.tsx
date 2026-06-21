import { useEffect } from 'react'
import { useStore } from './store'
import Workbench from './components/Workbench'
import FragmentPanel from './components/FragmentPanel'
import ProgressBar from './components/ProgressBar'

export default function App() {
  const { initFragments, isComplete, artifactInfo, fragments, fuseSequence, progress } = useStore()

  useEffect(() => {
    initFragments()
  }, [])

  return (
    <div className="app-container">
      <ProgressBar progress={progress} />
      <div className="main-content">
        <FragmentPanel />
        <Workbench />
      </div>
      
      {isComplete && (
        <div className="result-dialog">
          <div className="result-title">修复完成</div>
          <div className="result-section">
            <div className="result-label">文物名称</div>
            <div className="result-value">{artifactInfo.name}</div>
          </div>
          <div className="result-section">
            <div className="result-label">年代</div>
            <div className="result-value">{artifactInfo.dynasty} · {artifactInfo.year}</div>
          </div>
          <div className="result-section">
            <div className="result-label">出土信息</div>
            <div className="result-value">{artifactInfo.discovery}</div>
          </div>
          <div className="result-section">
            <div className="result-label">文物简介</div>
            <div className="result-value">{artifactInfo.description}</div>
          </div>
          <div className="result-section" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div className="result-score">{calculateScore(fuseSequence, fragments)}%</div>
            <div className="result-score-label">完美修复率</div>
          </div>
        </div>
      )}
    </div>
  )
}

function calculateScore(sequence: number[], fragments: { id: number; correctOrder: number }[]): number {
  if (sequence.length === 0) return 0
  let correct = 0
  const sorted = [...fragments].sort((a, b) => a.correctOrder - b.correctOrder).map(f => f.id)
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i] === sorted[i]) correct++
  }
  return Math.round((correct / sequence.length) * 100)
}
