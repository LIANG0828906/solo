import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTaskStore } from '@/store/taskStore';

interface StatsPanelProps {
  projectId: string;
}

export default function StatsPanel({ projectId }: StatsPanelProps) {
  const allTasks = useTaskStore((state) => state.tasks);
  const tasks = allTasks.filter((t) => t.projectId === projectId);
  const users = useTaskStore((state) => state.users);

  const data = users.map((user) => {
    const userTasks = tasks.filter((t) => t.assignee === user.id);
    return {
      name: user.name,
      todo: userTasks.filter((t) => t.status === 'todo').length,
      inProgress: userTasks.filter((t) => t.status === 'in-progress').length,
      done: userTasks.filter((t) => t.status === 'done').length,
    };
  });

  return (
    <div
      style={{
        height: '300px',
        background: '#F2F2F8',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <h3 className="text-base font-semibold text-gray-800 mb-4">任务统计</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="todo" name="待办" fill="#FF9800" radius={[4, 4, 0, 0]} />
          <Bar dataKey="inProgress" name="进行中" fill="#2196F3" radius={[4, 4, 0, 0]} />
          <Bar dataKey="done" name="已完成" fill="#4CAF50" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
