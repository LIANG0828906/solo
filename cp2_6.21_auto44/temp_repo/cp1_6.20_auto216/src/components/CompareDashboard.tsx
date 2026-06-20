import { useState, useCallback } from 'react'
import type { ScrapedResult, RatingDimension } from '../App'

interface Props {
  results: ScrapedResult[]
  dimensions: RatingDimension[]
  onDimensionsChange: (dimensions: RatingDimension[]) => void
}

const TECH_COLORS: Record<string, string> = {
  React: '#61dafb',
  Vue: '#42b883',
  jQuery: '#0769ad',
  Angular: '#dd0031',
  'Next.js': '#000000',
  'Nuxt.js': '#00dc82',
  Svelte: '#ff3e00',
  Bootstrap: '#7952b3',
  Tailwind: '#06b6d4',
  WordPress: '#21759b',
  Shopify: '#96bf48',
  Unknown: '#9ca3af',
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function urlToColor(url: string): string {
  const h = hashCode(url) % 360
  return `hsl(${h}, 45%, 35%)`
}

function StarRating({
  score,
  onChange,
}: {
  score: number
  onChange: (score: number) => void
}) {
  const [hoverScore, setHoverScore] = useState(0)
  const displayScore = hoverScore || score

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= displayScore ? 'filled' : ''}`}
          onMouseEnter={() => setHoverScore(star)}
          onMouseLeave={() => setHoverScore(0)}
          onClick={() => onChange(star === score ? 0 : star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function CompareDashboard({ results, dimensions, onDimensionsChange }: Props) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [newDimName, setNewDimName] = useState('')
  const [showDimInput, setShowDimInput] = useState(false)

  const addDimension = useCallback(() => {
    const name = newDimName.trim()
    if (!name) return
    if (dimensions.some((d) => d.name === name)) return
    onDimensionsChange([...dimensions, { name, scores: {} }])
    setNewDimName('')
    setShowDimInput(false)
  }, [newDimName, dimensions, onDimensionsChange])

  const removeDimension = useCallback(
    (name: string) => {
      onDimensionsChange(dimensions.filter((d) => d.name !== name))
    },
    [dimensions, onDimensionsChange]
  )

  const updateScore = useCallback(
    (url: string, dimName: string, score: number) => {
      onDimensionsChange(
        dimensions.map((d) =>
          d.name === dimName
            ? { ...d, scores: { ...d.scores, [url]: score } }
            : d
        )
      )
    },
    [dimensions, onDimensionsChange]
  )

  const handleCardClick = useCallback((index: number) => {
    setSelectedCard((prev) => (prev === index ? null : index))
  }, [])

  const handleExport = useCallback(() => {
    const data = {
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">对比仪表盘</h2>
        <div className="dashboard-actions">
          <button className="action-btn small" onClick={handleExport}>
            复制快照
          </button>
        </div>
      </div>

      <div className="dimension-controls">
        {dimensions.map((dim) => (
          <span className="dimension-chip" key={dim.name}>
            {dim.name}
            <button
              className="dimension-chip-remove"
              onClick={() => removeDimension(dim.name)}
            >
              ✕
            </button>
          </span>
        ))}
        {showDimInput ? (
          <div className="new-dim-input">
            <input
              type="text"
              value={newDimName}
              onChange={(e) => setNewDimName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addDimension()
              }}
              placeholder="维度名称"
              autoFocus
            />
            <button className="dim-confirm-btn" onClick={addDimension}>
              ✓
            </button>
            <button
              className="dim-cancel-btn"
              onClick={() => {
                setShowDimInput(false)
                setNewDimName('')
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="add-dim-btn"
            onClick={() => setShowDimInput(true)}
          >
            + 新增维度
          </button>
        )}
      </div>

      <div className="cards-container">
        {results.map((result, index) => {
          const isSelected = selectedCard === index
          return (
            <div
              className={`compare-card ${isSelected ? 'selected' : ''}`}
              key={result.url}
              onClick={() => handleCardClick(index)}
            >
              <div className="card-screenshot-area">
                {result.screenshotUrl && !result.error ? (
                  <img
                    className="card-screenshot"
                    src={result.screenshotUrl}
                    alt={result.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.classList.add('placeholder')
                        parent.style.backgroundColor = urlToColor(result.url)
                      }
                    }}
                  />
                ) : (
                  <div
                    className="card-screenshot-placeholder"
                    style={{ backgroundColor: urlToColor(result.url) }}
                  >
                    <span>{result.error ? '✕' : '🖼'}</span>
                  </div>
                )}
              </div>

              <div className="card-body">
                <h3 className="card-title" title={result.title}>
                  {result.title || result.url}
                </h3>
                <p className="card-description" title={result.description}>
                  {result.description || '暂无描述'}
                </p>

                <div className="card-tech-stack">
                  {result.techStack.map((tech) => (
                    <span
                      className="tech-tag"
                      key={tech}
                      style={{
                        backgroundColor: TECH_COLORS[tech] || '#6b7280',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="card-ratings">
                  {dimensions.map((dim) => (
                    <div className="rating-row" key={dim.name}>
                      <span className="rating-label">{dim.name}</span>
                      <StarRating
                        score={dim.scores[result.url] || 0}
                        onChange={(score) => updateScore(result.url, dim.name, score)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="card-expanded">
                  <div className="expanded-screenshot">
                    {result.screenshotUrl && !result.error ? (
                      <img
                        className="expanded-screenshot-img"
                        src={result.screenshotUrl}
                        alt={result.title}
                      />
                    ) : (
                      <div
                        className="expanded-placeholder"
                        style={{ backgroundColor: urlToColor(result.url) }}
                      />
                    )}
                  </div>
                  <p className="expanded-url">{result.url}</p>
                  <p className="expanded-description">
                    {result.description || '暂无描述'}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompareDashboard
