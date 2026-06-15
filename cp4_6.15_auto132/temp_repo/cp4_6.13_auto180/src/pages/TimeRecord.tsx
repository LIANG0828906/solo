import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store'
import { Edit2, Trash2, Plus, X } from 'lucide-react'
import type { TimeRecord as TimeRecordType } from '../../shared/types'

const PROJECTS = ['项目A', '项目B', '日常事务']

interface FormData {
  date: string
  project: string
  hours: number
  note: string
}

const emptyForm: FormData = {
  date: new Date().toISOString().split('T')[0],
  project: PROJECTS[0],
  hours: 8,
  note: '',
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
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </td>
    </tr>
  )
}

export default function TimeRecord() {
  const { records, setRecords, showToast } = useStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<FormData>(emptyForm)

  useEffect(() => {
    setLoading(true)
    fetch('/api/records?days=30')
      .then((r) => r.json())
      .then((data: { records: TimeRecordType[] }) => {
        setRecords(data.records)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [setRecords])

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [records])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setRecords([data.record, ...records])
        setForm(emptyForm)
        showToast('提交成功')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (record: TimeRecordType) => {
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      project: record.project,
      hours: record.hours,
      note: record.note,
    })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingId) return
    const res = await fetch(`/api/records/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const data = await res.json()
      setRecords(records.map((r) => (r.id === editingId ? data.record : r)))
      setShowEditModal(false)
      setEditingId(null)
      showToast('修改成功')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此条记录？')) return
    const res = await fetch(`/api/records/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRecords(records.filter((r) => r.id !== id))
      showToast('删除成功')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1565c0' }}>
          工时记录
        </h2>
      </div>

      <div
        className="card bg-white rounded-xl p-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)', minWidth: 320 }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#333' }}>
          提交工时
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">项目</label>
            <select
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              {PROJECTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">工时(小时)</label>
            <input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              value={form.hours}
              onChange={(e) =>
                setForm({ ...form, hours: Math.min(24, Math.max(0.5, parseFloat(e.target.value) || 0)) })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm text-gray-600 mb-1">备注</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="可选"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>
          <div className="md:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#1976d2' }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
            >
              <Plus size={18} />
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>

      <div
        className="card bg-white rounded-xl p-6"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)', minWidth: 320 }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: '#333' }}>
          最近30天工时记录
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">日期</th>
                <th className="px-4 py-3 font-medium">项目</th>
                <th className="px-4 py-3 font-medium">工时</th>
                <th className="px-4 py-3 font-medium">备注</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    暂无工时记录
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className="record-row group transition-colors duration-200"
                    style={{
                      backgroundColor: index % 2 === 1 ? '#f9f9f9' : '#ffffff',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e3f2fd')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = index % 2 === 1 ? '#f9f9f9' : '#ffffff')
                    }
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">{record.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.project}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1976d2' }}>
                      {record.hours}h
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                      {record.note || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="edit-btn p-1.5 rounded-lg transition-all duration-200 hover:bg-blue-50"
                          onClick={() => handleEditClick(record)}
                          style={{ color: '#1976d2' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="delete-btn p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50"
                          onClick={() => handleDelete(record.id)}
                          style={{ color: '#f44336' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                编辑工时记录
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">日期</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">项目</label>
                <select
                  value={editForm.project}
                  onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                >
                  {PROJECTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">工时(小时)</label>
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={editForm.hours}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      hours: Math.min(24, Math.max(0.5, parseFloat(e.target.value) || 0)),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <input
                  type="text"
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#e0e0e0' }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-lg text-gray-600 font-medium transition-all duration-200 hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: '#1976d2' }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
