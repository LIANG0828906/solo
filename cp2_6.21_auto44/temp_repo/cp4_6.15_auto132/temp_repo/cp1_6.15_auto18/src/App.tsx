import { useState, useEffect, useMemo } from 'react'
import RiskDashboard from './components/RiskDashboard'
import DepartmentDetail from './components/DepartmentDetail'
import { DepartmentSummary, DepartmentDetail as DepartmentDetailType, EmployeeDetail, riskApi } from './api/riskApi'

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

const generateSuggestion = (employee: EmployeeDetail): string => {
  const signals = employee.signals
  const hasAttendance = signals.some((s) => s.type === 'attendance')
  const hasDelay = signals.some((s) => s.type === 'delay')
  const hasOvertime = signals.some((s) => s.type === 'overtime')

  const attendanceCount = signals.filter((s) => s.type === 'attendance').length
  const delaySignals = signals.filter((s) => s.type === 'delay')

  let suggestion = `该员工`

  if (hasAttendance && attendanceCount >= 3 && hasDelay) {
    suggestion += `连续${attendanceCount}天考勤异常且任务延误增加，建议主动沟通了解情况`
  } else if (hasAttendance && attendanceCount >= 3) {
    suggestion += `连续${attendanceCount}天考勤异常，建议关注其工作状态`
  } else if (hasDelay && delaySignals.length > 0) {
    suggestion += `近期任务延误率上升，建议了解是否遇到工作困难`
  } else if (hasOvertime) {
    suggestion += `加班时长有明显变化，建议关注工作负荷情况`
  } else if (employee.riskScore >= 70) {
    suggestion += `风险评分较高，建议尽快安排一对一沟通`
  } else if (employee.riskScore >= 40) {
    suggestion += `存在一定离职风险，建议持续关注相关指标变化`
  } else {
    suggestion += `目前风险较低，保持正常关注即可`
  }

  return suggestion
}

type View =
  | { type: 'dashboard' }
  | { type: 'department'; departmentId: string }

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' })
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentDetailType | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortedTimeline = useMemo(() => {
    if (!selectedEmployee) return []
    return [...selectedEmployee.timeline].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [selectedEmployee])

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#E74C3C'
    if (score >= 40) return '#F39C12'
    return '#27AE60'
  }

  const handleEmployeeClick = async (employeeId: string) => {
    try {
      setSidebarVisible(false)
      const data = await riskApi.getEmployeeDetail(employeeId)
      setSelectedEmployee(data)
      setTimeout(() => setSidebarVisible(true), 10)
    } catch (err) {
      console.error('加载员工详情失败')
    }
  }

  const handleCloseEmployee = () => {
    setSidebarVisible(false)
    setTimeout(() => {
      setSelectedEmployee(null)
    }, 200)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await riskApi.getRiskSummary()
      setDepartments(data)
    } catch (err) {
      setError('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentClick = async (departmentId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await riskApi.getDepartmentDetail(departmentId)
      setCurrentDepartment(data)
      setView({ type: 'department', departmentId })
    } catch (err) {
      setError('加载部门详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setView({ type: 'dashboard' })
    setCurrentDepartment(null)
    setSidebarVisible(false)
    setTimeout(() => {
      setSelectedEmployee(null)
    }, 200)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>员工离职影响预警与分析系统</h1>
        <p>通过多维度数据分析，提前识别离职风险员工，助力主动管理</p>
      </header>

      <main className="app-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div>正在加载数据...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : view.type === 'dashboard' ? (
          <RiskDashboard
            departments={departments}
            onDepartmentClick={handleDepartmentClick}
          />
        ) : currentDepartment ? (
          <DepartmentDetail
            department={currentDepartment}
            onBack={handleBack}
            onEmployeeClick={handleEmployeeClick}
          />
        ) : null}
      </main>

      {selectedEmployee && (
        <>
          <div
            className={`sidebar-overlay ${sidebarVisible ? 'visible' : ''}`}
            onClick={handleCloseEmployee}
          ></div>
          <div className={`employee-sidebar ${sidebarVisible ? 'visible' : ''}`}>
            <div className="sidebar-header">
              <h3>员工风险详情</h3>
              <button className="close-btn" onClick={handleCloseEmployee}>
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
                      stroke={getScoreColor(selectedEmployee.riskScore)}
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
                  {sortedTimeline.map((signal, idx) => (
                    <div
                      key={`timeline-${idx}-${signal.date}`}
                      className="timeline-item"
                      style={{ animationDelay: `${idx * 50}ms` }}
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
                <div className="suggestion-text">
                  {generateSuggestion(selectedEmployee)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
