import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInDays } from 'date-fns';
import TaskCard from './components/TaskCard';
import MoodTimeline from './components/MoodTimeline';
import DiaryEditor from './components/DiaryEditor';
import { initialTasks, initialMoodEntries } from './utils/mockData';
import { Task, MoodEntry, Mood, Priority, SearchResult, PRIORITY_CONFIG } from './types';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(initialMoodEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hasUserSorted, setHasUserSorted] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  }, []);

  const sortedTasks = useMemo(() => {
    const priorityWeight = PRIORITY_CONFIG;
    const incomplete = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);

    const sortIncomplete = (a: Task, b: Task) => {
      if (hasUserSorted) {
        return a.order - b.order;
      }
      const wA = priorityWeight[a.priority].weight;
      const wB = priorityWeight[b.priority].weight;
      if (wA !== wB) return wB - wA;
      return a.order - b.order;
    };

    incomplete.sort(sortIncomplete);
    completed.sort((a, b) => a.order - b.order);

    return [...incomplete, ...completed];
  }, [tasks, hasUserSorted]);

  const addTask = useCallback(() => {
    const title = newTaskTitle.trim();
    if (!title) {
      showToast('请输入任务标题哦 📝');
      return;
    }
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
    const task: Task = {
      id: uuidv4(),
      title,
      dueDate: newTaskDate,
      priority: newTaskPriority,
      completed: false,
      order: maxOrder + 1,
    };
    setTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
    showToast('任务添加成功 ✅');
  }, [newTaskTitle, newTaskDate, newTaskPriority, tasks, showToast]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('任务已删除 🗑️');
  }, [showToast]);

  const editTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
    showToast('任务已更新 ✏️');
  }, [showToast]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    try {
      e.dataTransfer.setData('text/plain', id);
    } catch {}
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  }, [dragOverId]);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }

      setTasks((prev) => {
        const incomplete = prev.filter((t) => !t.completed);
        const completed = prev.filter((t) => t.completed);

        const dragTask = prev.find((t) => t.id === dragId);
        const targetTask = prev.find((t) => t.id === targetId);
        if (!dragTask || !targetTask) return prev;

        const sortPool = dragTask.completed ? completed : incomplete;
        const dragIndex = sortPool.findIndex((t) => t.id === dragId);
        const dropIndex = sortPool.findIndex((t) => t.id === targetId);
        if (dragIndex === -1 || dropIndex === -1) return prev;

        const poolCopy = [...sortPool];
        const [removed] = poolCopy.splice(dragIndex, 1);
        poolCopy.splice(dropIndex, 0, removed);
        const reordered = poolCopy.map((t, i) => ({ ...t, order: i }));

        const otherPool = dragTask.completed ? incomplete : completed;
        const result = dragTask.completed
          ? [...otherPool, ...reordered]
          : [...reordered, ...otherPool];

        let globalOrder = 0;
        return result.map((t) => ({ ...t, order: globalOrder++ }));
      });

      setHasUserSorted(true);
      setDragId(null);
      setDragOverId(null);
      showToast('排序已更新 📋');
    },
    [dragId, showToast]
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
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return [];
    const q = trimmedQuery.toLowerCase();
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
      if (!entry.diary && !entry.mood) return;
      let found = false;
      if (entry.diary) {
        const idx = entry.diary.toLowerCase().indexOf(q);
        if (idx >= 0) {
          found = true;
          const start = Math.max(0, idx - 15);
          const end = Math.min(entry.diary.length, idx + q.length + 15);
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
      }
      if (!found) {
        const moodLabel = {
          happy: '开心',
          calm: '平静',
          sad: '忧伤',
          angry: '愤怒',
          surprised: '惊喜',
        }[entry.mood] || '';
        if (moodLabel && moodLabel.toLowerCase().indexOf(q) >= 0) {
          results.push({
            type: 'diary',
            id: entry.date,
            title: `${entry.date} 的心情：${moodLabel}`,
            snippet: entry.diary || `当日心情为：${moodLabel}`,
            matchStart: 0,
            matchEnd: q.length,
          });
        }
      }
    });

    return results.slice(0, 50);
  }, [searchQuery, tasks, moodEntries]);

  const highlightText = useCallback(
    (text: string, matchStart: number, matchEnd: number) => {
      if (matchStart < 0 || matchEnd > text.length || matchStart >= matchEnd) {
        return text;
      }
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

  const handleSearchToggle = useCallback(() => {
    setSearchExpanded((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 400);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

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
        {totalTasks > 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: '0.85rem',
              color: '#8A9A8A',
              fontFamily: "'Patrick Hand', cursive",
              letterSpacing: 1,
            }}
          >
            今日完成进度：{doneTasks}/{totalTasks} （{progressPercent}%）
          </div>
        )}
      </header>

      <div className="search-section">
        <button
          className="search-toggle"
          onClick={handleSearchToggle}
          title={searchExpanded ? '收起搜索' : '展开搜索'}
        >
          {searchExpanded ? '✕' : '🔍'}
        </button>
        <div className={`search-bar-wrapper ${searchExpanded ? 'expanded' : ''}`}>
          <input
            ref={searchInputRef}
            className="search-bar"
            type="text"
            placeholder="🔍 搜索任务标题或日记内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchExpanded && searchQuery.trim() && searchResults.length > 0 && (
          <div className="search-results">
            <div
              style={{
                padding: '8px 16px',
                borderBottom: '1px dashed #E8E0D0',
                fontSize: '0.8rem',
                color: '#98D8C8',
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              共找到 {searchResults.length} 条结果
            </div>
            {searchResults.map((result, i) => (
              <div
                key={`${result.type}-${result.id}-${i}`}
                className="search-result-item"
              >
                <div className="search-result-type">
                  {result.type === 'task' ? '📋 任务' : '📖 日记'}
                </div>
                <div className="search-result-title">
                  {highlightText(result.title, 0, 0) || result.title}
                </div>
                <div className="search-result-snippet">
                  {highlightText(result.snippet, result.matchStart, result.matchEnd)}
                </div>
              </div>
            ))}
          </div>
        )}
        {searchExpanded && searchQuery.trim() && searchResults.length === 0 && (
          <div className="search-results">
            <div className="empty-state">
              <div className="empty-state-emoji">🔍</div>
              没有找到匹配「{searchQuery.trim()}」的内容，换个关键词试试吧
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
            placeholder="➕ 添加新任务，按回车快速添加..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
              }
            }}
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
            <option value="high">🔴 高优先级</option>
            <option value="medium">🟡 中优先级</option>
            <option value="low">🟢 低优先级</option>
          </select>
          <button className="add-task-btn" onClick={addTask}>
            添加
          </button>
        </div>
        <div className="task-list">
          {sortedTasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-emoji">🎉</div>
              太棒了！没有待办任务，好好享受今天吧～
            </div>
          )}
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={dragId === task.id}
              isDragOver={dragOverId === task.id}
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

      <footer
        style={{
          textAlign: 'center',
          marginTop: 40,
          paddingTop: 20,
          borderTop: '2px dashed #E8E0D0',
          color: '#B0B0A0',
          fontSize: '0.8rem',
          fontFamily: "'Patrick Hand', cursive",
          letterSpacing: 1,
        }}
      >
        用心记录每一天 ❀ Made with ♡
      </footer>
    </div>
  );
};

export default App;
