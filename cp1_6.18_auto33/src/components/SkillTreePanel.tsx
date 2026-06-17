import { useState } from 'react'
import type { TaskDifficulty } from '@/types'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { TaskCard } from './TaskCard'
import './SkillTreePanel.css'

export const SkillTreePanel = () => {
  const { nodes, toggleNode, highlightedNode, addTask } = useSkillTreeStore()
  const [addingToNode, setAddingToNode] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0])
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('medium')

  const handleAdd = (nodeId: string) => {
    if (newTitle.trim()) {
      addTask(nodeId, newTitle.trim(), newDueDate, newDifficulty)
      setNewTitle('')
      setNewDueDate(new Date().toISOString().split('T')[0])
      setNewDifficulty('medium')
      setAddingToNode(null)
    }
  }

  return (
    <aside className="skill-tree-panel">
      <div className="panel-header">
        <h2 className="panel-title">🌳 技能树</h2>
      </div>
      <div className="skill-tree">
        {nodes.map((node, idx) => (
          <div key={node.id} className="skill-node-wrapper">
            <div className="skill-node-row">
              <div className="node-connector">
                {idx > 0 && <div className="connector-line-top" />}
                <button
                  className={`skill-node ${highlightedNode === node.id ? 'highlighted' : ''} ${
                    node.expanded ? 'expanded' : ''
                  }`}
                  style={{ background: node.color }}
                  onClick={() => toggleNode(node.id)}
                  aria-label={`切换${node.name}`}
                >
                  <span className="node-icon">{node.icon}</span>
                </button>
                {idx < nodes.length - 1 && <div className="connector-line-bottom" />}
              </div>
              <div className="node-info">
                <button className="node-name-btn" onClick={() => toggleNode(node.id)}>
                  <span className="node-name">{node.name}</span>
                  <span className="node-count">{node.tasks.filter((t) => !t.completed).length}</span>
                </button>
              </div>
            </div>

            {node.expanded && (
              <div className="node-tasks">
                {node.tasks.map((task) => (
                  <TaskCard key={task.id} node={node} task={task} />
                ))}

                {addingToNode === node.id ? (
                  <div className="add-task-form">
                    <input
                      className="form-input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="新任务标题"
                      autoFocus
                    />
                    <input
                      type="date"
                      className="form-input"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                    <select
                      className="form-input"
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as TaskDifficulty)}
                    >
                      <option value="easy">简单 (5 XP)</option>
                      <option value="medium">中等 (10 XP)</option>
                      <option value="hard">困难 (20 XP)</option>
                    </select>
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={() => handleAdd(node.id)}>
                        添加
                      </button>
                      <button className="btn btn-ghost" onClick={() => setAddingToNode(null)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="add-task-btn" onClick={() => setAddingToNode(node.id)}>
                    + 添加任务
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
