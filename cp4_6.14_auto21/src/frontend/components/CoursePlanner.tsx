import { useState, useEffect, useRef } from 'react';
import { courseApi, instructorApi } from '../api';
import { Course, Instructor, CreateCourseRequest } from '../types';
import Modal from './Modal';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function CoursePlanner() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [currentWeek, setCurrentWeek] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const [dragInfo, setDragInfo] = useState<{
    courseId: string;
    startY: number;
    originalTop: number;
  } | null>(null);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    instructorId: '',
    startTime: '',
    duration: 1,
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([courseApi.getSchedule(), instructorApi.getInstructors()])
      .then(([schedule, insts]) => {
        setCourses(schedule);
        setInstructors(insts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getCoursePosition = (course: Course, dayDate: Date) => {
    const courseDate = new Date(course.startTime);
    if (
      courseDate.getDate() !== dayDate.getDate() ||
      courseDate.getMonth() !== dayDate.getMonth() ||
      courseDate.getFullYear() !== dayDate.getFullYear()
    ) {
      return null;
    }

    const startHour = courseDate.getHours() + courseDate.getMinutes() / 60;
    const top = (startHour - 8) * 60;
    const height = course.duration * 60;

    return { top: `${top}px`, height: `${height}px` };
  };

  const prevWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const nextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(getMonday(new Date()));
  };

  const handleSlotClick = (day: Date, hour: number) => {
    const newDate = new Date(day);
    newDate.setHours(hour, 0, 0, 0);
    setNewCourseData({
      title: '',
      description: '',
      instructorId: instructors[0]?.id || '',
      startTime: newDate.toISOString(),
      duration: 1,
    });
    setConflictError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateCourse = async () => {
    setConflictError('');
    const request: CreateCourseRequest = {
      title: newCourseData.title || '新课程',
      description: newCourseData.description,
      instructorId: newCourseData.instructorId,
      startTime: newCourseData.startTime,
      duration: newCourseData.duration,
    };

    try {
      const result = await courseApi.createCourse(request);
      if (result.success && result.course) {
        const instructor = instructors.find((i) => i.id === result.course!.instructorId);
        setCourses([...courses, { ...result.course, instructor }]);
        setIsCreateModalOpen(false);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setConflictError(error.response?.data?.message || '创建课程失败');
    }
  };

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement>,
    course: Course
  ) => {
    e.preventDefault();
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    setDragInfo({
      courseId: course.id,
      startY: e.clientY,
      originalTop: rect.top,
    });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!dragInfo || !calendarRef.current) return;

    const course = courses.find((c) => c.id === dragInfo.courseId);
    if (!course) return;

    const deltaY = e.clientY - dragInfo.startY;
    const newTop = dragInfo.originalTop + deltaY;

    const cardEl = document.querySelector(
      `[data-course-id="${dragInfo.courseId}"]`
    ) as HTMLElement;
    if (cardEl) {
      cardEl.style.position = 'fixed';
      cardEl.style.top = `${newTop}px`;
      cardEl.style.left = `${e.clientX - 50}px`;
      cardEl.classList.add('dragging');
    }
  };

  const handleDragEnd = async (e: React.MouseEvent) => {
    if (!dragInfo) return;

    const course = courses.find((c) => c.id === dragInfo.courseId);
    if (!course) {
      setDragInfo(null);
      return;
    }

    const cardEl = document.querySelector(
      `[data-course-id="${dragInfo.courseId}"]`
    ) as HTMLElement;
    if (cardEl) {
      cardEl.style.position = '';
      cardEl.style.top = '';
      cardEl.style.left = '';
      cardEl.classList.remove('dragging');
    }

    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (calendarRect) {
      const colWidth = (calendarRect.width - 60) / 7;
      const dayIndex = Math.floor((e.clientX - calendarRect.left - 60) / colWidth);
      if (dayIndex >= 0 && dayIndex < 7) {
        const newDay = new Date(currentWeek);
        newDay.setDate(newDay.getDate() + dayIndex);

        const topOffset = e.clientY - calendarRect.top - 40;
        const newHour = Math.max(8, Math.min(17, Math.floor(topOffset / 60) + 8));

        const newStartTime = new Date(newDay);
        newStartTime.setHours(newHour, 0, 0, 0);

        try {
          const result = await courseApi.updateCourse(course.id, {
            startTime: newStartTime.toISOString(),
          });
          if (result.success && result.course) {
            setCourses(
              courses.map((c) =>
                c.id === course.id ? { ...result.course!, instructor: course.instructor } : c
              )
            );
          }
        } catch {
          // 静默失败
        }
      }
    }

    setDragInfo(null);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">课程编排</h1>
          <p className="page-description">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div onMouseMove={handleDragMove} onMouseUp={handleDragEnd}>
      <div className="page-header">
        <h1 className="page-title">课程编排</h1>
        <p className="page-description">拖拽创建和调整课程安排</p>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevWeek}>
            ‹
          </button>
          <span className="calendar-week-text">
            {currentWeek.getFullYear()}年{currentWeek.getMonth() + 1}月{currentWeek.getDate()}日 -{' '}
            {weekDays[6].getMonth() + 1}月{weekDays[6].getDate()}日
          </span>
          <button className="calendar-nav-btn" onClick={nextWeek}>
            ›
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={goToToday}>
            今天
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSlotClick(weekDays[0], 9)}
          >
            + 新建课程
          </button>
        </div>
      </div>

      <div className="calendar-week-view" ref={calendarRef}>
        <div className="calendar-time-header" />
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day-header ${isToday(day) ? 'today' : ''}`}
          >
            <div className="day-name">{DAY_NAMES[idx]}</div>
            <div className="day-date">{day.getDate()}</div>
          </div>
        ))}

        <div className="calendar-time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="calendar-time-slot">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {weekDays.map((day, dayIdx) => (
          <div key={dayIdx} className="calendar-day-column">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="calendar-day-slot"
                onClick={() => handleSlotClick(day, hour)}
              />
            ))}
            {courses.map((course) => {
              const position = getCoursePosition(course, day);
              if (!position) return null;
              return (
                <div
                  key={course.id}
                  data-course-id={course.id}
                  className="course-calendar-card"
                  style={position}
                  onMouseDown={(e) => handleDragStart(e, course)}
                >
                  <div className="course-calendar-card-title">{course.title}</div>
                  <div className="course-calendar-card-instructor">
                    {course.instructor && (
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="instructor-avatar-small"
                      />
                    )}
                    <span>{course.instructor?.name}</span>
                  </div>
                  <div className="course-calendar-card-time">
                    {formatTime(course.startTime)} - {formatTime(course.endTime)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建新课程"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              取消
            </button>
            <button className="btn btn-primary" onClick={handleCreateCourse}>
              创建
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">课程名称</label>
          <input
            type="text"
            className="form-input"
            value={newCourseData.title}
            onChange={(e) =>
              setNewCourseData({ ...newCourseData, title: e.target.value })
            }
            placeholder="请输入课程名称"
          />
        </div>

        <div className="form-group">
          <label className="form-label">课程描述</label>
          <textarea
            className="form-textarea"
            value={newCourseData.description}
            onChange={(e) =>
              setNewCourseData({ ...newCourseData, description: e.target.value })
            }
            placeholder="请输入课程描述"
          />
        </div>

        <div className="form-group">
          <label className="form-label">讲师</label>
          <select
            className="form-select"
            value={newCourseData.instructorId}
            onChange={(e) =>
              setNewCourseData({ ...newCourseData, instructorId: e.target.value })
            }
          >
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} - {inst.department}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">开始时间</label>
          <input
            type="datetime-local"
            className="form-input"
            value={newCourseData.startTime.slice(0, 16)}
            onChange={(e) =>
              setNewCourseData({
                ...newCourseData,
                startTime: new Date(e.target.value).toISOString(),
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">课程时长：{newCourseData.duration} 小时</label>
          <input
            type="range"
            min={1}
            max={4}
            value={newCourseData.duration}
            onChange={(e) =>
              setNewCourseData({
                ...newCourseData,
                duration: parseInt(e.target.value),
              })
            }
          />
        </div>

        {conflictError && <div className="form-error">⚠️ {conflictError}</div>}
      </Modal>
    </div>
  );
}

export default CoursePlanner;
