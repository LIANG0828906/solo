import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { downloadQueue, DownloadTask } from '../../utils/downloadQueue'

const createExportWorker = (): Worker => {
  const code = `
    self.onmessage = function(e) {
      const { tracks, versions } = e.data
      const results = []
      for (const track of tracks) {
        const trackVersions = versions[track.id] || []
        const latest = trackVersions[trackVersions.length - 1]
        results.push({
          trackId: track.id,
          trackName: track.name,
          versionNumber: latest ? latest.versionNumber : 'v1.0',
          fileSize: latest ? latest.fileSize : 0,
          audioUrl: latest ? latest.audioUrl : ''
        })
      }
      setTimeout(() => {
        self.postMessage({ results })
      }, 300)
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
  const versions = useProjectStore((s) => s.versions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([])
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({})
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const finalizedTracks = tracks.filter((t) => t.status === '已定稿')

  const exportItems = finalizedTracks.map((track) => {
    const trackVersions = versions[track.id] || []
    const latest = trackVersions[trackVersions.length - 1]
    return {
      trackId: track.id,
      trackName: track.name,
      versionNumber: latest?.versionNumber || 'v1.0',
      fileSize: latest?.fileSize || 0,
      audioUrl: latest?.audioUrl || '',
    }
  })

  useEffect(() => {
    const unsub = downloadQueue.subscribe(() => {
      setDownloadTasks(downloadQueue.getTasks())
    })
    return unsub
  }, [])

  const toggleSelect = (trackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === exportItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(exportItems.map((i) => i.trackId)))
    }
  }

  const handleExport = useCallback(() => {
    if (selectedIds.size === 0) return

    setIsExporting(true)

    const selectedItems = exportItems.filter((i) => selectedIds.has(i.trackId))
    const tracksData = selectedItems.map((i) => ({
      id: i.trackId,
      name: i.trackName,
    }))

    const worker = createExportWorker()
    workerRef.current = worker

    worker.onmessage = (e) => {
      const { results } = e.data
      results.forEach((item: { trackId: string; trackName: string; versionNumber: string; fileSize: number }) => {
        downloadQueue.enqueue({
          id: `dl-${item.trackId}`,
          fileName: `${item.trackName}-${item.versionNumber}.mp3`,
          fileSize: item.fileSize,
          audioUrl: `blob:mock-audio-${item.trackId}`,
        })
      })
      setIsExporting(false)
      worker.terminate()
    }

    worker.onerror = () => {
      setIsExporting(false)
      worker.terminate()
    }

    worker.postMessage({
      tracks: tracksData,
      versions: Object.fromEntries(
        Object.entries(versions).map(([k, v]) => [k, v.map((ver) => ({
          id: ver.id,
          versionNumber: ver.versionNumber,
          fileSize: ver.fileSize,
          audioUrl: ver.audioUrl,
        }))])
      ),
    })
  }, [selectedIds, exportItems, versions])

  const handlePreview = (trackId: string, trackName: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingTrackId === trackId) {
      setPlayingTrackId(null)
      return
    }

    const audio = new Audio()
    const audioCtx = new AudioContext()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.frequency.value = 220 + Math.random() * 200
    oscillator.type = 'sine'
    gainNode.gain.value = 0.1

    const mediaStream = audioCtx.createMediaStreamDestination()
    gainNode.connect(mediaStream)

    setPlayingTrackId(trackId)
    setAudioProgress((prev) => ({ ...prev, [trackId]: 0 }))

    let progress = 0
    const interval = setInterval(() => {
      progress += 2
      if (progress >= 100) {
        clearInterval(interval)
        setPlayingTrackId(null)
        setAudioProgress((prev) => ({ ...prev, [trackId]: 100 }))
        oscillator.stop()
        audioCtx.close()
      } else {
        setAudioProgress((prev) => ({ ...prev, [trackId]: progress }))
      }
    }, 60)

    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      audioCtx.close()
      clearInterval(interval)
      setPlayingTrackId(null)
    }, 3000)
  }

  const getTaskForTrack = (trackId: string) => {
    return downloadTasks.find((t) => t.id === `dl-${trackId}`)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                已选 {selectedIds.size} / {exportItems.length} 首
              </span>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={selectAll}>
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
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <div className="track-export-name">
                        {item.trackName}-{item.versionNumber}.mp3
                      </div>
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
                      onClick={() => handlePreview(item.trackId, item.trackName)}
                    >
                      {playingTrackId === item.trackId ? '⏹ 停止' : '▶ 试听'}
                    </button>
                  </div>
                </div>
              )
            })}

            {playingTrackId && (
              <div className="audio-player" style={{ marginTop: 12 }}>
                <button className="audio-player-btn" onClick={() => setPlayingTrackId(null)}>⏹</button>
                <div className="audio-player-progress">
                  <div
                    className="audio-player-progress-bar"
                    style={{ width: `${audioProgress[playingTrackId] || 0}%` }}
                  />
                </div>
                <span className="audio-player-time">
                  {Math.round((audioProgress[playingTrackId] || 0) / 100 * 30)}s
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                关闭
              </button>
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={selectedIds.size === 0 || isExporting}
              >
                {isExporting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="loading-spinner" />
                    导出中...
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
