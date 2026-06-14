import { useState, useMemo, Fragment } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  DepartmentDetail as DepartmentDetailType,
  EmployeeRisk
} from '../api/riskApi'

interface DepartmentDetailProps {
  department: DepartmentDetailType
  onBack: () => void
  onEmployeeClick: (employeeId: string) => void
}

type SortOrder = 'asc' | 'desc'

const getSignalIcon = (type: string) => {
  switch (type) {
    case 'attendance':
      return '⏰'
    case 'delay':
      return '🚩'
    case 'overtime':
      return '⏱️'
    default:
      return '•'
  }
}

const getSignalLabel = (type: string) => {
  switch (type) {
    case 'attendance':
      return '考勤异常'
    case 'delay':
      return '任务延误'
    case 'overtime':
      return '加班变化'
    default:
      return '其他'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

const interpolateColor = (score: number) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  let r: number, g: number, b: number

  if (clampedScore <= 40) {
    const t = clampedScore / 40
    r = Math.round(39 + (243 - 39) * t * 0.5)
    g = Math.round(174 + (156 - 174) * t * 0.5)
    b = Math.round(96 + (18 - 96) * t * 0.5)
  } else if (clampedScore <= 70) {
    const t = (clampedScore - 40) / 30
    r = Math.round(243 + (231 - 243) * t)
    g = Math.round(156 + (76 - 156) * t)
    b = Math.round(18 + (60 - 18) * t)
  } else {
    r = 231
    g = 76
    b = 60
  }

  return `rgba(${r}, ${g}, ${b}, 0.08)`
}

function DepartmentDetail({
  department,
  onBack,
  onEmployeeClick
}: DepartmentDetailProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const sortedEmployees = useMemo(() => {
    const sorted = [...department.employees].sort((a, b) => {
      return sortOrder === 'desc'
        ? b.riskScore - a.riskScore
        : a.riskScore - b.riskScore
    })
    return sorted
  }, [department.employees, sortOrder])

  const top3Employees = useMemo(() => {
    const sorted = [...department.employees].sort(
      (a, b) => b.riskScore - a.riskScore
    )
    if (sorted.length === 0) return { ids: new Set<string>(), minScore: 0 }
    const top3 = sorted.slice(0, 3)
    const minScore = top3[top3.length - 1].riskScore
    return {
      ids: new Set(top3.map((e) => e.id)),
      minScore
    }
  }, [department.employees])

  const isTop3 = (employee: EmployeeRisk) => {
    return (
      top3Employees.ids.has(employee.id) ||
      employee.riskScore >= top3Employees.minScore
    )
  }

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  const toggleExpand = (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) {
        next.delete(employeeId)
      } else {
        next.add(employeeId)
      }
      return next
    })
  }

  const handleRowClick = (employee: EmployeeRisk) => {
    onEmployeeClick(employee.id)
  }

  return (
    <div>
      <button className="back-button" onClick={onBack}>
        <span>←</span>
        返回总览
      </button>

      <div className="department-detail">
        <h2 className="section-title">
          <span>📈</span>
          {department.name} - 风险趋势分析
        </h2>

        <div className="chart-section">
          <div className="chart-title">近6周风险指数变化趋势</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={department.riskTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" />
                <XAxis dataKey="week" tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E1E8ED',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#2C3E50' }}
                  formatter={(value: number) => [`风险指数: ${value}分`]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4A90E2"
                  strokeWidth={3}
                  dot={{ fill: '#4A90E2', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#E74C3C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="table-section">
          <div className="chart-title">员工风险列表</div>
          <table className="risk-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>排名</th>
                <th>员工姓名</th>
                <th>职位</th>
                <th onClick={toggleSort} style={{ cursor: 'pointer' }}>
                  风险评分
                  <span className="sort-icon">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                </th>
                <th>考勤异常</th>
                <th>任务延误比</th>
                <th>加班变化率</th>
                <th>关键信号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((employee, index) => (
                <Fragment key={employee.id}>
                  <tr
                    className={isTop3(employee) ? 'risk-highlight' : ''}
                    style={{
                      backgroundColor: interpolateColor(employee.riskScore),
                      fontWeight: isTop3(employee) ? 600 : 400
                    }}
                    onClick={() => handleRowClick(employee)}
                  >
                    <td>
                      <strong>#{index + 1}</strong>
                    </td>
                    <td>
                      <strong>{employee.name}</strong>
                    </td>
                    <td>{employee.position}</td>
                    <td onClick={toggleSort} style={{ cursor: 'pointer' }}>
                      <span className={`risk-score ${getScoreColor(employee.riskScore)}`}>
                        {employee.riskScore}
                      </span>
                    </td>
                    <td>{employee.attendanceAnomalies} 次</td>
                    <td>
                      <span style={{ color: employee.taskDelayRatio > 20 ? '#E74C3C' : '#27AE60' }}>
                        {employee.taskDelayRatio}%
                      </span>
                    </td>
                    <td>
                      <span style={{ color: employee.overtimeChangeRate < -30 ? '#E74C3C' : '#27AE60' }}>
                        {employee.overtimeChangeRate > 0 ? '+' : ''}{employee.overtimeChangeRate}%
                      </span>
                    </td>
                    <td>
                      <div className="signal-tags">
                        {employee.signals.slice(0, 3).map((signal, idx) => (
                          <span key={`${employee.id}-signal-${idx}`} className={`signal-tag ${signal.type}`}>
                            {getSignalLabel(signal.type)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        className="expand-btn"
                        onClick={(e) => toggleExpand(employee.id, e)}
                      >
                        {expandedRows.has(employee.id) ? '收起' : '详情'}
                      </button>
                    </td>
                  </tr>
                  <tr
                    key={`${employee.id}-detail`}
                    className={`signal-detail-row ${expandedRows.has(employee.id) ? 'expanded' : ''}`}
                  >
                    <td colSpan={9}>
                      <div className="signal-detail-content">
                        {employee.signals.map((signal, idx) => (
                          <div key={`${employee.id}-detail-${idx}`} className="signal-detail-item">
                            <div className={`signal-icon ${signal.type}`}>
                              {getSignalIcon(signal.type)}
                            </div>
                            <div className="signal-detail-text">
                              <div className="title">{signal.title}</div>
                              <div className="desc">
                                {signal.description}（{signal.date}）
                              </div>
                            </div>
                            <div style={{ fontWeight: 600, color: '#2C3E50' }}>
                              {signal.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  )
}

export default DepartmentDetail
