import { useMemo } from 'react';
import { BarChart3, PieChart, Clock, CheckCircle, Clock8 } from 'lucide-react';
import PieChartComponent from './PieChart';
import BarChartComponent from './BarChart';
import { useTaskStore } from '@/modules/task/taskStore';
import { useUserStore } from '@/modules/user/userStore';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/utils/constants';
import { formatHours } from '@/utils/time';

export default function StatsDashboard() {
  const currentUser = useUserStore((state) => state.currentUser);
  const getTasksByUser = useTaskStore((state) => state.getTasksByUser);
  const getUserDailyHours = useTaskStore((state) => state.getUserDailyHours);

  const userTasks = useMemo(() => {
    if (!currentUser) return [];
    return getTasksByUser(currentUser.id);
  }, [currentUser, getTasksByUser]);

  const dailyHours = useMemo(() => {
    if (!currentUser) return [];
    return getUserDailyHours(currentUser.id);
  }, [currentUser, getUserDailyHours]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
    };

    for (const task of userTasks) {
      if (task.assigneeId === currentUser?.id) {
        counts[task.status] = (counts[task.status] || 0) + 1;
      }
    }

    return [
      {
        label: TASK_STATUS_LABELS.pending,
        value: counts.pending,
        color: TASK_STATUS_COLORS.pending,
      },
      {
        label: TASK_STATUS_LABELS.in_progress,
        value: counts.in_progress,
        color: TASK_STATUS_COLORS.in_progress,
      },
      {
        label: TASK_STATUS_LABELS.completed,
        value: counts.completed,
        color: TASK_STATUS_COLORS.completed,
      },
    ];
  }, [userTasks, currentUser]);

  const barData = useMemo(() => {
    return dailyHours.map((d) => ({
      label: d.date,
      value: d.hours,
    }));
  }, [dailyHours]);

  const totalHours = useMemo(() => {
    return dailyHours.reduce((sum, d) => sum + d.hours, 0);
  }, [dailyHours]);

  const assignedTasks = useMemo(() => {
    return userTasks.filter((t) => t.assigneeId === currentUser?.id);
  }, [userTasks, currentUser]);

  const completedTasks = useMemo(() => {
    return assignedTasks.filter((t) => t.status === 'completed');
  }, [assignedTasks]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">请先登录以查看个人统计</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <BarChart3 className="w-7 h-7 text-blue-500" />
        个人统计仪表盘
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">本周总工时</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatHours(totalHours)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock8 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-500 text-sm">进行中任务</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {assignedTasks.filter((t) => t.status === 'in_progress').length} 个
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">已完成任务</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{completedTasks.length} 个</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <PieChartComponent
            data={pieData}
            title="任务状态分布"
            width={280}
            height={280}
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
          <BarChartComponent
            data={barData}
            title="最近7天工时"
            width={420}
            height={280}
            yAxisLabel="小时"
          />
        </div>
      </div>
    </div>
  );
}
