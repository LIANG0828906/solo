import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export interface Member {
  id: string
  name: string
  avatar: string
  role: string
}

export interface Checkin {
  id: string
  userId: string
  taskId: string
  timestamp: string
  duration: number
}

export interface TaskItem {
  id: string
  title: string
  estimatedHours: number
}

interface MemberStatsProps {
  member: Member
  checkins: Checkin[]
  tasks: TaskItem[]
}

export default function MemberStats({ member, checkins, tasks }: MemberStatsProps) {
  const memberCheckins = checkins.filter((c) => c.userId === member.id)
  const memberTasks = tasks.filter((t) =>
    memberCheckins.some((c) => c.taskId === t.id)
  )

  const totalDays = new Set(
    memberCheckins.map((c) => new Date(c.timestamp).toDateString())
  ).size

  const totalHours = memberCheckins.reduce((sum, c) => sum + c.duration, 0)

  const chartData = [
    { name: '打卡天数', value: totalDays, unit: '天' },
    { name: '总时长', value: totalHours, unit: '小时' },
  ]

  const chartColors = ['#3B82F6', '#10B981']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-4 mb-6">
        <img
          src={member.avatar}
          alt={member.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
          <p className="text-sm text-gray-500">{member.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
          <p className="text-sm text-blue-600">累计打卡天数</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalHours}</p>
          <p className="text-sm text-green-600">总时长 (小时)</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={60}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number, _name: string, props: { payload: { unit: string } }) => [
                `${value} ${props.payload.unit}`,
                '',
              ]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {memberTasks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">参与任务</h4>
          <div className="space-y-2">
            {memberTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700 truncate flex-1">{task.title}</span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {task.estimatedHours}h
                </span>
              </div>
            ))}
            {memberTasks.length > 3 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                还有 {memberTasks.length - 3} 个任务
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
