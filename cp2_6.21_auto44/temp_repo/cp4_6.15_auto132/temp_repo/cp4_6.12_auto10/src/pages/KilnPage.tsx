import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Play, Flame, ThermometerSun, CheckCircle } from 'lucide-react'
import { useAppStore, CLAY_LABELS } from '@/stores/useAppStore'
import { formatDate, clayTypeName } from '@/utils/format'
import type { KilnFiring, KilnPosition, ClayType } from '../../shared/types'

const KILN_ROWS = 3
const KILN_COLS = 4

const CLAY_COLORS: Record<string, string> = {
  white_porcelain: '#FAFAFA',
  coarse_pottery: '#D7CCC8',
  red_clay: '#FFCCBC',
  stoneware: '#BCAAA4',
}

const CLAY_PATTERNS: Record<string, string> = {
  white_porcelain: 'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F5F5F5 100%)',
  coarse_pottery: 'repeating-linear-gradient(45deg, #D7CCC8, #D7CCC8 4px, #BCAAA4 4px, #BCAAA4 8px)',
  red_clay: 'radial-gradient(circle at 40% 40%, #FFAB91 0%, #FFCCBC 60%, #FFCCBC 100%)',
  stoneware: 'repeating-linear-gradient(135deg, #BCAAA4, #BCAAA4 3px, #A1887F 3px, #A1887F 6px)',
}

const KILN_STATUS_LABELS: Record<string, string> = {
  preparing: '准备中',
  firing: '烧制中',
  cooling: '冷却中',
  completed: '已完成',
}

const KILN_STATUS_COLORS: Record<string, string> = {
  preparing: '#BDBDBD',
  firing: '#FF7043',
  cooling: '#42A5F5',
  completed: '#66BB6A',
}

function TempChart({ records }: { records: Array<{ timestamp: string; temperature: number }> }) {
  if (records.length === 0) return null

  const width = 500
  const height = 200
  const padding = 40
  const maxTemp = Math.max(...records.map((r) => r.temperature), 1300)
  const minTemp = 0

  const points = records
    .map((r, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(records.length - 1, 1)
      const y = height - padding - ((r.temperature - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding)
      return `${x},${y}`
    })
    .join(' ')

  const yTicks = [0, 300, 600, 900, 1200, maxTemp]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {yTicks.map((temp, i) => {
        const y = height - padding - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding)
        return (
          <g key={i}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#EFEBE9"
              strokeDasharray="4 4"
            />
            <text x={padding - 8} y={y + 4} textAnchor="end" className="fill-earth-brown/40 text-[10px]">
              {temp}°C
            </text>
          </g>
        )
      })}
      <polyline
        points={points}
        fill="none"
        stroke="#FF7043"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {records.map((r, i) => {
        const x = padding + (i * (width - 2 * padding)) / Math.max(records.length - 1, 1)
        const y = height - padding - ((r.temperature - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding)
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#FF7043" />
        )
      })}
    </svg>
  )
}

function KilnGrid({ positions }: { positions: KilnPosition[] }) {
  const grid: Array<KilnPosition | null>[][] = useMemo(() => {
    const g: Array<KilnPosition | null>[][] = Array(KILN_ROWS)
      .fill(null)
      .map(() => Array(KILN_COLS).fill(null))
    positions.forEach((p) => {
      if (p.row < KILN_ROWS && p.col < KILN_COLS) {
        g[p.row][p.col] = p
      }
    })
    return g
  }, [positions])

  return (
    <div className="inline-block p-3 bg-earth-brown/5 rounded-lg">
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          {row.map((cell, colIdx) => {
            const isOccupied = cell?.clayType !== null
            const clayType = cell?.clayType
            const pattern = clayType ? CLAY_PATTERNS[clayType] : undefined
            return (
              <div
                key={colIdx}
                className="border border-earth-brown/20 m-0.5 flex items-center justify-center text-xs"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: isOccupied ? 'transparent' : '#F5F5F5',
                  background: isOccupied ? pattern : undefined,
                }}
                title={isOccupied && clayType ? clayTypeName(clayType) : '空位'}
              >
                {isOccupied ? '' : `${rowIdx + 1}-${colIdx + 1}`}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function NewBatchForm({
  glazeIds,
  positions,
  onPositionsChange,
  onSubmit,
  onCancel,
}: {
  glazeIds: string[]
  positions: KilnPosition[]
  onPositionsChange: (positions: KilnPosition[]) => void
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [targetTemp, setTargetTemp] = useState('1240')
  const [heatingRate, setHeatingRate] = useState('150')
  const [holdingDuration, setHeatingDuration] = useState('30')
  const [selectedGlazes, setSelectedGlazes] = useState<string[]>([])

  const toggleGlaze = (id: string) => {
    setSelectedGlazes((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  const togglePosition = (row: number, col: number) => {
    const existing = positions.find((p) => p.row === row && p.col === col)
    if (existing) {
      onPositionsChange(positions.filter((p) => !(p.row === row && p.col === col)))
    } else {
      onPositionsChange([
        ...positions,
        { row, col, clayType: 'white_porcelain' as ClayType, orderId: null },
      ])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      glazeIds: selectedGlazes,
      positions,
      startTime: new Date().toISOString(),
      targetTemperature: parseInt(targetTemp),
      heatingRate: parseInt(heatingRate),
      holdingDuration: parseInt(holdingDuration),
    })
  }

  const grid: Array<KilnPosition | null>[][] = useMemo(() => {
    const g: Array<KilnPosition | null>[][] = Array(KILN_ROWS)
      .fill(null)
      .map(() => Array(KILN_COLS).fill(null))
    positions.forEach((p) => {
      if (p.row < KILN_ROWS && p.col < KILN_COLS) {
        g[p.row][p.col] = p
      }
    })
    return g
  }, [positions])

  const { glazes } = useAppStore()

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">目标温度（°C）</label>
          <input
            type="number"
            value={targetTemp}
            onChange={(e) => setTargetTemp(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">升温速率（°C/h）</label>
          <input
            type="number"
            value={heatingRate}
            onChange={(e) => setHeatingRate(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">保温时长（分钟）</label>
          <input
            type="number"
            value={holdingDuration}
            onChange={(e) => setHeatingDuration(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-earth-brown mb-2">选择釉料配方（可多选）</label>
        <div className="flex flex-wrap gap-2">
          {glazes.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGlaze(g.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedGlazes.includes(g.id)
                  ? 'bg-celadon-green text-white'
                  : 'bg-rice-white text-earth-brown/70 hover:bg-earth-brown/5 border border-earth-brown/10'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-earth-brown mb-2">点击仓位放置坯体</label>
        <div className="inline-block p-3 bg-earth-brown/5 rounded-lg">
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              {row.map((cell, colIdx) => {
                const isOccupied = cell !== null
                return (
                  <button
                    key={colIdx}
                    type="button"
                    onClick={() => togglePosition(rowIdx, colIdx)}
                    className="border border-earth-brown/20 m-0.5 flex items-center justify-center text-xs transition-all hover:opacity-80"
                    style={{
                      width: 80,
                      height: 80,
                      backgroundColor: isOccupied ? 'transparent' : '#F5F5F5',
                      background: isOccupied ? CLAY_PATTERNS.white_porcelain : undefined,
                    }}
                  >
                    {isOccupied ? '' : `${rowIdx + 1}-${colIdx + 1}`}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-clay-orange text-white rounded-lg font-medium hover:bg-clay-orange/90 transition-all"
        >
          创建烧制批次
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-earth-brown/70 hover:bg-earth-brown/5 rounded-lg font-medium transition-all"
        >
          取消
        </button>
      </div>
    </form>
  )
}

export default function KilnPage() {
  const {
    kilnBatches,
    glazes,
    createKilnBatch,
    addTemperatureRecord,
    completeKilnBatch,
    loadKilnBatches,
  } = useAppStore()

  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [positions, setPositions] = useState<KilnPosition[]>([])
  const [tempDeviation, setTempDeviation] = useState('')
  const [colorEffect, setColorEffect] = useState('')
  const [showReportForm, setShowReportForm] = useState(false)

  useEffect(() => {
    loadKilnBatches()
  }, [loadKilnBatches])

  useEffect(() => {
    const firingBatch = kilnBatches.find((b) => b.status === 'firing')
    if (!firingBatch) return

    const interval = setInterval(async () => {
      const lastRecord = firingBatch.temperatureRecords[firingBatch.temperatureRecords.length - 1]
      if (!lastRecord) return

      const progress = 1 - lastRecord.remainingMinutes / 600
      const nextTemp = Math.min(
        firingBatch.targetTemperature,
        20 + progress * (firingBatch.targetTemperature - 20) + (Math.random() - 0.5) * 10,
      )
      const nextRemaining = Math.max(0, lastRecord.remainingMinutes - 5)

      await addTemperatureRecord(firingBatch.id, Math.round(nextTemp), nextRemaining)
    }, 5000)

    return () => clearInterval(interval)
  }, [kilnBatches, addTemperatureRecord])

  const selectedBatch = kilnBatches.find((b) => b.id === selectedBatchId) || null

  const handleCreateBatch = async (data: any) => {
    await createKilnBatch(data)
    setShowNewForm(false)
    setPositions([])
  }

  const handleComplete = async () => {
    if (!selectedBatch) return
    await completeKilnBatch(selectedBatch.id, { tempDeviation, colorEffect })
    setShowReportForm(false)
    setTempDeviation('')
    setColorEffect('')
  }

  const activeBatch = kilnBatches.find((b) => b.status === 'firing')

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="font-serif text-3xl text-earth-brown mb-1">窑炉烧制管理</h1>
            <p className="text-earth-brown/60 text-sm">共 {kilnBatches.length} 条烧制记录</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            disabled={!!activeBatch}
            className="px-5 py-2.5 bg-clay-orange text-white rounded-lg font-medium hover:bg-clay-orange/90 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            新建批次
          </button>
        </div>

        {activeBatch && (
          <div className="mb-6 bg-white rounded-xl shadow-card p-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-earth-brown flex items-center gap-2">
                  <Flame size={20} className="text-status-kiln animate-pulse" />
                  当前烧制：{activeBatch.batchNumber}
                </h3>
                <p className="text-sm text-earth-brown/60 mt-1">
                  目标温度 {activeBatch.targetTemperature}°C · 升温速率 {activeBatch.heatingRate}°C/h
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: KILN_STATUS_COLORS[activeBatch.status] }}
              >
                {KILN_STATUS_LABELS[activeBatch.status]}
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-status-kiln/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-status-kiln">
                  {activeBatch.temperatureRecords[activeBatch.temperatureRecords.length - 1]?.temperature.toFixed(0) || 0}°C
                </p>
                <p className="text-xs text-earth-brown/60 mt-1">当前温度</p>
              </div>
              <div className="p-4 bg-status-kiln/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-earth-brown">
                  {activeBatch.targetTemperature}°C
                </p>
                <p className="text-xs text-earth-brown/60 mt-1">目标温度</p>
              </div>
              <div className="p-4 bg-status-kiln/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-earth-brown">
                  {activeBatch.temperatureRecords[activeBatch.temperatureRecords.length - 1]?.remainingMinutes || 0}
                </p>
                <p className="text-xs text-earth-brown/60 mt-1">剩余分钟</p>
              </div>
            </div>
            <TempChart records={activeBatch.temperatureRecords} />
          </div>
        )}

        {showNewForm && (
          <div className="mb-6 bg-white rounded-xl shadow-card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-earth-brown">新建烧制批次</h2>
              <button
                onClick={() => {
                  setShowNewForm(false)
                  setPositions([])
                }}
                className="p-2 text-earth-brown/40 hover:text-earth-brown/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <NewBatchForm
              glazeIds={glazes.map((g) => g.id)}
              positions={positions}
              onPositionsChange={setPositions}
              onSubmit={handleCreateBatch}
              onCancel={() => {
                setShowNewForm(false)
                setPositions([])
              }}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {kilnBatches.map((batch, idx) => (
              <div
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={`bg-white rounded-xl p-4 cursor-pointer transition-all card-animate ${
                  selectedBatchId === batch.id
                    ? 'ring-2 ring-celadon-green shadow-card-hover'
                    : 'shadow-card hover:shadow-card-hover'
                }`}
                style={{ animationDelay: `${0.1 + idx * 0.03}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-earth-brown">{batch.batchNumber}</p>
                    <p className="text-xs text-earth-brown/50">
                      开始于 {formatDate(batch.startTime)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ backgroundColor: KILN_STATUS_COLORS[batch.status] }}
                  >
                    {KILN_STATUS_LABELS[batch.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-earth-brown/70">
                  <span className="flex items-center gap-1">
                    <ThermometerSun size={14} />
                    {batch.targetTemperature}°C
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {selectedBatch ? (
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-xl text-earth-brown mb-1">
                      {selectedBatch.batchNumber}
                    </h2>
                    <p className="text-sm text-earth-brown/50">
                      {formatDate(selectedBatch.startTime)}
                    </p>
                  </div>
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: KILN_STATUS_COLORS[selectedBatch.status] }}
                  >
                    {KILN_STATUS_LABELS[selectedBatch.status]}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-earth-brown mb-3">仓位图</h3>
                  <KilnGrid positions={selectedBatch.positions} />
                </div>

                {selectedBatch.temperatureRecords.length > 1 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-earth-brown mb-3">升温曲线</h3>
                    <TempChart records={selectedBatch.temperatureRecords} />
                  </div>
                )}

                {selectedBatch.status === 'completed' && selectedBatch.report && (
                  <div className="p-4 bg-rice-white rounded-lg">
                    <h3 className="text-sm font-medium text-earth-brown mb-3 flex items-center gap-2">
                      <CheckCircle size={16} className="text-status-done" />
                      烧制报告
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-earth-brown/60">温度偏差分析：</span>
                        <span>{selectedBatch.report.tempDeviation}</span>
                      </div>
                      <div>
                        <span className="text-earth-brown/60">发色效果评价：</span>
                        <span>{selectedBatch.report.colorEffect}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBatch.status === 'cooling' && !showReportForm && (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="w-full py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 transition-all"
                  >
                    生成烧制报告
                  </button>
                )}

                {showReportForm && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-earth-brown mb-1">
                        温度偏差分析
                      </label>
                      <textarea
                        value={tempDeviation}
                        onChange={(e) => setTempDeviation(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all resize-none"
                        placeholder="如：±5°C，控制良好"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-earth-brown mb-1">
                        发色效果评价
                      </label>
                      <textarea
                        value={colorEffect}
                        onChange={(e) => setColorEffect(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all resize-none"
                        placeholder="如：色泽均匀，釉面光滑"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleComplete}
                        className="flex-1 py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 transition-all"
                      >
                        完成烧制
                      </button>
                      <button
                        onClick={() => setShowReportForm(false)}
                        className="px-4 py-2.5 text-earth-brown/70 hover:bg-earth-brown/5 rounded-lg font-medium transition-all"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <Flame size={48} className="mx-auto text-earth-brown/20 mb-3" />
                <p className="text-earth-brown/50">选择左侧记录查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
