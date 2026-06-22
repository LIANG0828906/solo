import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import ScrollToast from '@/components/ScrollToast'
import { ArrowLeft, Pencil, Trash2, ClipboardList, LogOut } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

interface ScoreRecord {
  id: number
  studentName: string
  type: string
  score: number
  detail: string
  createdAt: string
}

const typeOptions = [
  { value: '', label: '全部' },
  { value: 'archery', label: '射箭' },
  { value: 'touhu', label: '投壶' },
  { value: 'cuju', label: '蹴鞠' },
]

const periodOptions = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

const typeLabel: Record<string, string> = {
  archery: '射箭',
  touhu: '投壶',
  cuju: '蹴鞠',
}

export default function TeacherManage() {
  const { currentUser, userRole, logout } = useAuthStore()
  const navigate = useNavigate()
  const [records, setRecords] = useState<ScoreRecord[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('month')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editScore, setEditScore] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    if (!currentUser || userRole !== 'teacher') {
      navigate('/')
      return
    }
    fetchScores()
  }, [currentUser, userRole, typeFilter, periodFilter])

  const fetchScores = async () => {
    try {
      const res = await api.get('/api/teacher/scores', {
        params: { type: typeFilter || undefined, period: periodFilter },
      })
      setRecords(res.data)
    } catch {
      // ignore
    }
  }

  const handleEdit = (record: ScoreRecord) => {
    setEditingId(record.id)
    setEditScore(record.score)
  }

  const handleSaveEdit = async (id: number) => {
    try {
      await api.put(`/api/teacher/scores/${id}`, { score: editScore })
      setToastMsg('成绩已更新')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 800)
      setEditingId(null)
      fetchScores()
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/teacher/scores/${id}`)
      setToastMsg('成绩已删除')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 800)
      fetchScores()
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ScrollToast message={toastMsg} visible={showToast} />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider flex items-center gap-2">
            <ClipboardList size={28} />
            夫子管理
          </h1>
          <button
            className="btn-ancient flex items-center gap-2 text-sm"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            退出
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-ancient-brown">项目：</label>
            <select
              className="input-ancient"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-ancient-brown">时段：</label>
            <select
              className="input-ancient"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              {periodOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-ancient text-sm"
            onClick={() => navigate('/training-plan')}
          >
            训练计划管理
          </button>
          <button
            className="btn-ancient text-sm"
            onClick={() => navigate('/leaderboard')}
          >
            查看排行榜
          </button>
        </div>

        <div
          className="rounded-lg border-2 border-gold overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #FFF8DC 0%, #F5F0E1 100%)' }}
        >
          <div className="grid grid-cols-5 gap-2 p-3 bg-ancient-brown text-white text-sm font-title">
            <div>学子</div>
            <div className="text-center">项目</div>
            <div className="text-center">分数</div>
            <div className="text-center">时间</div>
            <div className="text-center">操作</div>
          </div>

          {records.length === 0 && (
            <div className="p-8 text-center text-ancient-brown opacity-60">
              暂无成绩记录
            </div>
          )}

          {records.map((record) => (
            <div
              key={record.id}
              className="grid grid-cols-5 gap-2 p-3 border-b border-gold border-opacity-30 items-center"
            >
              <div className="text-ancient-brown">{record.studentName}</div>
              <div className="text-center text-ancient-brown text-sm">
                {typeLabel[record.type] || record.type}
              </div>
              <div className="text-center">
                {editingId === record.id ? (
                  <input
                    type="number"
                    className="input-ancient w-20 text-center"
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    onBlur={() => handleSaveEdit(record.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(record.id)
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="font-title text-ancient-red">{record.score}</span>
                )}
              </div>
              <div className="text-center text-ancient-brown text-xs">
                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
              </div>
              <div className="flex justify-center gap-1">
                <button
                  className="p-1 rounded hover:bg-amber-50 text-ancient-brown transition-colors"
                  onClick={() => handleEdit(record)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="p-1 rounded hover:bg-red-50 text-ancient-red transition-colors"
                  onClick={() => handleDelete(record.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
