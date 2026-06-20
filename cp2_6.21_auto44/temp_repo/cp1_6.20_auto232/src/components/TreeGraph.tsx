import React, { useEffect, useRef, useState, useMemo } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type Simulation, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force'
import type { PoemAnalysis, LineInfo, CharInfo, AntithesisType } from '@/analyzers/poemParser'

interface TreeNode extends SimulationNodeDatum {
  id: string
  label: string
  kind: 'title' | 'line' | 'char'
  depth: number
  rhymeGroup: number
  isRhyme: boolean
  rhymeColor: string
  toneLabel: string
  parentId?: string
  lineIdx: number
  charIdx: number
  info?: CharInfo | LineInfo | null
}

interface TreeLink extends SimulationLinkDatum<TreeNode> {
  antithesis?: AntithesisType | 'parent'
}

interface TreeGraphProps {
  analysis: PoemAnalysis
  animKey: number
}

const ANTI_COLORS: Record<AntithesisType | 'parent', string> = {
  strict: '#2e7d32',
  wide: '#1565c0',
  borrowed: '#ef6c00',
  none: '#9e9e9e',
  parent: '#5d4037'
}

const TreeGraph: React.FC<TreeGraphProps> = ({ analysis, animKey }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<Simulation<TreeNode, TreeLink> | null>(null)
  const animRef = useRef<number>(0)
  const [tick, setTick] = useState(0)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [dimensions, setDimensions] = useState({ w: 600, h: 600 })

  const { nodes, links } = useMemo(() => {
    const ns: TreeNode[] = []
    const ls: TreeLink[] = []
    const titleId = `title_${animKey}`

    ns.push({
      id: titleId,
      label: analysis.title,
      kind: 'title',
      depth: 0,
      rhymeGroup: -1,
      isRhyme: false,
      rhymeColor: '#5d4037',
      toneLabel: '',
      lineIdx: -1,
      charIdx: -1,
      info: null
    })

    analysis.lines.forEach((line, li) => {
      const lineId = `line_${animKey}_${li}`
      const couplet = analysis.couplets.find(
        c => c.lineA.text === line.text || c.lineB.text === line.text
      )
      let anti: AntithesisType | undefined
      if (li % 2 === 1 && couplet) {
        anti = couplet.antithesis
      }

      ns.push({
        id: lineId,
        label: `第${li + 1}句：${line.text}`,
        kind: 'line',
        depth: 1,
        rhymeGroup: -1,
        isRhyme: false,
        rhymeColor: '#6d4c41',
        toneLabel: '',
        lineIdx: li,
        charIdx: -1,
        info: line
      })
      ls.push({
        source: titleId,
        target: lineId,
        antithesis: 'parent'
      })

      line.chars.forEach((c, ci) => {
        const charId = `char_${animKey}_${li}_${ci}`
        const rhymeObj = analysis.rhymeGroups.find(r => r.group === c.rhymeGroup)
        ns.push({
          id: charId,
          label: c.char,
          kind: 'char',
          depth: 2,
          rhymeGroup: c.rhymeGroup,
          isRhyme: c.isRhyme,
          rhymeColor: rhymeObj?.color || '#ce93d8',
          toneLabel: c.tone === 'ping' ? '平' : c.tone === 'ze' ? '仄' : '?',
          parentId: lineId,
          lineIdx: li,
          charIdx: ci,
          info: c
        })
        ls.push({
          source: lineId,
          target: charId,
          antithesis: 'parent'
        })
      })

      if (li % 2 === 1 && anti) {
        const prevLineId = `line_${animKey}_${li - 1}`
        ls.push({
          source: prevLineId,
          target: lineId,
          antithesis: anti
        })
      }
    })

    return { nodes: ns, links: ls }
  }, [analysis, animKey])

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDimensions({ w: rect.width, h: rect.height })

    const onResize = () => {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      setDimensions({ w: r.width, h: r.height })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const sim = forceSimulation<TreeNode, TreeLink>(nodes)
      .force('link', forceLink<TreeNode, TreeLink>(links)
        .id(d => d.id)
        .distance(d => {
          if (d.antithesis && d.antithesis !== 'parent') return 140
          const s = d.source as TreeNode
          if (s.kind === 'title') return 120
          return 75
        })
        .strength(d => {
          if (d.antithesis && d.antithesis !== 'parent') return 0.05
          return 0.4
        })
      )
      .force('charge', forceManyBody<TreeNode>().strength(d => {
        if (d.kind === 'title') return -420
        if (d.kind === 'line') return -260
        return -80
      }))
      .force('center', forceCenter<TreeNode>(dimensions.w / 2, dimensions.h / 2).strength(0.08))
      .force('collide', forceCollide<TreeNode>().radius(d => d.kind === 'title' ? 46 : d.kind === 'line' ? 32 : 22).strength(0.8))
      .alphaDecay(0.028)

    sim.on('tick', () => {
      setTick(t => t + 1)
    })

    simRef.current = sim

    return () => {
      sim.stop()
    }
  }, [nodes, links, dimensions.w, dimensions.h])

  useEffect(() => {
    let startTime: number
    const animate = (t: number) => {
      if (!startTime) startTime = t
      const elapsed = t - startTime

      if (simRef.current && elapsed < 600) {
        simRef.current.tick()
        setTick(x => x + 1)
      }
      if (elapsed < 650) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animKey, nodes])

  const handleDoubleClick = (node: TreeNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }

  const getLinkStyle = (l: TreeLink) => {
    const anti = l.antithesis || 'parent'
    const color = ANTI_COLORS[anti]
    let dash = ''
    if (anti === 'wide') dash = '7,4'
    else if (anti === 'borrowed') dash = '2,6,8,4'
    else if (anti === 'strict') dash = ''
    else dash = ''
    return {
      stroke: color,
      strokeDasharray: dash,
      strokeWidth: anti !== 'parent' ? 2.2 : 1.3,
      opacity: anti !== 'parent' ? 0.9 : 0.45
    }
  }

  return (
    <div
      ref={containerRef}
      className="fade-in-up"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        border: '2px solid #5d4037',
        boxShadow: '2px 4px 8px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        animationDelay: '0.2s'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <h3 className="zhuanshu" style={{
          margin: 0,
          fontSize: '22px',
          color: '#5d4037',
          letterSpacing: '3px'
        }}>语义韵律树图</h3>
        <div style={{
          display: 'flex',
          gap: '10px',
          fontSize: '11px',
          color: '#6d4c41',
          alignItems: 'center',
          pointerEvents: 'auto'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="#2e7d32" strokeWidth="2" /></svg>
            工对
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="#1565c0" strokeWidth="2" strokeDasharray="7,4" /></svg>
            宽对
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="#ef6c00" strokeWidth="2" strokeDasharray="2,6,8,4" /></svg>
            借对
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.w}
        height={dimensions.h}
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="glow-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e1bee7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e1bee7" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#5d4037" floodOpacity="0.25" />
          </filter>
        </defs>

        <g style={{ transform: 'translate(0, 24px)' }}>
          {links.map((l, i) => {
            const s = l.source as TreeNode
            const t = l.target as TreeNode
            if (s.x == null || t.x == null) return null
            const style = getLinkStyle(l)
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                {...style}
                strokeLinecap="round"
              />
            )
          })}

          {analysis.rhymeGroups.map((rg, gi) => {
            const rhymeNodes = nodes.filter(n => n.isRhyme && analysis.rhymeGroups[rg.group] && n.rhymeGroup === rg.group)
            const centerX = rhymeNodes.reduce((a, b) => a + (b.x || 0), 0) / (rhymeNodes.length || 1)
            const centerY = rhymeNodes.reduce((a, b) => a + (b.y || 0), 0) / (rhymeNodes.length || 1)
            if (rhymeNodes.length === 0) return null
            return (
              <circle
                key={`rhyme-legend-${gi}`}
                cx={centerX}
                cy={centerY}
                r={50}
                fill={rg.color}
                opacity={0.12}
              />
            )
          })}

          {nodes.map((n, i) => {
            if (n.x == null || n.y == null) return null
            const isSelected = selectedNode?.id === n.id
            const zoom = isSelected ? 1.5 : 1
            const transX = n.x
            const transY = n.y

            if (n.kind === 'title') {
              return (
                <g key={i}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.4s ease',
                    transform: `translate(${transX}px, ${transY}px) scale(${zoom})`,
                    transformOrigin: `${n.x}px ${n.y}px`,
                    transformBox: 'fill-box' as any
                  }}
                  onDoubleClick={() => handleDoubleClick(n)}
                  filter="url(#soft-shadow)"
                >
                  <circle r={38} fill="#5d4037" />
                  <circle r={34} fill="none" stroke="#d7ccc8" strokeWidth="2" strokeDasharray="3,2" />
                  <text
                    textAnchor="middle"
                    dy="6"
                    fill="#f5f0eb"
                    style={{
                      fontFamily: "'Ma Shan Zheng', cursive",
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '2px'
                    }}
                  >{n.label.length > 5 ? n.label.slice(0, 5) : n.label}</text>
                </g>
              )
            }

            if (n.kind === 'line') {
              const textWidth = Math.min(n.label.length * 12 + 20, 160)
              return (
                <g key={i}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.4s ease',
                    transform: `translate(${transX}px, ${transY}px) scale(${zoom})`,
                    transformOrigin: `${n.x}px ${n.y}px`,
                    transformBox: 'fill-box' as any
                  }}
                  onDoubleClick={() => handleDoubleClick(n)}
                >
                  <rect
                    x={-textWidth / 2}
                    y={-16}
                    width={textWidth}
                    height={32}
                    rx={16}
                    ry={16}
                    fill="#8d6e63"
                    stroke="#d7ccc8"
                    strokeWidth="1.5"
                    filter="url(#soft-shadow)"
                  />
                  <text
                    textAnchor="middle"
                    dy="5"
                    fill="#fff8e1"
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label}
                  </text>
                </g>
              )
            }

            return (
              <g key={i}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.4s ease',
                  transform: `translate(${transX}px, ${transY}px) scale(${zoom})`,
                  transformOrigin: `${n.x}px ${n.y}px`,
                  transformBox: 'fill-box' as any
                }}
                onDoubleClick={() => handleDoubleClick(n)}
              >
                {n.isRhyme && (
                  <circle r={26} fill={n.rhymeColor} opacity={0.4} />
                )}
                <circle
                  r={20}
                  fill={n.isRhyme ? n.rhymeColor : 'white'}
                  stroke={n.toneLabel === '平' ? '#00bcd4' : n.toneLabel === '仄' ? '#ff5722' : '#bdbdbd'}
                  strokeWidth={n.isRhyme ? 3 : 2}
                  filter="url(#soft-shadow)"
                />
                <text
                  textAnchor="middle"
                  dy="-3"
                  fill={n.isRhyme ? '#5d4037' : '#3e2723'}
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: '16px',
                    fontWeight: 700
                  }}
                >{n.label}</text>
                <text
                  textAnchor="middle"
                  dy="12"
                  fill={n.toneLabel === '平' ? '#00838f' : n.toneLabel === '仄' ? '#d84315' : '#9e9e9e'}
                  style={{
                    fontFamily: "'Ma Shan Zheng', cursive",
                    fontSize: '10px',
                    fontWeight: 600
                  }}
                >{n.toneLabel}</text>
                {n.isRhyme && (
                  <circle r={4} cx={16} cy={-16} fill="#ad1457" stroke="#fff" strokeWidth="1" />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {selectedNode && (
        <div
          className="node-detail-pop"
          onClick={() => setSelectedNode(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(62,39,35,0.35)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            animation: 'popIn 0.4s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff8e1',
              border: '3px solid #5d4037',
              borderRadius: '16px',
              padding: '28px 36px',
              minWidth: '300px',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.4s ease'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
              borderBottom: '2px double #bfaaa0',
              paddingBottom: '12px'
            }}>
              <h4 className="zhuanshu" style={{
                margin: 0,
                fontSize: '22px',
                color: '#5d4037',
                letterSpacing: '2px'
              }}>
                {selectedNode.kind === 'title' ? '诗题' : selectedNode.kind === 'line' ? '诗句' : '单字'}注解
              </h4>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: '#5d4037',
                  color: '#fff8e1',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: '24px'
                }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px', color: '#4e342e' }}>
              {selectedNode.kind === 'title' && (
                <>
                  <div><strong>诗题：</strong>{selectedNode.label}</div>
                  <div><strong>体裁：</strong>{analysis.formType}</div>
                  <div><strong>全诗字数：</strong>{analysis.totalChars} 字</div>
                  <div><strong>句数：</strong>{analysis.lines.length} 句</div>
                </>
              )}
              {selectedNode.kind === 'line' && (
                <>
                  <div style={{
                    fontSize: '26px',
                    textAlign: 'center',
                    padding: '12px',
                    background: 'rgba(93,64,55,0.06)',
                    borderRadius: '8px',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    letterSpacing: '6px',
                    color: '#3e2723'
                  }}>{selectedNode.label.replace(/^第\d+句：/, '')}</div>
                  <div><strong>平仄格式：</strong>
                    {(selectedNode.info as LineInfo)?.pattern.map(p =>
                      p === 'ping' ? '○' : p === 'ze' ? '●' : '△'
                    ).join(' ')}
                  </div>
                  <div><strong>位置：</strong>第 {selectedNode.lineIdx + 1} 句 {selectedNode.lineIdx % 2 === 0 ? '（出句）' : '（对句）'}</div>
                  {analysis.couplets.find(c => c.idx === Math.floor(selectedNode.lineIdx / 2)) && (
                    <div>
                      <strong>所属联对仗：</strong>
                      {(() => {
                        const cp = analysis.couplets.find(c => c.idx === Math.floor(selectedNode.lineIdx / 2))
                        if (!cp) return '-'
                        const map = { strict: '工对', wide: '宽对', borrowed: '借对', none: '无对仗' }
                        return `${map[cp.antithesis]}（评分 ${cp.antithesisScore}/5）`
                      })()}
                    </div>
                  )}
                </>
              )}
              {selectedNode.kind === 'char' && (
                <>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: `radial-gradient(circle, ${selectedNode.isRhyme ? selectedNode.rhymeColor + '88' : 'rgba(93,64,55,0.1)'} 0%, transparent 70%)`
                  }}>
                    <span style={{
                      fontSize: '72px',
                      fontWeight: 700,
                      color: '#3e2723',
                      fontFamily: "'Noto Serif SC', serif",
                      textShadow: '2px 4px 8px rgba(0,0,0,0.15)'
                    }}>{selectedNode.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div><strong>声调：</strong>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '10px',
                        background: selectedNode.toneLabel === '平' ? '#e0f7fa' :
                                   selectedNode.toneLabel === '仄' ? '#fbe9e7' : '#f5f5f5',
                        color: selectedNode.toneLabel === '平' ? '#00838f' :
                               selectedNode.toneLabel === '仄' ? '#d84315' : '#757575',
                        fontWeight: 600
                      }}>{selectedNode.toneLabel}声</span>
                    </div>
                    <div><strong>韵脚：</strong>
                      <span style={{
                        color: selectedNode.isRhyme ? '#ad1457' : '#757575',
                        fontWeight: 600
                      }}>{selectedNode.isRhyme ? '是 ✓' : '否'}</span>
                    </div>
                  </div>
                  <div><strong>位置：</strong>第 {selectedNode.lineIdx + 1} 句，第 {selectedNode.charIdx + 1} 字</div>
                  {selectedNode.isRhyme && (
                    <div>
                      <strong>同韵字：</strong>
                      {analysis.rhymeGroups[selectedNode.rhymeGroup]?.chars.join('、') || '-'}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{
              marginTop: '18px',
              paddingTop: '12px',
              borderTop: '1px dashed #bfaaa0',
              textAlign: 'center',
              fontSize: '12px',
              color: '#8d6e63',
              fontStyle: 'italic'
            }}>
              双击空白处或点击×关闭
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#8d6e63',
        zIndex: 5,
        pointerEvents: 'none'
      }}>
        <span>节点：{nodes.length} | 连线：{links.filter(l => l.antithesis !== 'parent').length} 对仗</span>
        <span className="zhuanshu" style={{ letterSpacing: '2px' }}>双击节点放大查看</span>
      </div>

      <style>{`
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .node-detail-pop {
          animation: popIn 0.4s ease;
        }
      `}</style>
    </div>
  )
}

export default TreeGraph
