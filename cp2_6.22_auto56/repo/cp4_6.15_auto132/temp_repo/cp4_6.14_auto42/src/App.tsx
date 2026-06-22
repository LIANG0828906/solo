import { useEffect, useRef, useState } from 'react'
import { HandTracker, CANVAS_SIZE, HandState } from './handTracker'
import { SceneManager, GeometryParams } from './sceneManager'
import { GestureController, ControlState } from './controls'

interface UIState {
  handDetected: boolean
  fps: number
  selectedId: string | null
  pointingId: string | null
  pointingProgress: number
  selectedParams: GeometryParams | null
  showHint: boolean
  gesture: string
  pinchDistance: number
  fistStrength: number
  cameraError: string | null
  cameraLoading: boolean
}

const GESTURE_NAMES: Record<string, string> = {
  none: '无',
  pinch: '捏合',
  fist: '握拳',
  open: '张开',
  pointing: '指向'
}

const GEOMETRY_NAMES: Record<string, string> = {
  cube: '立方体',
  sphere: '球体',
  torusknot: '环面结'
}

const HAND_MISSING_THRESHOLD = 3000

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneContainerRef = useRef<HTMLDivElement | null>(null)

  const handTrackerRef = useRef<HandTracker | null>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const gestureControllerRef = useRef<GestureController | null>(null)
  const lastHandStateRef = useRef<HandState | null>(null)
  const hintFadeRef = useRef({ target: 0, current: 0 })

  const [ui, setUi] = useState<UIState>({
    handDetected: false,
    fps: 0,
    selectedId: null,
    pointingId: null,
    pointingProgress: 0,
    selectedParams: null,
    showHint: false,
    gesture: 'none',
    pinchDistance: 0,
    fistStrength: 0,
    cameraError: null,
    cameraLoading: true
  })

  useEffect(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !sceneContainerRef.current) return

    const handTracker = new HandTracker(videoRef.current, overlayCanvasRef.current)
    const sceneManager = new SceneManager(sceneContainerRef.current)
    const gestureController = new GestureController()

    handTrackerRef.current = handTracker
    sceneManagerRef.current = sceneManager
    gestureControllerRef.current = gestureController

    sceneManager.init()

    handTracker.onUpdate((state) => {
      lastHandStateRef.current = state
    })

    let uiTimer = 0
    sceneManager.onFrame(() => {
      const now = performance.now()
      handTracker.drawSkeleton()

      const handState = lastHandStateRef.current ?? handTracker.getState()

      let hitId: string | null = null
      if (handState.detected && handState.pointingScreen) {
        hitId = sceneManager.raycast(handState.pointingScreen.x, handState.pointingScreen.y)
      }

      const { state: ctrl } = gestureController.update(handState, hitId, now)

      for (const id of ['cube', 'sphere', 'torusknot'] as const) {
        const p = ctrl.params[id]
        sceneManager.updateGeometry(id, {
          scale: p.scale,
          rotationSpeed: p.rotationSpeed,
          color: p.color
        })
      }
      sceneManager.setSelected(ctrl.selectedId)

      const handMissing =
        handState.lastDetectedTime !== 0 && now - handState.lastDetectedTime > HAND_MISSING_THRESHOLD
      hintFadeRef.current.target = handMissing ? 1 : 0
      hintFadeRef.current.current += (hintFadeRef.current.target - hintFadeRef.current.current) * 0.05

      uiTimer += 1
      if (uiTimer % 6 === 0) {
        setUi(prev => {
          const nextSelectedId = ctrl.selectedId
          const nextParams = nextSelectedId ? sceneManager.getParams(nextSelectedId) : null
          const shouldUpdate =
            prev.handDetected !== handState.detected ||
            prev.fps !== handState.fps ||
            prev.selectedId !== nextSelectedId ||
            prev.pointingId !== ctrl.pointingAtId ||
            prev.gesture !== handState.gesture ||
            Math.abs(prev.pinchDistance - handState.pinchDistance) > 1 ||
            Math.abs(prev.fistStrength - handState.fistStrength) > 0.03 ||
            prev.showHint !== (hintFadeRef.current.current > 0.05) ||
            JSON.stringify(prev.selectedParams) !== JSON.stringify(nextParams)

          if (!shouldUpdate) return prev

          return {
            ...prev,
            handDetected: handState.detected,
            fps: handState.fps,
            selectedId: nextSelectedId,
            pointingId: ctrl.pointingAtId,
            pointingProgress: gestureController.getPointingProgress(),
            selectedParams: nextParams,
            showHint: hintFadeRef.current.current > 0.05,
            gesture: handState.gesture,
            pinchDistance: handState.pinchDistance,
            fistStrength: handState.fistStrength,
            cameraLoading: false
          }
        })
      }
    })

    handTracker.start().catch((err) => {
      console.error('摄像头启动失败:', err)
      setUi(prev => ({
        ...prev,
        cameraError: err?.message ?? '无法访问摄像头，请检查权限设置',
        cameraLoading: false
      }))
    })

    return () => {
      handTracker.stop()
      sceneManager.dispose()
      handTrackerRef.current = null
      sceneManagerRef.current = null
      gestureControllerRef.current = null
    }
  }, [])

  return (
    <div style={styles.root}>
      <div style={styles.leftColumn}>
        <div style={styles.cameraPanel}>
          <div style={styles.videoWrapper}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ ...styles.video, display: 'none' }}
            />
            <canvas
              ref={overlayCanvasRef}
              style={styles.overlayCanvas}
              width={CANVAS_SIZE.width}
              height={CANVAS_SIZE.height}
            />
            {ui.showHint && (
              <div style={{
                ...styles.hintText,
                opacity: hintFadeRef.current.current,
                transition: 'opacity 0.5s ease-out'
              }}>
                请将手放入摄像头区域
              </div>
            )}
            {ui.cameraLoading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.loadingSpinner} />
                <span style={{ color: '#c0c0d0', fontSize: 13 }}>正在启动摄像头...</span>
              </div>
            )}
            {ui.cameraError && (
              <div style={styles.errorOverlay}>
                <span style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
                  {ui.cameraError}
                </span>
              </div>
            )}
          </div>

          <div style={styles.statusRow}>
            <div style={styles.statusTag}>
              <span style={{
                ...styles.statusDot,
                backgroundColor: ui.handDetected ? '#4caf50' : '#f44336'
              }} />
              <span style={styles.statusText}>
                {ui.handDetected ? '检测中' : '未检测到'}
              </span>
            </div>
            <div style={styles.fpsTag}>
              <span style={styles.fpsLabel}>FPS</span>
              <span style={{
                ...styles.fpsValue,
                color: ui.fps >= 25 ? '#4caf50' : ui.fps >= 15 ? '#ffb74d' : '#f44336'
              }}>
                {ui.fps}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.glassPanel}>
          <div style={styles.panelTitle}>参数面板</div>

          <div style={styles.panelSection}>
            <div style={styles.sectionLabel}>当前选中</div>
            <div style={{
              ...styles.selectedValue,
              color: ui.selectedId ? '#ff9500' : '#6a6a8a'
            }}>
              {ui.selectedId ? GEOMETRY_NAMES[ui.selectedId] : '未选中'}
            </div>
            {ui.pointingId && !ui.selectedId && (
              <div style={styles.pointingProgressWrap}>
                <div style={styles.pointingProgressLabel}>
                  正在指向：{GEOMETRY_NAMES[ui.pointingId]}
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${ui.pointingProgress * 100}%`
                  }} />
                </div>
              </div>
            )}
          </div>

          <div style={styles.panelSection}>
            <div style={styles.sectionLabel}>手势识别</div>
            <div style={styles.gestureRow}>
              <span style={styles.paramLabel}>类型</span>
              <span style={{ ...styles.paramValue, color: '#64b5f6' }}>
                {GESTURE_NAMES[ui.gesture] ?? ui.gesture}
              </span>
            </div>
            <div style={styles.gestureRow}>
              <span style={styles.paramLabel}>捏合距离</span>
              <span style={styles.paramValue}>
                {ui.pinchDistance.toFixed(0)} px
              </span>
            </div>
            <div style={styles.gestureRow}>
              <span style={styles.paramLabel}>握拳强度</span>
              <span style={styles.paramValue}>
                {(ui.fistStrength * 100).toFixed(0)} %
              </span>
            </div>
          </div>

          {ui.selectedParams && (
            <div style={styles.panelSection}>
              <div style={styles.sectionLabel}>
                {GEOMETRY_NAMES[ui.selectedId ?? '']} 参数
              </div>

              <div style={styles.paramBlock}>
                <div style={styles.paramRow}>
                  <span style={styles.paramLabel}>缩放比例</span>
                  <span style={styles.paramValue}>
                    {ui.selectedParams.scale.toFixed(2)}x
                  </span>
                </div>
                <div style={styles.sliderBg}>
                  <div style={{
                    ...styles.sliderFill,
                    width: `${((ui.selectedParams.scale - 0.5) / 1.5) * 100}%`
                  }} />
                </div>
                <div style={styles.sliderRange}>
                  <span>0.5</span>
                  <span>2.0</span>
                </div>
              </div>

              <div style={styles.paramBlock}>
                <div style={styles.paramRow}>
                  <span style={styles.paramLabel}>旋转速度</span>
                  <span style={styles.paramValue}>
                    {ui.selectedParams.rotationSpeed.toFixed(2)}x
                  </span>
                </div>
                <div style={styles.sliderBg}>
                  <div style={{
                    ...styles.sliderFill,
                    width: `${(ui.selectedParams.rotationSpeed / 2) * 100}%`,
                    backgroundColor: ui.selectedParams.rotationSpeed < 0.1 ? '#f44336' : '#64b5f6'
                  }} />
                </div>
                <div style={styles.sliderRange}>
                  <span>0</span>
                  <span>2.0</span>
                </div>
              </div>

              <div style={styles.paramBlock}>
                <div style={styles.paramRow}>
                  <span style={styles.paramLabel}>颜色</span>
                  <span style={styles.paramValue}>{ui.selectedParams.color.toUpperCase()}</span>
                </div>
                <div style={{
                  ...styles.colorSwatch,
                  backgroundColor: ui.selectedParams.color
                }} />
              </div>
            </div>
          )}

          <div style={styles.helpSection}>
            <div style={styles.helpTitle}>操作指引</div>
            <ul style={styles.helpList}>
              <li>食指指向几何体保持 1.5 秒选中</li>
              <li>拇指与食指捏合调整缩放</li>
              <li>握拳停止旋转，张开加速旋转</li>
            </ul>
          </div>
        </div>
      </div>

      <div ref={sceneContainerRef} style={styles.sceneContainer} />

      <div style={styles.geometryLabels}>
        {(['cube', 'sphere', 'torusknot'] as const).map((id) => (
          <div
            key={id}
            style={{
              ...styles.geometryLabel,
              borderColor: ui.selectedId === id ? '#ff9500' : 'transparent',
              color: ui.selectedId === id ? '#ff9500' : '#8a8aaa',
              backgroundColor: ui.selectedId === id ? 'rgba(255, 149, 0, 0.08)' : 'transparent'
            }}
          >
            {GEOMETRY_NAMES[id]}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    display: 'flex',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    overflow: 'hidden',
    userSelect: 'none'
  },
  leftColumn: {
    width: 360,
    minWidth: 360,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
    zIndex: 5
  },
  cameraPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  videoWrapper: {
    position: 'relative',
    width: CANVAS_SIZE.width,
    height: CANVAS_SIZE.height,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #4a4a6a',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  overlayCanvas: {
    display: 'block',
    width: CANVAS_SIZE.width,
    height: CANVAS_SIZE.height,
    borderRadius: 8
  },
  hintText: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    textAlign: 'center',
    padding: '0 20px',
    pointerEvents: 'none'
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14
  },
  loadingSpinner: {
    width: 28,
    height: 28,
    border: '3px solid rgba(100, 181, 246, 0.2)',
    borderTopColor: '#64b5f6',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite'
  },
  errorOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(30, 10, 15, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    boxSizing: 'border-box'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4
  },
  statusTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 12px',
    backgroundColor: 'rgba(40, 40, 70, 0.6)',
    borderRadius: 20,
    border: '1px solid #3a3a5a'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    boxShadow: '0 0 6px currentColor'
  },
  statusText: {
    fontSize: 13,
    fontWeight: 500,
    color: '#d0d0e0'
  },
  fpsTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    backgroundColor: 'rgba(40, 40, 70, 0.6)',
    borderRadius: 20,
    border: '1px solid #3a3a5a'
  },
  fpsLabel: {
    fontSize: 11,
    color: '#8a8aaa',
    letterSpacing: 0.5
  },
  fpsValue: {
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums'
  },
  glassPanel: {
    width: CANVAS_SIZE.width + 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 30, 60, 0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(100, 100, 150, 0.25)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxSizing: 'border-box'
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f0f0ff',
    letterSpacing: 0.5,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(120, 120, 170, 0.18)'
  },
  panelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9090b0',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 600,
    marginBottom: 2
  },
  selectedValue: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5
  },
  pointingProgressWrap: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  pointingProgressLabel: {
    fontSize: 12,
    color: '#ffb74d',
    fontWeight: 500
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 183, 77, 0.18)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffb74d',
    borderRadius: 2,
    transition: 'width 0.12s linear'
  },
  gestureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    padding: '4px 0'
  },
  paramLabel: {
    color: '#a0a0c0',
    fontWeight: 500
  },
  paramValue: {
    color: '#e0e0f0',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums'
  },
  paramBlock: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(25, 25, 50, 0.5)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  paramRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13
  },
  sliderBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(100, 100, 160, 0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#64b5f6',
    borderRadius: 3,
    transition: 'width 0.3s ease-out, background-color 0.3s ease-out'
  },
  sliderRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#6a6a8a',
    fontVariantNumeric: 'tabular-nums'
  },
  colorSwatch: {
    width: '100%',
    height: 18,
    borderRadius: 4,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
  },
  helpSection: {
    marginTop: 4,
    padding: 10,
    backgroundColor: 'rgba(25, 25, 50, 0.4)',
    borderRadius: 8
  },
  helpTitle: {
    fontSize: 11,
    color: '#7a7a9a',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 600,
    marginBottom: 6
  },
  helpList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 11.5,
    color: '#9090b0',
    lineHeight: 1.75
  },
  sceneContainer: {
    flex: 1,
    position: 'relative',
    minWidth: 0
  },
  geometryLabels: {
    position: 'absolute',
    bottom: 24,
    right: 40,
    display: 'flex',
    gap: 14,
    zIndex: 10,
    pointerEvents: 'none'
  },
  geometryLabel: {
    padding: '6px 14px',
    borderRadius: 18,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    transition: 'all 0.3s ease-out'
  }
}

const globalStyles = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a2e;
  overflow: hidden;
}
* {
  box-sizing: border-box;
}
`

if (typeof document !== 'undefined') {
  const existing = document.getElementById('app-global-styles')
  if (!existing) {
    const s = document.createElement('style')
    s.id = 'app-global-styles'
    s.textContent = globalStyles
    document.head.appendChild(s)
  }
}
