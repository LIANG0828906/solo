import React, { useState } from 'react'
import { Track, useProjectStore, TrackStatus } from '../../store/projectStore'
import { VersionTimeline } from './VersionTimeline'

const STATUS_LABELS: TrackStatus[] = ['待录制', '已录制', '混音中', '已定稿']

export const TrackItem: React.FC<{ track: Track }> = ({ track }) => {
  const [expanded, setExpanded] = useState(false)
  const collaborators = useProjectStore((s) => s.collaborators)
  const assignCollaborators = useProjectStore((s) => s.assignCollaborators)
  const markTrackComplete = useProjectStore((s) => s.markTrackComplete)
  const addNotification = useProjectStore((s) => s.addNotification)
  const [assignInput, setAssignInput] = useState('')
  const [showAssign, setShowAssign] = useState(false)

  const trackCollabs = collaborators.filter((c) => track.collaboratorIds.includes(c.id))

  const handleAssign = () => {
    if (!assignInput.trim()) return
    const existing = collaborators.find(
      (c) => c.name === assignInput.trim()
    )
    let collabId: string
    if (existing) {
      collabId = existing.id
    } else {
      if (track.collaboratorIds.length >= 5) {
        addNotification('每首曲目最多5位协作者')
        return
      }
      const newCollab = useProjectStore.getState().addCollaborator(assignInput.trim())
      collabId = newCollab.id
    }
    const newIds = [...new Set([...track.collaboratorIds, collabId])]
    assignCollaborators(track.id, newIds)
    setAssignInput('')
  }

  const handleRemoveCollab = (collabId: string) => {
    const newIds = track.collaboratorIds.filter((id) => id !== collabId)
    assignCollaborators(track.id, newIds)
  }

  const handleMarkComplete = () => {
    markTrackComplete(track.id)
  }

  return (
    <div className="track-item scroll-fade-in">
      <div className="track-header">
        <div className="track-name">{track.name}</div>
        <span className={`track-status ${
          track.status === '待录制' ? 'pending' :
          track.status === '已录制' ? 'recorded' :
          track.status === '混音中' ? 'mixing' : 'finalized'
        }`}>
          {track.status}
        </span>
      </div>
      <div className="track-desc">{track.description}</div>
      <div className="track-actions">
        <button className="btn btn-ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? '收起版本' : '查看版本'}
        </button>
        {track.status !== '已定稿' && (
          <button className="btn btn-success" onClick={handleMarkComplete}>
            标记完成
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setShowAssign(!showAssign)}>
          指派协作者
        </button>
      </div>

      {trackCollabs.length > 0 && (
        <div className="collaborator-chips">
          {trackCollabs.map((c) => (
            <div key={c.id} className="collaborator-chip">
              <span
                className="avatar-circle"
                style={{
                  background: c.avatarColor,
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  marginLeft: 0,
                  borderWidth: 0,
                }}
              >
                {c.name.charAt(0)}
              </span>
              {c.name}
              <span
                className="collaborator-chip-remove"
                onClick={() => handleRemoveCollab(c.id)}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      {showAssign && (
        <div className="assign-section">
          <div className="assign-input-row">
            <input
              className="form-input"
              placeholder="输入协作者姓名"
              value={assignInput}
              onChange={(e) => setAssignInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssign()}
            />
            <button className="btn btn-primary" onClick={handleAssign}>
              添加
            </button>
          </div>
          {track.collaboratorIds.length >= 5 && (
            <div style={{ fontSize: 12, color: 'var(--accent)' }}>
              已达最大协作者数量（5人）
            </div>
          )}
        </div>
      )}

      {expanded && <VersionTimeline trackId={track.id} />}
    </div>
  )
}
