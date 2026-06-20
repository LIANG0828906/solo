import { useState, useRef, useMemo, useEffect } from 'react'
import Visualizer from './visualizer'
import type { VisualizerHandle } from './visualizer'
import { parseCode, getNodeColor, getTypeLabel } from './parser'
import type { SyntaxNode, ParseResult } from './parser'

const DEFAULT_CODE = `// 示例代码 - 可以修改后点击解析
const greet = (name) => {
  const greeting = 'Hello, ' + name
  return greeting
}

function fibonacci(n) {
  if (n <= 1) {
    return n
  }
  let a = 0, b = 1
  for (let i = 2; i <= n; i++) {
    const temp = a + b
    a = b
    b = temp
  }
  return b
}

const nums = [1, 2, 3, 4, 5]
const doubled = nums.map(n => n * 2)
`

const MAX_CODE_LINES = 30

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selectedNode, setSelectedNode] = useState<SyntaxNode | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  const visualizerRef = useRef<VisualizerHandle>(null)

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const layoutMode = useMemo(() => {
    if (viewportWidth > 1200) return 'desktop'
    if (viewportWidth >= 768) return 'tablet'
    return 'mobile'
  }, [viewportWidth])

  const codeLines = useMemo(() => code.split('\n'), [code])
  const lineCount = codeLines.length
  const exceedsLimit = lineCount > MAX_CODE_LINES

  const handleParse = () => {
    if (exceedsLimit) {
      setParseError(`代码行数不能超过 ${MAX_CODE_LINES} 行（当前 ${lineCount} 行）`)
      return
    }
    setParsing(true)
    setParseError(null)
    setSelectedNode(null)

    try {
      const t0 = performance.now()
      const result = parseCode(code)
      const t1 = performance.now()

      if (result.nodes.length === 0) {
        setParseError('未能解析出有效的语法节点，请检查代码是否合法。')
        setParseResult(null)
      } else {
        setParseResult(result)
        console.info(`[CodeMosaic] 解析完成: ${result.nodes.length} 个节点, 耗时 ${Math.round(t1 - t0)}ms`)
      }
    } catch (err: any) {
      setParseError(`解析失败: ${err?.message || '未知错误'}`)
      setParseResult(null)
    } finally {
      requestAnimationFrame(() => setParsing(false))
    }
  }

  const handleReset = () => {
    visualizerRef.current?.resetLayout()
  }

  const handleExport = () => {
    visualizerRef.current?.exportImage()
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    setParseError(null)
  }

  const getCodeLinesPreview = (nodeCode: string) => {
    const lines = nodeCode.split('\n').filter(l => l.trim().length > 0)
    return lines.slice(0, 2).join('\n') + (lines.length > 2 ? '\n...' : '')
  }

  const Button = ({
    children,
    onClick,
    disabled,
    variant = 'primary',
  }: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary'
  }) => {
    const isPrimary = variant === 'primary'
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onContextMenu={e => e.preventDefault()}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: layoutMode === 'mobile' ? '10px 14px' : '10px 20px',
          border: 'none',
          borderRadius: 10,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: layoutMode === 'mobile' ? 13 : 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          letterSpacing: 0.5,
          color: '#fff',
          minHeight: 40,
          touchAction: 'manipulation',
          background: isPrimary
            ? 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
            : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isPrimary
            ? '0 4px 16px rgba(0, 210, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
            : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          borderTop: isPrimary ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: disabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
        onMouseEnter={e => {
          if (disabled) return
          const el = e.currentTarget
          el.style.transform = 'translateY(-2px)'
          el.style.filter = 'brightness(1.15)'
          if (isPrimary) {
            el.style.boxShadow = '0 6px 24px rgba(0, 210, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform = 'translateY(0)'
          el.style.filter = 'brightness(1)'
          if (isPrimary) {
            el.style.boxShadow = '0 4px 16px rgba(0, 210, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
          }
        }}
        onMouseDown={e => {
          if (disabled) return
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onMouseUp={e => {
          if (disabled) return
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {children}
      </button>
    )
  }

  const editorHeightStyle =
    layoutMode === 'desktop'
      ? { flex: 1, minHeight: 0 }
      : layoutMode === 'tablet'
      ? { height: '40vh', minHeight: 200, flexShrink: 0 }
      : { height: '35vh', minHeight: 160, flexShrink: 0 }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: layoutMode === 'desktop' ? 'row' : 'column',
        padding: layoutMode === 'mobile' ? 8 : 16,
        gap: layoutMode === 'mobile' ? 8 : 16,
        animation: 'appFadeIn 0.5s ease-out',
      }}
    >
      <style>{`
        @keyframes appFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelSlideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes panelSlideInBottom {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes detailSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(0, 210, 255, 0.3); }
          50% { box-shadow: 0 0 20px rgba(0, 210, 255, 0.55); }
        }
        .code-textarea:focus {
          outline: none;
          border-color: rgba(0, 210, 255, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.12), 0 8px 32px rgba(0,0,0,0.3);
        }
        .code-line-numbers {
          user-select: none;
          text-align: right;
          padding-right: 12px;
          color: rgba(255, 255, 255, 0.25);
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          ...(layoutMode === 'desktop'
            ? { width: '33.333%', flexShrink: 0, animation: 'panelSlideInLeft 0.4s ease-out both' }
            : { width: '100%', animation: 'panelSlideInBottom 0.4s ease-out both' }),
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: layoutMode === 'mobile' ? 32 : 40,
                height: layoutMode === 'mobile' ? 32 : 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00d2ff, #3a7bd5, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: layoutMode === 'mobile' ? 16 : 20,
                boxShadow: '0 4px 16px rgba(0, 210, 255, 0.4)',
              }}
            >
              ✨
            </div>
            <div>
              <div
                style={{
                  fontSize: layoutMode === 'mobile' ? 15 : 18,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #00d2ff, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 0.5,
                }}
              >
                CodeMosaic
              </div>
              <div
                style={{
                  fontSize: layoutMode === 'mobile' ? 10 : 11,
                  color: 'rgba(224, 224, 224, 0.5)',
                  fontFamily: 'monospace',
                }}
              >
                代码语法气泡可视化
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              flex: layoutMode === 'mobile' ? '1 1 100%' : 'none',
            }}
          >
            <Button onClick={handleParse} disabled={parsing || exceedsLimit}>
              <span>{parsing ? '⏳' : '🪄'}</span>
              {layoutMode === 'mobile' ? '解析' : '解析并可视化'}
            </Button>
            <Button onClick={handleReset} variant="secondary" disabled={!parseResult}>
              <span>↺</span>
              {layoutMode === 'mobile' ? '重置' : '重置布局'}
            </Button>
            <Button onClick={handleExport} variant="secondary" disabled={!parseResult}>
              <span>📥</span>
              {layoutMode === 'mobile' ? '导出' : '导出图片'}
            </Button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            ...editorHeightStyle,
            minHeight: layoutMode === 'desktop' ? 0 : undefined,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
            animation: 'panelSlideInLeft 0.45s ease-out 0.1s both',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ff5f57',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#febc2e',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#28c840',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(224, 224, 224, 0.5)',
                  fontFamily: 'monospace',
                  marginLeft: 8,
                }}
              >
                script.js
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: exceedsLimit ? '#ef4444' : 'rgba(224, 224, 224, 0.5)',
                fontWeight: exceedsLimit ? 600 : 400,
              }}
            >
              {lineCount}/{MAX_CODE_LINES}
            </span>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div
              className="code-line-numbers"
              style={{
                padding: '10px 0 10px 12px',
                flexShrink: 0,
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              {Array.from({ length: Math.max(lineCount, 5) }, (_, i) => (
                <div key={i} style={{ minHeight: '1.6em' }}>
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              className="code-textarea"
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              placeholder="在这里输入或粘贴 JavaScript 代码..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '10px 14px',
                color: '#e0e0e0',
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                resize: 'none',
                width: '100%',
                minHeight: '100%',
                caretColor: '#00d2ff',
                transition: 'all 0.2s ease',
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {parseError && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              fontSize: 12,
              color: '#fca5a5',
              fontFamily: 'monospace',
              animation: 'detailSlideUp 0.3s ease-out',
            }}
          >
            ⚠️ {parseError}
          </div>
        )}

        {parseResult && !selectedNode && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8,
              fontSize: 11,
              color: '#6ee7b7',
              fontFamily: 'monospace',
              textAlign: 'center',
              animation: 'detailSlideUp 0.3s ease-out',
            }}
          >
            ✓ 解析成功：{parseResult.nodes.length} 个节点 · 点击气泡查看详情 · 拖拽调整布局
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
          minHeight: 0,
          animation: 'panelSlideInBottom 0.45s ease-out 0.15s both',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: layoutMode === 'mobile' ? '65vh' : 400,
            display: 'flex',
            minWidth: 0,
          }}
        >
          <Visualizer ref={visualizerRef} parseResult={parseResult} onNodeSelect={setSelectedNode} />
        </div>

        <div
          style={{
            position: 'relative',
            height: 1,
            flexShrink: 0,
            minHeight: selectedNode ? (layoutMode === 'desktop' ? 200 : 180) : 0,
            transition: 'min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          {selectedNode && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(15, 12, 41, 0.72)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                boxShadow: '0 0 24px rgba(139, 92, 246, 0.15), 0 8px 32px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: 16,
                flexDirection: layoutMode === 'desktop' ? 'row' : 'column',
                alignItems: 'flex-start',
                animation: 'detailSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: `radial-gradient(circle at 30% 30%, ${getNodeColor(selectedNode.type).toString()}, ${getNodeColor(selectedNode.type).toString()}aa 60%, ${getNodeColor(selectedNode.type).toString()}55)`,
                  boxShadow: `0 0 20px ${getNodeColor(selectedNode.type).toString()}88, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              >
                {getTypeLabel(selectedNode.type).slice(0, 2)}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#fff',
                        margin: 0,
                        letterSpacing: 0.3,
                      }}
                    >
                      {selectedNode.label}
                    </h3>
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: `${getNodeColor(selectedNode.type).toString()}33`,
                        border: `1px solid ${getNodeColor(selectedNode.type).toString()}55`,
                        color: getNodeColor(selectedNode.type).toString(),
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        letterSpacing: 0.5,
                      }}
                    >
                      {getTypeLabel(selectedNode.type)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedNode(null)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'rgba(224,224,224,0.6)',
                      fontSize: 16,
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      touchAction: 'manipulation',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'rgba(224,224,224,0.6)'
                    }}
                    aria-label="关闭"
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: layoutMode === 'desktop' ? 'repeat(4, auto) 1fr' : 'repeat(2, 1fr)',
                    gap: layoutMode === 'desktop' ? 20 : 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(224,224,224,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>
                      起始行
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'monospace', color: '#a78bfa' }}>
                      L{selectedNode.startLine}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(224,224,224,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>
                      结束行
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'monospace', color: '#a78bfa' }}>
                      L{selectedNode.endLine}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(224,224,224,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>
                      子节点数
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'monospace', color: '#22d3ee' }}>
                      {selectedNode.childCount}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(224,224,224,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>
                      字符范围
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'monospace', color: '#fbbf24' }}>
                      {selectedNode.start}:{selectedNode.end}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'rgba(224,224,224,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
                    原始代码片段
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px 14px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: '#d1d5db',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: 100,
                      overflow: 'auto',
                      borderLeft: `3px solid ${getNodeColor(selectedNode.type).toString()}`,
                    }}
                  >
                    {getCodeLinesPreview(selectedNode.code) || <span style={{ color: 'rgba(224,224,224,0.35)' }}>（空）</span>}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
