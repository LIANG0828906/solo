import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { DiaryEntry, MoodType, Task } from '../../types';
import { MOOD_CONFIG } from '../../types';
import { useDiaryStore } from '../../store/useDiaryStore';

const DRAFT_KEY = 'diary_draft';
const DRAFT_EXPIRY = 30 * 60 * 1000;

interface DiaryEditorProps {
  editingEntry?: DiaryEntry | null;
  onClose: () => void;
  initialDate?: string;
}

export default function DiaryEditor({ editingEntry, onClose, initialDate }: DiaryEditorProps) {
  const { createEntry, updateEntry } = useDiaryStore();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(editingEntry?.date || initialDate || today);
  const [mood, setMood] = useState<MoodType>(editingEntry?.mood || 'neutral');
  const [title, setTitle] = useState<string>(editingEntry?.title || '');
  const [content, setContent] = useState<string>(editingEntry?.content || '');
  const [tasks, setTasks] = useState<Task[]>(editingEntry?.tasks || []);
  const [draftSaved, setDraftSaved] = useState<boolean>(false);

  const saveDraft = useCallback(() => {
    const draft = {
      date,
      mood,
      title,
      content,
      tasks,
      savedAt: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [date, mood, title, content, tasks]);

  const loadDraft = useCallback(() => {
    if (editingEntry) return;
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (!draftStr) return;
      const draft = JSON.parse(draftStr);
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      setDate(draft.date);
      setMood(draft.mood);
      setTitle(draft.title);
      setContent(draft.content);
      setTasks(draft.tasks);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [editingEntry]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (!title && !content && tasks.length === 0 && !editingEntry) return;
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [date, mood, title, content, tasks, saveDraft, editingEntry]);

  const addTask = () => {
    setTasks([...tasks, { id: uuidv4(), text: '', completed: false }]);
  };

  const updateTask = (id: string, text: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id: string) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }
    const validTasks = tasks.filter((t) => t.text.trim());
    if (validTasks.length === 0) {
      alert('至少需要一个任务');
      return;
    }

    if (editingEntry) {
      await updateEntry(editingEntry.id, {
        date,
        mood,
        title: title.trim(),
        content,
        tasks: validTasks
      });
    } else {
      await createEntry({
        date,
        mood,
        title: title.trim(),
        content,
        tasks: validTasks
      });
      localStorage.removeItem(DRAFT_KEY);
    }
    onClose();
  };

  return (
    <div className="editor-container">
      <h2 className="editor-title">{editingEntry ? '编辑日记' : '写日记'}</h2>

      <div className="editor-form">
        <div className="form-group">
          <label className="form-label">日期</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">心情</label>
          <div className="mood-selector">
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((m) => (
              <div
                key={m}
                className={`mood-option ${mood === m ? 'selected' : ''}`}
                onClick={() => setMood(m)}
              >
                <span className="mood-emoji">{MOOD_CONFIG[m].emoji}</span>
                <span className="mood-label">{MOOD_CONFIG[m].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给今天的日记起个标题..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">正文 (支持 Markdown)</label>
          <textarea
            className="form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的想法、感受和灵感...\n\n支持 Markdown 语法：\n# 标题\n**粗体** *斜体*\n- 列表项\n```代码块```"
          />
        </div>

        <div className="form-group">
          <label className="form-label">任务清单</label>
          <div className="task-list-editor">
            {tasks.map((task, index) => (
              <div key={task.id} className="task-item-editor">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <input
                  type="text"
                  value={task.text}
                  onChange={(e) => updateTask(task.id, e.target.value)}
                  placeholder={`任务 ${index + 1}`}
                />
                <button
                  className="remove-task-btn"
                  onClick={() => removeTask(task.id)}
                  disabled={tasks.length <= 1}
                  title="删除任务"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="add-task-btn" onClick={addTask} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            + 添加任务
          </button>
        </div>

        <div className="editor-actions">
          {draftSaved && <span className="draft-indicator">草稿已保存</span>}
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editingEntry ? '保存修改' : '创建日记'}
          </button>
        </div>
      </div>
    </div>
  );
}
