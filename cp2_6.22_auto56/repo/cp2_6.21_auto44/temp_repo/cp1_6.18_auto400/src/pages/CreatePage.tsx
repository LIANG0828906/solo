import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { AppState } from '../store/store'
import {
  generatePoemAction,
  applyStyleAction,
  saveHistoryAction
} from '../store/store'
import { generatePoem, validateKeyword } from '../modules/generation/GeneratorModule'
import type { GeneratedPoem } from '../modules/generation/GeneratorModule'
import {
  fontOptions,
  bgOptions,
  decorationOptions,
  applyStyleConfig,
  defaultStyle
} from '../modules/styling/StyleModule'
import type { FontType, BgTextureType, DecorationType, StyleConfig } from '../modules/styling/StyleModule'
import { saveToHistory, generateShareCode } from '../modules/history/HistoryModule'

function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>
}

function DecorationLayer({ type, animate }: { type: DecorationType; animate: boolean }) {
  if (type === 'none') return null

  const renderDecoration = () => {
    switch (type) {
      case 'seal':
        return <div className="seal">诗印</div>
      case 'petals':
        return (
          <div className="petal-container">
            <div className="petal p1"></div>
            <div className="petal p2"></div>
            <div className="petal p3"></div>
            <div className="petal p4"></div>
          </div>
        )
      case 'birds':
        return (
          <div className="bird-silhouette">
            <span style={{ transform: 'rotate(-15deg)', display: 'inline-block' }}>⊶</span>
          </div>
        )
      default:
        return null
    }
  }

  const positions = ['tl', 'tr', 'bl', 'br'] as const
  const count = type === 'petals' ? 4 : type === 'seal' ? 1 : 2
  const usedPositions = positions.slice(0, count)

  return (
    <>
      {usedPositions.map((pos) => (
        <div
          key={`${type}-${pos}`}
          className={`decoration-corner ${pos} ${animate ? 'animate' : ''}`}
        >
          {renderDecoration()}
        </div>
      ))}
    </>
  )
}

function PoemCard({
  poem,
  style,
  animateDeco
}: {
  poem: GeneratedPoem | null
  style: StyleConfig
  animateDeco: boolean
}) {
  const cssVars = useMemo(() => applyStyleConfig(style), [style])

  const styleObj = {
    '--poem-font-family': cssVars['--poem-font-family'],
    '--bg-color': cssVars['--bg-color'],
    '--bg-texture': cssVars['--bg-texture']
  } as React.CSSProperties

  return (
    <div className="poem-card" style={styleObj}>
      <DecorationLayer type={style.decoration} animate={animateDeco} />
      {poem ? (
        <>
          <div className="poem-content">
            {poem.lines.map((line, idx) => (
              <div key={idx} className="poem-line">
                {line}
              </div>
            ))}
          </div>
          <div className="poem-meta">
            <div className="poem-keyword">题·{poem.keyword}</div>
            <div className="poem-type">
              {poem.lineType === 'seven' ? '七言' : '五言'}绝句
            </div>
            <div className="poem-author">—— {poem.author}</div>
          </div>
        </>
      ) : (
        <div className="poem-placeholder">
          <div className="poem-placeholder-icon">✦</div>
          <div className="poem-placeholder-text">输入关键词 · 生成佳句</div>
        </div>
      )}
    </div>
  )
}

