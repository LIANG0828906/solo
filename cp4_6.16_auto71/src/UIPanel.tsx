import React, { useEffect, useRef, useState } from 'react'
import { useVoxelStore, PRESET_COLORS, VoxelMode, BrushSize, AnimationType } from './VoxelStore'
import { exportSnapshot, downloadSnapshot, readSnapshotFromFile, importSnapshot, showToast } from './ExportImport'

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 60,
  right: 20,
  width: 320,
  maxHeight: 'calc(100vh - 140px)',
  overflowY: 'auto',
  padding: '20px',
  background: 'rgba(26, 30, 50, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(96, 192, 255, 0.35)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  color: '#e0e8f0',
  zIndex: 100,
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(96, 192, 255, 0.3) transparent',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 22,
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#8fb8e0',
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  display: 'block',
}

const colorGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: 10,
}

const getColorButtonStyle = (color: string, isSelected: boolean): React.CSSProperties => ({
  width: 38,
  height: 38,
  borderRadius: '50%',
  background: color,
  border: isSelected ? '2.5px solid #60c0ff' : '2px solid rgba(0,0,0,0.4)',
  cursor: 'pointer',
  position: 'relative',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  boxShadow: isSelected
    ? '0 0 0 3px rgba(96, 192, 255, 0.25), 0 4px 12px rgba(96, 192, 255, 0.3)'
    : '0 2px 6px rgba(0,0,0,0.35)',
  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
})

const getButtonStyle = (
  isActive: boolean,
  variant: 'primary' | 'secondary' | 'warn' = 'primary'
): React.CSSProperties => {
  const colors = {
    primary: isActive
      ? { bg: 'rgba(96, 192, 255, 0.25)', border: '#60c0ff', shadow: '0 0 16px rgba(96,192,255,0.35)' }
      : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', shadow: 'none' },
    secondary: isActive
      ? { bg: 'rgba(128, 255, 128, 0.2)', border: '#80ff80', shadow: '0 0 16px rgba(128,255,128,0.3)' }
      : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', shadow: 'none' },
    warn: isActive
      ? { bg: 'rgba(255, 80, 80, 0.2)', border: '#ff6060', shadow: '0 0 16px rgba(255,80,80,0.3)' }
      : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', shadow: 'none' },
  }
  const c = colors[variant]
  return {
    padding: '8px 14px',
    borderRadius: 10,
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: isActive ? (variant === 'warn' ? '#ffa0a0' : variant === 'secondary' ? '#b0ffb0' : '#a0d8ff') : '#a0b0c0',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: c.shadow,
    fontFamily: 'inherit',
  }
}

const modeButtons: { key: VoxelMode; label: string; icon: string; variant: 'primary' | 'secondary' | 'warn' }[] = [
  { key: 'place', label: '放置', icon: '➕', variant: 'secondary' },
  { key: 'remove', label: '删除', icon: '🗑️', variant: 'warn' },
  { key: 'pick', label: '吸色', icon: '🎨', variant: 'primary' },
]

const brushSizes: BrushSize[] = [1, 2, 3]

const animationTypes: { key: AnimationType; label: string; desc: string }[] = [
  { key: 'rotate', label: '旋转展示', desc: '整体旋转并渐变色彩' },
  { key: 'bounce', label: '弹跳呼吸', desc: '个体跳动呼吸效果' },
  { key: 'wave', label: '波浪扩散', desc: '波纹起伏色彩流动' },
]

