import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Teacher, Course, Classroom, ScheduleEntry, ConflictInfo, TimeSlot } from './types';
import * as api from './api/scheduleApi';
import TeacherManage from './components/TeacherManage';
import CourseManage from './components/CourseManage';
import ClassroomManage from './components/ClassroomManage';

const DAYS = ['周一', '周二', '周三', '周四', '周五'];
const TOTAL_SLOTS = 20;
const SLOT_LABELS: string[] = [];
for (let i = 0; i < TOTAL_SLOTS; i++) {
  const hour = 8 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  SLOT_LABELS.push(`${hour}:${min}`);
}

const TEACHER_COLORS = ['#1565C0', '#2E7D32', '#E65100', '#7B1FA2', '#C62828', '#00695C', '#F57C00', '#4527A0'];

const CHART_PIE_COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EF5350', '#26C6DA', '#FFCA28', '#7E57C2'];

function slotToTime(slot: number): string {
  return SLOT_LABELS[slot] ?? '';
}

function slotsOverlap(start1: number, duration1: number, start2: number, duration2: number): boolean {
  return start1 < start2 + duration2 && start2 < start1 + duration1;
}

interface HoveredEntry {
  entry: ScheduleEntry;
  course: Course;
  teacher: Teacher;
  classroom: Classroom;
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  entryId: string | null;
  currentDay: number;
  currentSlot: number;
  conflicts: ConflictInfo[];
}

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'courses' | 'classrooms'>('teachers');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [hoveredEntry, setHoveredEntry] = useState<HoveredEntry | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [shakeCell, setShakeCell] = useState<{ day: number; slot: number } | null>(null);

  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    entryId: null,
    currentDay: -1,
    currentSlot: -1,
    conflicts: [],
  });

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, r, s] = await Promise.all([
        api.fetchTeachers(),
        api.fetchCourses(),
        api.fetchClassrooms(),
        api.fetchSchedule(),
      ]);
      setTeachers(t);
      setCourses(c);
      setClassrooms(r);
      setSchedule(s);
    } catch (e) {
      console.error('Load data error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (scheduleMessage) {
      const t = setTimeout(() => setScheduleMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [scheduleMessage]);

  const getCourseById = (id: string) => courses.find((c) => c.id === id);
  const getTeacherById = (id: string) => teachers.find((t) => t.id === id);
  const getClassroomById = (id: string) => classrooms.find((c) => c.id === id);

  const detectConflictsForMove = useCallback(
    (entryId: string, newDay: number, newStartSlot: number, newClassroomId?: string): ConflictInfo[] => {
      const entry = schedule.find((e) => e.id === entryId);
      if (!entry) return [];
      const course = getCourseById(entry.courseId);
      if (!course) return [];
      const duration = course.duration;
      const targetClassroomId = newClassroomId ?? entry.classroomId;
      const conflictList: ConflictInfo[] = [];

      for (const existing of schedule) {
        if (existing.id === entryId) continue;
        if (existing.day !== newDay) continue;

        const existingDuration = getCourseById(existing.courseId)?.duration ?? 1;

        if (existing.teacherId === entry.teacherId) {
          if (slotsOverlap(newStartSlot, duration, existing.startSlot, existingDuration)) {
            conflictList.push({
              type: 'teacher',
              message: `教师冲突：${getTeacherById(existing.teacherId)?.name} 在 ${slotToTime(existing.startSlot)} 已有课程 ${getCourseById(existing.courseId)?.name}`,
              existingEntry: existing,
            });
          }
        }

        if (existing.classroomId === targetClassroomId) {
          if (slotsOverlap(newStartSlot, duration, existing.startSlot, existingDuration)) {
            conflictList.push({
              type: 'classroom',
              message: `教室冲突：${getClassroomById(existing.classroomId)?.name} 在 ${slotToTime(existing.startSlot)} 已被 ${getCourseById(existing.courseId)?.name} 占用`,
              existingEntry: existing,
            });
          }
        }
      }

      return conflictList;
    },
    [schedule, courses, teachers, classrooms]
  );

  const handleAutoSchedule = async () => {
    setAutoScheduling(true);
    try {
      const result = await api.autoSchedule();
      setSchedule(result.schedule);
      setConflicts([]);

      let messageText = `排课完成：成功生成 ${result.schedule.length} 节课`;
      let messageType: 'success' | 'error' | 'info' = 'success';

      if (result.conflicts.length > 0) {
        messageText += `，${result.conflicts.length} 节课无法排入`;
        messageType = 'info';
      }

      if (!result.validation.valid) {
        messageText += `，排课验证发现 ${result.validation.errors.length} 个冲突`;
        messageType = 'error';
        console.error('Validation errors:', result.validation.errors);
      }

      setScheduleMessage({ type: messageType, text: messageText });
    } catch (e) {
      console.error('Auto schedule error:', e);
      setScheduleMessage({ type: 'error', text: '自动排课失败，请稍后重试' });
    } finally {
      setAutoScheduling(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent, entryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const entry = schedule.find((s) => s.id === entryId);
    if (!entry) return;

    setDrag({
      isDragging: true,
      entryId,
      currentDay: entry.day,
      currentSlot: entry.startSlot,
      conflicts: [],
    });
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!drag.isDragging || !drag.entryId) return;
      setDragPosition({ x: e.clientX, y: e.clientY });

      const gridEl = document.getElementById('schedule-grid');
      if (!gridEl) return;

      const rect = gridEl.getBoundingClientRect();
      const timeColWidth = 60;
      const colWidth = (rect.width - timeColWidth) / 5;
      const headerHeight = 32;
      const rowHeight = 36;

      const x = e.clientX - rect.left - timeColWidth;
      const y = e.clientY - rect.top - headerHeight;

      if (x < 0 || y < 0) {
        if (drag.currentDay !== -1) {
          setDrag((d) => ({ ...d, currentDay: -1, currentSlot: -1, conflicts: [] }));
        }
        return;
      }

      const day = Math.floor(x / colWidth);
      const slot = Math.floor(y / rowHeight);

      if (day < 0 || day >= 5 || slot < 0 || slot >= TOTAL_SLOTS) {
        if (drag.currentDay !== -1) {
          setDrag((d) => ({ ...d, currentDay: -1, currentSlot: -1, conflicts: [] }));
        }
        return;
      }

      if (day === drag.currentDay && slot === drag.currentSlot) return;

      const entry = schedule.find((s) => s.id === drag.entryId);
      if (!entry) return;

      const course = getCourseById(entry.courseId);
      if (!course) return;
      if (slot + course.duration > TOTAL_SLOTS) return;

      const newConflicts = detectConflictsForMove(drag.entryId, day, slot);

      setDrag((d) => ({
        ...d,
        currentDay: day,
        currentSlot: slot,
        conflicts: newConflicts,
      }));
    },
    [drag.isDragging, drag.entryId, drag.currentDay, drag.currentSlot, schedule, courses, detectConflictsForMove]
  );

  const handleDragEnd = useCallback(async () => {
    if (!drag.isDragging || !drag.entryId) {
      setDrag({ isDragging: false, entryId: null, currentDay: -1, currentSlot: -1, conflicts: [] });
      return;
    }

    const entryId = drag.entryId;
    const newDay = drag.currentDay;
    const newStartSlot = drag.currentSlot;

    if (newDay < 0 || newStartSlot < 0) {
      setDrag({ isDragging: false, entryId: null, currentDay: -1, currentSlot: -1, conflicts: [] });
      return;
    }

    if (drag.conflicts.length > 0) {
      setShakeCell({ day: newDay, slot: newStartSlot });
      setTimeout(() => setShakeCell(null), 400);
      setConflicts(drag.conflicts);
      setScheduleMessage({ type: 'error', text: drag.conflicts[0].message });
      setDrag({ isDragging: false, entryId: null, currentDay: -1, currentSlot: -1, conflicts: [] });
      return;
    }

    try {
      const result = await api.moveScheduleEntry(entryId, newDay, newStartSlot);
      if (result.success) {
        const updated = await api.fetchSchedule();
        setSchedule(updated);
        setConflicts([]);
        setScheduleMessage({ type: 'success', text: '课程已移动' });
      } else if (result.conflicts) {
        setConflicts(result.conflicts);
        setScheduleMessage({ type: 'error', text: result.conflicts[0].message });
      }
    } catch (e) {
      console.error('Move error:', e);
      setScheduleMessage({ type: 'error', text: '移动失败，请稍后重试' });
    } finally {
      setDrag({ isDragging: false, entryId: null, currentDay: -1, currentSlot: -1, conflicts: [] });
    }
  }, [drag]);

  useEffect(() => {
    if (drag.isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [drag.isDragging, handleDragMove, handleDragEnd]);

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await api.deleteScheduleEntry(entryId);
      setSchedule((s) => s.filter((e) => e.id !== entryId));
      setScheduleMessage({ type: 'success', text: '课程已删除' });
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const entryStartSlots = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of schedule) {
      for (let s = e.startSlot; s < e.startSlot + (getCourseById(e.courseId)?.duration ?? 1); s++) {
        map.set(`${e.day}-${s}`, e.startSlot);
      }
    }
    return map;
  }, [schedule, courses]);

  const conflictingCells = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      const dur = getCourseById(c.existingEntry.courseId)?.duration ?? 1;
      for (let s = c.existingEntry.startSlot; s < c.existingEntry.startSlot + dur; s++) {
        set.add(`${c.existingEntry.day}-${s}`);
      }
    }
    for (const c of drag.conflicts) {
      const dur = getCourseById(c.existingEntry.courseId)?.duration ?? 1;
      for (let s = c.existingEntry.startSlot; s < c.existingEntry.startSlot + dur; s++) {
        set.add(`${c.existingEntry.day}-${s}`);
      }
    }
    return set;
  }, [conflicts, drag.conflicts, courses]);

  const classroomUsageData = useMemo(() => {
    return classrooms.map((c) => {
      const totalSlots = schedule
        .filter((e) => e.classroomId === c.id)
        .reduce((sum, e) => sum + (getCourseById(e.courseId)?.duration ?? 1), 0);
      const maxPossible = TOTAL_SLOTS * 5;
      const rate = maxPossible > 0 ? (totalSlots / maxPossible) * 100 : 0;
      return {
        name: c.name,
        使用率: Number(rate.toFixed(1)),
        总课时: totalSlots,
      };
    });
  }, [classrooms, schedule, courses]);

  const teacherLoadData = useMemo(() => {
    const totalAssignments = schedule.length;
    const data = teachers.map((t, i) => {
      const count = schedule.filter((e) => e.teacherId === t.id).length;
      const percentage = totalAssignments > 0 ? (count / totalAssignments) * 100 : 0;
      return {
        name: t.name,
        value: count,
        percentage: Number(percentage.toFixed(1)),
        fill: CHART_PIE_COLORS[i % CHART_PIE_COLORS.length],
      };
    });
    return data.filter((d) => d.value > 0);
  }, [teachers, schedule]);

  const totalHours = schedule.reduce((sum, e) => sum + (getCourseById(e.courseId)?.duration ?? 1) * 0.5, 0);

  const renderGrid = () => {
    const rows = [];

    for (let slotIndex = 0; slotIndex < TOTAL_SLOTS; slotIndex++) {
      const cells = [];

      cells.push(
        <div
          key="time"
          style={{
            width: 60,
            minWidth: 60,
            padding: '4px 8px',
            fontSize: 11,
            color: '#78909C',
            borderBottom: '1px solid #E3F2FD',
            borderRight: '1px solid #E3F2FD',
            background: '#F8FAFD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {SLOT_LABELS[slotIndex]}
        </div>
      );

      for (let day = 0; day < 5; day++) {
        const cellKey = `${day}-${slotIndex}`;
        const startSlot = entryStartSlots.get(cellKey);
        const isStartSlot = startSlot === slotIndex;
        const entry = isStartSlot ? schedule.find((e) => e.day === day && e.startSlot === slotIndex) : null;
        const course = entry ? getCourseById(entry.courseId) : null;
        const teacher = entry ? getTeacherById(entry.teacherId) : null;
        const classroom = entry ? getClassroomById(entry.classroomId) : null;
        const hasConflict = conflictingCells.has(cellKey);
        const isDragTarget = drag.currentDay === day && drag.currentSlot === slotIndex;
        const isValidDrop = isDragTarget && drag.conflicts.length === 0;
        const isInvalidDrop = isDragTarget && drag.conflicts.length > 0;
        const isShaking = shakeCell && shakeCell.day === day && shakeCell.slot === slotIndex;

        const borderColor = hasConflict ? (conflicts.some((c) => c.type === 'teacher' && c.existingEntry.day === day && c.existingEntry.startSlot <= slotIndex && slotIndex < c.existingEntry.startSlot + (getCourseById(c.existingEntry.courseId)?.duration ?? 1)) ? '#F44336' : '#FF9800') : '#E3F2FD';

        let dropClass = '';
        if (isValidDrop) dropClass = 'drop-valid';
        if (isInvalidDrop) dropClass = 'drop-invalid shake';

        const cellHeight = 36;
        let cellContent: React.ReactNode = null;

        if (isStartSlot && entry && course && teacher && classroom) {
          const duration = course.duration;
          const isDraggingThis = drag.entryId === entry.id;

          const teacherColor = TEACHER_COLORS[teachers.findIndex((t) => t.id === teacher.id) % TEACHER_COLORS.length];

          cellContent = (
            <div
              className={`schedule-card ${isDraggingThis ? 'dragging' : ''} ${hasConflict ? 'conflict-pulse' : ''}`}
              onMouseDown={(e) => handleDragStart(e, entry.id)}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setHoveredEntry({ entry, course, teacher, classroom, x: rect.right + 8, y: rect.top });
              }}
              onMouseLeave={() => setHoveredEntry(null)}
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                height: cellHeight * duration - 4,
                background: `linear-gradient(135deg, ${teacherColor}CC 0%, ${teacherColor}EE 100%)`,
                color: 'white',
                borderRadius: 6,
                padding: '4px 6px',
                fontSize: 11,
                lineHeight: 1.3,
                boxShadow: hasConflict ? '0 0 0 2px #F44336, 0 2px 8px rgba(244,67,54,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: isDraggingThis ? 100 : 1,
                border: hasConflict ? `2px solid ${conflicts.some((c) => c.type === 'teacher') ? '#F44336' : '#FF9800'}` : 'none',
              }}
            >
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</div>
              <div style={{ opacity: 0.95, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.name}</div>
              <div style={{ opacity: 0.85, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{classroom.name}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定删除 ${course.name} 吗？`)) handleDeleteEntry(entry.id);
                }}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: 10,
                  lineHeight: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                ×
              </button>
            </div>
          );
        }

        cells.push(
          <div
            key={`${day}-${slotIndex}`}
            className={dropClass}
            style={{
              flex: 1,
              minWidth: 80,
              position: 'relative',
              borderBottom: '1px solid #E3F2FD',
              borderRight: day < 4 ? '1px solid #E3F2FD' : 'none',
              borderLeft: 'none',
              borderTop: 'none',
              background: hasConflict ? (conflicts.some((c) => c.type === 'teacher' && c.existingEntry.day === day && c.existingEntry.startSlot <= slotIndex && slotIndex < c.existingEntry.startSlot + (getCourseById(c.existingEntry.courseId)?.duration ?? 1)) ? 'rgba(244,67,54,0.08)' : 'rgba(255,152,0,0.08)') : 'white',
              transition: 'all 0.2s ease',
            }}
          >
            {cellContent}
          </div>
        );
      }

      rows.push(
        <div key={slotIndex} style={{ display: 'flex', height: cellHeight }}>
          {cells}
        </div>
      );
    }

    return rows;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E3F2FD' }}>
      <div style={{ background: '#1565C0', color: 'white', padding: '16px 24px', boxShadow: '0 2px 12px rgba(21,101,192,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>智能排课与资源管理系统</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleAutoSchedule} disabled={autoScheduling} style={{ background: 'white', color: '#1565C0', fontWeight: 600 }}>
              {autoScheduling ? '排课中...' : '✨ 自动排课'}
            </button>
            <button className="btn-secondary" onClick={loadData} disabled={loading} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
              🔄 刷新
            </button>
          </div>
        </div>
      </div>

      {scheduleMessage && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: scheduleMessage.type === 'success' ? '#4CAF50' : scheduleMessage.type === 'error' ? '#F44336' : '#FF9800',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideDown 0.3s ease',
          }}
        >
          {scheduleMessage.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 360,
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: '1 1 320px',
          }}
        >
          <div className="panel-card" style={{ padding: 8, display: 'flex', gap: 4 }}>
            {(['teachers', 'courses', 'classrooms'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === tab ? '#1565C0' : 'transparent',
                  color: activeTab === tab ? 'white' : '#546E7A',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab === 'teachers' ? '👨‍🏫 教师' : tab === 'courses' ? '📚 课程' : '🏫 教室'}
              </button>
            ))}
          </div>

          <div className="panel-card" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 400px)', minHeight: 400 }}>
            {activeTab === 'teachers' && <TeacherManage teachers={teachers} courses={courses} onRefresh={loadData} />}
            {activeTab === 'courses' && <CourseManage courses={courses} teachers={teachers} onRefresh={loadData} />}
            {activeTab === 'classrooms' && <ClassroomManage classrooms={classrooms} schedule={schedule} courses={courses} teachers={teachers} onRefresh={loadData} />}
          </div>
        </div>

        <div style={{ flex: '2 1 600px', minWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E3F2FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1565C0', margin: 0 }}>📅 周课表</h2>
              <div style={{ fontSize: 12, color: '#78909C' }}>
                拖拽课程卡片调整时间 · 悬停查看详情
              </div>
            </div>

            <div id="schedule-grid" style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #1565C0' }}>
                <div style={{ width: 60, minWidth: 60, padding: '6px 8px', background: '#F8FAFD', fontWeight: 600, fontSize: 12, color: '#546E7A', borderRight: '1px solid #E3F2FD' }}></div>
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    style={{ flex: 1, minWidth: 80, padding: '6px 8px', textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#1565C0', borderRight: i < 4 ? '1px solid #E3F2FD' : 'none', background: '#F8FAFD' }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {renderGrid()}
            </div>

            {conflicts.length > 0 && (
              <div style={{ padding: 12, background: '#FFEBEE', borderTop: '1px solid #F44336' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#D32F2F', marginBottom: 4 }}>⚠️ 冲突检测结果</div>
                {conflicts.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#D32F2F', padding: '2px 0' }}>
                    • {c.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="panel-card" style={{ flex: '1 1 200px', minWidth: 200 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>📊 统计概览</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#546E7A' }}>总课时数</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#1565C0' }}>{totalHours.toFixed(1)} h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#546E7A' }}>已排课程</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#2E7D32' }}>{schedule.length} 节</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#546E7A' }}>教师人数</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#7B1FA2' }}>{teachers.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#546E7A' }}>教室数量</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#E65100' }}>{classrooms.length}</span>
                </div>
              </div>
            </div>

            <div className="panel-card" style={{ flex: '2 1 300px', minWidth: 300 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>🏢 教室使用率</h3>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classroomUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#546E7A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#546E7A' }} unit="%" />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '使用率']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="使用率" radius={[4, 4, 0, 0]}>
                      {classroomUsageData.map((entry, index) => (
                        <Cell key={index} fill={`url(#colorGradient_${index})`} />
                      ))}
                      <defs>
                        {classroomUsageData.map((entry, index) => (
                          <linearGradient key={index} id={`colorGradient_${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#42A5F5" stopOpacity={1} />
                            <stop offset="100%" stopColor="#1565C0" stopOpacity={0.8} />
                          </linearGradient>
                        ))}
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel-card" style={{ flex: '2 1 300px', minWidth: 300 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1565C0', marginBottom: 12 }}>👨‍🏫 教师排课均匀度</h3>
              {teacherLoadData.length > 0 ? (
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teacherLoadData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        labelLine={true}
                      >
                        {teacherLoadData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value} 节 (${props.payload.percentage}%)`,
                          '课时数',
                        ]}
                        labelFormatter={(label) => label}
                      />
                      <Legend formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#90A4AE', fontSize: 13 }}>
                  暂无排课数据，请先执行自动排课
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hoveredEntry && (
        <div
          className="panel-card"
          style={{
            position: 'fixed',
            left: Math.min(hoveredEntry.x, window.innerWidth - 280),
            top: Math.min(hoveredEntry.y, window.innerHeight - 160),
            width: 260,
            zIndex: 2000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #90CAF9',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, #1565C0, #42A5F5)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {hoveredEntry.teacher.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{hoveredEntry.course.name}</div>
              <div style={{ fontSize: 12, color: '#546E7A' }}>{hoveredEntry.course.grade}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #E3F2FD', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: '#546E7A' }}>
              👨‍🏫 教师：<span style={{ color: '#1565C0', fontWeight: 500 }}>{hoveredEntry.teacher.name}</span> ({hoveredEntry.teacher.subject}, {hoveredEntry.teacher.experience}年)
            </div>
            <div style={{ fontSize: 12, color: '#546E7A' }}>
              🏫 教室：<span style={{ color: '#2E7D32', fontWeight: 500 }}>{hoveredEntry.classroom.name}</span> ({hoveredEntry.classroom.type})
            </div>
            <div style={{ fontSize: 12, color: '#546E7A' }}>
              ⏰ 时间：<span style={{ fontWeight: 500 }}>{DAYS[hoveredEntry.entry.day]} {slotToTime(hoveredEntry.entry.startSlot)}-{slotToTime(hoveredEntry.entry.startSlot + hoveredEntry.course.duration)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#546E7A' }}>
              ⏱️ 时长：<span style={{ fontWeight: 500 }}>{hoveredEntry.course.duration * 0.5} 小时</span>
            </div>
          </div>
        </div>
      )}

      {drag.isDragging && drag.entryId && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x + 16,
            top: dragPosition.y + 16,
            pointerEvents: 'none',
            zIndex: 3000,
            opacity: 0.85,
          }}
        >
          {(() => {
            const entry = schedule.find((s) => s.id === drag.entryId);
            const course = entry ? getCourseById(entry.courseId) : null;
            const teacher = entry ? getTeacherById(entry.teacherId) : null;
            if (!entry || !course || !teacher) return null;
            const teacherColor = TEACHER_COLORS[teachers.findIndex((t) => t.id === teacher.id) % TEACHER_COLORS.length];
            return (
              <div
                style={{
                  background: `linear-gradient(135deg, ${teacherColor}CC 0%, ${teacherColor}EE 100%)`,
                  color: 'white',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  minWidth: 140,
                }}
              >
                <div style={{ fontWeight: 600 }}>{course.name}</div>
                <div style={{ opacity: 0.95 }}>{teacher.name}</div>
                {drag.currentDay >= 0 && drag.currentSlot >= 0 && (
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                    {DAYS[drag.currentDay]} {slotToTime(drag.currentSlot)}
                  </div>
                )}
                {drag.conflicts.length > 0 && (
                  <div style={{ fontSize: 11, background: 'rgba(244,67,54,0.9)', padding: '2px 6px', borderRadius: 4, marginTop: 4 }}>
                    ⚠️ {drag.conflicts[0].type === 'teacher' ? '教师冲突' : '教室冲突'}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
