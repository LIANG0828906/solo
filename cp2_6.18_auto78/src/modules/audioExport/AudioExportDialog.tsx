import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { downloadQueue, DownloadTask } from '../../utils/downloadQueue'

const createExportWorker = (): Worker => {
  const code = `
    self.onmessage = function(e) {
      const { selectedIds, tracksData, versionsData } = e.data
      const result = []
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i]
        const track = tracksData.find(function(t) { return t.id === id })
        if (!track) continue
        const trackVersions = versionsData[id] || []
        const latest = trackVersions[trackVersions.length - 1]
        result.push({
          trackId: id,
          fileName: track.name + '-' + (latest ? latest.versionNumber : 'v1.0') + '.mp3',
          fileSize: latest ? latest.fileSize : 0,
          audioUrl: latest ? (latest.audioUrl || '') : ''
        })
      }
      setTimeout(function() {
        self.postMessage({ results: result })
      }, 200)
    }
  `
  const blob = new Blob([code], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

export const AudioExportDialog: React.FC<{
  projectId: string
  onClose: () => void
}> = ({ projectId, onClose }) => {
  const tracks = useProjectStore((s) => s.tracks[projectId] || [])
  const allVersions = useProjectStore((s) => s.versions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [queueTasks, setQueueTasks] = useState<DownloadTask[]>([])
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({})
  const [exportStartTime, setExportStartTime] = useState<number | null>(null)
  const [showSpinner, setShowSpinner] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const audioCleanupRef = useRef<{ oscillator?: OscillatorNode; audioCtx?: AudioContext; interval?: number } | null>(null)
  const exportTimeoutRef = useRef<number | null>(null)
  const spinnerTimeoutRef = useRef<number | null>(null)

  const finalizedTracks = useMemo(
    () => tracks.filter((t) => t.status === '已定稿'),
    [tracks]
  )

  const exportItems = useMemo(() => {
    return finalizedTracks.map((track) => {
      const trackVersions = allVersions[track.id] || []
      const latest = trackVersions[trackVersions.length - 1]
      return {
        trackId: track.id,
        trackName: track.name,
        versionNumber: latest?.versionNumber || 'v1.0',
        fileSize: latest?.fileSize || 0,
        audioUrl: latest?.audioUrl || '',
        fileName: `${track.name}-${latest?.versionNumber || 'v1.0'}.mp3`,
      }
    })
  }, [finalizedTracks, allVersions])

  useEffect(() => {
    const unsub = downloadQueue.subscribe(() => {
      setQueueTasks(downloadQueue.getTasks())
    })
    return () => unsub
  }, [])

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate() } catch (_) {}
      }
      if (audioCleanupRef.current) {
        try { audioCleanupRef.current.oscillator?.stop() } catch (_) {}
        try { audioCleanupRef.current.audioCtx?.close() } catch (_) {}
        if (audioCleanupRef.current.interval) {
          window.clearInterval(audioCleanupRef.current.interval)
        }
      }
      if (exportTimeoutRef.current) window.clearTimeout(exportTimeoutRef.current)
      if (spinnerTimeoutRef.current) window.clearTimeout(spinnerTimeoutRef.current)
      downloadQueue.clear()
    }
  }, [])

  const toggleSelect = useCallback((trackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === exportItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(exportItems.map((i) => i.trackId)))
    }
  }, [selectedIds, exportItems])

  const handleExport = useCallback(() => {
    if (selectedIds.size === 0) return

    const selectedIdArr = Array.from(selectedIds)
    setIsExporting(true)
    setExportStartTime(Date.now())

    if (spinnerTimeoutRef.current) window.clearTimeout(spinnerTimeoutRef.current)
    spinnerTimeoutRef.current = window.setTimeout(() => {
      if (isExporting || Date.now() - (exportStartTime || 0) < 1000) {
        setShowSpinner(true)
      }
    }, 900)

    try {
      const worker = createExportWorker()
      workerRef.current = worker

      worker.onmessage = (e) => {
        const { results } = e.data
        const taskPromiseArr: DownloadTask[] = []
        results.forEach((item: { trackId: string; fileName: string; fileSize: number; audioUrl: string }) => {
          const t = downloadQueue.enqueue({
            id: `dl-${item.trackId}`,
            fileName: item.fileName,
            fileSize: item.fileSize,
            audioUrl: item.audioUrl || `blob:mock-audio-${item.trackId}-${Date.now()}`,
            onProgress: () => {},
            onComplete: (fileSizeMB, audioUrl) => {},
          })
          taskPromiseArr.push(t)
        })
        worker.terminate()
        workerRef.current = null

        if (exportTimeoutRef.current) window.clearTimeout(exportTimeoutRef.current)
        exportTimeoutRef.current = window.setTimeout(() => {
          setIsExporting(false)
          if (spinnerTimeoutRef.current) window.clearTimeout(spinnerTimeoutRef.current)
          setShowSpinner(false)
        }, 400)
      }

      worker.onerror = () => {
        setIsExporting(false)
        setShowSpinner(false)
        try { worker.terminate() } catch (_) {}
        workerRef.current = null
      }

      const tracksData = finalizedTracks.map((t) => ({ id: t.id, name: t.name }))
      const versionsData: Record<string, { versionNumber: string; fileSize: number; audioUrl: string }[]> = {}
      for (const track of finalizedTracks) {
        versionsData[track.id] = (allVersions[track.id] || []).map((v) => ({
          versionNumber: v.versionNumber,
          fileSize: v.fileSize,
          audioUrl: v.audioUrl,
        }))
      }

      worker.postMessage({
        selectedIds: selectedIdArr,
        tracksData,
        versionsData,
      })
    } catch (err) {
      setIsExporting(false)
      setShowSpinner(false)
    }
  }, [selectedIds, finalizedTracks, allVersions, isExporting, exportStartTime])

  const handlePreview = useCallback((trackId: string) => {
    if (audioCleanupRef.current) {
      try { audioCleanupRef.current.oscillator?.stop() } catch (_) {}
      try { audioCleanupRef.current.audioCtx?.close() } catch (_) {}
      if (audioCleanupRef.current.interval) window.clearInterval(audioCleanupRef.current.interval)
      audioCleanupRef.current = null
    }

    if (playingTrackId === trackId) {
      setPlayingTrackId(null)
      return
    }

    try {
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.frequency.value = 220 + Math.random() * 200
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1
      oscillator.start()

      setPlayingTrackId(trackId)
      setAudioProgress((prev) => ({ ...prev, [trackId]: 0 }))

      let progress = 0
      const interval = window.setInterval(() => {
        progress += 2
        if (progress >= 100) {
          window.clearInterval(interval)
          try { oscillator.stop() } catch (_) {}
          try { audioCtx.close() } catch (_) {}
          setPlayingTrackId(null)
          setAudioProgress((prev) => ({ ...prev, [trackId]: 100 }))
          audioCleanupRef.current = null
        } else {
          setAudioProgress((prev) => ({ ...prev, [trackId]: progress }))
        }
      }, 60)

      audioCleanupRef.current = { oscillator, audioCtx, interval }

      window.setTimeout(() => {
        if (audioCleanupRef.current?.interval === interval) {
          try { oscillator.stop() } catch (_) {}
          try { audioCtx.close() } catch (_) {}
          window.clearInterval(interval)
          setPlayingTrackId(null)
          audioCleanupRef.current = null
        }
      }, 3000)
    } catch (_) {
      setPlayingTrackId(null)
    }
  }, [playingTrackId])

  const getTaskForTrack = (trackId: string) => {
    return queueTasks.find((t) => t.id === `dl-${trackId}`)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal export-dialog"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">导出定稿曲目</div>

        {exportItems.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>暂无定稿曲目可导出</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                已选 {selectedIds.size} / {exportItems.length} 首
              </span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={selectAll}
              >
                {selectedIds.size === exportItems.length ? '取消全选' : '全选'}
              </button>
            </div>

            {exportItems.map((item) => {
              const task = getTaskForTrack(item.trackId)
              return (
                <div key={item.trackId} className="track-export-item">
                  <div className="track-export-info">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.trackId)}
                      onChange={() => toggleSelect(item.trackId)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div>
                      <div className="track-export-name">{item.fileName}</div>
                      <div className="track-export-size">{item.fileSize}MB</div>
                    </div>
                  </div>
                  <div className="track-export-actions">
                    {task && task.status === 'downloading' && (
                      <div style={{ fontSize: 12, color: 'var(--accent)' }}>
                        {task.progress}%
                      </div>
                    )}
                    {task && task.status === 'completed' && (
                      <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ 完成</span>
                    )}
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      onClick={() => handlePreview(item.trackId)}
                    >
                      {playingTrackId === item.trackId ? '⏹ 停止' : '▶ 试听'}
                    </button>
                  </div>
                </div>
              )
            })}

            {playingTrackId && (
              <div className="audio-player" style={{ marginTop: 12 }}>
                <button
                  className="audio-player-btn"
                  onClick={() => {
                    if (audioCleanupRef.current) {
                      try { audioCleanupRef.current.oscillator?.stop() } catch (_) {}
                      try { audioCleanupRef.current.audioCtx?.close() } catch (_) {}
                      if (audioCleanupRef.current.interval) {
                        window.clearInterval(audioCleanupRef.current.interval)
                      }
                      audioCleanupRef.current = null
                    }
                    setPlayingTrackId(null)
                  }}
                >
                  ⏹
                </button>
                <div className="audio-player-progress">
                  <div
                    className="audio-player-progress-bar"
                    style={{ width: `${audioProgress[playingTrackId] || 0}%` }}
                  />
                </div>
                <span className="audio-player-time">
                  {Math.round(((audioProgress[playingTrackId] || 0) / 100) * 30)}s
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 20,
                alignItems: 'center',
              }}
            >
              {isExporting && showSpinner && <div className="loading-spinner-32" />}
              <button className="btn btn-ghost" onClick={onClose}>
                关闭
              </button>
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={selectedIds.size === 0 || isExporting}
              >
                {isExporting ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexDirection: 'row-reverse',
                    }}
                  >
                    {!showSpinner && '导出处理中...'}
                    {showSpinner && (
                      <div
                        className="loading-spinner-32"
                        style={{ width: 16, height: 16, borderWidth: 2 }}
                      />
                    )}
                  </span>
                ) : (
                  `导出 ${selectedIds.size} 首曲目`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
