import { useState, useEffect, useRef } from 'react'
import { Check, Plus, ArrowLeft, BarChart3, Share2, Trash2 } from 'lucide-react'
import type { Project, Milestone } from '../utils/helpers'
import { formatDate, generateShortCode, calculateProjectCompletion } from '../utils/helpers'

interface ProjectTimelineProps {
  project: Project
  onBack: () => void
  onUpdateProject: (project: Project) => void
  onGenerateReport: (project: Project) => void
  onShare: (shortCode: string, project: Project) => void
}

export default function ProjectTimeline({
  project,
  onBack,
  onUpdateProject,
  onGenerateReport,
  onShare,
}: ProjectTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newCompletion, setNewCompletion] = useState(0)
  const [newNote, setNewNote] = useState('')
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('timeline-item-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const items = timelineRef.current?.querySelectorAll('.timeline-item')
    items?.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [project.milestones])

  const handleAddMilestone = () => {
    if (!newTitle.trim() || project.milestones.length >= 15) return
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      dueDate: newDueDate,
      completion: newCompletion,
      note: newNote.trim(),
    }
    onUpdateProject({
      ...project,
      milestones: [...project.milestones, newMilestone],
    })
    setNewTitle('')
    setNewDueDate('')
    setNewCompletion(0)
    setNewNote('')
    setShowAddForm(false)
  }

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    onUpdateProject({
      ...project,
      milestones: project.milestones.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })
  }

  const handleDeleteMilestone = (id: string) => {
    onUpdateProject({
      ...project,
      milestones: project.milestones.filter((m) => m.id !== id),
    })
  }

  const handleShare = () => {
    const shortCode = generateShortCode()
    onShare(shortCode, project)
  }

  const sortedMilestones = [...project.milestones].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const avgCompletion = calculateProjectCompletion(project)

  return (
    <div className="project-timeline-page">
      <div className="timeline-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="timeline-header-info">
          <div className="project-title-row">
            <span
              className="project-color-dot-large"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="project-title">{project.name}</h1>
          </div>
          <p className="project-meta">
            {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
            <span className="project-completion-badge" style={{ backgroundColor: project.color }}>
              {avgCompletion}%
            </span>
          </p>
          {project.description && (
            <p className="project-description">{project.description}</p>
          )}
        </div>
        <div className="timeline-header-actions">
          <button
            className="btn-primary"
            onClick={() => onGenerateReport(project)}
          >
            <BarChart3 size={16} />
            生成报告
          </button>
          <button className="btn-secondary" onClick={handleShare}>
            <Share2 size={16} />
            共享链接
          </button>
        </div>
      </div>

      <div className="timeline-container" ref={timelineRef}>
        <div className="timeline-line" />

        {sortedMilestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="timeline-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className="timeline-node"
              style={{ backgroundColor: project.color }}
            >
              {milestone.completion >= 100 && <Check size={12} color="white" />}
            </div>
            {index < sortedMilestones.length - 1 && (
              <div
                className="timeline-connector"
                style={{ backgroundColor: project.color }}
              />
            )}
            <div className="timeline-card">
              <div className="timeline-card-header">
                <h3 className="milestone-title">{milestone.title}</h3>
                <button
                  className="btn-icon"
                  onClick={() => handleDeleteMilestone(milestone.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="milestone-date">截止: {formatDate(milestone.dueDate) || '未设置'}</p>
              <div className="milestone-completion">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={milestone.completion}
                  onChange={(e) =>
                    handleUpdateMilestone(milestone.id, {
                      completion: Number(e.target.value),
                    })
                  }
                  className="completion-slider"
                  style={{ accentColor: project.color }}
                />
                <span className="completion-value">{milestone.completion}%</span>
              </div>
              {milestone.note && (
                <p className="milestone-note">{milestone.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!showAddForm ? (
        <button
          className="btn-add-milestone"
          onClick={() => setShowAddForm(true)}
          disabled={project.milestones.length >= 15}
        >
          <Plus size={18} />
          {project.milestones.length >= 15 ? '已达最大里程碑数（15个）' : '添加里程碑'}
        </button>
      ) : (
        <div className="add-milestone-form">
          <h3>添加新里程碑</h3>
          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入里程碑标题"
            />
          </div>
          <div className="form-group">
            <label>截止日期</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>完成度: {newCompletion}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={newCompletion}
              onChange={(e) => setNewCompletion(Number(e.target.value))}
              className="completion-slider"
              style={{ accentColor: project.color }}
            />
          </div>
          <div className="form-group">
            <label>备注</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="添加备注（可选）"
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={handleAddMilestone}
              disabled={!newTitle.trim()}
            >
              添加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
