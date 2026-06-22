import { useState, useEffect } from 'react'
import './HotWords.css'

interface HotWord {
  word: string
  count: number
}

interface HotWordsProps {
  hotWords: HotWord[]
}

const TAG_COLORS = ['#4A6FA5', '#9B72AA', '#6BCB77', '#4D96FF', '#C084FC']

function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length]
}

export function HotWords({ hotWords }: HotWordsProps) {
  const [displayWords, setDisplayWords] = useState<HotWord[]>(hotWords)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (JSON.stringify(hotWords) !== JSON.stringify(displayWords)) {
      setFading(true)
      const timer = setTimeout(() => {
        setDisplayWords(hotWords)
        setFading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [hotWords, displayWords])

  return (
    <div className="hot-words-container">
      <div className="hot-words-title">今日心愿热词</div>
      <div className={`hot-words-list ${fading ? 'fading' : ''}`}>
        {displayWords.length === 0 ? (
          <div className="hot-words-empty">暂无心愿，快来许个愿吧~</div>
        ) : (
          displayWords.map((item, index) => (
            <div
              key={item.word + index}
              className="hot-word-tag"
              style={{
                backgroundColor: getTagColor(index) + '40',
                borderColor: getTagColor(index),
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <span className="hot-word-text">{item.word}</span>
              <span className="hot-word-count">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
