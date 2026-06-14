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
  EmployeeRisk,
  EmployeeDetail
} from '../api/riskApi'

interface DepartmentDetailProps {
  department: DepartmentDetailType
  onBack: () => void
  onEmployeeClick: (employeeId: string) => void
  selectedEmployee: EmployeeDetail | null
  onCloseEmployee: () => void
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

const getRowBgColor = (score: number) => {
  if (score >= 70) return 'rgba(231, 76, 60, 0.08)'
  if (score >= 40) return 'rgba(243, 156, 18, 0.08)'
  return 'rgba(39, 174, 96, 0.05)'
}

function DepartmentDetail({
  department,
  onBack,
  onEmployeeClick,
  selectedEmployee,
  onCloseEmployee
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

  const top3Ids = useMemo(() => {
    const top3 = [...department.employees]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3)
      .map((e) => e.id)
    return new Set(top3Ids)
  }, [department.employees])

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
                  formatter={(value: number) => [`${value}分`, '风险指数']}
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
                    className={top3Ids.has(employee.id) ? 'risk-highlight' : ''}
                    style={{ backgroundColor: getRowBgColor(employee.riskScore) }}
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
                          <span key={idx} className={`signal-tag ${signal.type}`}>
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
                  {expandedRows.has(employee.id) && (
                    <tr className="signal-detail-row">
                      <td colSpan={9}>
                        <div className="signal-detail-content">
                          {employee.signals.map((signal, idx) => (
                            <div key={idx} className="signal-detail-item">
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
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployee && (
        <>
          <div className="sidebar-overlay" onClick={onCloseEmployee}></div>
          <div className="employee-sidebar">
            <div className="sidebar-header">
              <h3>员工风险详情</h3>
              <button className="close-btn" onClick={onCloseEmployee}>
                ×
              </button>
            </div>

            <div className="sidebar-content">
              <div className="employee-info">
                <div className="name">{selectedEmployee.name}</div>
                <div className="position">{selectedEmployee.position}</div>
              </div>

              <div className="score-section">
                <div className="score-chart-container">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="#E1E8ED"
                      strokeWidth="10"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke={
                        selectedEmployee.riskScore >= 70
                          ? '#E74C3C'
                          : selectedEmployee.riskScore >= 40
                          ? '#F39C12'
                          : '#27AE60'
                      }
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(selectedEmployee.riskScore / 100) * 408} 408`}
                      transform="rotate(-90 80 80)"
                    />
                  </svg>
                  <div className="score-center">
                    <div className="score-value">{selectedEmployee.riskScore}</div>
                    <div className="score-label">风险评分</div>
                  </div>
                </div>
              </div>

              <div className="timeline-section">
                <div className="timeline-title">近期信号时间线</div>
                <div className="timeline">
                  {selectedEmployee.timeline.map((signal, idx) => (
                    <div
                      key={idx}
                      className="timeline-item"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className={`timeline-dot ${signal.type}`}>
                        {getSignalIcon(signal.type)}
                      </div>
                      <div className="timeline-date">{signal.date}</div>
                      <div className="timeline-content">
                        <strong>{signal.title}</strong>：{signal.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="suggestion-section">
                <div className="suggestion-title">
                  <span>💡</span>
                  预警建议
                </div>
                <div className="suggestion-text">{selectedEmployee.suggestion}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DepartmentDetail
