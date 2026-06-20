import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, Music, AlertTriangle, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Calendar } from '@/components/Calendar';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { Course } from '@/types';
import { formatDate, formatTime, formatDateTime } from '@/utils/dateUtils';

const Schedule: React.FC = () => {
  const {
    courses,
    students,
    currentUser,
    addCourse,
    updateCourse,
    deleteCourse,
    checkCourseConflict,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    startTime: '',
    duration: 60,
    instrument: '',
    notes: '',
  });

  useEffect(() => {
    performance.mark('calendar-render-start');
    return () => {
      performance.mark('calendar-render-end');
      performance.measure('calendar-render', 'calendar-render-start', 'calendar-render-end');
    };
  }, []);

  const handleDateClick = (date: Date) => {
    if (currentUser?.role !== 'teacher') return;

    const defaultTime = new Date(date);
    defaultTime.setHours(10, 0, 0, 0);

    setSelectedDate(date);
    setEditingCourse(null);
    setFormData({
      studentId: students[0]?.id || '',
      startTime: formatDate(defaultTime, 'YYYY-MM-DDTHH:mm'),
      duration: 60,
      instrument: '',
      notes: '',
    });
    setShowConflictAlert(false);
    setConflictInfo(null);
    setIsModalOpen(true);
  };

  const handleCourseClick = (course: Course) => {
    if (currentUser?.role !== 'teacher') return;

    setEditingCourse(course);
    setSelectedDate(new Date(course.startTime));
    setFormData({
      studentId: course.studentId,
      startTime: formatDate(new Date(course.startTime), 'YYYY-MM-DDTHH:mm'),
      duration: course.duration,
      instrument: course.instrument,
      notes: course.notes || '',
    });
    setShowConflictAlert(false);
    setConflictInfo(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = new Date(formData.startTime).toISOString();
    const conflictResult = checkCourseConflict(
      startTime,
      formData.duration,
      editingCourse?.id
    );

    if (conflictResult.hasConflict && conflictResult.conflictingCourse) {
      setShowConflictAlert(true);
      setConflictInfo(conflictResult.conflictingCourse);
      return;
    }

    const student = students.find((s) => s.id === formData.studentId);

    if (editingCourse) {
      await updateCourse(editingCourse.id, {
        studentId: formData.studentId,
        startTime,
        duration: formData.duration,
        instrument: formData.instrument || student?.instrument || '',
        notes: formData.notes,
      });
    } else {
      await addCourse({
        studentId: formData.studentId,
        teacherId: currentUser?.id || '',
        startTime,
        duration: formData.duration,
        instrument: formData.instrument || student?.instrument || '',
        status: 'scheduled',
        notes: formData.notes,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingCourse) {
      await deleteCourse(editingCourse.id);
      setIsModalOpen(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setFormData((prev) => ({
      ...prev,
      studentId,
      instrument: student?.instrument || '',
    }));
  };

  const getConflictStudentName = () => {
    if (!conflictInfo) return '';
    const student = students.find((s) => s.id === conflictInfo.studentId);
    return student?.name || '';
  };

  const todayCourses = courses
    .filter((c) => {
      const today = new Date();
      const courseDate = new Date(c.startTime);
      return (
        courseDate.getDate() === today.getDate() &&
        courseDate.getMonth() === today.getMonth() &&
        courseDate.getFullYear() === today.getFullYear()
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">课程排期</h1>
          <p className="text-text-secondary mt-1">管理您的课程安排</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Calendar
            courses={courses}
            onDateClick={handleDateClick}
            onCourseClick={handleCourseClick}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <CalendarIcon size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">今日课程</h3>
                <p className="text-xs text-text-muted">
                  {formatDate(new Date(), 'MM月DD日')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {todayCourses.length > 0 ? (
                todayCourses.map((course) => {
                  const student = students.find((s) => s.id === course.studentId);
                  return (
                    <div
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className="p-3 rounded-xl bg-bg-hover cursor-pointer hover:shadow-md transition-all duration-fast"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-accent font-medium">
                          {formatTime(course.startTime)}
                        </span>
                        <span className="text-xs text-text-muted">
                          {course.duration}分钟
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={student?.avatar}
                          alt={student?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-text-primary">
                          {student?.name}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {course.instrument}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-text-muted">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">今天没有课程</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-4">课程状态</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent"></span>
                  <span className="text-sm text-text-secondary">待上课</span>
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {courses.filter((c) => c.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success"></span>
                  <span className="text-sm text-text-secondary">已完成</span>
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {courses.filter((c) => c.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                  <span className="text-sm text-text-secondary">已取消</span>
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {courses.filter((c) => c.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? '编辑课程' : '新建课程'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {showConflictAlert && conflictInfo && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-error">课程时间冲突</p>
                <p className="text-sm text-text-secondary mt-1">
                  该时段已有课程安排：{getConflictStudentName()} 的
                  {conflictInfo.instrument}课
                  <br />
                  时间：{formatDateTime(conflictInfo.startTime)}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <User size={14} className="inline mr-1" />
              学生
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.instrument}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Clock size={14} className="inline mr-1" />
              开始时间
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Clock size={14} className="inline mr-1" />
              课程时长
            </label>
            <select
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
            >
              <option value={30}>30 分钟</option>
              <option value={45}>45 分钟</option>
              <option value={50}>50 分钟</option>
              <option value={60}>60 分钟</option>
              <option value={90}>90 分钟</option>
              <option value={120}>120 分钟</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Music size={14} className="inline mr-1" />
              乐器
            </label>
            <input
              type="text"
              value={formData.instrument}
              onChange={(e) =>
                setFormData({ ...formData, instrument: e.target.value })
              }
              placeholder="请输入乐器类型"
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="课程备注..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            {editingCourse ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-error hover:text-error hover:bg-error/10"
              >
                <Trash2 size={16} />
                删除课程
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {editingCourse ? '保存修改' : '创建课程'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;
