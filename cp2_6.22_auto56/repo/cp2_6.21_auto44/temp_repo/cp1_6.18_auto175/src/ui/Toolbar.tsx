import { useRef, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { downloadBlob, triggerFileInput, readFileAsJSON } from '@/utils/dom'

export default function Toolbar() {
  const {
    tracks,
    generateBeatClip,
    addClipFromBuffer,
    undo,
    redo,
    exportProject,
    importProject,
    audioEngine,
    exporting,
    setExporting,
    masterVolume,
    bpm
  } = useProjectStore()

  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canUndo = useProjectStore((s) => s.history.length > 0)
  const canRedo = useProjectStore((s) => s.future.length > 0)

  async function handleImportFiles(files: FileList | null) {
    if (!files || !audioEngine) return
    setBusy(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          await audioEngine.ensureContext()
          const buffer = await audioEngine.decodeFile(file)
          const dur = buffer.duration
          if (dur > 35) {
            if (!confirm(`文件 ${file.name} 时长 ${dur.toFixed(1)}s，建议不超过 30s。是否仍导入？`)) continue
          }
          const nonBeat = tracks.filter((t) => !t.isBeatTrack)
          const target = nonBeat[i % (nonBeat.length || 1)] ?? tracks[0]
          const existingCount = target.clips.length
          addClipFromBuffer(target.id, {
            audioUrl: file.name,
            duration: dur,
            name: file.name.replace(/\.[^.]+$/, ''),
            audioBufferRef: `file:${file.name}:${file.size}:${file.lastModified}`,
            startAt: existingCount * (dur * 0.5)
          })
        } catch (e) {
          console.error('导入失败', file.name, e)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleExportWAV() {
    if (!audioEngine) return
    setExporting(true)
    try {
      await audioEngine.ensureContext()
      const blob = await audioEngine.renderOffline(() => ({ tracks, masterVolume }))
      const fname = `audio-collage-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`
      downloadBlob(blob, fname)
    } catch (e) {
      console.error('导出失败', e)
      alert('导出失败：' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  function handleSaveProject() {
    const data = exportProject()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `project-${Date.now()}.json`)
  }

  function handleLoadProject() {
    triggerFileInput('.json', async (f) => {
      try {
        const data = await readFileAsJSON(f)
        importProject(data)
      } catch (e) {
        alert('项目文件无效')
      }
    })
  }

  return (
    <div className="toolbar">
      <input
        ref={fileRef}
        type="file"
        accept="audio/wav,audio/mp3,audio/x-wav,audio/mpeg,.wav,.mp3,.ogg,.flac"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleImportFiles(e.target.files)}
      />
      <button
        className="btn-primary"
        style={{ width: 140 }}
        onClick={handleExportWAV}
        disabled={exporting}
      >
        {exporting ? <span className="spinner" /> : '📤'}
        <span>{exporting ? '导出中…' : '导出 WAV'}</span>
      </button>
      <button
        className="btn-secondary"
        onClick={() => fileRef.current?.click()}
        disabled={busy || !audioEngine}
      >
        📥 导入音频
      </button>
      <button
        className="btn-secondary"
        onClick={async () => {
          try {
            await audioEngine?.ensureContext()
            await generateBeatClip()
          } catch (e) {
            console.error(e)
          }
        }}
        disabled={!audioEngine}
      >
        🥁 生成节拍
      </button>
      <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
      <button className="btn-secondary" onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)">↶ 撤销</button>
      <button className="btn-secondary" onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Y)">↷ 重做</button>
      <div style={{ flex: 1 }} />
      <button className="btn-secondary" onClick={handleSaveProject}>💾 保存项目</button>
      <button className="btn-secondary" onClick={handleLoadProject}>📂 加载项目</button>
      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>{bpm} BPM</span>
    </div>
  )
}
