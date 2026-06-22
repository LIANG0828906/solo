import { useState } from 'react';
import { marked } from 'marked';
import type { DiaryEntry as DiaryEntryType } from '../../types';
import { MOOD_CONFIG } from '../../types';

interface DiaryEntryProps {
  entry: DiaryEntryType;
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
  onToggleTask?: (entryId: string, taskId: string) => void;
}

export default function DiaryEntry({ entry, onEdit, onDelete, onToggleTask }: DiaryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const moodConfig = MOOD_CONFIG[entry.mood];

  const getSummary = (content: string) => {
    const plain = content.replace(/[#*`_~\[\]()>]/g, '');
    return plain.length > 100 ? plain.slice(0, 100) + '...' : plain;
  };

  const handleTaskClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (onToggleTask) {
      onToggleTask(entry.id, taskId);
    }
  };

  return (
    <div
      className={`diary-entry-card ${expanded ? 'diary-entry-expanded' : ''}`}
      style={{ borderLeft: `4px solid ${moodConfig.color}` }}
      onClick={() => !expanded && setExpanded(true)}
    >
      <div className="diary-entry-header">
        <span className="diary-entry-mood">{moodConfig.emoji}</span>
        <span className="diary-entry-title">{entry.title}</span>
        <span className="diary-entry-date">{entry.date}</span>
      </div>

      {!expanded && (
        <div className="diary-entry-summary">{getSummary(entry.content)}</div>
      )}

      {expanded && (
        <>
          <div
            className="diary-entry-content"
            dangerouslySetInnerHTML={{ __html: marked.parse(entry.content) as string }}
          />

          {entry.tasks && entry.tasks.length > 0 && (
            <div className="diary-entry-tasks">
              <div className="form-label" style={{ marginBottom: '8px' }}>
                任务清单
              </div>
              {entry.tasks.map((task) => (
                <div key={task.id} className="task-item">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={(e) => handleTaskClick(e, task.id)}
                  />
                  <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="diary-entry-actions">
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
            >
              收起
            </button>
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              编辑
            </button>
            <button
              className="btn btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确定要删除这条日记吗？')) {
                  onDelete(entry.id);
                }
              }}
            >
              删除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
