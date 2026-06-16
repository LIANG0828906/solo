import React, { useState, useMemo } from 'react';
import { Plus, BookOpen, Clock, CheckCircle, XCircle, Clock3, Filter, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import type { Assignment, AssignmentStatus } from '@/types';
import { formatDate } from '@/utils/dateUtils';

type FilterType = 'all' | AssignmentStatus;

const Assignments: React.FC = () => {
  const {
    assignments,
    students,
    currentUser,
    addAssignment,
    submitAssignment,
    reviewAssignment,
  } = useStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const [createForm, setCreateForm] = useState({
    studentId: '',
    title: '',
    description: '',
    dueDate: '',
    attachmentUrl: '',
  });

  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    feedback: '',
  });

  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    if (currentUser?.role === 'student') {
      result = result.filter((a) => a.studentId === currentUser.id);
    }

    if (filter !== 'all') {
      result = result.filter((a) => a.status === filter);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [assignments, filter, currentUser]);

  const stats = useMemo(() => {
    const userAssignments =
      currentUser?.role === 'student'
        ? assignments.filter((a) => a.studentId === currentUser.id)
        : assignments;

    return {
      total: userAssignments.length,
      pending: userAssignments.filter((a) => a.status === 'pending').length,
      submitted: userAssignments.filter((a) => a.status === 'submitted').length,
      approved: userAssignments.filter((a) => a.status === 'approved').length,
      rejected: userAssignments.filter((a) => a.status === 'rejected').length,
    };
  }, [assignments, currentUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'teacher') return;

    await addAssignment({
      studentId: createForm.studentId,
      teacherId: currentUser.id,
      title: createForm.title,
      description: createForm.description,
      dueDate: new Date(createForm.dueDate).toISOString(),
      attachmentUrl: createForm.attachmentUrl || undefined,
    });

    setShowCreateModal(false);
    setCreateForm({
      studentId: '',
      title: '',
      description: '',
      dueDate: '',
      attachmentUrl: '',
    });
  };

  const handleSubmit = async (assignmentId: string) => {
    await submitAssignment(assignmentId);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    await reviewAssignment(selectedAssignment.id, reviewForm.status, reviewForm.feedback);
    setShowReviewModal(false);
    setSelectedAssignment(null);
    setReviewForm({ status: 'approved', feedback: '' });
  };

  const openReviewModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setReviewForm({ status: 'approved', feedback: '' });
    setShowReviewModal(true);
  };

  const getStatusInfo = (status: AssignmentStatus) => {
    const statusMap: Record<AssignmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: '待完成',
        className: 'bg-gray-100 text-gray-500',
        icon: <Clock3 size={14} />,
      },
      submitted: {
        label: '待审核',
        className: 'bg-warning/10 text-warning',
        icon: <Clock size={14} />,
      },
      approved: {
        label: '已通过',
        className: 'bg-success/10 text-success',
        icon: <CheckCircle size={14} />,
      },
      rejected: {
        label: '已打回',
        className: 'bg-error/10 text-error',
        icon: <XCircle size={14} />,
      },
    };
    return statusMap[status];
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待完成' },
    { value: 'submitted', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已打回' },
  ];

  const getStudentById = (id: string) => students.find((s) => s.id === id);

  const isTeacher = currentUser?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">作业中心</h1>
          <p className="text-text-secondary mt-1">
            {isTeacher ? '管理和批改学生作业' : '查看和提交你的作业'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            布置作业
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总作业数', value: stats.total, color: 'text-text-primary', bg: 'bg-bg-primary' },
          { label: '待完成', value: stats.pending, color: 'text-gray-500', bg: 'bg-gray-50' },
          { label: '待审核', value: stats.submitted, color: 'text-warning', bg: 'bg-warning/10' },
          { label: '已通过', value: stats.approved, color: 'text-success', bg: 'bg-success/10' },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-sm text-text-muted mt-1">{item.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-muted" />
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-fast ${
                    filter === option.value
                      ? 'bg-accent text-white'
                      : 'bg-bg-primary text-text-secondary hover:bg-accent-light hover:text-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment.status);
            const student = getStudentById(assignment.studentId);
            const isOverdue =
              assignment.status === 'pending' &&
              new Date(assignment.dueDate) < new Date();

            return (
              <Card
                key={assignment.id}
                className="p-5 hover:shadow-card-hover transition-all duration-fast"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-text-primary text-lg">
                        {assignment.title}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${statusInfo.className}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-error/10 text-error">
                          已逾期
                        </span>
                      )}
                    </div>

                    {isTeacher && student && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{student.name}</span>
                        <span className="text-text-muted">·</span>
                        <span>{student.instrument}</span>
                      </div>
                    )}

                    <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        截止：{formatDate(assignment.dueDate, 'YYYY年MM月DD日')}
                      </span>
                      {assignment.attachmentUrl && (
                        <span className="flex items-center gap-1.5 text-accent">
                          <BookOpen size={14} />
                          有附件
                        </span>
                      )}
                    </div>

                    {assignment.feedback && (
                      <div className="mt-4 p-3 rounded-xl bg-bg-primary">
                        <div className="text-xs text-text-muted mb-1">教师评语</div>
                        <p className="text-sm text-text-secondary">{assignment.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!isTeacher && assignment.status === 'pending' && (
                      <Button size="sm" onClick={() => handleSubmit(assignment.id)}>
                        提交作业
                      </Button>
                    )}
                    {isTeacher && assignment.status === 'submitted' && (
                      <Button size="sm" onClick={() => openReviewModal(assignment)}>
                        审核
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted">暂无作业</p>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="布置作业"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <User size={14} className="inline mr-1" />
              学生
            </label>
            <select
              value={createForm.studentId}
              onChange={(e) => setCreateForm({ ...createForm, studentId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            >
              <option value="">选择学生</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.instrument}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              作业标题
            </label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="请输入作业标题"
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              作业描述
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              placeholder="请输入作业要求和描述..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Clock size={14} className="inline mr-1" />
              截止日期
            </label>
            <input
              type="date"
              value={createForm.dueDate}
              onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              附件链接（可选）
            </label>
            <input
              type="url"
              value={createForm.attachmentUrl}
              onChange={(e) =>
                setCreateForm({ ...createForm, attachmentUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit">布置作业</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="审核作业"
        size="md"
      >
        {selectedAssignment && (
          <form onSubmit={handleReview} className="space-y-4">
            <div className="p-4 bg-bg-primary rounded-xl">
              <h4 className="font-medium text-text-primary mb-2">
                {selectedAssignment.title}
              </h4>
              <p className="text-sm text-text-secondary">
                学生：{getStudentById(selectedAssignment.studentId)?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                审核结果
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all duration-fast flex items-center justify-center gap-2 ${
                    reviewForm.status === 'approved'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border-color text-text-secondary hover:border-success/50'
                  }`}
                >
                  <CheckCircle size={18} />
                  通过
                </button>
                <button
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all duration-fast flex items-center justify-center gap-2 ${
                    reviewForm.status === 'rejected'
                      ? 'border-error bg-error/10 text-error'
                      : 'border-border-color text-text-secondary hover:border-error/50'
                  }`}
                >
                  <XCircle size={18} />
                  打回
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                评语
              </label>
              <textarea
                value={reviewForm.feedback}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, feedback: e.target.value })
                }
                placeholder="请输入评语..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-border-color bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-fast resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {reviewForm.status === 'approved' ? '通过作业' : '打回作业'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Assignments;
