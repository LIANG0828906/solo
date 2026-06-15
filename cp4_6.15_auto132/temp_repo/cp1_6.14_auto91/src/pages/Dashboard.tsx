import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getSchedule,
  createTask,
  updateTask,
  deleteTask,
  ScheduleTask,
} from '../api';

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TIME_SLOTS: Array<{ key: 'morning' | 'afternoon' | 'evening'; label: string }> = [
  { key: 'morning', label: '早上 🌅' },
  { key: 'afternoon', label: '中午 ☀️' },
  { key: 'evening', label: '晚上 🌙' },
];
const TASK_TYPES: Array<{ value: ScheduleTask['type']; label: string }> = [
  { value: 'feed', label: '🍚 喂食' },
  { value: 'walk', label: '🐾 遛弯' },
  { value: 'medicine', label: '💊 喂药' },
  { value: 'other', label: '📋 其他' },
];

const CURRENT_FAMILY_ID = 'f1';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekStart(d: Date): Date {
  const nd = new Date(d);
  const day = nd.getDay();
  nd.setDate(nd.getDate() - day);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

interface TaskFormState {
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  petName: string;
  type: ScheduleTask['type'];
  description: string;
}

const Dashboard: React.FC = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInit, setModalInit] = useState<TaskFormState>({
    date: formatDate(new Date()),
    timeSlot: 'morning',
    petName: '',
    type: 'feed',
    description: '',
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [animWeek, setAnimWeek] = useState(0);
  const [formState, setFormState] = useState<TaskFormState>(modalInit);
  const [animatingTaskId, setAnimatingTaskId] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const todayStr = formatDate(new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getSchedule(CURRENT_FAMILY_ID, formatDate(weekStart));
        if (!cancelled) setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [weekStart]);

  useEffect(() => {
    setFormState(modalInit);
  }, [modalInit]);

  const goPrevWeek = () => {
    setAnimWeek(-1);
    setTimeout(() => {
      setWeekStart((d) => addDays(d, -7));
      setAnimWeek(0);
    }, 150);
  };

  const goNextWeek = () => {
    setAnimWeek(1);
    setTimeout(() => {
      setWeekStart((d) => addDays(d, 7));
      setAnimWeek(0);
    }, 150);
  };

  const weekLabel = `${formatDate(weekDates[0]).slice(5)} ~ ${formatDate(weekDates[6]).slice(5)}`;

  const openAddModal = (date: string, timeSlot: 'morning' | 'afternoon' | 'evening') => {
    setModalInit({ date, timeSlot, petName: '', type: 'feed', description: '' });
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formState.petName.trim()) return;
    try {
      const res = await createTask({
        fosterFamilyId: CURRENT_FAMILY_ID,
        petName: formState.petName.trim(),
        date: formState.date,
        timeSlot: formState.timeSlot,
        type: formState.type,
        description: formState.description.trim(),
      });
      if (res.success) {
        setTasks((t) => [...t, res.task]);
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    try {
      await deleteTask(id);
      setTasks((t) => t.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', id);
    } catch {}

    const el = taskRefs.current.get(id);
    if (el) {
      const ghost = el.cloneNode(true) as HTMLDivElement;
      ghost.style.width = `${el.offsetWidth}px`;
      ghost.style.opacity = '0.6';
      ghost.style.transform = 'rotate(3deg) scale(1.05)';
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      document.body.appendChild(ghost);
      dragGhostRef.current = ghost;

      try {
        e.dataTransfer.setDragImage(ghost, el.offsetWidth / 2, el.offsetHeight / 2);
      } catch {}
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (
    e: React.DragEvent,
    date: string,
    timeSlot: 'morning' | 'afternoon' | 'evening'
  ) => {
    e.preventDefault();
    const id = draggingId || e.dataTransfer.getData('text/plain');
    if (!id) return;
    setDraggingId(null);

    setAnimatingTaskId(id);
    setTimeout(() => setAnimatingTaskId(null), 350);

    try {
      const res = await updateTask(id, { date, timeSlot });
      if (res.success) {
        setTasks((t) =>
          t.map((x) => (x.id === id ? { ...x, date, timeSlot } : x))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tasksByKey = useMemo(() => {
    const map = new Map<string, ScheduleTask[]>();
    tasks.forEach((t) => {
      const key = `${t.date}_${t.timeSlot}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div className="page-wrapper">
      <div className="dashboard-header">
        <h1 className="page-title" style={{ margin: 0 }}>📅 寄养日程管理</h1>
        <div className="dashboard-week-nav">
          <button className="week-nav-btn" onClick={goPrevWeek} aria-label="上一周">‹</button>
          <div className="week-label">{weekLabel}</div>
          <button className="week-nav-btn" onClick={goNextWeek} aria-label="下一周">›</button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <div>正在加载日程...</div>
        </div>
      )}

      {!loading && (
        <div
          style={{
            transform: `translateX(${animWeek * 30}px)`,
            opacity: animWeek === 0 ? 1 : 0,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          <div className="week-view">
            <div className="week-view-header">
              <div className="week-view-corner">时段 / 日期</div>
              {weekDates.map((d) => {
                const ds = formatDate(d);
                const isToday = ds === todayStr;
                return (
                  <div key={ds} className={`week-view-day-header ${isToday ? 'today' : ''}`}>
                    <div className="week-view-day-of-week">
                      {WEEKDAY_CN[d.getDay()]}
                    </div>
                    <div className="week-view-day-number">
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="week-view-body">
              {TIME_SLOTS.map((slot) => (
                <React.Fragment key={slot.key}>
                  <div className="week-view-slot-label">{slot.label}</div>
                  {weekDates.map((d) => {
                    const ds = formatDate(d);
                    const key = `${ds}_${slot.key}`;
                    const cellTasks = tasksByKey.get(key) || [];
                    return (
                      <div
                        key={key}
                        className={`week-view-cell ${slot.key}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, ds, slot.key)}
                      >
                        <button
                          type="button"
                          className="add-task-btn"
                          onClick={() => openAddModal(ds, slot.key)}
                          title="添加任务"
                        >
                          +
                        </button>
                        {cellTasks.map((t) => (
                          <div
                            key={t.id}
                            ref={(el) => {
                              if (el) taskRefs.current.set(t.id, el);
                              else taskRefs.current.delete(t.id);
                            }}
                            className={`task-card ${draggingId === t.id ? 'dragging' : ''} ${animatingTaskId === t.id ? 'task-animating' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onDragEnd={handleDragEnd}
                          >
                            <button
                              type="button"
                              className="task-delete"
                              onClick={() => handleDelete(t.id)}
                              aria-label="删除任务"
                            >
                              ✕
                            </button>
                            <span className={`task-type-badge task-type-${t.type}`}>
                              {TASK_TYPES.find((x) => x.value === t.type)?.label}
                            </span>
                            <div className="task-pet">{t.petName}</div>
                            {t.description && (
                              <div className="task-desc">{t.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="bottom-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="bottom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-modal-header">
              <div className="bottom-modal-title">✨ 添加照护任务</div>
              <button className="close-btn" onClick={() => setModalOpen(false)} aria-label="关闭">✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">宠物名字</label>
              <input
                className="form-input"
                value={formState.petName}
                onChange={(e) => setFormState({ ...formState, petName: e.target.value })}
                placeholder="请输入宠物名字"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formState.date}
                  onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">时段</label>
                <select
                  className="form-select"
                  value={formState.timeSlot}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      timeSlot: e.target.value as 'morning' | 'afternoon' | 'evening',
                    })
                  }
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">任务类型</label>
              <select
                className="form-select"
                value={formState.type}
                onChange={(e) =>
                  setFormState({ ...formState, type: e.target.value as ScheduleTask['type'] })
                }
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">任务描述</label>
              <textarea
                className="form-textarea"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="请输入任务描述（可选）"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={!formState.petName.trim()}
                onClick={handleCreate}
              >
                添加任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
