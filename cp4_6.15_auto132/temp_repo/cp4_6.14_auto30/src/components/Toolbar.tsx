import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { Upload, ChevronDown, Split, SplitSquareVertical, HelpCircle } from 'lucide-react'
import type { LightPreset } from '../utils/sceneHelpers'

export default function Toolbar() {
  const uploadModel = useAppStore((s) => s.uploadModel)
  const savedPresets = useAppStore((s) => s.savedPresets)
  const currentPresetId = useAppStore((s) => s.currentPresetId)
  const setCurrentPreset = useAppStore((s) => s.setCurrentPreset)
  const isSplitMode = useAppStore((s) => s.isSplitMode)
  const toggleSplitMode = useAppStore((s) => s.toggleSplitMode)
  const splitDirection = useAppStore((s) => s.splitDirection)
  const toggleSplitDirection = useAppStore((s) => s.toggleSplitDirection)
  const setShowHelpModal = useAppStore((s) => s.setShowHelpModal)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPreset = savedPresets.find((p) => p.id === currentPresetId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadModel(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePresetSelect = (preset: LightPreset) => {
    setCurrentPreset(preset.id)
    setDropdownOpen(false)
  }

  return (
    <>
      <div style={styles.toolbar}>
        <div style={styles.leftGroup}>
          <TooltipWrapper content="上传 GLTF/GLB 格式的 3D 模型文件">
            <button
              style={styles.primaryBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              <span>上传模型</span>
            </button>
          </TooltipWrapper>
          <input
            ref={fileInputRef}
            type="file"
            accept=".gltf,.glb"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div style={styles.centerGroup}>
          <div ref={dropdownRef} style={styles.dropdownWrapper}>
            <TooltipWrapper content="选择光照预设方案">
              <button
                style={styles.dropdownBtn}
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <span style={styles.dropdownLabel}>光照方案：</span>
                <span style={styles.dropdownValue}>
                  {currentPreset?.name ?? '请选择'}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            </TooltipWrapper>
            {dropdownOpen && (
              <div style={styles.dropdownMenu}>
                {savedPresets.length === 0 ? (
                  <div style={styles.dropdownEmpty}>暂无预设方案</div>
                ) : (
                  savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      style={{
                        ...styles.dropdownItem,
                        background:
                          preset.id === currentPresetId
                            ? 'rgba(79,195,247,0.15)'
                            : 'transparent',
                        color:
                          preset.id === currentPresetId
                            ? 'var(--accent-blue)'
                            : 'var(--text-primary)',
                      }}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <span>{preset.name}</span>
                      <span style={styles.dropdownItemMeta}>
                        {1 + preset.pointLights.length} 光源
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={styles.divider} />

          <TooltipWrapper content="开启/关闭分屏对比模式">
            <button
              style={{
                ...styles.toggleBtn,
                background: isSplitMode
                  ? 'rgba(79,195,247,0.2)'
                  : 'rgba(255,255,255,0.04)',
                borderColor: isSplitMode
                  ? 'rgba(79,195,247,0.5)'
                  : 'rgba(255,255,255,0.08)',
                boxShadow: isSplitMode
                  ? '0 0 12px rgba(79,195,247,0.25)'
                  : 'none',
                color: isSplitMode ? 'var(--accent-blue)' : 'var(--text-primary)',
              }}
              onClick={toggleSplitMode}
            >
              <Split size={18} />
              <span>分屏对比</span>
            </button>
          </TooltipWrapper>

          <TooltipWrapper
            content={
              splitDirection === 'vertical'
                ? '切换为水平分屏'
                : '切换为垂直分屏'
            }
          >
            <button
              style={{
                ...styles.iconBtn,
                opacity: isSplitMode ? 1 : 0.4,
                pointerEvents: isSplitMode ? 'auto' : 'none',
              }}
              onClick={toggleSplitDirection}
              disabled={!isSplitMode}
            >
              {splitDirection === 'vertical' ? (
                <Split size={18} />
              ) : (
                <SplitSquareVertical size={18} />
              )}
            </button>
          </TooltipWrapper>
        </div>

        <div style={styles.rightGroup}>
          <TooltipWrapper content="查看使用帮助">
            <button
              style={styles.iconBtn}
              onClick={() => setShowHelpModal(true)}
            >
              <HelpCircle size={20} />
            </button>
          </TooltipWrapper>
        </div>
      </div>

      <ToolbarStyles />
    </>
  )
}

function TooltipWrapper({
  children,
  content,
}: {
  children: React.ReactNode
  content: string
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)

  const handleEnter = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setVisible(true), 200)
  }
  const handleLeave = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {visible && (
        <div className="tooltip-box" data-visible="true">
          {content}
        </div>
      )}
    </div>
  )
}

function ToolbarStyles() {
  const injected = useRef(false)
  useEffect(() => {
    if (injected.current) return
    injected.current = true
    const css = document.createElement('style')
    css.setAttribute('data-toolbar-styles', 'true')
    css.textContent = `
      .tooltip-wrapper .tooltip-box {
        position: absolute;
        top: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%) translateY(-4px);
        background: #0a0f1e;
        color: #e0e0e0;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 6px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 9999;
        border: 1px solid rgba(79,195,247,0.15);
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        opacity: 0;
        animation: tooltipFadeIn 150ms ease forwards;
      }
      .tooltip-wrapper .tooltip-box::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-bottom-color: #0a0f1e;
      }
      @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `
    document.head.appendChild(css)
  }, [])
  return null
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: 'rgba(22, 33, 62, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(79,195,247,0.12)',
    zIndex: 100,
    gap: 16,
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  centerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    height: 38,
    background: 'linear-gradient(135deg, rgba(79,195,247,0.25), rgba(79,195,247,0.1))',
    color: 'var(--text-primary)',
    border: '1px solid rgba(79,195,247,0.4)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  dropdownWrapper: {
    position: 'relative',
  },
  dropdownBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    height: 38,
    minWidth: 220,
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s ease',
  },
  dropdownLabel: {
    color: 'var(--text-secondary)',
  },
  dropdownValue: {
    flex: 1,
    fontWeight: 500,
    textAlign: 'left',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: '#0f172a',
    border: '1px solid rgba(79,195,247,0.18)',
    borderRadius: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 1000,
    animation: 'dropdownIn 0.18s ease',
  },
  dropdownEmpty: {
    padding: '14px 16px',
    color: 'var(--text-secondary)',
    fontSize: 13,
    textAlign: 'center',
  },
  dropdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background 0.15s ease',
  },
  dropdownItemMeta: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    opacity: 0.8,
  },
  divider: {
    width: 1,
    height: 24,
    background: 'rgba(255,255,255,0.08)',
    margin: '0 4px',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    height: 38,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid',
    transition: 'all 0.2s ease',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

const animCss = document.createElement('style')
animCss.textContent = `
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .tooltip-wrapper + .tooltip-wrapper,
  [class*="Btn"]:hover {
    border-color: rgba(79,195,247,0.35) !important;
    background: rgba(79,195,247,0.12) !important;
  }
`
if (!document.querySelector('style[data-toolbar-anim]')) {
  animCss.setAttribute('data-toolbar-anim', 'true')
  document.head.appendChild(animCss)
}
