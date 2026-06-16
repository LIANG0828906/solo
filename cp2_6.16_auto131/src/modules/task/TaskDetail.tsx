import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Clock, Calendar, User, CheckCircle, Flag } from 'lucide-react';
import { useTaskStore } from './taskStore';
import { useUserStore } from '../user/userStore';
import { useTimerStore } from '../timer/timerStore';
import Timer from '../timer/Timer';
import TimeEntryList from './TimeEntryList';
import TaskForm from './TaskForm';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/utils/constants';
import { formatHours, isOverdue } from '@/utils/time';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getTaskById = useTaskStore((state) => state.getTaskById);
  const getTimeEntriesByTask = useTaskStore((state) => state.getTimeEntriesByTask);
  const completeTask = useTaskStore((state) => state.completeTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const currentUser = useUserStore((state) => state.currentUser);
  const lastToast = useTimerStore((state) => state.lastToast);
  const [editMode, setEditMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const task = useMemo(() => (id ? getTaskById(id) : undefined), [id, getTaskById]);
  const timeEntries = useMemo(
    () => (id ? getTimeEntriesByTask(id) : []),
    [id, getTimeEntriesByTask],
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [id]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">任务不存在或已被删除</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          返回任务列表
        </button>
      </div>
    );
  }

  const statusColor = TASK_STATUS_COLORS[task.status];
  const statusLabel = TASK_STATUS_LABELS[task.status];
  const overdue = task.status !== 'completed' && isOverdue(task.deadline);

  const canEdit =
    currentUser &&
    (task.creatorId === currentUser.id || task.assigneeId === currentUser.id);

  const isAssignee = currentUser?.id === task.assigneeId;

  const handleComplete = () => {
    if (task.id) {
      completeTask(task.id);
    }
  };

  const handleEdit = (data: {
    title: string;
    description: string;
    estimatedHours: number;
    deadline: string;
  }) => {
    updateTask(task.id, {
      description: data.description,
      deadline: data.deadline,
    });
    setEditMode(false);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回任务列表
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
                <span
                  className="text-sm px-3 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">{task.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">预计工时</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatHours(task.estimatedHours)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">已记录</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatHours(task.totalHours)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${overdue ? 'bg-red-50' : 'bg-orange-50'} flex items-center justify-center`}>
                <Calendar className={`w-5 h-5 ${overdue ? 'text-red-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">截止日期</p>
                <p className={`text-sm font-semibold ${overdue ? 'text-red-500' : 'text-gray-700'}`}>
                  {task.deadline}
                  {overdue && ' (逾期)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Flag className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">完成度</p>
                <p className="text-sm font-semibold text-gray-700">
                  {task.estimatedHours > 0
                    ? Math.min(100, Math.round((task.totalHours / task.estimatedHours) * 100))
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  发布人：<span className="font-medium">{task.creatorName}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  认领人：
                  <span className="font-medium">
                    {task.assigneeName || '暂无'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
              )}
              {isAssignee && task.status === 'in_progress' && (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成任务
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {isAssignee && task.status === 'in_progress' ? (
              task.id ? <Timer taskId={task.id} taskTitle={task.title} /> : null
            ) : (
              <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">
                  {task.status === 'completed'
                    ? '任务已完成'
                    : task.status === 'pending'
                    ? '请先认领任务'
                    : '仅任务认领者可记录工时'}
                </p>
              </div>
            )}
            {lastToast && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                {lastToast}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                工时记录
                <span className="text-sm font-normal text-gray-400">
                  ({timeEntries.length} 条记录)
                </span>
              </h3>
              <TimeEntryList entries={timeEntries} />
            </div>
          </div>
        </div>
      </div>

      <TaskForm
        isOpen={editMode}
        onClose={() => setEditMode(false)}
        onSubmit={handleEdit}
        initialData={{
          title: task.title,
          description: task.description,
          estimatedHours: task.estimatedHours,
          deadline: task.deadline,
        }}
        mode="edit"
        editFields="all"
      />
    </div>
  );
}