export function UIPanel() {
  const {
    currentColor, setColor,
    mode, setMode,
    brushSize, setBrushSize,
    undo, redo, undoStack, redoStack,
    voxels, pulseTrigger,
    animation, startAnimation, pauseAnimation, resetAnimation, setAnimationType,
    clearVoxels,
  } = useVoxelStore()

  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [pulse, setPulse] = useState(0)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pulseTrigger > 0) {
      setPulse(p => p + 1)
      const t = setTimeout(() => setPulse(p => p), 600)
      return () => clearTimeout(t)
    }
  }, [pulseTrigger])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = () => {
    const snap = exportSnapshot()
    downloadSnapshot(snap)
    setExportDropdownOpen(false)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const snap = await readSnapshotFromFile(file)
      importSnapshot(snap)
    } catch (err: any) {
      showToast('❌ 导入失败：' + (err.message || '未知错误'))
    }
    e.target.value = ''
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        background: 'rgba(20, 24, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(96, 192, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #60c0ff 0%, #a060ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(96,192,255,0.4)',
          }}>V</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Voxelize</div>
            <div style={{ fontSize: 11, color: '#8090a0', marginTop: -2 }}>三维体素建模 · 动画展示</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }} ref={dropdownRef}>
          <div style={{
            fontSize: 12, color: '#80a0c0',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ color: '#60c0ff', fontWeight: 700 }}>{voxels.length}</span> / 8000 体素
          </div>

          <button
            onClick={handleImport}
            style={{
              ...getButtonStyle(false, 'primary'),
              padding: '8px 16px',
              borderRadius: 10,
            }}>
            📥 导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportDropdownOpen(v => !v)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(96,192,255,0.35), rgba(160,96,255,0.35))',
                border: '1px solid rgba(128, 160, 255, 0.6)',
                color: '#d8e8ff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 4px 16px rgba(96,128,255,0.3)',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(96,128,255,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(96,128,255,0.3)'
              }}>
              💾 导出 ▾
            </button>
            {exportDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 200,
                background: 'rgba(28, 32, 54, 0.98)',
                border: '1px solid rgba(96, 192, 255, 0.4)',
                borderRadius: 12,
                padding: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                animation: 'fadeInDown 0.18s ease-out',
              }}>
                <button
                  onClick={handleExport}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: '#d0e0f0',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,192,255,0.15)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                  📤 导出为 JSON 快照
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={sectionStyle}>
          <span style={labelStyle}>🎨 颜色选择 ({PRESET_COLORS.length} 色)</span>
          <div style={colorGridStyle}>
            {PRESET_COLORS.map(({ name, color }) => (
              <div
                key={color}
                style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  aria-label={name}
                  onClick={() => setColor(color)}
                  onMouseEnter={() => setHoveredColor(color)}
                  onMouseLeave={() => setHoveredColor(null)}
                  style={getColorButtonStyle(color, currentColor === color)}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.22)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = currentColor === color ? 'scale(1.1)' : 'scale(1)' }}
                />
                {hoveredColor === color && (
                  <div style={{
                    position: 'absolute',
                    bottom: -24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(10, 14, 28, 0.95)',
                    color: '#c0d8f0',
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(96,192,255,0.4)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}>
                    {name}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: currentColor,
              border: '2px solid rgba(0,0,0,0.3)',
              boxShadow: `0 0 12px ${currentColor}55`,
            }} />
            <div style={{ fontSize: 12, color: '#a0b8d0' }}>
              当前颜色：<span style={{ color: '#fff', fontWeight: 700 }}>{currentColor.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>🖌️ 笔刷尺寸</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {brushSizes.map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                style={{
                  ...getButtonStyle(brushSize === size, 'primary'),
                  flex: 1,
                  padding: '10px 8px',
                  position: 'relative',
                }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{size}×{size}</div>
                <div style={{ fontSize: 10, color: '#8098b0', marginTop: 2 }}>
                  {size === 1 ? '精细' : size === 2 ? '标准' : '快速'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>🔧 操作模式</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {modeButtons.map(({ key, label, icon, variant }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  ...getButtonStyle(mode === key, variant),
                  flex: 1,
                  padding: '10px 6px',
                }}>
                <div style={{ fontSize: 16 }}>{icon}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 9, color: mode === key ? '#80b0d0' : '#607080', marginTop: 2 }}>
                  [{modeButtons.findIndex(m => m.key === key) + 1}]
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>↩️ 操作历史</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              style={{
                ...getButtonStyle(pulse > 0 && undoStack.length > 0, 'primary'),
                flex: 1,
                padding: '10px 8px',
                opacity: undoStack.length === 0 ? 0.4 : 1,
                cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>↶ 撤销</div>
              <div style={{ fontSize: 10, marginTop: 2, color: '#7090b0' }}>{undoStack.length} 步可撤</div>
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              style={{
                ...getButtonStyle(pulse > 0 && redoStack.length > 0, 'secondary'),
                flex: 1,
                padding: '10px 8px',
                opacity: redoStack.length === 0 ? 0.4 : 1,
                cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
              }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>↷ 重做</div>
              <div style={{ fontSize: 10, marginTop: 2, color: '#7090b0' }}>{redoStack.length} 步可重</div>
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('确定要清空所有体素吗？此操作可撤销。')) {
                clearVoxels()
                showToast('🧹 已清空画布')
              }
            }}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(255, 80, 80, 0.08)',
              border: '1px solid rgba(255, 120, 120, 0.25)',
              color: '#ff9090',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.18)'
              e.currentTarget.style.borderColor = 'rgba(255, 120, 120, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 120, 120, 0.25)'
            }}>
            🗑️ 清空画布
          </button>
        </div>
      </div>

      <AnimationControlPanel />

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(100, 255, 120, 0.5), 0 4px 12px rgba(100,255,120,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(100, 255, 120, 0), 0 4px 16px rgba(100,255,120,0.45); }
        }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(96, 192, 255, 0.3); border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(96, 192, 255, 0.5); }
      `}</style>
    </>
  )
}

function AnimationControlPanel() {
  const { animation, startAnimation, pauseAnimation, resetAnimation, setAnimationType, voxels } = useVoxelStore()

  const pillBase: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 999,
    border: '1.5px solid',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const playingStyle: React.CSSProperties = {
    ...pillBase,
    background: 'linear-gradient(135deg, rgba(100, 255, 120, 0.25), rgba(100, 200, 100, 0.15))',
    borderColor: '#60ff80',
    color: '#b0ffb8',
    animation: 'pulse-green 1.6s ease-in-out infinite',
  }

  const pausedStyle: React.CSSProperties = {
    ...pillBase,
    background: 'linear-gradient(135deg, rgba(255, 180, 80, 0.25), rgba(255, 140, 60, 0.15))',
    borderColor: '#ffb050',
    color: '#ffd0a0',
    boxShadow: '0 4px 16px rgba(255, 176, 80, 0.35)',
  }

  const resetStyle: React.CSSProperties = {
    ...pillBase,
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(180, 180, 200, 0.35)',
    color: '#b0b8c8',
  }

  const disabled = voxels.length === 0

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 20,
      width: 360,
      padding: '18px',
      background: 'rgba(26, 30, 50, 0.78)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(96, 192, 255, 0.35)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      zIndex: 100,
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#8fb8e0',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
      }}>🎬 动画控制</div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 14,
      }}>
        {animationTypes.map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => setAnimationType(key)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              textAlign: 'left',
              background: animation.type === key
                ? 'linear-gradient(135deg, rgba(96, 192, 255, 0.22), rgba(160, 96, 255, 0.18))'
                : 'rgba(255,255,255,0.03)',
              border: animation.type === key
                ? '1.5px solid rgba(128, 160, 255, 0.65)'
                : '1px solid rgba(255,255,255,0.08)',
              color: animation.type === key ? '#e0ecff' : '#8090a8',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: animation.type === key
                ? '0 4px 16px rgba(96, 128, 255, 0.25)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (animation.type !== key) {
                e.currentTarget.style.background = 'rgba(96,192,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(96,192,255,0.25)'
              }
            }}
            onMouseLeave={(e) => {
              if (animation.type !== key) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }
            }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
              {animation.type === key && (
                <span style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(96, 192, 255, 0.25)',
                  color: '#80d0ff',
                  fontWeight: 600,
                }}>已选</span>
              )}
            </div>
            <div style={{ fontSize: 11, marginTop: 3, color: animation.type === key ? '#8fb8e0' : '#607080' }}>{desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {animation.isPlaying ? (
          <button
            onClick={pauseAnimation}
            disabled={disabled}
            style={{
              ...playingStyle,
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}>
            ⏸ 暂停
          </button>
        ) : (
          <button
            onClick={startAnimation}
            disabled={disabled}
            style={{
              ...pausedStyle,
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              animation: !disabled ? 'none' : undefined,
              background: disabled
                ? 'linear-gradient(135deg, rgba(100, 255, 120, 0.15), rgba(100, 200, 100, 0.08))'
                : pausedStyle.background,
              borderColor: disabled ? 'rgba(120, 200, 120, 0.4)' : pausedStyle.borderColor,
              color: disabled ? '#80c888' : '#ffa050',
              animationIterationCount: 'infinite',
            }}>
            ▶ 播放
          </button>
        )}
        <button
          onClick={resetAnimation}
          disabled={disabled}
          style={{
            ...resetStyle,
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}>
          ↻ 重置
        </button>
      </div>
    </div>
  )
}
