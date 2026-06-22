import { useEffect, useState, useCallback } from 'react'
import { getGardenZones, getRotationPlans } from '@/api/client'
import { Leaf, ArrowRightLeft, CheckCircle } from 'lucide-react'

export default function Rotation() {
  const [zones, setZones] = useState<any[]>([])
  const [selectedZone, setSelectedZone] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    getGardenZones().then((data) => {
      setZones(data)
      if (data.length > 0) {
        setSelectedZone(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedZone) return
    setLoading(true)
    setConfirmed(false)
    getRotationPlans(selectedZone).then((data) => {
      setPlan(data)
      setPlans([
        { ...data.optimal, type: 'optimal' },
        { ...data.alternative, type: 'alternative' },
      ])
      setLoading(false)
    })
  }, [selectedZone])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      const dragIndex = Number(e.dataTransfer.getData('text/plain'))
      if (dragIndex === dropIndex) return
      const newPlans = [...plans]
      const temp = newPlans[dragIndex]
      newPlans[dragIndex] = newPlans[dropIndex]
      newPlans[dropIndex] = temp
      setPlans(newPlans)
    },
    [plans]
  )

  const handleConfirm = () => {
    setConfirmed(true)
  }

  if (loading && !plan) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#6B8E23] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6B8E23] text-sm">分析土壤数据中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4A6741]">轮作推荐</h2>
        <p className="text-sm text-gray-500 mt-1">基于土壤耗损分析与历史种植记录，智能推荐下季轮作方案</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#DCE8D0] p-4">
            <h3 className="text-sm font-semibold text-[#4A6741] mb-3 flex items-center gap-2">
              <Leaf size={14} />
              选择区域
            </h3>
            <div className="space-y-2">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                    selectedZone === zone.id
                      ? 'bg-[#6B8E23] text-white shadow-md'
                      : 'bg-[#F4F9ED] text-[#4A6741] hover:bg-[#E8F5E9]'
                  }`}
                >
                  <div className="font-medium">{zone.name}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      selectedZone === zone.id ? 'text-green-100' : 'text-gray-400'
                    }`}
                  >
                    {zone.currentCrop} · {zone.area}㎡
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <ArrowRightLeft size={14} />
            <span>拖拽卡片交换顺序，确认最终轮作方案</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {plans.map((p, index) => (
              <div
                key={`${p.type}-${p.crop}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="rotation-card cursor-grab active:cursor-grabbing"
                style={{
                  borderRadius: 12,
                  background:
                    p.type === 'optimal'
                      ? 'linear-gradient(135deg, #E8F5E9, #C8E6C9)'
                      : '#F5F5F5',
                  padding: '24px',
                  border: '1px solid',
                  borderColor: p.type === 'optimal' ? '#A5D6A7' : '#E0E0E0',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: p.type === 'optimal' ? '#6B8E23' : '#9E9E9E',
                      color: 'white',
                    }}
                  >
                    {index === 0 ? '首选方案' : '备选方案'}
                  </span>
                  <span className="text-xs text-gray-400">
                    土壤适配度 {p.soilCompatibility}%
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#4A6741] mb-2">{p.crop}</h3>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {p.reason}
                </p>

                <div className="w-full h-2 rounded-full bg-white/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.soilCompatibility}%`,
                      background: p.type === 'optimal' ? '#6B8E23' : '#9E9E9E',
                    }}
                  />
                </div>

                {index === 0 && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-[#6B8E23]">
                    <Leaf size={10} />
                    推荐指数最高
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                confirmed
                  ? 'bg-[#A8D5BA] text-white cursor-default'
                  : 'bg-[#6B8E23] text-white hover:bg-[#5A7A1E] hover:shadow-lg active:scale-95'
              }`}
            >
              {confirmed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  方案已确认
                </span>
              ) : (
                '确认轮作方案'
              )}
            </button>
            {confirmed && (
              <span className="text-sm text-[#6B8E23] animate-pulse">
                ✓ {plans[0].crop} 将作为下季首选作物
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
