import React, { useState, useEffect, useCallback } from 'react'
import { useProjectStore, TrackStatus } from '../../store/projectStore'
import { ProjectCard } from './ProjectCard'
import { SkeletonLoader } from '../layout/SkeletonLoader'
import { useScrollFadeIn } from '../layout/Sidebar'

const GENRES = ['流行', '爵士', '电子', '古典', '民谣', 'R&B']

export const ProjectList: React.FC = () => {
  const projects = useProjectStore((s) => s.projects)
  const addProject = useProjectStore((s) => s.addProject)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useScrollFadeIn([loading, projects.length])

  const [form, setForm] = useState({
    name: '',
    client: '',
    genres: [] as string[],
    bpmMin: 100,
    bpmMax: 140,
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleGenreToggle = useCallback((genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) return
    addProject({
      name: form.name.trim(),
      client: form.client.trim(),
      genres: form.genres,
      bpmMin: form.bpmMin,
      bpmMax: form.bpmMax,
      ownerId: 'user-1',
    })
    setShowModal(false)
    setForm({ name: '', client: '', genres: [], bpmMin: 100, bpmMax: 140 })
  }, [form, addProject])

  return (
    <div ref={scrollRef}>
      <div className="scroll-fade-in">
        <div className="section-header">
          <h1 className="page-title">项目列表</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建项目
          </button>
        </div>
        <p className="page-subtitle">管理你的音频项目，追踪版本和协作进度</p>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {projects.length === 0 && !loading && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <p>还没有项目，点击上方按钮创建第一个</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">新建项目</div>

            <div className="form-group">
              <label className="form-label">项目名称（最多40字）</label>
              <input
                className="form-input"
                placeholder="输入项目名称"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 40) })}
                maxLength={40}
              />
            </div>

            <div className="form-group">
              <label className="form-label">客户名称</label>
              <input
                className="form-input"
                placeholder="输入客户名称"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">风格标签（多选）</label>
              <div className="genre-checkboxes">
                {GENRES.map((genre) => (
                  <div
                    key={genre}
                    className={`genre-checkbox ${form.genres.includes(genre) ? 'selected' : ''}`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">BPM 范围</label>
              <div className="bpm-range">
                <input
                  type="range"
                  min={60}
                  max={200}
                  value={form.bpmMin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setForm({ ...form, bpmMin: Math.min(val, form.bpmMax) })
                  }}
                />
                <span className="bpm-range-value">{form.bpmMin}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>-</span>
                <input
                  type="range"
                  min={60}
                  max={200}
                  value={form.bpmMax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setForm({ ...form, bpmMax: Math.max(val, form.bpmMin) })
                  }}
                />
                <span className="bpm-range-value">{form.bpmMax}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
