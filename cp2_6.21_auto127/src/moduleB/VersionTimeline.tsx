import { useState, useRef, useEffect, useCallback } from 'react'
import { useDocStore } from '../store/useDocStore'
import type { Snapshot } from '../types'
import axios from 'axios'

const VersionTimeline = () => {
  const {
    snapshots,
    currentSnapshotIndex,
    documentId,
    rollbackToSnapshot,
    setFading,
    setSnapshots,
    setDocument,
  } = useDocStore()

  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (documentId) {
      fetchSnapshots()
    }
  }, [documentId])

  const fetchSnapshots = async () => {
    try {
      const response = await axios.get(`/api/documents/${documentId}/snapshots`)
      if (response.data && Array.isArray(response.data)) {
        const recentSnapshots = response.data.slice(-10)
        setSnapshots(recentSnapshots)
      }
    } catch (e) {
      console.error('Failed to fetch snapshots:', e)
      const mockSnapshots: Snapshot[] = Array.from({ length: 5 }, (_, i) => ({
        id: `snap-${i + 1}`,
        createdAt: new Date(Date.now() - (4 - i) * 3600000).toISOString(),
        version: i + 1,
      }))
      setSnapshots(mockSnapshots)
    }
  }

  const getThumbPosition = (): number => {
    if (snapshots.length === 0 || currentSnapshotIndex < 0) return 0
    return (currentSnapshotIndex / (snapshots.length - 1)) * 100
  }

  const calculateIndexFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || snapshots.length === 0) return 0

      const rect = trackRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const index = Math.round(percentage * (snapshots.length - 1))
      return index
    },
    [snapshots.length]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const index = calculateIndexFromPosition(e.clientX)
      if (index !== currentSnapshotIndex) {
        rollbackToSnapshot(index)
      }
    },
    [isDragging, calculateIndexFromPosition, currentSnapshotIndex, rollbackToSnapshot]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      performRollback()
    }
  }, [isDragging, currentSnapshotIndex, documentId])

  const performRollback = async () => {
    if (!documentId || currentSnapshotIndex < 0) return

    const snapshot = snapshots[currentSnapshotIndex]
    if (!snapshot) return

    setFading(true)

    setTimeout(async () => {
      try {
        const response = await axios.get(
          `/api/documents/${documentId}/snapshots/${snapshot.id}`
        )
        if (response.data) {
          const content = response.data.content || ''
          const paragraphs = content
            .split(/\n\n+/)
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0)
          setDocument({
            id: documentId,
            content,
            paragraphs,
          })
        }
      } catch (e) {
        console.error('Rollback error:', e)
      } finally {
        setFading(false)
      }
    }, 150)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    const index = calculateIndexFromPosition(e.clientX)
    rollbackToSnapshot(index)
    setTimeout(() => performRollback(), 200)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="timeline-container">
      <h3 className="timeline-title">版本历史</h3>

      {snapshots.length > 0 ? (
        <div className="timeline-slider-container">
          <div
            className="timeline-track"
            ref={trackRef}
            onClick={handleTrackClick}
          >
            <div
              className="timeline-progress"
              style={{
                width: `${getThumbPosition()}%`,
                transition: isDragging ? 'none' : 'width 0.2s ease',
              }}
            />
            <div
              className="timeline-thumb"
              style={{
                left: `${getThumbPosition()}%`,
                transition: isDragging ? 'none' : 'left 0.2s ease',
              }}
              onMouseDown={handleMouseDown}
            />
          </div>

          <div className="timeline-points">
            {snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className={`timeline-point ${index <= currentSnapshotIndex ? 'active' : ''}`}
              >
                <div className="timeline-point-dot" />
                <span className="timeline-point-label">
                  {formatDate(snapshot.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#b2bec3', padding: '20px 0' }}>
          <p style={{ fontSize: '14px' }}>暂无版本记录</p>
        </div>
      )}
    </div>
  )
}

export default VersionTimeline
