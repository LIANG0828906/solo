import { useEffect, useState } from 'react'
import { getGardenZones } from '@/api/client'
import { Sprout, Sun, Maximize } from 'lucide-react'

const STAGE_COLORS = {
  seedling: '#A8D5BA',
  growing: '#F9D976',
  harvest: '#F28B82',
}

const STAGE_LABELS = {
  seedling: '苗期',
  growing: '成长期',
  harvest: '收获期',
}

export default function Dashboard() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGardenZones()
      .then((data) => setZones(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#6B8E23] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6B8E23] text-sm">加载菜园数据中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4A6741]">菜园概览</h2>
        <p className="text-sm text-gray-500 mt-1">实时查看各区域种植状态与生长进度</p>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, 280px)' }}>
        {zones.map((zone) => {
          const progress = ((zone.totalDays - zone.daysToHarvest) / zone.totalDays) * 100
          const stageColor = STAGE_COLORS[zone.growthStage]
          return (
            <div
              key={zone.id}
              className="zone-card group cursor-default"
              style={{
                width: 280,
                borderRadius: 16,
                background: '#F4F9ED',
                border: '1px solid #DCE8D0',
                padding: '20px',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(74,103,65,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74,103,65,0.06)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span
                    className="inline-block text-white text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#6B8E23' }}
                  >
                    {zone.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#4A6741]">
                  {zone.currentCrop}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Maximize size={12} />
                  {zone.area}㎡
                </span>
                <span className="flex items-center gap-1">
                  <Sun size={12} />
                  {zone.sunlightHours}h/日
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Sprout size={12} />
                    {STAGE_LABELS[zone.growthStage]}
                  </span>
                  <span className="text-xs text-gray-400">
                    距收获 {zone.daysToHarvest} 天
                  </span>
                </div>
                <div
                  className="w-full"
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: '#E8E8E8',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      borderRadius: 4,
                      background: stageColor,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DCE8D0]">
                <span className="text-[10px] text-gray-400">历史种植：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {zone.history.slice(-3).map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded"
                    >
                      {h.crop}({h.season})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
