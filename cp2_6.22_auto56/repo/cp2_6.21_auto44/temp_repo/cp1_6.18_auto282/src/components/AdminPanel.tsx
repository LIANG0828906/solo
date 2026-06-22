import { useState, useEffect } from 'react'
import { useReportStore } from '../store'
import { STATUS_COLORS, FACILITY_COLORS } from '../types'
import type { FacilityType, ReportStatus } from '../types'

const FACILITY_TYPES: (FacilityType | '全部')[] = ['全部', '长椅', '路灯', '垃圾桶', '健身器材']
const STATUS_OPTIONS: (ReportStatus | '全部')[] = ['全部', '已提交', '处理中', '已完成']
const ADMIN_PASSWORD = 'admin123'

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_logged_in', 'true')
      onLogin()
    } else {
      setError('密码错误')
    }
  }

  return (
    <div className="card admin-login">
      <h1 className="page-title" style={{ textAlign: 'center' }}>管理员登录</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">密码</label>
          <textarea
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入管理员密码"
            style={{ minHeight: '40px', padding: '8px 12px' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          登录
        </button>
      </form>
    </div>
  )
}

function AdminPanelContent() {
  const { reports, total, page, totalPages, loading, error, fetchReports, changeStatus } = useReportStore()
  const [filterType, setFilterType] = useState<FacilityType | '全部'>('全部')
  const [filterStatus, setFilterStatus] = useState<ReportStatus | '全部'>('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadReports()
  }, [filterType, filterStatus, currentPage])

  const loadReports = () => {
    fetchReports({
      type: filterType === '全部' ? undefined : filterType,
      status: filterStatus === '全部' ? undefined : filterStatus,
      page: currentPage,
      limit: pageSize
    })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value as FacilityType | '全部')
    setCurrentPage(1)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value as ReportStatus | '全部')
    setCurrentPage(1)
  }

  const handleStatusUpdate = async (id: string, newStatus: ReportStatus) => {
    try {
      await changeStatus(id, newStatus)
      loadReports()
    } catch (err) {
      // Error handled by store
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in')
    window.location.reload()
  }

  return (
    <div className="admin-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>管理后台</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          退出登录
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-filters">
        <select
          className="filter-select"
          value={filterType}
          onChange={handleTypeChange}
        >
          {FACILITY_TYPES.map(type => (
            <option key={type} value={type}>
              设施类型：{type}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={handleStatusChange}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>
              状态：{status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>设施类型</th>
                <th>描述</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                reports.map(report => (
                  <tr key={report.id}>
                    <td style={{ fontFamily: 'monospace' }}>{report.id.substring(0, 8)}...</td>
                    <td>
                      <span style={{ color: FACILITY_COLORS[report.facilityType], fontWeight: 500 }}>
                        {report.facilityType}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.description.length > 30
                        ? report.description.substring(0, 30) + '...'
                        : report.description}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: STATUS_COLORS[report.status] }}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>{formatTime(report.createdAt)}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-warning"
                          onClick={() => handleStatusUpdate(report.id, '处理中')}
                          disabled={report.status === '处理中' || report.status === '已完成'}
                        >
                          标记为处理中
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusUpdate(report.id, '已完成')}
                          disabled={report.status === '已完成'}
                        >
                          标记为已完成
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              上一页
            </button>
            <span className="pagination-info">
              第 {page} / {totalPages} 页，共 {total} 条记录
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem('admin_logged_in') === 'true'
  )

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />
  }

  return <AdminPanelContent />
}

export default AdminPanel
