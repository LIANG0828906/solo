import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioEngine } from '@/engine/audioEngine'
import { VisualizerEngine } from '@/engine/visualizerEngine'
import { useProjectStore } from '@/stores/projectStore'
import Timeline from '@/ui/Timeline'
import MixerPanel from '@/ui/MixerPanel'
import EffectPanel from '@/ui/EffectPanel'

export default function App() {
  const { initEngine, setPlaying, setPlayhead, tracks } = useProjectStore()
  const [engineReady, setEngineReady] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null)
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080
  })
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const visualizerRef = useRef<VisualizerEngine | null>(null)
  const resizeStateRef = useRef({ dragging: false, startY: 0, startH: 0 })

  const visualizer = useMemo(() => {
    if (!visualizerRef.current) visualizerRef.current = new VisualizerEngine()
    return visualizerRef.current
  }, [])

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function init() {
      if (audioEngineRef.current) return
      const engine = new AudioEngine({
        onPlayhead: (t) => {
          useProjectStore.setState({ playhead: t })
        },
        onStop: () => {
          useProjectStore.setState({ playing: false })
        },
        tracksGetter: () => useProjectStore.getState().tracks,
        onMainAnalyserReady: (a) => {
          visualizer.attachMainAnalyser(a)
        }
      })
      audioEngineRef.current = engine
      initEngine(engine)
      setEngineReady(true)
    }

    const trigger = () => {
      init()
      window.removeEventListener('click', trigger)
      window.removeEventListener('keydown', trigger)
    }
    window.addEventListener('click', trigger)
    window.addEventListener('keydown', trigger)
    const t = setTimeout(init, 400)
    return () => {
      clearTimeout(t)
      window.removeEventListener('click', trigger)
      window.removeEventListener('keydown', trigger)
      audioEngineRef.current?.dispose()
      visualizer.dispose()
    }
  }, [initEngine, visualizer])

  useEffect(() => {
    function onResizeStart(e: MouseEvent) {
      if ((e.target as HTMLElement).classList.contains('drawer-handle')) {
        resizeStateRef.current = { dragging: true, startY: e.clientY, startH: drawerHeight ?? 360 }
      }
    }
    function onResizeMove(e: MouseEvent) {
      if (!resizeStateRef.current.dragging) return
      const dy = resizeStateRef.current.startY - e.clientY
      setDrawerHeight(Math.max(180, Math.min(window.innerHeight * 0.7, resizeStateRef.current.startH + dy)))
    }
    function onResizeUp() { resizeStateRef.current.dragging = false }
    window.addEventListener('mousedown', onResizeStart)
    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', onResizeUp)
    return () => {
      window.removeEventListener('mousedown', onResizeStart)
      window.removeEventListener('mousemove', onResizeMove)
      window.removeEventListener('mouseup', onResizeUp)
    }
  }, [drawerHeight])

  const isNarrow = viewport.w < 1560
  const useDrawer = isNarrow
  const mixerCollapsed = useDrawer && !drawerOpen

  const totalClips = tracks.reduce((a, t) => a + t.clips.length, 0)

  return (
    <div className="app-container">
      {!engineReady && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(22,22,30,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, flexDirection: 'column', gap: 18
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'linear-gradient(135deg, #E94560, #FF6B6B)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 8px 32px rgba(233,69,96,0.35)'
          }}>🎧</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>AudioCollage</div>
          <div style={{ fontSize: 13, color: '#8A8AA0', textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}>
            点击任意位置以初始化音频引擎<br />
            <span style={{ opacity: 0.75, fontSize: 12 }}>浏览器要求用户交互后才能播放音频</span>
          </div>
          <div className="spinner" />
        </div>
      )}

      <div className="main-layout" style={useDrawer ? { flexDirection: 'column' } : undefined}>
        <Timeline />

        {useDrawer ? (
          <>
            {!mixerCollapsed && (
              <div
                className="drawer-handle"
                onDoubleClick={() => setDrawerOpen(false)}
              />
            )}
            <div
              style={{
                height: mixerCollapsed ? 0 : (drawerHeight ?? Math.min(460, viewport.h * 0.45)),
                overflow: 'hidden',
                transition: 'height 0.25s ease',
                borderTop: mixerCollapsed ? 'none' : '1px solid var(--border-color)'
              }}
            >
              <MixerPanel visualizer={visualizer} />
            </div>
          </>
        ) : (
          <MixerPanel visualizer={visualizer} />
        )}
      </div>

      {useDrawer && (
        <button
          className="drawer-toggle"
          onClick={() => setDrawerOpen(!drawerOpen)}
          title={drawerOpen ? '收起混音面板' : '展开混音面板'}
        >
          {drawerOpen ? '▼' : '▲'}
        </button>
      )}

      <EffectPanel />

      {totalClips === 0 && engineReady && (
        <div style={{
          position: 'fixed',
          left: 160, right: useDrawer ? 20 : 'calc(30% + 24px)',
          top: 120,
          padding: '20px 24px',
          background: 'rgba(30,30,46,0.8)',
          border: '1px dashed rgba(233,69,96,0.4)',
          borderRadius: 10,
          pointerEvents: 'none',
          color: '#C0C0D0',
          fontSize: 13,
          lineHeight: 1.9
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
            ✨ 开始拼贴你的音乐
          </div>
          1. 点击顶部「🥁 生成节拍」快速获得 120BPM 4/4 拍鼓点循环<br />
          2. 点击「📥 导入音频」选择本地 WAV / MP3 片段（建议 ≤ 30 秒）<br />
          3. 将片段拖动到时间轴、拖拽左右边缘修剪、双击片段添加效果<br />
          4. 按 <kbd style={{ padding: '1px 6px', background: 'var(--border-color)', borderRadius: 3 }}>空格</kbd> 播放 / 暂停，<kbd style={{ padding: '1px 6px', background: 'var(--border-color)', borderRadius: 3 }}>Ctrl+Z</kbd> 撤销
        </div>
      )}
    </div>
  )
}
