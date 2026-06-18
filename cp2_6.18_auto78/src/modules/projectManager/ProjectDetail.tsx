import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore, TrackStatus } from '../../store/projectStore'
import { TrackItem } from './TrackItem'
import { AudioExportDialog } from '../audioExport/AudioExportDialog'
import { SkeletonLoader } from '../layout/SkeletonLoader'
import { useScrollFadeIn } from '../layout/Sidebar'

const STATUS_OPTIONS: TrackStatus[] = ['待录制', '已录制', '混音中', '已定稿']

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const tracks = useProjectStore((s) => s.tracks[id || ''] || [])
  const addTrack = useProjectStore((s) => s.addTrack)
  const selectProject = useProjectStore((s) => s.selectProject)
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [trackForm, setTrackForm] = useState({ name: '', description: '', status: '待录制' as TrackStatus })
  const scrollRef = useScrollFadeIn([id, tracks.length])

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id])

  if (!project) {
    return (
      <div className="empty-state">
        <p>项目不存在</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          返回项目列表
        </button>
      </div>
    )
  }

  const handleAddTrack = () => {
    if (!trackForm.name.trim()) return
    addTrack(project.id, {
      name: trackForm.name.trim(),
      description: trackForm.description.trim(),
      status: trackForm.status,
    })
    setTrackForm({ name: '', description: '', status: '待录制' })
    setShowAddTrack(false)
  }

  const finalizedCount = tracks.filter((t) => t.status === '已定稿').length

  return (
    <div ref={scrollRef}>
      <div className="scroll-fade-in">
        <button className="back-btn" onClick={() => { selectProject(null); navigate('/') }}>
          ← 返回项目列表
        </button>

        <div className="section-header">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">
              {project.client} · BPM {project.bpmMin}-{project.bpmMax} · {project.genres.join(' / ')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {finalizedCount > 0 && (
              <button className="btn btn-success" onClick={() => setShowExport(true)}>
                导出定稿
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowAddTrack(true)}>
              + 添加曲目
            </button>
          </div>
        </div>
      </div>

      <div className="track-list">
        {tracks.map((track) => (
          <TrackItem key={track.id} track={track} />
        ))}
      </div>

      {tracks.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <p>还没有曲目，点击上方按钮添加</p>
        </div>
      )}

      {showAddTrack && (
        <div className="modal-overlay" onClick={() => setShowAddTrack(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">添加曲目</div>

            <div className="form-group">
              <label className="form-label">曲目名称</label>
              <input
                className="form-input"
                placeholder="输入曲目名称"
                value={trackForm.name}
                onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">描述</label>
              <input
                className="form-input"
                placeholder="输入曲目描述"
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">状态</label>
              <div className="genre-checkboxes">
                {STATUS_OPTIONS.map((status) => (
                  <div
                    key={status}
                    className={`genre-checkbox ${trackForm.status === status ? 'selected' : ''}`}
                    onClick={() => setTrackForm({ ...trackForm, status })}
                  >
                    {status}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowAddTrack(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddTrack}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <AudioExportDialog projectId={project.id} onClose={() => setShowExport(false)} />
      )}
    </div>
  )
}
