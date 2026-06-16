import React, { useState, useMemo } from 'react';
import { Search, Clock, Star, Music, BookOpen, Plus, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/Card';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { formatDate, formatDuration, isSameDay } from '@/utils/dateUtils';
import type { Student, PracticeRecord } from '@/types';

const Students: React.FC = () => {
  const { students, practiceRecords, assignments, currentUser, addPracticeRecord } = useStore();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  const [practiceForm, setPracticeForm] = useState({
    duration: 30,
    rating: 3,
    notes: '',
  });

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.instrument.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const studentStats = useMemo(() => {
    const stats: Record<string, { totalPractice: number; avgRating: number; completedAssignments: number }> = {};

    students.forEach((student) => {
      const studentRecords = practiceRecords.filter((r) => r.studentId === student.id);
      const totalPractice = studentRecords.reduce((sum, r) => sum + r.duration, 0);
      const avgRating =
        studentRecords.length > 0
          ? studentRecords.reduce((sum, r) => sum + r.rating, 0) / studentRecords.length
          : 0;
      const completedAssignments = assignments.filter(
        (a) => a.studentId === student.id && a.status === 'approved'
      ).length;

      stats[student.id] = {
        totalPractice,
        avgRating,
        completedAssignments,
      };
    });

    return stats;
  }, [students, practiceRecords, assignments]);

  const studentPracticeRecords = useMemo(() => {
    if (!selectedStudent) return [];
    return practiceRecords
      .filter((r) => r.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudent, practiceRecords]);

  const studentAssignments = useMemo(() => {
    if (!selectedStudent) return [];
    return assignments.filter((a) => a.studentId === selectedStudent.id);
  }, [selectedStudent, assignments]);

  const handleAddPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || currentUser?.role !== 'student') return;

    await addPracticeRecord({
      studentId: currentUser.id,
      date: new Date().toISOString(),
      duration: practiceForm.duration,
      rating: practiceForm.rating,
      notes: practiceForm.notes,
    });

    setShowPracticeModal(false);
    setPracticeForm({ duration: 30, rating: 3, notes: '' });
  };

  const isStudentView = currentUser?.role === 'student';
  const currentStudentStudent = isStudentView
    ? students.find((s) => s.id === currentUser.id)
    : null;

  const activeStudent = isStudentView ? currentStudentStudent : selectedStudent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isStudentView ? '我的练习' : '学生管理'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isStudentView ? '记录你的练习进度' : '查看和管理所有学生信息'}
          </p>
        </div>
        {isStudentView && (
          <Button onClick={() => setShowPracticeModal(true)}>
            <Plus size={18} />
            记录练习
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isStudentView && (
          <Card className="p-5">
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="搜索学生..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-color bg-bg-primary/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredStudents.map((student) => {
                const stats = studentStats[student.id];
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-fast ${
                      isSelected
                        ? 'bg-accent-light/50 border-2 border-accent'
                        : 'hover:bg-bg-hover border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary truncate">
                          {student.name}
                        </h4>
                        <p className="text-sm text-text-muted flex items-center gap-1">
                          <Music size={12} />
                          {student.instrument} · {student.level}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        <Clock size={12} className="inline mr-1" />
                        {formatDuration(stats?.totalPractice || 0)}
                      </span>
                      <span className="text-text-muted flex items-center gap-1">
                        <Star size={12} className="text-warning fill-warning" />
                        {stats?.avgRating.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className={`p-6 ${isStudentView ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          {activeStudent ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-start gap-4 pb-6 border-b border-border-color">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {activeStudent.name}
                  </h2>
                  <p className="text-text-secondary mt-1 flex items-center gap-2">
                    <Music size={16} />
                    {activeStudent.instrument}
                  </p>
                  <div className="mt-3 flex gap-4">
                    <div className="px-3 py-1.5 bg-accent-light/50 rounded-lg">
                      <span className="text-sm text-accent font-medium">
                        {activeStudent.level}
                      </span>
                    </div>
                    <div className="text-sm text-text-muted">
                      加入于 {formatDate(activeStudent.joinDate, 'YYYY年MM月')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-bg-primary rounded-xl text-center">
                  <div className="text-2xl font-bold text-accent">
                    {studentStats[activeStudent.id]?.totalPractice
                      ? Math.floor(studentStats[activeStudent.id].totalPractice / 60)
                      : 0}
                    <span className="text-sm font-normal text-text-muted ml-1">小时</span>
                  </div>
                  <div className="text-sm text-text-muted mt-1">累计练习</div>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl text-center">
                  <div className="text-2xl font-bold text-success">
                    {studentStats[activeStudent.id]?.avgRating.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-text-muted mt-1">平均评分</div>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {studentPracticeRecords.length}
                    <span className="text-sm font-normal text-text-muted ml-1">次</span>
                  </div>
                  <div className="text-sm text-text-muted mt-1">练习记录</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <BookOpen size={18} />
                  练习记录时间轴
                </h3>
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border-color" />
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {studentPracticeRecords.length > 0 ? (
                      studentPracticeRecords.slice(0, 10).map((record, index) => (
                        <PracticeRecordItem
                          key={record.id}
                          record={record}
                          isLast={index === studentPracticeRecords.length - 1}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-text-muted">
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <p>暂无练习记录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <BookOpen size={18} />
                  作业状态
                </h3>
                <div className="space-y-3">
                  {studentAssignments.length > 0 ? (
                    studentAssignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 rounded-xl bg-bg-primary flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-primary truncate">
                            {assignment.title}
                          </h4>
                          <p className="text-xs text-text-muted mt-1">
                            截止：{formatDate(assignment.dueDate, 'MM月DD日')}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            assignment.status === 'approved'
                              ? 'bg-success/10 text-success'
                              : assignment.status === 'submitted'
                              ? 'bg-warning/10 text-warning'
                              : assignment.status === 'rejected'
                              ? 'bg-error/10 text-error'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {assignment.status === 'approved'
                            ? '已通过'
                            : assignment.status === 'submitted'
                            ? '待审核'
                            : assignment.status === 'rejected'
                            ? '已打回'
                            : '待完成'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-text-muted">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                      <p>暂无作业</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-text-muted">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">选择一位学生查看详情</p>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        title="记录练习"
        size="md"
      >
        <form onSubmit={handleAddPractice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Clock size={14} className="inline mr-1" />
              练习时长（分钟）
            </label>
            <input
              type="number"
              value={practiceForm.duration}
              onChange={(e) =>
                setPracticeForm({ ...practiceForm, duration: Number(e.target.value) })
              }
              min={5}
              max={480}
              step={5}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              自评星级
            </label>
            <StarRating
              rating={practiceForm.rating}
              size={28}
              interactive
              onChange={(rating) =>
                setPracticeForm({ ...practiceForm, rating })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              练习笔记
            </label>
            <textarea
              value={practiceForm.notes}
              onChange={(e) =>
                setPracticeForm({ ...practiceForm, notes: e.target.value })
              }
              placeholder="记录今天的练习感受..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPracticeModal(false)}
            >
              取消
            </Button>
            <Button type="submit">保存记录</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const PracticeRecordItem: React.FC<{ record: PracticeRecord; isLast: boolean }> = ({
  record,
  isLast,
}) => {
  return (
    <div className="relative pl-10 pb-4 last:pb-0">
      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-accent border-2 border-white shadow-sm z-10" />
      <div className="p-4 rounded-xl bg-bg-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {formatDate(record.date, 'MM月DD日')}
          </span>
          <span className="text-sm text-accent font-medium">
            {formatDuration(record.duration)}
          </span>
        </div>
        <StarRating rating={record.rating} size={14} />
        {record.notes && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-2">
            {record.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default Students;
