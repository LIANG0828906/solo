import React, { useState, useCallback, useEffect, useRef } from 'react'
import { parsePoem, recalcMetrics, type PoemAnalysis, type Tone } from '@/analyzers/poemParser'
import PingzePanel from '@/components/PingzePanel'
import TreeGraph from '@/components/TreeGraph'
import MetricsPanel from '@/components/MetricsPanel'
import { createInkParticles, drawInkParticles, resizeCanvas, type InkParticle } from '@/utils/canvasUtils'

const DEFAULT_POEM = `国破山河在，城春草木深。
感时花溅泪，恨别鸟惊心。
烽火连三月，家书抵万金。
白头搔更短，浑欲不胜簪。`

const SAMPLE_POEMS = [
  {
    name: '登高（杜甫·七言律诗）',
    text: `风急天高猿啸哀，渚清沙白鸟飞回。
无边落木萧萧下，不尽长江滚滚来。
万里悲秋常作客，百年多病独登台。
艰难苦恨繁霜鬓，潦倒新停浊酒杯。`
  },
  {
    name: '静夜思（李白·五言绝句）',
    text: `床前明月光，疑是地上霜。
举头望明月，低头思故乡。`
  },
  {
    name: '登鹳雀楼（王之涣·五言绝句）',
    text: `白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。`
  },
  {
    name: '春晓（孟浩然·五言绝句）',
    text: `春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。`
  },
  {
    name: '春望（杜甫·五言律诗）',
    text: DEFAULT_POEM
  }
]

