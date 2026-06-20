import { useState } from 'react'
import { Objective, KeyResult } from '../store/okrStore'
import KeyResultEditor from './KeyResultEditor'

interface ObjectiveCardProps {
  objective: Objective
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  isDragOver: boolean
}

export default function ObjectiveCard({ objective, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }: ObjectiveCardProps) {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <>
      <div
        className={`objective-card${isDragOver ? ' drag-over' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, objective.id)}
        onDragOver={(e) => onDragOver(e, objective.id)}
        onDrop={(e) => onDrop(e, objective.id)}
        onDragEnd={onDragEnd}
      >
        <div className="card-title">{objective.name}</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${objective.progress}%` }} />
        </div>
        <div className="progress-text">
          <span>进度</span>
          <span>{Math.round(objective.progress)}%</span>
        </div>
        <div className="kr-count">{objective.keyResults.length} 个关键结果</div>
        <button className="edit-btn" onClick={() => setShowEditor(true)} title="编辑关键结果">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-8.5 8.5H3v-2l8.5-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </button>
      </div>
      {showEditor && (
        <KeyResultEditor
          objective={objective}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  )
}
