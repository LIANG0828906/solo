import React, { useState, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useStore from '../store/useStore'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Exhibition, MilestoneType, Task } from '../types'

const milestoneTypeLabels: Record<MilestoneType, string> = {
  [MilestoneType.PREPARATION]: '筹备',
  [MilestoneType.INSTALLATION]: '布展',
  [MilestoneType.OPENING]: '开幕',
  [MilestoneType.EXHIBITION]: '展出',
  [MilestoneType.TEARDOWN]: '撤展'
}

const milestoneTypeColors: Record<MilestoneType, string> = {
  [MilestoneType.PREPARATION]: '#6B8DD6',
  [MilestoneType.INSTALLATION]: '#D4A05A',
  [MilestoneType.OPENING]: '#C25450',
  [MilestoneType.EXHIBITION]: '#4A8B5C',
  [MilestoneType.TEARDOWN]: '#8B7EC8'
}

interface AnimatedCounterProps {
  value: number
  duration?: number
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>()

  React.useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(easeProgress * value))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    startTimeRef.current = null
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span style={{ animation: 'countUp 0.6s var(--ease-standard) both' }}>{displayValue}</span>
}

interface StatsCardsProps {
  totalArtworks: number
  inStockCount: number
  lentOutCount: number
  exhibitionCount: number
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalArtworks,
  inStockCount,
  lentOutCount,
  exhibitionCount
}) => {
  const cards = useMemo(() => [
    {
      label: '总作品数',
      value: totalArtworks,
      gradient: 'linear-gradient(135deg, #1A1A3E 0%, #3D3D7A 100%)',
      icon: '◈'
    },
    {
      label: '在库作品',
      value: inStockCount,
      gradient: 'linear-gradient(135deg, #4A8B5C 0%, #6DB37E 100%)',
      icon: '▢'
    },
    {
      label: '借出作品',
      value: lentOutCount,
      gradient: 'linear-gradient(135deg, #C25450 0%, #E07870 100%)',
      icon: '↗'
    },
    {
      label: '展览数量',
      value: exhibitionCount,
      gradient: 'linear-gradient(135deg, #D4A05A 0%, #E4B068 100%)',
      icon: '◎'
    }
  ], [totalArtworks, inStockCount, lentOutCount, exhibitionCount])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      marginBottom: 32
    }}>
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="card-hover"
          style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            animation: `fadeIn 0.5s var(--ease-standard) both`,
            animationDelay: `${idx * 80}ms`
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: card.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 22,
            fontWeight: 300,
            flexShrink: 0
          }}>
            {card.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
              marginBottom: 2
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums'
            }}>
              <AnimatedCounter value={card.value} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const TaskRow: React.FC<{
  task: Task
  exhibitionId: string
  milestoneId: string
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetTaskId: string) => void
  showToast: (msg: string) => void
}> = ({ task, exhibitionId, milestoneId, onDragStart, onDragOver, onDrop, showToast }) => {
  const { toggleTask } = useStore()

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, task.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: task.completed ? 'rgba(74, 139, 92, 0.04)' : 'white',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 6,
        cursor: 'grab',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s var(--ease-standard)',
        border: task.completed ? '1px solid rgba(74, 139, 92, 0.15)' : '1px solid transparent'
      }}
      className="card-hover"
    >
      {task.completed && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(74, 139, 92, 0.12) 0%, rgba(74, 139, 92, 0.04) 100%)',
            animation: 'growWidth 0.6s var(--ease-standard) forwards',
            pointerEvents: 'none'
          }}
        />
      )}
      <div
        onClick={() => {
          toggleTask(exhibitionId, milestoneId, task.id)
          showToast(task.completed ? '已恢复任务' : '任务已完成')
        }}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${task.completed ? 'var(--color-success)' : 'var(--color-border)'}`,
          background: task.completed ? 'var(--color-success)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s var(--ease-standard)',
          flexShrink: 0,
          zIndex: 1
        }}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{
        flex: 1,
        fontSize: 13,
        color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        textDecoration: task.completed ? 'line-through' : 'none',
        transition: 'all 0.3s var(--ease-standard)',
        zIndex: 1,
        lineHeight: 1.4
      }}>
        {task.title}
      </span>
    </div>
  )
}

const CreateExhibitionModal: React.FC<{
  onClose: () => void
  showToast: (msg: string) => void
}> = ({ onClose, showToast }) => {
  const { addExhibition } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !startDate || !endDate) return
    addExhibition({ title, description, startDate, endDate, milestones: [] })
    showToast('展览已创建')
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 26, 62, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          width: '100%',
          maxWidth: 480,
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp 0.35s var(--ease-standard)'
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>创建新展览</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          开启一场新的策展之旅
        </p>

        <div style={{ marginBottom: 16 }}>
          <label className="label-text">展览名称 *</label>
          <input
            className="input-field"
            placeholder="如：赛博朋克重生"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label-text">展览简介</label>
          <textarea
            className="input-field"
            placeholder="简要描述展览主题与理念..."
            style={{ resize: 'vertical', minHeight: 80 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label className="label-text">开幕日期 *</label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text">闭幕日期 *</label>
            <input
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>创建展览</button>
        </div>
      </div>
    </div>
  )
}

const ExhibitionList: React.FC<{
  onSelect: (id: string) => void
  onCreate: () => void
}> = ({ onSelect, onCreate }) => {
  const { exhibitions, exportData } = useStore()

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `curator-archive-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
            我的展览
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            共 {exhibitions.length} 个策展项目
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={handleExport}>
            导出档案
          </button>
          <button className="btn-primary" onClick={onCreate}>
            + 新展览
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16
      }}>
        {exhibitions.map((ex, idx) => (
          <div
            key={ex.id}
            className="card-hover"
            onClick={() => onSelect(ex.id)}
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              animation: `fadeIn 0.5s var(--ease-standard) both`,
              animationDelay: `${idx * 60}ms`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #1A1A3E, #D4A05A)'
            }} />
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
              color: 'var(--color-text-primary)'
            }}>
              {ex.title}
            </h3>
            {ex.description && (
              <p style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                marginBottom: 16,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {ex.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: 'var(--color-text-muted)'
            }}>
              <span>
                {format(parseISO(ex.startDate), 'yyyy.MM.dd', { locale: zhCN })}
              </span>
              <span style={{ opacity: 0.5 }}>—</span>
              <span>
                {format(parseISO(ex.endDate), 'yyyy.MM.dd', { locale: zhCN })}
              </span>
            </div>
            <div style={{
              marginTop: 16,
              display: 'flex',
              gap: 8
            }}>
              <span style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'rgba(26, 26, 62, 0.05)',
                borderRadius: 50,
                color: 'var(--color-text-secondary)'
              }}>
                {ex.milestones.length} 个里程碑
              </span>
              <span style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'rgba(212, 160, 90, 0.12)',
                borderRadius: 50,
                color: 'var(--color-amber-gold)'
              }}>
                {ex.milestones.reduce((acc, m) => acc + m.tasks.length, 0)} 项任务
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ExhibitionDetail: React.FC<{
  exhibition: Exhibition
  onBack: () => void
  showToast: (msg: string) => void
}> = ({ exhibition, onBack, showToast }) => {
  const { addTask, addMilestone, reorderTasks } = useStore()
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({})
  const draggedTaskRef = useRef<string | null>(null)
  const draggedMilestoneRef = useRef<string | null>(null)

  const sortedMilestones = useMemo(() => {
    return [...exhibition.milestones].sort((a, b) => a.week - b.week)
  }, [exhibition.milestones])

  const handleAddTask = (milestoneId: string) => {
    const title = newTaskInputs[milestoneId]?.trim()
    if (!title) return
    addTask(exhibition.id, milestoneId, title)
    setNewTaskInputs(prev => ({ ...prev, [milestoneId]: '' }))
    showToast('任务已添加')
  }

  const handleAddMilestone = () => {
    const nextWeek = sortedMilestones.length > 0
      ? Math.max(...sortedMilestones.map(m => m.week)) + 1
      : 1
    addMilestone(exhibition.id, {
      type: MilestoneType.PREPARATION,
      title: '新阶段',
      week: nextWeek,
      tasks: []
    })
    showToast('里程碑已添加')
  }

  const handleTaskDrop = (milestoneId: string, targetTaskId: string) => {
    if (!draggedTaskRef.current || draggedTaskRef.current === targetTaskId) return
    const milestone = exhibition.milestones.find(m => m.id === milestoneId)
    if (!milestone) return
    const taskIds = milestone.tasks.map(t => t.id)
    const fromIdx = taskIds.indexOf(draggedTaskRef.current)
    const toIdx = taskIds.indexOf(targetTaskId)
    if (fromIdx === -1 || toIdx === -1) return
    taskIds.splice(fromIdx, 1)
    taskIds.splice(toIdx, 0, draggedTaskRef.current)
    reorderTasks(exhibition.id, milestoneId, taskIds)
    draggedTaskRef.current = null
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s var(--ease-standard)',
              color: 'var(--color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(26, 26, 62, 0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {exhibition.title}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {format(parseISO(exhibition.startDate), 'yyyy年M月d日', { locale: zhCN })} —{' '}
              {format(parseISO(exhibition.endDate), 'yyyy年M月d日', { locale: zhCN })}
            </p>
          </div>
        </div>
        <button className="btn-ghost" onClick={handleAddMilestone}>
          + 添加里程碑
        </button>
      </div>

      {exhibition.description && (
        <p style={{
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          marginBottom: 28,
          padding: '16px 20px',
          background: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          borderLeft: '3px solid var(--color-amber-gold)'
        }}>
          {exhibition.description}
        </p>
      )}

      <div
        className="paper-texture timeline-horizontal"
        style={{
          padding: 32,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: 24,
          overflowX: 'auto',
          minHeight: 500,
          position: 'relative'
        }}
      >
        {sortedMilestones.map((milestone, idx) => (
          <div
            key={milestone.id}
            className="timeline-column"
            draggable
            onDragStart={() => { draggedMilestoneRef.current = milestone.id }}
            style={{
              minWidth: 240,
              flexShrink: 0,
              animation: `fadeIn 0.5s var(--ease-standard) both`,
              animationDelay: `${idx * 80}ms`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px dashed rgba(26, 26, 62, 0.1)'
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: milestoneTypeColors[milestone.type],
                flexShrink: 0
              }} />
              <span style={{
                fontSize: 11,
                padding: '2px 8px',
                background: `${milestoneTypeColors[milestone.type]}15`,
                color: milestoneTypeColors[milestone.type],
                borderRadius: 50,
                fontWeight: 500
              }}>
                第{milestone.week}周
              </span>
              <span style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginLeft: 4
              }}>
                {milestone.title}
              </span>
            </div>

            {milestone.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                exhibitionId={exhibition.id}
                milestoneId={milestone.id}
                onDragStart={(e) => { draggedTaskRef.current = task.id; e.dataTransfer.effectAllowed = 'move' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e, targetId) => {
                  e.preventDefault()
                  handleTaskDrop(milestone.id, targetId)
                }}
                showToast={showToast}
              />
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                className="input-field"
                placeholder="添加任务..."
                style={{ fontSize: 13, padding: '8px 12px' }}
                value={newTaskInputs[milestone.id] || ''}
                onChange={(e) => setNewTaskInputs(prev => ({
                  ...prev,
                  [milestone.id]: e.target.value
                }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask(milestone.id)
                }}
              />
              <button
                onClick={() => handleAddTask(milestone.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-indigo-deep)',
                  color: 'white',
                  fontSize: 13,
                  transition: 'all 0.2s var(--ease-standard)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-amber-gold)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-indigo-deep)'
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Toast: React.FC<{ message: string; id: number }> = ({ message }) => (
  <div className="app-toast">{message}</div>
)

const ExhibitionModule: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { exhibitions, artworks } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])

  const showToast = (message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }

  const stats = useMemo(() => ({
    totalArtworks: artworks.length,
    inStockCount: artworks.filter(a => a.status === 'in_stock').length,
    lentOutCount: artworks.filter(a => a.status === 'lent_out').length,
    exhibitionCount: exhibitions.length
  }), [artworks, exhibitions])

  const selectedExhibition = id
    ? exhibitions.find(e => e.id === id)
    : null

  return (
    <div style={{ padding: 32, maxWidth: 1600, margin: '0 auto' }} className="main-content">
      {toasts.map(t => <Toast key={t.id} message={t.message} id={t.id} />)}
      <StatsCards {...stats} />
      {selectedExhibition ? (
        <ExhibitionDetail
          exhibition={selectedExhibition}
          onBack={() => navigate('/exhibitions')}
          showToast={showToast}
        />
      ) : (
        <ExhibitionList
          onSelect={(exId) => navigate(`/exhibitions/${exId}`)}
          onCreate={() => setShowCreateModal(true)}
        />
      )}
      {showCreateModal && (
        <CreateExhibitionModal
          onClose={() => setShowCreateModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

export default ExhibitionModule
