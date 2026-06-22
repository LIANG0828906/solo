import { useMemo } from 'react'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { DIFFICULTY_LABEL, getCategoryColor, getCategoryIcon, getCategoryName } from '@/utils/mockApi'
import type { Task } from '@/types'
import './TaskDetail.css'

export const TaskDetail = () => {
  const { nodes } = useSkillTreeStore()

  const allTasks = useMemo(() => {
    const list: Task[] = []
    nodes.forEach((n) => list.push(...n.tasks))
    return list
  }, [nodes])

  const pendingTasks = allTasks.filter((t) => !t.completed)
  const completedTasks = allTasks.filter((t) => t.completed)

  return (
    <main className="task-detail">
      <div className="detail-header">
        <h1 className="detail-title">✨ 我的待办事项</h1>
        <p className="detail-subtitle">
          共 <strong>{pendingTasks.length}</strong> 项待完成，<strong>{completedTasks.length}</strong> 项已完成
        </p>
      </div>

      <section className="detail-section">
        <div className="section-header">
          <h3 className="section-title">📝 待办列表</h3>
        </div>
        {pendingTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-text">太棒了！暂无待办事项</div>
            <div className="empty-hint">点击左侧技能树添加新任务</div>
          </div>
        ) : (
          <div className="task-list">
            {pendingTasks.map((task) => {
              return (
                <div
                  key={task.id}
                  className="detail-task-card"
                  style={{ borderLeftColor: getCategoryColor(task.category) }}
                >
                  <div className="dtc-left">
                    <span
                      className="dtc-icon"
                      style={{ background: `${getCategoryColor(task.category)}25` }}
                    >
                      {getCategoryIcon(task.category)}
                    </span>
                    <div className="dtc-info">
                      <div className="dtc-title">{task.title}</div>
                      <div className="dtc-meta">
                        <span className="dtc-category">{getCategoryName(task.category)}</span>
                        <span className="dtc-sep">·</span>
                        <span className="dtc-date">截止 {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="dtc-difficulty"
                    style={{
                      background: `${getCategoryColor(task.category)}20`,
                      color: getCategoryColor(task.category),
                    }}
                  >
                    {DIFFICULTY_LABEL[task.difficulty]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {completedTasks.length > 0 && (
        <section className="detail-section">
          <div className="section-header">
            <h3 className="section-title">✅ 已完成</h3>
          </div>
          <div className="task-list">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="detail-task-card completed"
                style={{ borderLeftColor: getCategoryColor(task.category) }}
              >
                <div className="dtc-left">
                  <span
                    className="dtc-icon"
                    style={{ background: `${getCategoryColor(task.category)}25` }}
                  >
                    {getCategoryIcon(task.category)}
                  </span>
                  <div className="dtc-info">
                    <div className="dtc-title">{task.title}</div>
                    <div className="dtc-meta">
                      <span className="dtc-category">{getCategoryName(task.category)}</span>
                      <span className="dtc-sep">·</span>
                      <span className="dtc-date">已完成</span>
                    </div>
                  </div>
                </div>
                <span className="dtc-check">✓</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
