import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useStatsStore } from './statsSlice'
import { useVoteStore } from '../投票模块/voteSlice'

const VoteChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bar' | 'pie'>('bar')
  const barChartData = useStatsStore(state => state.barChartData)
  const pieChartData = useStatsStore(state => state.pieChartData)
  const totalPolls = useStatsStore(state => state.totalPolls)
  const totalVotes = useStatsStore(state => state.totalVotes)
  const computeStats = useStatsStore(state => state.computeStats)
  const votes = useVoteStore(state => state.votes)

  useEffect(() => {
    computeStats()
  }, [votes, computeStats])

  return (
    <div style={containerStyle}>
      <div className="chart-summary" style={summaryStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryValueStyle}>{totalPolls}</div>
          <div style={summaryLabelStyle}>投票总数</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={summaryValueStyle}>{totalVotes}</div>
          <div style={summaryLabelStyle}>总投票次数</div>
        </div>
      </div>

      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('bar')}
          style={{
            ...tabStyle,
            borderBottom: activeTab === 'bar' ? '2px solid #6C63FF' : '2px solid transparent',
            color: activeTab === 'bar' ? '#FFFFFF' : '#B0B0B0',
          }}
        >
          柱状图
        </button>
        <button
          onClick={() => setActiveTab('pie')}
          style={{
            ...tabStyle,
            borderBottom: activeTab === 'pie' ? '2px solid #6C63FF' : '2px solid transparent',
            color: activeTab === 'pie' ? '#FFFFFF' : '#B0B0B0',
          }}
        >
          饼图
        </button>
      </div>

      <div style={chartAreaStyle}>
        {activeTab === 'bar' ? (
          barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                <XAxis
                  dataKey="name"
                  stroke="#B0B0B0"
                  tick={{ fill: '#B0B0B0', fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#B0B0B0"
                  tick={{ fill: '#B0B0B0', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A2A3D',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#E0E0E0',
                  }}
                  labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                />
                <Bar dataKey="total" fill="#6C63FF" radius={[4, 4, 0, 0]} name="总票数" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyChartStyle}>暂无数据</div>
          )
        ) : (
          pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A2A3D',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#E0E0E0',
                  }}
                  formatter={(value: number) => [`${value} 票`, '票数']}
                />
                <Legend
                  formatter={(value: string) => <span style={{ color: '#B0B0B0' }}>{value}</span>}
                />
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={140}
                  dataKey="value"
                  stroke="#1A1A2E"
                  strokeWidth={2}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyChartStyle}>暂无数据</div>
          )
        )}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
}

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
}

const summaryCardStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#1A1A2E',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
}

const summaryValueStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#6C63FF',
  marginBottom: '8px',
}

const summaryLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#B0B0B0',
}

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderBottom: '1px solid #2A2A3D',
}

const tabStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const chartAreaStyle: React.CSSProperties = {
  backgroundColor: '#1A1A2E',
  borderRadius: '12px',
  padding: '20px',
  color: '#E0E0E0',
}

const emptyChartStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '400px',
  color: '#787878',
  fontSize: '16px',
}

export default VoteChart
