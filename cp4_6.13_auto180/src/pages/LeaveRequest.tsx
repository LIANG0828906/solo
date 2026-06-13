import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store'
import { Plus, X, CheckCircle, XCircle } from 'lucide-react'
import type { LeaveRequest as LeaveRequestType } from '../../shared/types'

const LEAVE_TYPES: Array<'年假' | '病假' | '事假'> = ['年假', '病假', '事假']

interface FormData {
  startDate: string
  endDate: string
  type: '年假' | '病假' | '事假'
  reason: string
}

const emptyForm: FormData = {
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  type: '年假',
  reason: '',
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </td>
    </tr>
  )
}

export default function LeaveRequest() {
  const { leaves, setLeaves, showToast } = useStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)

  useEffect(() => {
    setLoading(true)
    fetch('/api/leaves')
      .then((r) => r.json())
      .then((data: { leaves: LeaveRequestType[] }) => {
        setLeaves(data.leaves)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [setLeaves])

  const sortedLeaves = useMemo(() => {
    return [...leaves].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [leaves])

  const getRowBgColor = (status: string) => {
    if (status === '已通过') return '#e8f5e9'
    if (status === '已拒绝') return '#ffebee'
    return '#ffffff'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (new Date(form.endDate) < new Date(form.startDate)) {
      showToast('结束日期不能早于开始日期')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setLeaves([data.leave, ...leaves])
        setForm(emptyForm)
        setShowModal(false)
        showToast('提交成功')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: '已通过' | '已拒绝') => {
    const res = await fetch(`/api/leaves/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setLeaves(leaves.map((l) => (l.id === id ? data.leave : l)))
      showToast(status === '已通过' ? '已通过' : '已驳回')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1565c0' }}>
          请假审批
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="leave-add-btn flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
          style={{ backgroundColor: '#1976d2' }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
        >
          <Plus size={18} />
          提交请假
        </button>
      </div>

      <div
        className="card bg-white rounded-xl p-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)', minWidth: 320 }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#333' }}>
          请假申请列表
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">日期范围</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">理由</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sortedLeaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    暂无请假申请
                  </td>
                </tr>
              ) : (
                sortedLeaves.map((leave, index) => (
                  <tr
                    key={leave.id}
                    className="leave-row group transition-colors duration-200"
                    style={{
                      backgroundColor:
                        leave.status === '已通过'
                          ? '#e8f5e9'
                          : leave.status === '已拒绝'
                            ? '#ffebee'
                            : index % 2 === 1
                              ? '#f9f9f9'
                              : '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      if (leave.status === '待审批') {
                        e.currentTarget.style.backgroundColor = '#e3f2fd'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (leave.status === '待审批') {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 1 ? '#f9f9f9' : '#ffffff'
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {leave.startDate} 至 {leave.endDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{leave.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                      {leave.reason || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            leave.status === '已通过'
                              ? '#c8e6c9'
                              : leave.status === '已拒绝'
                                ? '#ffcdd2'
                                : '#fff3e0',
                          color:
                            leave.status === '已通过'
                              ? '#2e7d32'
                              : leave.status === '已拒绝'
                                ? '#c62828'
                                : '#e65100',
                        }}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === '待审批' && (
                        <div className="flex gap-2">
                          <button
                            className="approve-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-all duration-200"
                            style={{ backgroundColor: '#4caf50' }}
                            onClick={() => handleUpdateStatus(leave.id, '已通过')}
                            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                          >
                            <CheckCircle size={14} />
                            通过
                          </button>
                          <button
                            className="reject-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-all duration-200"
                            style={{ backgroundColor: '#f44336' }}
                            onClick={() => handleUpdateStatus(leave.id, '已拒绝')}
                            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                          >
                            <XCircle size={14} />
                            驳回
                          </button>
                        </div>
                      )}
                      {leave.status !== '待审批' && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                提交请假申请
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">请假类型</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as '年假' | '病假' | '事假' })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">请假理由</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  placeholder="请输入请假理由"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ borderColor: '#e0e0e0' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg text-gray-600 font-medium transition-all duration-200 hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#1976d2' }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
