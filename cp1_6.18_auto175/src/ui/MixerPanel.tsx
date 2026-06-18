import { useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import Fader from './Fader'
import PanKnob from './PanKnob'
import SpectrumDisplay from './SpectrumDisplay'
import type { VisualizerEngine } from '@/engine/visualizerEngine'

interface Props {
  visualizer: VisualizerEngine | null
}

export default function MixerPanel({ visualizer }: Props) {
  const {
    tracks,
    setTrackVolume, setTrackPan, toggleMute, toggleSolo,
    masterVolume, setMasterVolume,
    audioEngine
  } = useProjectStore()

  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = masterCanvasRef.current
    if (canvas && visualizer) visualizer.setSpectrumCanvas(canvas)
    return () => { if (visualizer) visualizer.setSpectrumCanvas(null) }
  }, [visualizer])

  const attachMini = useCallback((canvas: HTMLCanvasElement, trackId?: string) => {
    if (trackId && visualizer) visualizer.registerMiniSpectrum(trackId, canvas)
  }, [visualizer])

  const detachMini = useCallback((trackId?: string) => {
    if (trackId && visualizer) visualizer.unregisterMiniSpectrum(trackId)
  }, [visualizer])

  const anySolo = tracks.some((t) => t.solo)

  return (
    <div className="mixer-panel">
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>混音台</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{tracks.length} 轨</span>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
        {tracks.map((t) => (
          <div key={t.id} className="channel-strip" style={{ flex: '1 1 0', minWidth: 100 }}>
            <div className="channel-strip-header">
              <span className="track-color-mark" style={{
                width: 8, height: 8, borderRadius: 2, background: t.color, flexShrink: 0
              }} />
              <div className="channel-name" title={t.name}>{t.name}</div>
            </div>
            <div className="solo-mute">
              <button
                className={`sm-btn solo ${t.solo ? 'active' : ''}`}
                onClick={() => toggleSolo(t.id)}
                title="独奏"
              >S</button>
              <button
                className={`sm-btn mute ${t.muted ? 'active' : ''}`}
                onClick={() => toggleMute(t.id)}
                title="静音"
              >M</button>
            </div>
            <div style={{ height: 4 }} />
            <PanKnob value={t.pan} onChange={(v) => setTrackPan(t.id, v)} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Fader
                value={anySolo ? (t.solo ? t.volume : 0) : (t.muted ? 0 : t.volume)}
                onChange={(v) => setTrackVolume(t.id, v)}
              />
            </div>
            <SpectrumDisplay
              trackId={t.id}
              onAttach={attachMini}
              onDetach={detachMini}
              width="100%"
              height={32}
            />
          </div>
        ))}
      </div>

      <div className="master-section">
        <div className="master-label">MASTER 主输出</div>
        <SpectrumDisplay
          width="100%"
          height={60}
          onAttach={(canvas) => { masterCanvasRef.current = canvas; if (visualizer) visualizer.setSpectrumCanvas(canvas) }}
          onDetach={() => { masterCanvasRef.current = null }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>电平</span>
          <div style={{ flex: 1, height: 4, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(masterVolume * 100)}%`,
                background: 'linear-gradient(to right, #66BB6A, #FFD54F, #E94560)',
                transition: 'width 0.1s'
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)', width: 36, textAlign: 'right', fontFamily: 'monospace' }}>
            {masterVolume > 0 ? `${Math.round(20 * Math.log10(masterVolume))}dB` : '-∞'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <Fader value={masterVolume} onChange={setMasterVolume} />
        </div>
      </div>
      <div style={{ height: 20 }} />
    </div>
  )
}
