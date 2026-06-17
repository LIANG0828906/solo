import { useAnalysisStore } from '../stores/analysisStore'

export const ReadabilityPanel = () => {
  const { result, status } = useAnalysisStore()
  const readability = result?.readability

  const radius = 60
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const score = readability?.fleschKincaid ?? 0
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  const getGradientColor = (value: number) => {
    if (value >= 70) return '#00B894'
    if (value >= 50) return '#FDCB6E'
    return '#E17055'
  }

  const arcColor = getGradientColor(score)

  return (
    <div className="readability-panel">
      <h2 className="readability-title">可读性指数</h2>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E17055" />
              <stop offset="50%" stopColor="#FDCB6E" />
              <stop offset="100%" stopColor="#00B894" />
            </linearGradient>
          </defs>
          
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#3D3D5C"
            strokeWidth={strokeWidth}
          />
          
          {status === 'success' && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
              style={{
                transition: 'stroke-dashoffset 0.8s ease'
              }}
            />
          )}
        </svg>
        
        <div className="gauge-center" style={{ position: 'absolute' }}>
          {status === 'success' ? (
            <>
              <span className="gauge-value" style={{ color: arcColor }}>{score}</span>
              <span className="gauge-grade">{readability?.fleschKincaidGrade}</span>
            </>
          ) : (
            <span className="gauge-grade" style={{ fontSize: '12px' }}>等待分析</span>
          )}
        </div>
      </div>

      <div className="metrics-list">
        <div className="metric-row">
          <span className="metric-label">单词数</span>
          <span className="metric-divider"></span>
          <span className="metric-value">{readability?.wordCount ?? 0}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">句子数</span>
          <span className="metric-divider"></span>
          <span className="metric-value">{readability?.sentenceCount ?? 0}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">音节数</span>
          <span className="metric-divider"></span>
          <span className="metric-value">{readability?.syllableCount ?? 0}</span>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">平均词长</span>
          <span className="metric-divider"></span>
          <span className="metric-value">{readability?.avgWordLength ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
