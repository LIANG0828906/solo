import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store'
import ScrollToast from '@/components/ScrollToast'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'

const api = axios.create({ timeout: 5000 })

interface TrainingPlan {
  id?: number
  date: string
  project: string
  content: string
  targetScore: number
}

const emptyPlan: TrainingPlan = {
  date: '',
  project: 'archery',
  content: '',
  targetScore: 60,
}

const projectOptions = [
  { value: 'archery', label: '射箭' },
  { value: 'touhu', label: '投壶' },
  { value: 'cuju', label: '蹴鞠' },
  { value: 'comprehensive', label: '综合' },
]

export default function TrainingPlan() {
  const { currentUser, userRole } = useAuthStore()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [form, setForm] = useState<TrainingPlan>({ ...emptyPlan })
  const [editing, setEditing] = useState<number | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    if (!currentUser || userRole !== 'teacher') {
      navigate('/')
      return
    }
    fetchPlans()
  }, [currentUser, userRole])

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/teacher/training-plans')
      setPlans(res.data)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async () => {
    if (!form.date || !form.content) return
    try {
      if (editing !== null) {
        await api.put(`/api/teacher/training-plans/${editing}`, form)
        setToastMsg('训练计划已更新')
      } else {
        await api.post('/api/teacher/training-plans', form)
        setToastMsg('训练计划已创建')
      }
      setShowToast(true)
      setTimeout(() => setShowToast(false), 800)
      setForm({ ...emptyPlan })
      setEditing(null)
      fetchPlans()
    } catch {
      // ignore
    }
  }

  const handleEdit = (plan: TrainingPlan) => {
    setForm({ date: plan.date, project: plan.project, content: plan.content, targetScore: plan.targetScore })
    setEditing(plan.id ?? null)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/teacher/training-plans/${id}`)
      setToastMsg('训练计划已删除')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 800)
      fetchPlans()
    } catch {
      // ignore
    }
  }

  const projectLabel: Record<string, string> = {
    archery: '射箭',
    touhu: '投壶',
    cuju: '蹴鞠',
    comprehensive: '综合',
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <ScrollToast message={toastMsg} visible={showToast} />

      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center gap-2 text-ancient-brown mb-4 hover:text-ancient-red transition-colors"
          onClick={() => navigate('/teacher')}
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="font-title text-2xl md:text-3xl text-ancient-brown tracking-wider mb-6 text-center">
          训练计划管理
        </h1>

        <div
          className="rounded-lg border-2 border-gold p-6 bg-ancient-input mb-6"
          style={{ boxShadow: 'inset 0 2px 8px rgba(74,44,26,0.1)' }}
        >
          <h2 className="font-title text-xl text-ancient-brown mb-4">
            {editing ? '编辑计划' : '新建计划'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-ancient-brown">日期</label>
              <input
                type="date"
                className="input-ancient w-full"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-ancient-brown">项目</label>
              <select
                className="input-ancient w-full"
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
              >
                {projectOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-ancient-brown">内容</label>
              <textarea
                className="input-ancient w-full"
                rows={3}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="请输入训练内容"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-ancient-brown">目标分数</label>
              <input
                type="number"
                className="input-ancient w-full"
                value={form.targetScore}
                onChange={(e) => setForm({ ...form, targetScore: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn-ancient flex-1 flex items-center justify-center gap-2"
                onClick={handleSubmit}
              >
                <Plus size={16} />
                {editing ? '更新计划' : '创建计划'}
              </button>
              {editing && (
                <button
                  className="flex-1 py-2 rounded-md border border-gold text-ancient-brown hover:bg-amber-50 transition-colors"
                  onClick={() => { setForm({ ...emptyPlan }); setEditing(null) }}
                >
                  取消编辑
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {plans.length === 0 && (
            <p className="text-ancient-brown opacity-60 text-center py-4">暂无训练计划</p>
          )}
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-lg border border-gold p-4 bg-ancient-input flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-title text-ancient-brown">
                    {projectLabel[plan.project] || plan.project}
                  </span>
                  <span className="text-sm text-ancient-brown">{plan.date}</span>
                  <span className="text-xs text-ancient-red">目标：{plan.targetScore}分</span>
                </div>
                <p className="text-sm text-ancient-brown">{plan.content}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded hover:bg-amber-50 text-ancient-brown transition-colors"
                  onClick={() => handleEdit(plan)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="p-2 rounded hover:bg-red-50 text-ancient-red transition-colors"
                  onClick={() => plan.id && handleDelete(plan.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
