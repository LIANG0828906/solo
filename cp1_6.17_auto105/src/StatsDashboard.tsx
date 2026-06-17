import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAppStore } from './store'
import { FileText, PlusCircle, MinusCircle, Edit3 } from 'lucide-react'

const StatCard: React.FC<{
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  delay: number
}> = ({ title, value, icon, color, delay }) => {
  return (
    <div
      className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-slide-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">{title}</div>
          <div className="text-[24px] font-bold text-gray-800">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export const StatsDashboard: React.FC = () => {
  const { statsResult, isCalculating } = useAppStore()

  if (!statsResult) {
    return null
  }

  const chartData = [
    { name: '旧版', lines: statsResult.totalLines.old, color: '#9CA3AF' },
    { name: '新版', lines: statsResult.totalLines.new, color: '#6C63FF' }
  ]

  const lineChange = statsResult.totalLines.new - statsResult.totalLines.old
  const lineChangeText = lineChange >= 0 ? `+${lineChange}` : `${lineChange}`

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总行数变化"
          value={`${statsResult.totalLines.old} → ${statsResult.totalLines.new} (${lineChangeText})`}
          icon={<FileText size={20} className="text-[#6C63FF]" />}
          color="bg-[#EEF2FF]"
          delay={0}
        />
        <StatCard
          title="新增行数"
          value={statsResult.addedLines}
          icon={<PlusCircle size={20} className="text-[#16A34A]" />}
          color="bg-[#DCFCE7]"
          delay={100}
        />
        <StatCard
          title="删除行数"
          value={statsResult.removedLines}
          icon={<MinusCircle size={20} className="text-[#DC2626]" />}
          color="bg-[#FEE2E2]"
          delay={200}
        />
        <StatCard
          title="修改行数"
          value={statsResult.modifiedLines}
          icon={<Edit3 size={20} className="text-[#CA8A04]" />}
          color="bg-[#FEF9C3]"
          delay={300}
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        <div className="text-lg font-semibold text-gray-800 mb-4">行数对比</div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [`${value} 行`, '行数']}
              />
              <Bar dataKey="lines" radius={[8, 8, 0, 0]} barSize={80}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isCalculating && (
        <div className="text-center text-gray-500 animate-pulse py-4">
          正在更新统计...
        </div>
      )}
    </div>
  )
}
