import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import PlantCard from '@/components/PlantCard'
import type { PlantStatus } from '@/types'
import { Plus, X, Heart, Droplets, Sun, Bug, RefreshCw, AlertCircle, Loader2, Leaf } from 'lucide-react'

const VARIETIES = ['多肉', '观叶', '开花', '草本']

const statusOptions: { value: PlantStatus; label: string; icon: typeof Heart; color: string }[] = [
  { value: 'healthy', label: '健康', icon: Heart, color: '#22c55e' },
  { value: 'thirsty', label: '缺水', icon: Droplets, color: '#f97316' },
  { value: 'low_light', label: '缺光', icon: Sun, color: '#eab308' },
  { value: 'pest', label: '虫害', icon: Bug, color: '#ef4444' },
]

export default function PlantListPage() {
  const { plants, loading, error, fetchPlants, createPlant, clearError } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    variety: '观叶',
    customVariety: '',
    plantedDate: new Date().toISOString().split('T')[0],
    status: 'healthy' as PlantStatus,
    notes: '',
  })
  const [useCustomVariety, setUseCustomVariety] = useState(false)

  useEffect(() => {
    fetchPlants()
  }, [fetchPlants])

  const handleSubmit = async () => {
    if (!form.name || form.name.length > 20) return
    const variety = useCustomVariety ? form.customVariety : form.variety
    await createPlant({
      name: form.name,
      variety,
      plantedDate: form.plantedDate,
      status: form.status,
      notes: form.notes,
    })
    setShowModal(false)
    setForm({
      name: '',
      variety: '观叶',
      customVariety: '',
      plantedDate: new Date().toISOString().split('T')[0],
      status: 'healthy',
      notes: '',
    })
    setUseCustomVariety(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#166534', margin: 0 }}>
          我的植物
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
          style={{
            background: '#166534',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#166534')}
        >
          <Plus size={16} />
          添加植物
        </button>
      </div>

      {error ? (
        <div
          className="animate-fade-in-up flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', marginTop: 8 }}
        >
          <div
            className="flex items-center justify-center mb-4"
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2' }}
          >
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 6px' }}>
            加载失败
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px', maxWidth: 320 }}>
            {error || '无法连接到服务器，请检查网络或稍后重试'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                clearError()
                fetchPlants()
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ background: '#166534', border: 'none', cursor: 'pointer', fontSize: 14 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#166534')}
            >
              <RefreshCw size={14} />
              重新加载
            </button>
          </div>
        </div>
      ) : loading && plants.length === 0 ? (
        <div className="flex flex-wrap gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-fade-in-up opacity-0"
              style={{
                width: 260,
                height: 200,
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: 20,
                boxSizing: 'border-box',
                animationDelay: `${i * 0.05}s`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <div
                className="absolute top-3 right-3"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  position: 'relative',
                  marginLeft: 'auto',
                }}
              />
              <div
                className="animate-pulse mb-3"
                style={{ height: 22, width: '60%', background: '#f1f5f9', borderRadius: 4 }}
              />
              <div
                className="animate-pulse mb-3"
                style={{ height: 20, width: '40%', background: '#f1f5f9', borderRadius: 4 }}
              />
              <div className="flex items-center justify-between">
                <div
                  className="animate-pulse"
                  style={{ height: 14, width: '35%', background: '#f1f5f9', borderRadius: 4 }}
                />
                <div
                  className="animate-pulse"
                  style={{ height: 16, width: '25%', background: '#f1f5f9', borderRadius: 4 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-4 mb-4" style={{ color: '#166534', fontSize: 13 }}>
          <Loader2 size={16} className="animate-spin mr-2" />
          数据更新中...
        </div>
      ) : plants.length === 0 ? (
        <div
          className="text-center py-20"
          style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', marginTop: 8 }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-4"
            style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7' }}
          >
            <Leaf size={32} color="#166534" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
            还没有植物档案
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            点击上方"添加植物"按钮，开始记录你的第一棵植物吧！
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {plants.map((plant, index) => (
            <PlantCard key={plant.id} plant={plant} index={index} />
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              width: 440,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                添加新植物
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  名称 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入植物名称（1-20字符）"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  品种
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={useCustomVariety ? '__custom__' : form.variety}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setUseCustomVariety(true)
                      } else {
                        setUseCustomVariety(false)
                        setForm({ ...form, variety: e.target.value })
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                      outline: 'none',
                      flex: 1,
                    }}
                  >
                    {VARIETIES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    <option value="__custom__">自定义...</option>
                  </select>
                  {useCustomVariety && (
                    <input
                      type="text"
                      value={form.customVariety}
                      onChange={(e) => setForm({ ...form, customVariety: e.target.value })}
                      placeholder="自定义品种"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                        outline: 'none',
                        flex: 1,
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  种植日期
                </label>
                <input
                  type="date"
                  value={form.plantedDate}
                  onChange={(e) => setForm({ ...form, plantedDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  当前状态
                </label>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setForm({ ...form, status: opt.value })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          border: `2px solid ${form.status === opt.value ? opt.color : '#e2e8f0'}`,
                          background: form.status === opt.value ? `${opt.color}15` : '#ffffff',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          color: form.status === opt.value ? opt.color : '#64748b',
                        }}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>
                  备注
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value.slice(0, 200) })}
                  placeholder="选填，最多200字"
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 2 }}>
                  {form.notes.length}/200
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || form.name.length > 20}
                className="w-full py-2.5 rounded-lg text-white font-medium transition-colors mt-2"
                style={{
                  background: form.name && form.name.length <= 20 ? '#166534' : '#94a3b8',
                  border: 'none',
                  cursor: form.name && form.name.length <= 20 ? 'pointer' : 'not-allowed',
                  fontSize: 15,
                }}
              >
                添加植物
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
