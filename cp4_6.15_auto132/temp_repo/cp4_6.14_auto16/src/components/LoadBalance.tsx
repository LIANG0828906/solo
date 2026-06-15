import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import type { LoadData, Task, TeamMember } from '@/utils/types';
import { OVERLOAD_THRESHOLD } from '@/utils/loadBalancer';
import { suggestAssignments, rebalanceTasks } from '@/utils/loadBalancer';

interface LoadBalanceProps {
  loadData: LoadData[];
  members: TeamMember[];
  tasks: Task[];
  averageLoad: number;
  onReassignTask: (taskId: string, newAssigneeId: string) => void;
  onApplySuggestion: (taskId: string, newAssigneeId: string) => void;
}

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export function LoadBalance({
  loadData,
  members,
  tasks,
  averageLoad,
  onReassignTask,
  onApplySuggestion,
}: LoadBalanceProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const chartData = loadData.map((item) => ({
    name: item.member.name,
    memberId: item.memberId,
    taskCount: item.taskCount,
    totalHours: item.totalHours,
    loadPercentage: item.loadPercentage,
    color: item.member.color,
    isOverloaded: item.loadPercentage > OVERLOAD_THRESHOLD,
  }));

  const suggestions = suggestAssignments(members, tasks);
  const rebalancePlan = rebalanceTasks(members, tasks);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setHoveredMemberId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, memberId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (hoveredMemberId !== memberId) {
        setHoveredMemberId(memberId);
      }
    },
    [hoveredMemberId]
  );

  const handleDragLeave = useCallback(() => {
    setHoveredMemberId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, memberId: string) => {
      e.preventDefault();
      if (draggedTask) {
        onReassignTask(draggedTask.id, memberId);
      }
      setDraggedTask(null);
      setHoveredMemberId(null);
    },
    [draggedTask, onReassignTask]
  );

  const handleApplyRebalance = useCallback(() => {
    rebalancePlan.forEach(({ taskId, newAssigneeId }) => {
      onApplySuggestion(taskId, newAssigneeId);
    });
  }, [rebalancePlan, onApplySuggestion]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="font-medium text-gray-800">{data.name}</p>
          <p className="text-gray-600">
            负载: <span className="font-semibold">{data.loadPercentage}%</span>
          </p>
          <p className="text-gray-600">任务数: {data.taskCount} 个</p>
          <p className="text-gray-600">总工时: {data.totalHours}h</p>
        </div>
      );
    }
    return null;
  };

  const getStatusIcon = (load: number) => {
    if (load > OVERLOAD_THRESHOLD) {
      return <AlertTriangle size={14} className="text-red-500" />;
    }
    return <TrendingUp size={14} className="text-emerald-500" />;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            团队负载均衡
          </h3>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`
              text-xs px-2 py-1 rounded-full transition-colors
              ${
                showSuggestions
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {showSuggestions ? '隐藏建议' : '显示建议'}
          </button>
        </div>

        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={OVERLOAD_THRESHOLD}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: '过载线',
                  position: 'top',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
              <Bar
                dataKey="loadPercentage"
                radius={[0, 4, 4, 0]}
                animationDuration={500}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOverloaded ? '#ef4444' : entry.color}
                    fillOpacity={entry.isOverloaded ? 0.9 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
          <span className="text-xs text-gray-600">平均负载</span>
          <span
            className={`text-lg font-bold ${
              averageLoad > 80
                ? 'text-red-600'
                : averageLoad > 60
                ? 'text-emerald-600'
                : 'text-amber-600'
            }`}
          >
            {averageLoad}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <p className="text-emerald-600 font-semibold text-sm">
              {loadData.filter((l) => l.loadPercentage <= 50).length}
            </p>
            <p className="text-emerald-700">负载偏低</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-blue-600 font-semibold text-sm">
              {loadData.filter(
                (l) => l.loadPercentage > 50 && l.loadPercentage <= 80
              ).length}
            </p>
            <p className="text-blue-700">负载正常</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-red-600 font-semibold text-sm">
              {loadData.filter((l) => l.loadPercentage > 80).length}
            </p>
            <p className="text-red-700">过载</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            拖拽任务到成员头像重新分配
          </h4>
          <div className="space-y-2">
            {loadData.map((item) => {
              const memberTasks = tasks.filter(
                (t) =>
                  t.assigneeId === item.memberId &&
                  t.status !== 'done' &&
                  (t.priority === 'low' || t.priority === 'medium')
              );

              return (
                <div
                  key={item.memberId}
                  className={`
                    p-3 rounded-xl border-2 transition-all duration-200
                    ${
                      hoveredMemberId === item.memberId
                        ? 'border-indigo-400 bg-indigo-50 scale-102'
                        : 'border-gray-100 bg-white'
                    }
                    ${
                      item.loadPercentage > 80
                        ? 'border-red-200 bg-red-50/30'
                        : ''
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, item.memberId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.memberId)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white relative"
                      style={{ backgroundColor: item.member.color }}
                    >
                      {item.member.avatar}
                      {hoveredMemberId === item.memberId && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 rounded-full border-2 border-indigo-400"
                          style={{ animation: 'pulse 1s infinite' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {item.member.name}
                        </span>
                        {getStatusIcon(item.loadPercentage)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{item.taskCount}个任务</span>
                        <span>{item.totalHours}h</span>
                        <span
                          className={`font-semibold ${
                            item.loadPercentage > 80
                              ? 'text-red-500'
                              : 'text-gray-600'
                          }`}
                        >
                          {item.loadPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {memberTasks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memberTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={`
                            px-2 py-1 rounded text-[10px] cursor-grab active:cursor-grabbing
                            transition-all duration-200 hover:scale-105
                            ${
                              draggedTask?.id === task.id
                                ? 'opacity-50 scale-95'
                                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                            }
                          `}
                        >
                          {task.title.length > 8
                            ? task.title.slice(0, 8) + '...'
                            : task.title}
                        </div>
                      ))}
                      {memberTasks.length > 3 && (
                        <span className="px-2 py-1 text-[10px] text-gray-400">
                          +{memberTasks.length - 3} 更多
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.loadPercentage, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{
                        backgroundColor:
                          item.loadPercentage > 80 ? '#ef4444' : item.member.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <RefreshCw size={12} className="text-indigo-500" />
                智能分配建议
              </h4>
              {rebalancePlan.length > 0 && (
                <button
                  onClick={handleApplyRebalance}
                  className="text-[10px] px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={10} />
                  一键均衡
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {suggestions.slice(0, 5).map((suggestion, index) => {
                const fromMember = members.find(
                  (m) => m.id === suggestion.fromMemberId
                );
                const toMember = members.find(
                  (m) => m.id === suggestion.toMemberId
                );
                return (
                  <motion.div
                    key={suggestion.taskId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, ...springConfig }}
                    className="p-2 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <div className="flex items-center gap-1 text-[11px] text-gray-700 mb-1">
                      <span className="font-medium text-amber-700 truncate">
                        {suggestion.taskTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1.5">
                      {fromMember && (
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${fromMember.color}22`,
                            color: fromMember.color,
                          }}
                        >
                          {fromMember.name}
                        </span>
                      )}
                      {!fromMember && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                          未分配
                        </span>
                      )}
                      <ArrowRight size={10} className="text-gray-400" />
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${toMember?.color}22`,
                          color: toMember?.color,
                        }}
                      >
                        {toMember?.name}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 line-clamp-2 mb-1">
                      {suggestion.reason}
                    </p>
                    <button
                      onClick={() =>
                        onApplySuggestion(
                          suggestion.taskId,
                          suggestion.toMemberId
                        )
                      }
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      应用建议
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadBalance;
