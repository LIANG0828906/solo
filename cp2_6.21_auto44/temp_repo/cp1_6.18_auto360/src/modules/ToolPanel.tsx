import React, { useRef, useEffect } from 'react'
import { Type, Sticker, Paintbrush, Undo2, Redo2, Download, Trash2, Bold, Italic, Underline } from 'lucide-react'
import { useElementStore, TextureType, TextElement, StickerElement } from '../store/elementStore'
import { PRESET_COLORS } from './ElementEditor'
import { STICKER_TYPES, exportPostcard } from './CanvasRenderer'

const TEXTURE_OPTIONS: { key: TextureType; label: string; render: (canvas: HTMLCanvasElement) => void }[] = [
  {
    key: 'plain', label: '纯白',
    render: (c) => {
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#FAFAFA'
      ctx.fillRect(0, 0, 60, 60)
    },
  },
  {
    key: 'grid', label: '信纸格纹',
    render: (c) => {
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#FAFAFA'
      ctx.fillRect(0, 0, 60, 60)
      ctx.strokeStyle = 'rgba(93,64,55,0.2)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 60; i += 8) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 60); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(60, i); ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(229,57,53,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, 60); ctx.stroke()
    },
  },
  {
    key: 'watercolor', label: '水彩晕染',
    render: (c) => {
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#FAFAFA'
      ctx.fillRect(0, 0, 60, 60)
      const spots = [
        { x: 15, y: 15, r: 18, c: 'rgba(255,179,0,0.3)' },
        { x: 45, y: 45, r: 18, c: 'rgba(30,136,229,0.25)' },
        { x: 20, y: 45, r: 14, c: 'rgba(142,36,170,0.2)' },
      ]
      for (const s of spots) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
        g.addColorStop(0, s.c)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, 60, 60)
      }
    },
  },
  {
    key: 'vintage', label: '复古邮票',
    render: (c) => {
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#FDF5E6'
      ctx.fillRect(0, 0, 60, 60)
      ctx.strokeStyle = 'rgba(93,64,55,0.6)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 2])
      ctx.strokeRect(4, 4, 52, 52)
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(93,64,55,0.8)'
      ctx.lineWidth = 1.5
      const corners = [[6, 6], [54, 6], [54, 54], [6, 54]]
      const rots = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
      for (let i = 0; i < 4; i++) {
        ctx.save()
        ctx.translate(corners[i][0], corners[i][1])
        ctx.rotate(rots[i])
        ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 0); ctx.lineTo(6, 0); ctx.stroke()
        ctx.restore()
      }
    },
  },
  {
    key: 'kraft', label: '牛皮纸',
    render: (c) => {
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#D7CCC8'
      ctx.fillRect(0, 0, 60, 60)
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(141,110,99,${Math.random() * 0.2})`
        ctx.fillRect(Math.random() * 60, Math.random() * 60, 1, 1)
      }
    },
  },
]

const TextureThumbnail: React.FC<{ option: typeof TEXTURE_OPTIONS[0]; selected: boolean; onClick: () => void }> = ({ option, selected, onClick }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) option.render(ref.current)
  }, [option])
  return (
    <div
      onClick={onClick}
      title={option.label}
      style={{
        width: 60, height: 60, borderRadius: 8,
        border: selected ? '3px solid #FFB300' : '2px solid #D7CCC8',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        boxSizing: 'border-box',
        background: '#FFF',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <canvas ref={ref} width={60} height={60} style={{ display: 'block' }} />
    </div>
  )
}

const StickerPreview: React.FC<{ type: string; onClick: () => void }> = ({ type, onClick }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    import('./CanvasRenderer').then((m) => {
      const STICKER_SVGS_LOOKUP: Record<string, string> = (m as any).STICKER_SVGS ?? {}
      const svg = STICKER_SVGS_LOOKUP[type] || ''
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      img.onload = () => {
        ctx.clearRect(0, 0, 80, 80)
        ctx.drawImage(img, 5, 5, 70, 70)
      }
    })
  }, [type])
  return (
    <div
      onClick={onClick}
      style={{
        width: 80, height: 80, borderRadius: 10,
        background: '#FDF5E6', border: '1.5px solid #E0D5CC',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#FFF3D6'
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.borderColor = '#FFB300'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FDF5E6'
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.borderColor = '#E0D5CC'
      }}
    >
      <canvas ref={ref} width={80} height={80} />
    </div>
  )
}

const FONT_OPTIONS = ['Georgia', 'Times New Roman', 'Arial', 'Verdana', 'Courier New', 'Impact']

export const ToolPanel: React.FC = () => {
  const state = useElementStore()
  const selected = state.selectedId
    ? state.elements.find((e) => e.id === state.selectedId)
    : undefined
  const isText = selected?.type === 'text'
  const textEl = selected as TextElement | undefined
  const stickerEl = selected as StickerElement | undefined
  const isBrush = state.currentTool === 'brush'

  return (
    <>
      <div
        className="tool-panel"
        style={{
          width: 220,
          background: '#F0EBE6',
          borderRadius: '12px 12px 0 0',
          padding: 16,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 64px)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
          zIndex: 10,
        }}
      >
        <div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#5D4037',
            marginBottom: 10, letterSpacing: 0.5,
          }}>
            背景纹理
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TEXTURE_OPTIONS.map((opt) => (
              <TextureThumbnail
                key={opt.key}
                option={opt}
                selected={state.backgroundTexture === opt.key}
                onClick={() => state.setTexture(opt.key)}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#5D4037',
            marginBottom: 10, letterSpacing: 0.5,
          }}>
            添加元素
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { key: 'text', label: '文字', Icon: Type },
              { key: 'sticker', label: '贴纸', Icon: Sticker },
              { key: 'brush', label: '画笔', Icon: Paintbrush },
            ].map(({ key, label, Icon }) => {
              const active = state.currentTool === key
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => state.setTool(state.currentTool === key ? 'select' : (key as any))}
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: active ? '#FFB300' : '#FFF',
                      border: active ? '2px solid #E09E00' : '2px solid #D7CCC8',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? '#FFF' : '#5D4037',
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = '#D7CCC8'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = '#FFF'
                    }}
                    title={label}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </button>
                  <span style={{ fontSize: 10, color: '#8D6E63' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#5D4037',
            marginBottom: 10, letterSpacing: 0.5,
          }}>
            操作
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => state.undo()}
              disabled={state.historyIndex <= 0}
              title="撤销 (Ctrl+Z)"
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                background: '#FFF', border: '1.5px solid #D7CCC8',
                cursor: state.historyIndex <= 0 ? 'not-allowed' : 'pointer',
                opacity: state.historyIndex <= 0 ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                color: '#5D4037',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = state.historyIndex > 0 ? '#D7CCC8' : '#FFF')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
            >
              <Undo2 size={16} /><span style={{ fontSize: 11 }}>撤销</span>
            </button>
            <button
              onClick={() => state.redo()}
              disabled={state.historyIndex >= state.history.length - 1}
              title="重做"
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                background: '#FFF', border: '1.5px solid #D7CCC8',
                cursor: state.historyIndex >= state.history.length - 1 ? 'not-allowed' : 'pointer',
                opacity: state.historyIndex >= state.history.length - 1 ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                color: '#5D4037',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = state.historyIndex < state.history.length - 1 ? '#D7CCC8' : '#FFF')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
            >
              <Redo2 size={16} /><span style={{ fontSize: 11 }}>重做</span>
            </button>
          </div>
          <button
            onClick={() => exportPostcard()}
            style={{
              width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #FFB300, #FFA000)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#FFF', fontWeight: 600, fontSize: 13,
              boxShadow: '0 4px 10px rgba(255,179,0,0.35)',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(255,179,0,0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(255,179,0,0.35)'
            }}
          >
            <Download size={16} />
            导出明信片
          </button>
        </div>

        {(selected || isBrush) && (
          <div style={{
            borderTop: '1px solid #D7CCC8',
            paddingTop: 16,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#5D4037',
              marginBottom: 10, letterSpacing: 0.5,
            }}>
              {isBrush ? '画笔设置' : isText ? '文字属性' : '贴纸属性'}
            </div>

            {isBrush && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>笔触颜色</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                    {PRESET_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => state.setBrushColor(c)}
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: c, cursor: 'pointer',
                          border: state.brushColor === c ? '2px solid #5D4037' : '1px solid #CCC',
                          transition: 'all 0.2s ease-in-out',
                          boxSizing: 'border-box',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>笔触宽度</span><span>{state.brushWidth}px</span>
                  </div>
                  <input
                    type="range" min={1} max={20} value={state.brushWidth}
                    onChange={(e) => state.setBrushWidth(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FFB300' }}
                  />
                </div>
              </div>
            )}

            {selected && selected.type !== 'brush' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'X', key: 'x', v: Math.round(selected.x) },
                    { label: 'Y', key: 'y', v: Math.round(selected.y) },
                    { label: 'W', key: 'width', v: Math.round(selected.width) },
                    { label: 'H', key: 'height', v: Math.round(selected.height) },
                  ].map((f) => (
                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#8D6E63', width: 12 }}>{f.label}</span>
                      <input
                        type="number"
                        value={f.v}
                        style={{
                          width: '100%', padding: '4px 6px', borderRadius: 6,
                          border: '1.5px solid #D7CCC8', fontSize: 11,
                          background: '#FFF', outline: 'none',
                          color: '#5D4037', boxSizing: 'border-box',
                        }}
                        onChange={(e) => {
                          state.pushHistory()
                          state.updateElement(selected.id, { [f.key]: Number(e.target.value) } as any)
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#8D6E63', width: 20 }}>角度</span>
                  <input
                    type="number"
                    value={Math.round(selected.rotation)}
                    style={{
                      width: 50, padding: '4px 6px', borderRadius: 6,
                      border: '1.5px solid #D7CCC8', fontSize: 11,
                      background: '#FFF', outline: 'none',
                      color: '#5D4037', boxSizing: 'border-box',
                    }}
                    onChange={(e) => {
                      state.pushHistory()
                      state.updateElement(selected.id, { rotation: Number(e.target.value) })
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#8D6E63' }}>°（Shift+滚轮）</span>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>颜色</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                    {PRESET_COLORS.map((c) => {
                      const currentColor = isText ? textEl?.color : undefined
                      return (
                        <div
                          key={c}
                          onClick={() => {
                            if (isText) {
                              state.pushHistory()
                              state.updateElement(selected.id, { color: c })
                            }
                          }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: c, cursor: 'pointer',
                            border: currentColor === c ? '2px solid #5D4037' : '1px solid #CCC',
                            transition: 'all 0.2s ease-in-out',
                            boxSizing: 'border-box',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>

                {isText && textEl && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>文字样式</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { key: 'bold', Icon: Bold },
                          { key: 'italic', Icon: Italic },
                          { key: 'underline', Icon: Underline },
                        ].map(({ key, Icon }) => {
                          const active = (textEl as any)[key]
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                state.pushHistory()
                                state.updateElement(selected.id, { [key]: !active } as any)
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: 6,
                                background: active ? '#FFB300' : '#FFF',
                                border: '1.5px solid #D7CCC8', cursor: 'pointer',
                                color: active ? '#FFF' : '#5D4037',
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              <Icon size={14} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>字号</div>
                      <input
                        type="range" min={8} max={96} value={textEl.fontSize}
                        onChange={(e) => {
                          state.pushHistory()
                          state.updateElement(selected.id, { fontSize: Number(e.target.value) })
                        }}
                        style={{ width: '100%', accentColor: '#FFB300' }}
                      />
                      <div style={{ fontSize: 10, color: '#8D6E63', textAlign: 'right' }}>{textEl.fontSize}px</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>字体</div>
                      <select
                        value={textEl.fontFamily}
                        onChange={(e) => {
                          state.pushHistory()
                          state.updateElement(selected.id, { fontFamily: e.target.value })
                        }}
                        style={{
                          width: '100%', padding: '5px 6px', borderRadius: 6,
                          border: '1.5px solid #D7CCC8', fontSize: 11,
                          background: '#FFF', outline: 'none',
                          color: '#5D4037', fontFamily: textEl.fontFamily,
                        }}
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {stickerEl?.type === 'sticker' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#8D6E63', marginBottom: 4 }}>贴纸类型</div>
                    <select
                      value={stickerEl.stickerType}
                      onChange={(e) => {
                        state.pushHistory()
                        state.updateElement(selected.id, { stickerType: e.target.value })
                      }}
                      style={{
                        width: '100%', padding: '5px 6px', borderRadius: 6,
                        border: '1.5px solid #D7CCC8', fontSize: 11,
                        background: '#FFF', outline: 'none', color: '#5D4037',
                      }}
                    >
                      {STICKER_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => state.deleteElement(selected.id)}
                  style={{
                    marginTop: 6, padding: '7px 0', borderRadius: 8,
                    background: '#FFF', border: '1.5px solid #E53935',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    color: '#E53935', fontSize: 11, fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FFEBEE'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFF'
                  }}
                >
                  <Trash2 size={14} />
                  删除元素
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {state.showStickerPanel && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
          onClick={() => state.setShowStickerPanel(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 320, background: '#FFF', borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              animation: 'scaleIn 0.25s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#5D4037' }}>选择贴纸</div>
              <button
                onClick={() => state.setShowStickerPanel(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: '#F0EBE6', color: '#5D4037',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D7CCC8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F0EBE6')}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {STICKER_TYPES.map((s) => (
                <StickerPreview
                  key={s}
                  type={s}
                  onClick={() => state.addStickerElement(s)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 900px) {
          .tool-panel {
            position: fixed !important;
            bottom: 0 !important; left: 0 !important; right: 0 !important;
            width: 100% !important;
            height: 60px !important;
            max-height: 60px !important;
            border-radius: 16px 16px 0 0 !important;
            flex-direction: row !important;
            gap: 12px !important;
            padding: 8px 12px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
        }
      `}</style>
    </>
  )
}
