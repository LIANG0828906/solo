import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import Timeline from './Timeline'
import WordCloud from './WordCloud'
import { SpeechItem } from './utils'

type PlaybackSpeed = 1 | 2 | 3

export default function App() {
  const speeches = useStore(state => state.speeches)
  const keywords = useStore(state => state.keywords)
  const addSpeech = useStore(state => state.addSpeech)
  const loadFromData = useStore(state => state.loadFromData)
  const isPlaying = useStore(state => state.isPlaying)
  const togglePlay = useStore(state => state.togglePlay)
  const playbackSpeed = useStore(state => state.playbackSpeed)
  const setPlaybackSpeed = useStore(state => state.setPlaybackSpeed)

  const [speaker, setSpeaker] = useState('')
  const [text, setText] = useState('')
  const [showCopied, setShowCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dataParam = params.get('data')
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(escape(atob(dataParam)))
        const data = JSON.parse(decoded) as SpeechItem[]
        if (Array.isArray(data) && data.length > 0) {
          loadFromData(data)
        }
      } catch (e) {
        console.warn('Failed to load data from URL:', e)
      }
    } else {
      const demoSpeeches: SpeechItem[] = [
        {
          id: 'demo1',
          speaker: '李明',
          timestamp: 0,
          text: '今天我们读书会的主题是《人类简史》，尤瓦尔·赫拉利通过宏大的视角重新审视了人类从石器时代到21世纪的进化历程。'
        },
        {
          id: 'demo2',
          speaker: '王芳',
          timestamp: 180,
          text: '我印象最深刻的是认知革命这一章，作者认为语言的虚构能力让智人能够大规模协作，从而战胜了尼安德特人。'
        },
        {
          id: 'demo3',
          speaker: '张伟',
          timestamp: 360,
          text: '农业革命其实是个陷阱，人类以为自己驯化了小麦，但其实是小麦驯化了我们，带来了更多的疾病和更辛苦的劳作。'
        },
        {
          id: 'demo4',
          speaker: '陈静',
          timestamp: 540,
          text: '关于金钱的章节也很精彩，金钱是有史以来最普遍也最有效的互信系统，它跨越了宗教、国家和文化的边界。'
        },
        {
          id: 'demo5',
          speaker: '赵磊',
          timestamp: 720,
          text: '最后作者提到科技革命和人文主义的危机，人工智能和生物工程可能会重新定义生命和意识的本质，引人深思。'
        }
      ]
      loadFromData(demoSpeeches)
    }
  }, [])

  const handleAddSpeech = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addSpeech(speaker.trim(), text.trim())
    setText('')
  }

  const handleShare = async () => {
    try {
      const dataStr = JSON.stringify(speeches)
      const encoded = btoa(unescape(encodeURIComponent(dataStr)))
      const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`
      setShareUrl(url)

      try {
        await navigator.clipboard.writeText(url)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (e) {
      console.error('Share failed:', e)
    }
  }

  const handleExportHTML = () => {
    const html = generateHTMLSnapshot()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    a.download = `speech-recap-${dateStr}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateHTMLSnapshot = (): string => {
    const maxCount = keywords.length > 0 ? Math.max(...keywords.map(k => k.count)) : 0
    const minCount = keywords.length > 0 ? Math.min(...keywords.map(k => k.count)) : 0
    const range = Math.max(1, maxCount - minCount)
    const themeColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

    const getGradientColor = (index: number, total: number): string => {
      if (total <= 1) return '#FF6B6B'
      const ratio = index / (total - 1)
      const r = Math.round(0xFF + (0x4E - 0xFF) * ratio)
      const g = Math.round(0x6B + (0xCD - 0x6B) * ratio)
      const b = Math.round(0x6B + (0xC4 - 0x6B) * ratio)
      return `rgb(${r}, ${g}, ${b})`
    }

    const formatTimestamp = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    const cardsHTML = speeches.map((s, i) => {
      const color = getGradientColor(i, speeches.length)
      return `
        <div style="position:relative;padding-left:40px;margin-bottom:24px;">
          <div style="position:absolute;left:11px;top:16px;width:10px;height:10px;border-radius:50%;background:${color};z-index:2;"></div>
          <div style="width:480px;max-width:100%;border-radius:12px;background:#F8F9FA;border-left:2px solid ${color};padding:16px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:600;font-size:14px;color:${color};">${s.speaker}</span>
              <span style="font-size:12px;color:#888;font-family:monospace;">${formatTimestamp(s.timestamp)}</span>
            </div>
            <p style="font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;word-break:break-word;margin:0;">${s.text}</p>
          </div>
        </div>
      `
    }).join('')

    const bubblesHTML = keywords.slice(0, 30).map((k, i) => {
      const ratio = range > 0 ? (k.count - minCount) / range : 0
      const fontSize = 12 + ratio * 36
      const color = themeColors[i % themeColors.length]
      const radius = fontSize
      return `<span style="display:inline-flex;align-items:center;justify-content:center;padding:${fontSize * 0.2}px ${fontSize * 0.4}px;border-radius:${radius}px;background:${color}15;font-size:${fontSize}px;font-weight:${500 + Math.floor(fontSize / 48 * 300)};color:${color};white-space:nowrap;margin:4px;" title="出现 ${k.count} 次">${k.word}</span>`
    }).join('')

    const eventDate = new Date()
    const dateStr = `${eventDate.getFullYear()}年${eventDate.getMonth() + 1}月${eventDate.getDate()}日`

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>演讲回顾 - ${dateStr}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FFFFFF;
      color: #333333;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px 100px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 28px;
      color: #333;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header p { color: #888; font-size: 14px; }
    .layout {
      display: flex;
      gap: 32px;
      align-items: flex-start;
    }
    .timeline-section {
      flex: 1;
      position: relative;
    }
    .wordcloud-section {
      width: 280px;
      flex-shrink: 0;
      padding-left: 32px;
      border-left: 1px solid #E8E8E8;
    }
    .wordcloud-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333;
      text-align: center;
    }
    .wordcloud-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      align-content: center;
      min-height: 300px;
      padding: 16px;
    }
    .timeline-line {
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #FF6B6B, #4ECDC4);
      z-index: 1;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 24px;
      padding: 16px;
      background: #F8F9FA;
      border-radius: 8px;
    }
    .stat-item { text-align: center; }
    .stat-value { font-size: 24px; font-weight: 600; color: #4ECDC4; }
    .stat-label { font-size: 12px; color: #888; margin-top: 2px; }
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #E8E8E8;
      text-align: center;
      color: #AAA;
      font-size: 12px;
    }
    @media (max-width: 768px) {
      .layout { flex-direction: column; }
      .wordcloud-section {
        width: 100%;
        border-left: none;
        padding-left: 0;
        padding-top: 32px;
        border-top: 1px solid #E8E8E8;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 演讲回顾</h1>
      <p>${dateStr} · 共 ${speeches.length} 条发言</p>
    </div>
    <div class="layout">
      <div class="timeline-section">
        <div class="timeline-line"></div>
        ${cardsHTML}
      </div>
      <div class="wordcloud-section">
        <div class="wordcloud-title">🔑 关键词云</div>
        <div class="wordcloud-container">${bubblesHTML || '<p style="color:#CCC;font-size:13px;">暂无关键词</p>'}</div>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-value">${speeches.length}</div>
            <div class="stat-label">发言数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${keywords.length}</div>
            <div class="stat-label">关键词</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${speeches.length > 0 ? formatTimestamp(speeches[speeches.length - 1].timestamp) : '00:00'}</div>
            <div class="stat-label">时长</div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      由 Speech Recap 生成 · ${dateStr}
    </div>
  </div>
</body>
</html>`
  }

  const playbackSpeeds: PlaybackSpeed[] = [1, 2, 3]

  const totalDuration = useMemo(() => {
    if (speeches.length === 0) return 0
    return speeches[speeches.length - 1].timestamp
  }, [speeches])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#FFFFFFF5',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #F0F0F0',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              🎙️
            </div>
            <div>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#333',
                }}
              >
                演讲回顾
              </h1>
              <p style={{ fontSize: 12, color: '#999' }}>
                {speeches.length} 条发言 · 关键词 {keywords.length} 个 · 时长 {Math.floor(totalDuration / 60)}分{totalDuration % 60}秒
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: '#F8F9FA',
              borderRadius: 8,
            }}
          >
            <button
              onClick={togglePlay}
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                border: 'none',
                backgroundColor: isPlaying ? '#FF6B6B' : '#4ECDC4',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => {
                if (!isPlaying) e.currentTarget.style.backgroundColor = '#3BA99A'
                else e.currentTarget.style.backgroundColor = '#E55555'
              }}
              onMouseOut={e => {
                if (!isPlaying) e.currentTarget.style.backgroundColor = '#4ECDC4'
                else e.currentTarget.style.backgroundColor = '#FF6B6B'
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div style={{ display: 'flex', gap: 4 }}>
              {playbackSpeeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: playbackSpeed === speed ? '#4ECDC4' : 'transparent',
                    color: playbackSpeed === speed ? '#fff' : '#666',
                    fontSize: 12,
                    fontWeight: playbackSpeed === speed ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => {
                    if (playbackSpeed !== speed) e.currentTarget.style.backgroundColor = '#EDEDED'
                  }}
                  onMouseOut={e => {
                    if (playbackSpeed !== speed) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          padding: '20px 24px',
        }}
      >
        <form
          onSubmit={handleAddSpeech}
          style={{
            display: 'flex',
            gap: 12,
            padding: 16,
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            placeholder="发言者姓名"
            value={speaker}
            onChange={e => setSpeaker(e.target.value)}
            style={{
              width: 120,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: '#fff',
            }}
            onFocus={e => (e.target.style.borderColor = '#4ECDC4')}
            onBlur={e => (e.target.style.borderColor = '#E0E0E0')}
          />
          <textarea
            placeholder="输入发言内容（最多500字）..."
            value={text}
            onChange={e => setText(e.target.value.slice(0, 500))}
            rows={1}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #E0E0E0',
              fontSize: 14,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              transition: 'border-color 0.2s',
              backgroundColor: '#fff',
            }}
            onFocus={e => (e.target.style.borderColor = '#4ECDC4')}
            onBlur={e => (e.target.style.borderColor = '#E0E0E0')}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAddSpeech(e)
              }
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="submit"
              disabled={!text.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: !text.trim() ? '#CCC' : '#4ECDC4',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: !text.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={e => {
                if (text.trim()) e.currentTarget.style.backgroundColor = '#3BA99A'
              }}
              onMouseOut={e => {
                if (text.trim()) e.currentTarget.style.backgroundColor = '#4ECDC4'
              }}
              onMouseDown={e => {
                if (text.trim()) e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ➕ 添加
            </button>
            <span style={{ fontSize: 10, color: '#AAA', textAlign: 'center' }}>
              {text.length}/500
            </span>
          </div>
        </form>
        <p style={{ fontSize: 11, color: '#BBB', textAlign: 'right', marginBottom: 16, paddingRight: 4 }}>
          提示：Ctrl/Cmd + Enter 快捷添加
        </p>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: 0,
          alignItems: 'stretch',
        }}
        className="main-layout"
      >
        <div
          style={{
            width: '65%',
            minWidth: 0,
            display: 'flex',
            justifyContent: 'center',
            maxHeight: 'calc(100vh - 360px)',
            minHeight: 400,
          }}
          className="timeline-wrapper"
        >
          <div style={{ width: 560, maxWidth: '100%' }}>
            <Timeline />
          </div>
        </div>

        <div
          style={{
            width: '1px',
            backgroundColor: '#E8E8E8',
            margin: '0 8px',
            minHeight: 300,
            flexShrink: 0,
          }}
          className="divider"
        />

        <div
          style={{
            width: 280,
            flexShrink: 0,
            padding: '20px 8px 80px 16px',
            maxHeight: 'calc(100vh - 360px)',
            overflowY: 'auto',
            minHeight: 400,
          }}
          className="wordcloud-wrapper"
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🔑</span> 关键词词云
            </h3>
          </div>
          <div
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: 12,
              padding: '8px 0',
              border: '1px solid #F0F0F0',
            }}
          >
            <WordCloud keywords={keywords} />
          </div>
        </div>
      </div>

      <footer
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 800,
          height: 60,
          backgroundColor: '#FFFFFFCC',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          zIndex: 100,
        }}
      >
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 8,
            border: '1px solid #4ECDC4',
            backgroundColor: '#fff',
            color: '#4ECDC4',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#4ECDC4'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#fff'
            e.currentTarget.style.color = '#4ECDC4'
          }}
        >
          <AnimatePresence mode="wait">
            {showCopied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="link"
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
          <span>{showCopied ? '已复制！' : '分享链接'}</span>
        </motion.button>

        <motion.button
          onClick={handleExportHTML}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#4ECDC4',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#3BA99A')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4ECDC4')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>导出 HTML</span>
        </motion.button>
      </footer>

      {shareUrl && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 600,
            width: 'calc(100% - 48px)',
            padding: '10px 16px',
            backgroundColor: '#333',
            color: '#fff',
            fontSize: 12,
            borderRadius: 8,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            zIndex: 99,
            display: showCopied ? 'block' : 'none',
          }}
        >
          {shareUrl}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column !important;
          }
          .timeline-wrapper {
            width: 100% !important;
            max-height: none !important;
          }
          .divider {
            width: 100% !important;
            height: 1px !important;
            margin: 16px 0 !important;
            min-height: auto !important;
          }
          .wordcloud-wrapper {
            width: 100% !important;
            max-height: none !important;
            padding: 16px 0 80px !important;
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}
