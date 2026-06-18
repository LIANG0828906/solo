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

export const WaveformCompare: React.FC<{
  oldVersionId: string
  newVersionId: string
  trackId: string
  onClose: () => void
}> = ({ oldVersionId, newVersionId, trackId, onClose }) => {
  const versions = useProjectStore((s) => s.versions[trackId] || [])
  const oldVersion = versions.find((v) => v.id === oldVersionId)
  const newVersion = versions.find((v) => v.id === newVersionId)

  const oldContainerRef = useRef<HTMLDivElement>(null)
  const newContainerRef = useRef<HTMLDivElement>(null)
  const oldWaveSurferRef = useRef<WaveSurfer | null>(null)
  const newWaveSurferRef = useRef<WaveSurfer | null>(null)
  const [oldReady, setOldReady] = useState(false)
  const [newReady, setNewReady] = useState(false)

  useEffect(() => {
    if (!oldContainerRef.current || !newContainerRef.current) return

    const oldUrl = URL.createObjectURL(generateWavBlob(220 + Math.random() * 200, 3))
    const newUrl = URL.createObjectURL(generateWavBlob(260 + Math.random() * 200, 3))

    const oldWs = WaveSurfer.create({
      container: oldContainerRef.current,
      waveColor: '#3B82F6',
      progressColor: '#2563EB',
      cursorColor: '#3B82F6',
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
    })

    const newWs = WaveSurfer.create({
      container: newContainerRef.current,
      waveColor: '#F97316',
      progressColor: '#EA580C',
      cursorColor: '#F97316',
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
    })

    oldWs.on('ready', () => setOldReady(true))
    newWs.on('ready', () => setNewReady(true))

    oldWs.load(oldUrl)
    newWs.load(newUrl)

    oldWaveSurferRef.current = oldWs
    newWaveSurferRef.current = newWs

    return () => {
      oldWs.destroy()
      newWs.destroy()
      URL.revokeObjectURL(oldUrl)
      URL.revokeObjectURL(newUrl)
      setOldReady(false)
      setNewReady(false)
    }
  }, [oldVersionId, newVersionId])

  const handlePlayOld = () => {
    if (oldWaveSurferRef.current) {
      oldWaveSurferRef.current.playPause()
    }
  }

  const handlePlayNew = () => {
    if (newWaveSurferRef.current) {
      newWaveSurferRef.current.playPause()
    }
  }

  if (!oldVersion || !newVersion) return null

  return (
    <div className="waveform-compare">
      <div className="waveform-panel">
        <div className="waveform-label">
          <span className="dot old" />
          {oldVersion.versionNumber} - {oldVersion.uploaderName}
        </div>
        <div className="waveform-container" ref={oldContainerRef} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handlePlayOld}
            disabled={!oldReady}
          >
            ▶ 播放旧版
          </button>
        </div>
      </div>
      <div className="waveform-panel">
        <div className="waveform-label">
          <span className="dot new" />
          {newVersion.versionNumber} - {newVersion.uploaderName}
        </div>
        <div className="waveform-container" ref={newContainerRef} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={handlePlayNew}
            disabled={!newReady}
          >
            ▶ 播放新版
          </button>
        </div>
      </div>
      <button
        className="btn btn-ghost"
        style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, padding: '4px 8px' }}
        onClick={onClose}
      >
        ✕ 关闭对比
      </button>
    </div>
  )
}
