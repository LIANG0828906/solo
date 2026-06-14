import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import TaskCard from './components/TaskCard';
import MoodTimeline from './components/MoodTimeline';
import DiaryEditor from './components/DiaryEditor';
import { initialTasks, initialMoodEntries } from './utils/mockData';
import { Task, MoodEntry, Mood, Priority, SearchResult, PRIORITY_CONFIG } from './types';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(initialMoodEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const sortedTasks = useMemo(() => {
    const priorityWeight = PRIORITY_CONFIG;
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.completed && b.completed) return a.order - b.order;
      const wA = priorityWeight[a.priority].weight;
      const wB = priorityWeight[b.priority].weight;
      if (wA !== wB) return wB - wA;
      return a.order - b.order;
    });
  }, [tasks]);

  const addTask = useCallback(() => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const task: Task = {
      id: uuidv4(),
      title,
      dueDate: newTaskDate,
      priority: newTaskPriority,
      completed: false,
      order: tasks.length,
    };
    setTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
  }, [newTaskTitle, newTaskDate, newTaskPriority, tasks.length]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const editTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }
      setTasks((prev) => {
        const arr = [...prev];
        const dragIndex = arr.findIndex((t) => t.id === dragId);
        const dropIndex = arr.findIndex((t) => t.id === targetId);
        if (dragIndex === -1 || dropIndex === -1) return prev;
        const [removed] = arr.splice(dragIndex, 1);
        arr.splice(dropIndex, 0, removed);
        return arr.map((t, i) => ({ ...t, order: i }));
      });
      setDragId(null);
      setDragOverId(null);
    },
    [dragId]
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);

  const saveDiary = useCallback(
    (date: string, mood: Mood, diary: string) => {
      setMoodEntries((prev) => {
        const existing = prev.findIndex((e) => e.date === date);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], mood, diary };
          return updated;
        }
        return [...prev, { date, mood, diary }];
      });
    },
    []
  );

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];

    tasks.forEach((task) => {
      const idx = task.title.toLowerCase().indexOf(q);
      if (idx >= 0) {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          snippet: task.title,
          matchStart: idx,
          matchEnd: idx + q.length,
        });
      }
    });

    moodEntries.forEach((entry) => {
      if (!entry.diary) return;
      const idx = entry.diary.toLowerCase().indexOf(q);
      if (idx >= 0) {
        const start = Math.max(0, idx - 10);
        const end = Math.min(entry.diary.length, idx + q.length + 10);
        let snippet = '';
        if (start > 0) snippet += '...';
        snippet += entry.diary.slice(start, end);
        if (end < entry.diary.length) snippet += '...';
        const matchStart = start > 0 ? idx - start + 3 : idx - start;
        results.push({
          type: 'diary',
          id: entry.date,
          title: `${entry.date} 的日记`,
          snippet,
          matchStart,
          matchEnd: matchStart + q.length,
        });
      }
    });

    return results;
  }, [searchQuery, tasks, moodEntries]);

  const highlightText = useCallback(
    (text: string, matchStart: number, matchEnd: number) => {
      if (matchStart < 0 || matchEnd > text.length) return text;
      return (
        <>
          {text.slice(0, matchStart)}
          <mark>{text.slice(matchStart, matchEnd)}</mark>
          {text.slice(matchEnd)}
        </>
      );
    },
    []
  );

  const todayEntry = useMemo(
    () => moodEntries.find((e) => e.date === format(new Date(), 'yyyy-MM-dd')),
    [moodEntries]
  );

  return (
    <div className="app-container">
      {toastVisible && (
        <div className="toast-container">
          <div className="toast">
            <span className="toast-emoji">✨</span>
            {toastMessage}
          </div>
        </div>
      )}

      <header className="app-header">
        <h1 className="app-title">My Mood Journal</h1>
        <p className="app-subtitle">记录每一天的心情与待办 ✿</p>
      </header>

      <div className="search-section">
        <button
          className="search-toggle"
          onClick={() => setSearchExpanded(!searchExpanded)}
          title="搜索"
        >
          {searchExpanded ? '✕' : '🔍'}
        </button>
        <div className={`search-bar-wrapper ${searchExpanded ? 'expanded' : ''}`}>
          <input
            className="search-bar"
            type="text"
            placeholder="搜索任务或日记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, i) => (
              <div key={`${result.type}-${result.id}-${i}`} className="search-result-item">
                <div className="search-result-type">
                  {result.type === 'task' ? '📋 任务' : '📖 日记'}
                </div>
                <div className="search-result-title">{result.title}</div>
                <div className="search-result-snippet">
                  {highlightText(result.snippet, result.matchStart, result.matchEnd)}
                </div>
              </div>
            ))}
          </div>
        )}
        {searchQuery.trim() && searchResults.length === 0 && (
          <div className="search-results">
            <div className="empty-state">
              <div className="empty-state-emoji">🔍</div>
              没有找到匹配的内容
            </div>
          </div>
        )}
      </div>

      <section className="task-section">
        <h2 className="section-title">📋 今日待办</h2>
        <div className="add-task-bar">
          <input
            className="add-task-input"
            type="text"
            placeholder="添加新任务..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <input
            className="add-task-date"
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
          />
          <select
            className="add-task-priority"
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <button className="add-task-btn" onClick={addTask}>
            添加
          </button>
        </div>
        <div className="task-list">
          {sortedTasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-emoji">🎉</div>
              没有待办任务，好好享受今天吧！
            </div>
          )}
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </section>

      <section className="diary-section">
        <h2 className="section-title">📝 今日日记</h2>
        <DiaryEditor
          moodEntry={todayEntry}
          onSave={saveDiary}
          onToast={showToast}
        />
      </section>

      <section className="timeline-section">
        <h2 className="section-title">🌈 心情时间线</h2>
        <MoodTimeline moodEntries={moodEntries} />
      </section>
    </div>
  );
};

export default App;