function StylePanel({
  style,
  onStyleChange
}: {
  style: StyleConfig
  onStyleChange: (style: StyleConfig) => void
}) {
  return (
    <aside className="style-panel">
      <div className="style-panel-title">样式定制</div>

      <div className="style-section">
        <div className="style-section-label">字体选择</div>
        <div className="style-options">
          {(Object.keys(fontOptions) as FontType[]).map((key) => (
            <div
              key={key}
              className={`style-option ${style.font === key ? 'active' : ''}`}
              onClick={() => onStyleChange({ ...style, font: key })}
            >
              <span style={{ fontFamily: fontOptions[key].family }}>
                {fontOptions[key].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="style-section">
        <div className="style-section-label">背景纹理</div>
        <div className="style-options">
          {(Object.keys(bgOptions) as BgTextureType[]).map((key) => (
            <div
              key={key}
              className={`style-option ${style.background === key ? 'active' : ''}`}
              onClick={() => onStyleChange({ ...style, background: key })}
            >
              <span
                className="bg-preview"
                style={{ background: bgOptions[key].color }}
              ></span>
              {bgOptions[key].label}
            </div>
          ))}
        </div>
      </div>

      <div className="style-section">
        <div className="style-section-label">装饰元素</div>
        <div className="style-options">
          {(Object.keys(decorationOptions) as DecorationType[]).map((key) => (
            <div
              key={key}
              className={`style-option ${style.decoration === key ? 'active' : ''}`}
              onClick={() => onStyleChange({ ...style, decoration: key })}
            >
              {decorationOptions[key].icon} {decorationOptions[key].label}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default function CreatePage() {
  const dispatch = useDispatch()
  const { currentPoem } = useSelector((state: AppState) => state.poem)
  const { currentStyle } = useSelector((state: AppState) => state.style)
  const { items: historyItems } = useSelector((state: AppState) => state.history)

  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [animateDeco, setAnimateDeco] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareCode = window.location.search.substring(1)
    if (shareCode && (params.get('p') || params.get('f'))) {
      import('../modules/history/HistoryModule').then(({ parseShareCode }) => {
        const { poem, style } = parseShareCode(shareCode)
        if (poem) {
          dispatch(generatePoemAction(poem))
          setKeyword(poem.keyword)
        }
        const hasCustomStyle = params.get('f') || params.get('b') || params.get('d')
        if (hasCustomStyle) {
          dispatch(applyStyleAction(style))
        }
      })
    }
  }, [dispatch])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleGenerate = () => {
    const validation = validateKeyword(keyword)
    if (!validation.valid) {
      setError(validation.message || '')
      return
    }
    setError('')

    const t0 = performance.now()
    const poem = generatePoem(keyword.trim())
    const t1 = performance.now()

    dispatch(generatePoemAction(poem))
    setAnimateDeco(true)
    setTimeout(() => setAnimateDeco(false), 50)

    console.log(`生成耗时: ${(t1 - t0).toFixed(2)}ms`)
  }

  const handleStyleChange = (newStyle: StyleConfig) => {
    dispatch(applyStyleAction(newStyle))
    if (newStyle.decoration !== currentStyle.decoration) {
      setAnimateDeco(true)
      setTimeout(() => setAnimateDeco(false), 50)
    }
  }

  const handleSave = () => {
    if (!currentPoem) {
      showToast('请先生成诗词')
      return
    }
    const exists = historyItems.some(item => item.id === currentPoem.id)
    if (exists) {
      showToast('该作品已收藏')
      return
    }
    const item = saveToHistory(currentPoem, currentStyle)
    dispatch(saveHistoryAction(item))
    showToast('收藏成功')
  }

  const handleShare = () => {
    if (!currentPoem) {
      showToast('请先生成诗词')
      return
    }
    const code = generateShareCode(currentPoem, currentStyle)
    const url = `${window.location.origin}${window.location.pathname}?${code}`
    const poemText = `${currentPoem.lines.join('，')}\n—— ${currentPoem.author}`
    const fullText = `${poemText}\n\n还原链接：${url}`

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(fullText)
        .then(() => showToast('已复制到剪贴板'))
        .catch(() => fallbackCopy(fullText))
    } else {
      fallbackCopy(fullText)
    }
  }

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      showToast('已复制到剪贴板')
    } catch {
      showToast('复制失败')
    }
    document.body.removeChild(textarea)
  }

  return (
    <div className="create-page">
      {toast && <Toast message={toast} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div className="input-section">
          <h2>诗题关键词</h2>
          <div className="input-row">
            <input
              type="text"
              className="keyword-input"
              placeholder="如春、月、离别..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate()
              }}
            />
            <button onClick={handleGenerate}>生成诗词</button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="poem-card-wrapper">
          <PoemCard poem={currentPoem} style={currentStyle} animateDeco={animateDeco} />
          {currentPoem && (
            <div className="action-buttons">
              <button onClick={handleSave}>★ 收藏</button>
              <button onClick={handleShare}>↗ 分享</button>
              <button onClick={handleGenerate}>↻ 换一首</button>
            </div>
          )}
        </div>
      </div>

      <StylePanel style={currentStyle} onStyleChange={handleStyleChange} />
    </div>
  )
}