const App: React.FC = () => {
  const [inputText, setInputText] = useState(DEFAULT_POEM)
  const [title, setTitle] = useState('春望')
  const [analysis, setAnalysis] = useState<PoemAnalysis | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)
  const [inputFocused, setInputFocused] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<InkParticle[]>([])
  const animRef = useRef<number>(0)
  const totalInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const doResize = () => {
      if (!canvas) return
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      resizeCanvas(canvas)
      particlesRef.current = createInkParticles(canvas, 30)
    }
    doResize()
    window.addEventListener('resize', doResize)

    const ctx = canvas.getContext('2d')!
    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      particlesRef.current = drawInkParticles(ctx, particlesRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', doResize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  useEffect(() => {
    handleAnalyze()
  }, [])

  const handleAnalyze = useCallback(() => {
    if (!inputText.trim()) {
      alert('请输入古诗内容')
      return
    }
    setAnalyzing(true)
    setTimeout(() => {
      const result = parsePoem(inputText, title || undefined)
      setAnalysis(result)
      setAnimKey(k => k + 1)
      setPulseKey(k => k + 1)
      setAnalyzing(false)
    }, 50)
  }, [inputText, title])

  const handleToneChange = useCallback((lineIdx: number, charIdx: number, newTone: Tone) => {
    if (!analysis) return
    const newLines = analysis.lines.map((line, li) => ({
      ...line,
      chars: line.chars.map((c, ci) =>
        li === lineIdx && ci === charIdx ? { ...c, tone: newTone } : c
      ),
      pattern: line.chars.map((c, ci) =>
        li === lineIdx && ci === charIdx ? newTone : c.tone
      ) as Tone[]
    }))

    const newAnalysis = recalcMetrics({
      ...analysis,
      lines: newLines,
      couplets: analysis.couplets.map(c => ({
        ...c,
        lineA: c.lineA.text === newLines[c.idx * 2]?.text ? newLines[c.idx * 2] : c.lineA,
        lineB: c.lineB.text === newLines[c.idx * 2 + 1]?.text ? newLines[c.idx * 2 + 1] : c.lineB,
      }))
    })
    setAnalysis(newAnalysis)
    setPulseKey(k => k + 1)
  }, [analysis])

  const handleSelectSample = (s: typeof SAMPLE_POEMS[number]) => {
    setInputText(s.text)
    setTitle(s.name.split('（')[0])
    setTimeout(() => {
      const result = parsePoem(s.text, s.name.split('（')[0])
      setAnalysis(result)
      setAnimKey(k => k + 1)
      setPulseKey(k => k + 1)
    }, 50)
  }

  const charCount = inputText.replace(/[\s，。、,.!?！？；;\n\r]/g, '').length
  const isOverLimit = charCount > 56

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#f5f0eb',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <canvas
        ref={bgCanvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1800px',
        margin: '0 auto',
        padding: '24px 28px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '100vh'
      }}>
        <header style={{
          textAlign: 'center',
          padding: '8px 0 16px'
        }}>
          <h1 className="zhuanshu" style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#3e2723',
            letterSpacing: '8px',
            textShadow: '2px 2px 0 rgba(93,64,55,0.1)',
            fontWeight: 700
          }}>
            古诗词图谱与韵律分析器
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: '#8d6e63',
            letterSpacing: '4px',
            fontFamily: "'Ma Shan Zheng', cursive"
          }}>
            ── 品诗词韵律 · 览格律之美 ──
          </p>
        </header>

        <section
          ref={totalInputRef}
          className="fade-in-up"
          style={{
            padding: '24px 28px',
            background: 'rgba(255,255,255,0.75)',
            borderRadius: '16px',
            border: `3px solid ${inputFocused ? '#b71c1c' : '#5d4037'}`,
            boxShadow: inputFocused ? '2px 4px 16px rgba(183,28,28,0.2)' : '2px 4px 8px rgba(0,0,0,0.15)',
            transition: 'border-color 0.3s linear, box-shadow 0.3s linear',
            animationDelay: '0s'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px 140px',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontSize: '14px',
                color: '#5d4037',
                fontFamily: "'Ma Shan Zheng', cursive",
                letterSpacing: '3px'
              }}>诗题（可选）</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="如：春望"
                style={{
                  padding: '10px 16px',
                  border: '2px solid #bfaaa0',
                  borderRadius: '10px',
                  background: 'rgba(255,248,225,0.6)',
                  fontSize: '15px',
                  color: '#3e2723',
                  fontFamily: "'Noto Serif SC', serif",
                  outline: 'none',
                  transition: 'all 0.3s',
                  fontStyle: 'italic'
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontSize: '14px',
                color: '#5d4037',
                fontFamily: "'Ma Shan Zheng', cursive",
                letterSpacing: '3px'
              }}>选择范例</label>
              <select
                onChange={e => {
                  const s = SAMPLE_POEMS.find(x => x.name === e.target.value)
                  if (s) handleSelectSample(s)
                }}
                defaultValue=""
                style={{
                  padding: '10px 12px',
                  border: '2px solid #bfaaa0',
                  borderRadius: '10px',
                  background: 'rgba(255,248,225,0.6)',
                  fontSize: '13px',
                  color: '#3e2723',
                  fontFamily: "'Noto Serif SC', serif",
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>—— 选择范例 ——</option>
                {SAMPLE_POEMS.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontSize: '14px',
                color: '#5d4037',
                fontFamily: "'Ma Shan Zheng', cursive",
                letterSpacing: '3px'
              }}>&nbsp;</label>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || isOverLimit}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  background: isOverLimit
                    ? '#bdbdbd'
                    : 'linear-gradient(135deg, #5d4037 0%, #8d6e63 100%)',
                  color: '#fff8e1',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: "'Ma Shan Zheng', cursive",
                  letterSpacing: '4px',
                  cursor: analyzing || isOverLimit ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 10px rgba(93,64,55,0.3)',
                  transition: 'all 0.3s',
                  transform: analyzing ? 'scale(0.98)' : undefined
                }}
                onMouseEnter={e => {
                  if (!analyzing && !isOverLimit) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(93,64,55,0.4)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(93,64,55,0.3)'
                }}
              >
                {analyzing ? '分析中…' : '开 始 分 析'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <label style={{
                fontSize: '14px',
                color: '#5d4037',
                fontFamily: "'Ma Shan Zheng', cursive",
                letterSpacing: '3px'
              }}>
                古诗原文 <span style={{ fontSize: '12px', color: '#8d6e63', letterSpacing: '1px', fontFamily: "'Noto Serif SC', serif" }}>（五言/七言绝句或律诗，限56字以内）</span>
              </label>
              <span style={{
                fontSize: '12px',
                color: isOverLimit ? '#c62828' : '#6d4c41',
                fontWeight: 600
              }}>
                已输入 <strong>{charCount}</strong> / 56 字
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAnalyze()
              }}
              placeholder="粘贴一首古诗，用逗号、句号或换行分隔每一句，例如：&#10;床前明月光，疑是地上霜。&#10;举头望明月，低头思故乡。"
              rows={4}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: `2px solid ${inputFocused ? '#b71c1c' : '#bfaaa0'}`,
                borderRadius: '10px',
                background: 'rgba(255,248,225,0.6)',
                fontSize: '18px',
                lineHeight: 1.8,
                color: '#3e2723',
                fontFamily: "'Noto Serif SC', serif",
                outline: 'none',
                transition: 'border-color 0.3s linear',
                resize: 'vertical',
                minHeight: '120px',
                boxShadow: isOverLimit ? '0 0 0 3px rgba(198,40,40,0.2) inset' : undefined
              }}
            />
            <div style={{
              fontSize: '12px',
              color: '#8d6e63',
              fontStyle: 'italic',
              textAlign: 'right'
            }}>
              💡 提示：Ctrl/⌘ + Enter 快速分析
            </div>
          </div>
        </section>

        {analysis && (
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(380px, 1.1fr) minmax(420px, 1.4fr) minmax(340px, 1fr)',
            gap: '20px',
            flex: 1,
            minHeight: 'calc(100vh - 380px)',
            height: '680px'
          }} key={animKey}>
            <div key={`pz-${animKey}`} style={{ height: '100%' }}>
              <PingzePanel
                lines={analysis.lines}
                onToneChange={handleToneChange}
                animKey={animKey}
              />
            </div>
            <div key={`tg-${animKey}`} style={{ height: '100%' }}>
              <TreeGraph
                analysis={analysis}
                animKey={animKey}
              />
            </div>
            <div key={`mt-${pulseKey}`} style={{ height: '100%' }}>
              <MetricsPanel
                analysis={analysis}
                pulseKey={pulseKey}
              />
            </div>
          </section>
        )}

        {!analysis && (
          <div style={{
            padding: '60px 40px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '16px',
            border: '2px dashed #bfaaa0',
            color: '#8d6e63'
          }}>
            <div className="zhuanshu" style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: '#a1887f'
            }}>✒️</div>
            <p style={{ fontSize: '18px', margin: '0 0 8px' }}>点击"开始分析"按钮，开始领略诗词格律之美</p>
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>支持五言/七言绝句与律诗，可手动微调平仄标注</p>
          </div>
        )}

        <footer style={{
          textAlign: 'center',
          padding: '20px 0 8px',
          fontSize: '12px',
          color: '#8d6e63',
          borderTop: '1px solid rgba(141,110,99,0.2)',
          marginTop: '16px',
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: '4px'
        }}>
          诗言志 · 歌咏言 · 声依永 · 律和声
        </footer>
      </div>

      <style>{`
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        textarea:focus, input:focus {
          box-shadow: 0 0 0 4px rgba(183,28,28,0.08);
        }
      `}</style>
    </div>
  )
}

export default App
