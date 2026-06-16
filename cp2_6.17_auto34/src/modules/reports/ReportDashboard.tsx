import React, { useMemo, useState, useEffect } from 'react'
import { useSignStore } from '@/stores/signStore'
import { downloadCSV } from '@/utils/csv'
import type { SignRecord, QueryFilters } from '@/types'
import ReceiptDisplay from '../signing/ReceiptDisplay'
import './ReportDashboard.css'

function formatDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const ReportDashboard: React.FC = () => {
  const initStore = useSignStore((s) => s.initStore)
  const queryRecords = useSignStore((s) => s.queryRecords)
  const getCouriers = useSignStore((s) => s.getCouriers)

  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [trackingNumber, setTrackingNumber] = useState('')
  const [startDate, setStartDate] = useState(formatDateInput(weekAgo))
  const [endDate, setEndDate] = useState(formatDateInput(today))
  const [courier, setCourier] = useState('')
  const [results, setResults] = useState<SignRecord[]>([])
  const [hasQueried, setHasQueried] = useState(false)
  const [modalRecordId, setModalRecordId] = useState<string | null>(null)
  const [queryDuration, setQueryDuration] = useState<number>(0)

  const couriers = useMemo(() => getCouriers(), [getCouriers])

  useEffect(() => {
    initStore().then(() => {
      handleQuery()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuery = () => {
    const filters: QueryFilters = {
      trackingNumber: trackingNumber || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      courier: courier || undefined,
    }

    const start = performance.now()
    const data = queryRecords(filters)
    const elapsed = performance.now() - start
    console.debug(`[SignFlow] 查询耗时: ${elapsed.toFixed(1)}ms, 结果数: ${data.length}`)

    setResults(data)
    setQueryDuration(elapsed)
    setHasQueried(true)
  }

  const handleReset = () => {
    setTrackingNumber('')
    setStartDate(formatDateInput(weekAgo))
    setEndDate(formatDateInput(today))
    setCourier('')
  }

  const handleExportCSV = () => {
    if (results.length === 0) {
      alert('暂无数据可导出')
      return
    }
    downloadCSV(results)
  }

  const openReceiptModal = (id: string) => {
    setModalRecordId(id)
  }

  const closeModal = () => {
    setModalRecordId(null)
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div className="header-inner">
          <div className="header-left">
            <h1 className="reports-title">签收记录查询</h1>
            <span className="subtitle">SignFlow · 凭证管理中心</span>
          </div>
          <div className="header-right">
            <nav className="nav-tabs">
              <a href="#/signing" className="nav-tab">签收管理</a>
              <a href="#/reports" className="nav-tab active">查询报告</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="reports-layout">
        <aside className="filter-panel">
          <h2 className="panel-title">筛选条件</h2>

          <div className="filter-group">
            <label className="filter-label">运单号 (模糊匹配)</label>
            <input
              type="text"
              className="filter-input"
              placeholder="输入运单号关键字"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">日期范围</label>
            <div className="date-range">
              <div className="date-field">
                <span className="date-label">开始日期</span>
                <input
                  type="date"
                  className="filter-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-field">
                <span className="date-label">结束日期</span>
                <input
                  type="date"
                  className="filter-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">快递员</label>
            <select
              className="filter-input"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            >
              <option value="">全部快递员</option>
              {couriers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-filter btn-primary" onClick={handleQuery}>
              查询
            </button>
            <button className="btn-filter btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>

          <div className="filter-divider" />

          <div className="stats-box">
            <div className="stats-item">
              <span className="stats-label">总记录数</span>
              <span className="stats-value">{results.length}</span>
            </div>
            {hasQueried && (
              <div className="stats-item">
                <span className="stats-label">查询耗时</span>
                <span className="stats-value small">{queryDuration.toFixed(0)}ms</span>
              </div>
            )}
          </div>
        </aside>

        <main className="results-main">
          <div className="results-toolbar">
            <div className="toolbar-left">
              {hasQueried && (
                <span className="result-summary">
                  共找到 <strong>{results.length}</strong> 条签收记录
                  {results.length > 0 && (
                    <span className="sort-info">（按签收时间降序排列）</span>
                  )}
                </span>
              )}
            </div>
            <div className="toolbar-right">
              <button
                className="btn-export"
                onClick={handleExportCSV}
                disabled={results.length === 0}
              >
                📥 导出为 CSV
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">{hasQueried ? '暂无符合条件的记录' : '请设置筛选条件后查询'}</div>
                <div className="empty-desc">签收记录会自动保存在本地浏览器中</div>
              </div>
            ) : (
              <table className="records-table">
                <thead>
                  <tr>
                    <th style={{ width: '56px' }}>序号</th>
                    <th>运单号</th>
                    <th>收件人</th>
                    <th style={{ width: '170px' }}>签收时间</th>
                    <th style={{ width: '100px' }}>快递员</th>
                    <th style={{ width: '110px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((record, index) => (
                    <tr key={record.id}>
                      <td className="cell-index">{index + 1}</td>
                      <td>
                        <button
                          className="link-btn"
                          onClick={() => openReceiptModal(record.id)}
                          title="点击查看凭证"
                        >
                          {record.trackingNumber}
                        </button>
                      </td>
                      <td>{record.recipient}</td>
                      <td className="cell-time">{formatTimestamp(record.timestamp)}</td>
                      <td>{record.courier}</td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => openReceiptModal(record.id)}
                        >
                          查看凭证
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {modalRecordId && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="关闭">
              ×
            </button>
            <div className="modal-body">
              <ReceiptDisplay
                recordId={modalRecordId}
                showBackButton={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportDashboard
