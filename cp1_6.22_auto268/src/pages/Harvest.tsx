import { useEffect, useState, useRef, useMemo } from 'react'
import { getHarvestRecords } from '@/api/client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { TrendingUp, Package, DollarSign, Leaf } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const ROW_HEIGHT = 48
const VISIBLE_COUNT = 10

export default function Harvest() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getHarvestRecords()
      .then((data) => setRecords(data))
      .finally(() => setLoading(false))
  }, [])

  const monthlyData = useMemo(() => {
    const map: Record<string, { weight: number; cost: number; revenue: number }> = {}
    records.forEach((r) => {
      const month = r.date.substring(0, 7)
      if (!map[month]) map[month] = { weight: 0, cost: 0, revenue: 0 }
      map[month].weight += r.weightKg
      map[month].cost += r.costYuan
      map[month].revenue += r.revenueYuan
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))
  }, [records])

  const chartData = useMemo(
    () => ({
      labels: monthlyData.map((d) => d.month),
      datasets: [
        {
          label: '总重量 (kg)',
          data: monthlyData.map((d) => d.weight),
          backgroundColor: '#4CAF50',
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    }),
    [monthlyData]
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_event: any, elements: any[]) => {
        if (elements.length > 0) {
          const idx = elements[0].index
          setSelectedMonth(monthlyData[idx]?.month || null)
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#4A6741',
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9E9E9E', font: { size: 11 } },
        },
        y: {
          grid: { color: '#F0F0F0' },
          ticks: { color: '#9E9E9E', font: { size: 11 } },
        },
      },
    }),
    [monthlyData]
  )

  const filteredRecords = useMemo(() => {
    if (!selectedMonth) return records
    return records.filter((r) => r.date.startsWith(selectedMonth))
  }, [records, selectedMonth])

  const totals = useMemo(
    () => ({
      weight: records.reduce((s, r) => s + r.weightKg, 0),
      cost: records.reduce((s, r) => s + r.costYuan, 0),
      revenue: records.reduce((s, r) => s + r.revenueYuan, 0),
    }),
    [records]
  )

  const totalHeight = filteredRecords.length * ROW_HEIGHT
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT)
  const endIndex = Math.min(startIndex + VISIBLE_COUNT + 2, filteredRecords.length)
  const visibleRecords = filteredRecords.slice(startIndex, endIndex)

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#6B8E23] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6B8E23] text-sm">加载收成数据中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4A6741]">收成记录</h2>
        <p className="text-sm text-gray-500 mt-1">跟踪每季收成重量与投入成本，生成投入产出报告</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#DCE8D0] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <Package size={18} className="text-[#6B8E23]" />
          </div>
          <div>
            <div className="text-xs text-gray-400">总产量</div>
            <div className="text-lg font-bold text-[#4A6741]">{totals.weight.toFixed(1)} kg</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#DCE8D0] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
            <DollarSign size={18} className="text-[#E65100]" />
          </div>
          <div>
            <div className="text-xs text-gray-400">总成本</div>
            <div className="text-lg font-bold text-[#E65100]">¥{totals.cost}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#DCE8D0] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <TrendingUp size={18} className="text-[#6B8E23]" />
          </div>
          <div>
            <div className="text-xs text-gray-400">总收入</div>
            <div className="text-lg font-bold text-[#6B8E23]">¥{totals.revenue}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#DCE8D0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#4A6741] flex items-center gap-2">
              <Leaf size={14} />
              月度产量分布
            </h3>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-xs text-[#6B8E23] hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
          <div style={{ height: 320 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">点击柱体查看当月详细记录</p>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE8D0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#4A6741] flex items-center gap-2">
              <Package size={14} />
              收成明细
            </h3>
            {selectedMonth && (
              <span className="text-xs bg-[#E8F5E9] text-[#6B8E23] px-2 py-0.5 rounded-full">
                {selectedMonth}
              </span>
            )}
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ height: 320 }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
                }}
              >
                {visibleRecords.map((record, i) => {
                  const profit = record.revenueYuan - record.costYuan
                  return (
                    <div
                      key={record.id}
                      className="flex items-center text-sm border-b border-gray-50 hover:bg-[#F4F9ED] transition-colors"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <span className="w-24 text-gray-400 text-xs shrink-0">{record.date}</span>
                      <span className="w-20 font-medium text-[#4A6741] shrink-0">{record.crop}</span>
                      <span className="w-16 text-gray-600 shrink-0">{record.weightKg}kg</span>
                      <span className="w-16 text-gray-400 shrink-0">¥{record.costYuan}</span>
                      <span className="w-16 text-gray-600 shrink-0">¥{record.revenueYuan}</span>
                      <span
                        className={`text-xs font-medium ${profit >= 0 ? 'text-[#6B8E23]' : 'text-red-500'}`}
                      >
                        {profit >= 0 ? '+' : ''}¥{profit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
