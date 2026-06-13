import { useAppStore } from './store/appStore'
import Toolbar from './components/Toolbar'
import SidePanel from './components/SidePanel'
import LightPresetPanel from './components/LightPresetPanel'
import { HelpCircle, X } from 'lucide-react'

export default function App() {
  const showHelpModal = useAppStore((s) => s.showHelpModal)
  const setShowHelpModal = useAppStore((s) => s.setShowHelpModal)
  const leftPanelCollapsed = useAppStore((s) => s.leftPanelCollapsed)
  const rightPanelVisible = useAppStore((s) => s.rightPanelVisible)
  const isSplitMode = useAppStore((s) => s.isSplitMode)
  const splitDirection = useAppStore((s) => s.splitDirection)
  const splitRatio = useAppStore((s) => s.splitRatio)

  return (
    <div style={styles.appContainer}>
      <Toolbar />

      <div style={styles.mainContent}>
        <SidePanel />

        <div style={styles.viewportArea}>
          <div style={styles.scenePlaceholder}>
            <div style={styles.sceneInner}>
              {isSplitMode ? (
                <div
                  style={{
                    ...styles.splitContainer,
                    flexDirection:
                      splitDirection === 'vertical' ? 'row' : 'column',
                  }}
                >
                  <div
                    style={{
                      ...styles.splitPane,
                      [splitDirection === 'vertical'
                        ? 'width'
                        : 'height']: `${splitRatio * 100}%`,
                      borderRight:
                        splitDirection === 'vertical'
                          ? '2px solid var(--accent-blue)'
                          : 'none',
                      borderBottom:
                        splitDirection === 'horizontal'
                          ? '2px solid var(--accent-blue)'
                          : 'none',
                    }}
                  >
                    <div style={styles.paneLabel}>视口 A（主视图）</div>
                  </div>
                  <div
                    style={{
                      ...styles.splitPane,
                      [splitDirection === 'vertical'
                        ? 'width'
                        : 'height']: `${(1 - splitRatio) * 100}%`,
                    }}
                  >
                    <div style={styles.paneLabel}>视口 B（对比视图）</div>
                  </div>
                </div>
              ) : (
                <div style={styles.singleViewport}>
                  <div style={styles.sceneTitle}>3D 视口区域</div>
                  <div style={styles.sceneSubtitle}>
                    上传 GLTF/GLB 模型以开始渲染
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <LightPresetPanel />
      </div>

      {showHelpModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <HelpCircle size={22} color="var(--accent-blue)" />
                <span>使用帮助</span>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowHelpModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <h4 style={styles.helpSectionTitle}>基础操作</h4>
              <ul style={styles.helpList}>
                <li>
                  <strong>上传模型：</strong>
                  点击左上角按钮，支持 .gltf / .glb 格式
                </li>
                <li>
                  <strong>旋转视角：</strong>鼠标左键拖拽
                </li>
                <li>
                  <strong>缩放：</strong>鼠标滚轮
                </li>
                <li>
                  <strong>平移：</strong>鼠标右键拖拽
                </li>
              </ul>

              <h4 style={styles.helpSectionTitle}>光照与预设</h4>
              <ul style={styles.helpList}>
                <li>
                  <strong>选择方案：</strong>工具栏下拉框或右侧预设卡片
                </li>
                <li>
                  <strong>微调参数：</strong>左侧面板滑块调节环境光/方向光
                </li>
                <li>
                  <strong>保存预设：</strong>右侧面板顶部"保存"按钮
                </li>
              </ul>

              <h4 style={styles.helpSectionTitle}>分屏对比</h4>
              <ul style={styles.helpList}>
                <li>
                  <strong>开启分屏：</strong>工具栏"分屏对比"按钮
                </li>
                <li>
                  <strong>切换方向：</strong>点击分屏方向按钮
                </li>
                <li>
                  <strong>调整比例：</strong>拖拽中间分割线
                </li>
              </ul>

              <h4 style={styles.helpSectionTitle}>标记点</h4>
              <ul style={styles.helpList}>
                <li>
                  <strong>添加标记：</strong>开启标记模式后点击模型表面
                </li>
                <li>
                  <strong>清除全部：</strong>左侧面板"清除全部标记"按钮
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    marginTop: 56,
  },
  viewportArea: {
    flex: 1,
    padding: 16,
    display: 'flex',
    minWidth: 800,
  },
  scenePlaceholder: {
    flex: 1,
    borderRadius: 16,
    border: '1px solid var(--border)',
    background:
      'radial-gradient(ellipse at center, rgba(79,195,247,0.06) 0%, transparent 70%)',
    overflow: 'hidden',
  },
  sceneInner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  splitPane: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  paneLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '4px 10px',
    background: 'rgba(22,33,62,0.7)',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    backdropFilter: 'blur(8px)',
  },
  singleViewport: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  sceneTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  sceneSubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  },
  modalContent: {
    width: 520,
    maxHeight: '80vh',
    background: '#16213e',
    borderRadius: 16,
    border: '1px solid var(--border)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    animation: 'modalIn 0.25s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 18,
    fontWeight: 600,
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  modalBody: {
    padding: '20px 22px',
    overflowY: 'auto',
    maxHeight: 'calc(80vh - 60px)',
  },
  helpSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--accent-blue)',
    marginBottom: 8,
    marginTop: 16,
  },
  helpList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: 4,
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  button:hover {
    color: var(--text-primary) !important;
    background: rgba(79,195,247,0.1) !important;
  }
`
if (!document.querySelector('style[data-global-modal]')) {
  styleSheet.setAttribute('data-global-modal', 'true')
  document.head.appendChild(styleSheet)
}
