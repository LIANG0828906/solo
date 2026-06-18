import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useProjectStore } from '../../store/projectStore'

function generateWavBlob(frequency: number, duration: number, sampleRate = 44100): Blob {
  const numSamples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 0.3)
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 * envelope
    const noise = (Math.random() - 0.5) * 0.05
    const val = Math.max(-1, Math.min(1, sample + noise))
    view.setInt16(44 + i * 2, val * 32767, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

function lightenColor(hex: string, amount: number = 0.15): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount))
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

interface WaveformCompareProps {
  oldVersionId: string
  newVersionId: string
  trackId: string
  onClose: () => void
  oldColor?: string
  newColor?: string
}

export const WaveformCompare: React.FC<WaveformCompareProps> = ({
  oldVersionId,
  newVersionId,
  trackId,
  onClose,
  oldColor = '#3B82F6',
  newColor = '#F97316',
}) => {
  const versions = useProjectStore((s) => s.versions[trackId] || [])
  const oldVersion = versions.find((v) => v.id === oldVersionId)
  const newVersion = versions.find((v) => v.id === newVersionId)

  const oldContainerRef = useRef<HTMLDivElement>(null)
  const newContainerRef = useRef<HTMLDivElement>(null)
  const oldWaveSurferRef = useRef<WaveSurfer | null>(null)
  const newWaveSurferRef = useRef<WaveSurfer | null>(null)
  const [oldReady, setOldReady] = useState(false)
  const [newReady, setNewReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cleanupRef = useRef<{ urls: string[]; destroy: () => void } | null>(null)

  useEffect(() => {
    if (!oldContainerRef.current || !newContainerRef.current) return

    const urls: string[] = []
    let oldWs: WaveSurfer | null = null
    let newWs: WaveSurfer | null = null
    let disposed = false

    const cleanup = () => {
      disposed = true
      try {
        if (oldWs) oldWs.destroy()
        if (newWs) newWs.destroy()
      } catch (_) {}
      urls.forEach((u) => {
        try { URL.revokeObjectURL(u) } catch (_) {}
      })
      setOldReady(false)
      setNewReady(false)
    }

    cleanupRef.current = { urls, destroy: cleanup }

    ;(async () => {
      try {
        if (disposed) return
        const oldBlob = generateWavBlob(220 + Math.random() * 200, 3)
        const newBlob = generateWavBlob(260 + Math.random() * 200, 3)
        const oldUrl = URL.createObjectURL(oldBlob)
        const newUrl = URL.createObjectURL(newBlob)
        urls.push(oldUrl, newUrl)

        if (!oldContainerRef.current || !newContainerRef.current) return

        try {
          oldWs = WaveSurfer.create({
            container: oldContainerRef.current,
            waveColor: oldColor,
            progressColor: lightenColor(oldColor, -0.1),
            cursorColor: oldColor,
            height: 80,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
          })
        } catch (e) {
          throw new Error('旧版本波形创建失败')
        }

        try {
          newWs = WaveSurfer.create({
            container: newContainerRef.current,
            waveColor: newColor,
            progressColor: lightenColor(newColor, -0.1),
            cursorColor: newColor,
            height: 80,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
          })
        } catch (e) {
          throw new Error('新版本波形创建失败')
        }

        oldWs.on('ready', () => setOldReady(true))
        newWs.on('ready', () => setNewReady(true))
        oldWs.on('error', () => setError('旧版本音频加载失败'))
        newWs.on('error', () => setError('新版本音频加载失败'))

        try {
          oldWs.load(oldUrl)
        } catch (_) {
          setError('旧版本音频加载失败')
        }
        try {
          newWs.load(newUrl)
        } catch (_) {
          setError('新版本音频加载失败')
        }

        oldWaveSurferRef.current = oldWs
        newWaveSurferRef.current = newWs
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : '波形渲染失败，请刷新重试')
          cleanup()
        }
      }
    })()

    return cleanup
  }, [oldVersionId, newVersionId, oldColor, newColor])

  const handlePlayOld = () => {
    try {
      oldWaveSurferRef.current?.playPause()
    } catch (_) {}
  }

  const handlePlayNew = () => {
    try {
      newWaveSurferRef.current?.playPause()
    } catch (_) {}
  }

  if (!oldVersion || !newVersion) return null

  return (
    <div className="waveform-compare" style={{ position: 'relative' }}>
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}
      <div className="waveform-panel">
        <div className="waveform-label">
          <span className="dot old" style={{ background: oldColor }} />
          {oldVersion.versionNumber} - {oldVersion.uploaderName}
        </div>
        <div className="waveform-container" ref={oldContainerRef} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handlePlayOld}
            disabled={!oldReady || !!error}
          >
            ▶ 播放旧版
          </button>
        </div>
      </div>
      <div className="waveform-panel">
        <div className="waveform-label">
          <span className="dot new" style={{ background: newColor }} />
          {newVersion.versionNumber} - {newVersion.uploaderName}
        </div>
        <div className="waveform-container" ref={newContainerRef} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handlePlayNew}
            disabled={!newReady || !!error}
          >
            ▶ 播放新版
          </button>
        </div>
      </div>
      <button
        className="btn btn-ghost"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: 12,
          padding: '4px 8px',
        }}
        onClick={onClose}
      >
        ✕ 关闭对比
      </button>
    </div>
  )
}
