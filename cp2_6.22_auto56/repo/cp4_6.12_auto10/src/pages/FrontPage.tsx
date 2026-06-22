import { useState, useEffect } from 'react'
import { Search, Upload, Clock } from 'lucide-react'
import { useAppStore, STATUS_LABELS, STATUS_COLORS } from '@/stores/useAppStore'
import { formatDate, vesselTypeName, clayTypeName } from '@/utils/format'
import type { Order, VesselType, ClayType } from '../../shared/types'

const VESSEL_OPTIONS: { value: VesselType; label: string }[] = [
  { value: 'cup', label: '杯' },
  { value: 'bowl', label: '碗' },
  { value: 'plate', label: '盘' },
  { value: 'vase', label: '花瓶' },
  { value: 'teapot', label: '茶壶' },
  { value: 'decor', label: '摆件' },
]

const CLAY_OPTIONS: { value: ClayType; label: string }[] = [
  { value: 'white_porcelain', label: '白瓷' },
  { value: 'coarse_pottery', label: '粗陶' },
  { value: 'red_clay', label: '红陶' },
  { value: 'stoneware', label: '炻器' },
]

function OrderTimeline({ order }: { order: Order }) {
  return (
    <div className="relative pl-8 py-4">
      {order.statusHistory.map((item, idx) => {
        const isLast = idx === order.statusHistory.length - 1
        const color = STATUS_COLORS[item.status]
        return (
          <div key={idx} className="relative pb-8 last:pb-0">
            {!isLast && (
              <div
                className="absolute left-[-17px] top-5 w-0.5 h-full"
                style={{ backgroundColor: color, opacity: 0.3 }}
              />
            )}
            <div
              className="absolute left-[-24px] top-1 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}40` }}
            />
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {STATUS_LABELS[item.status]}
              </span>
              <span className="text-sm text-earth-brown/60">
                {formatDate(item.timestamp)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FrontPage() {
  const { orders, createOrder } = useAppStore()

  const [vesselType, setVesselType] = useState<VesselType>('cup')
  const [caliber, setCaliber] = useState('')
  const [height, setHeight] = useState('')
  const [baseDiameter, setBaseDiameter] = useState('')
  const [clayType, setClayType] = useState<ClayType>('white_porcelain')
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null)

  const [searchOrderId, setSearchOrderId] = useState('')
  const [searchResult, setSearchResult] = useState<Order | null>(null)
  const [searchError, setSearchError] = useState('')
  const [activeTab, setActiveTab] = useState<'submit' | 'query'>('submit')

  useEffect(() => {
    if (submittedOrder) {
      const timer = setTimeout(() => setSubmittedOrder(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [submittedOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone || !caliber || !height || !baseDiameter) return

    const newOrder = await createOrder({
      customerName,
      customerPhone,
      vesselType,
      caliber: Number(caliber),
      height: Number(height),
      baseDiameter: Number(baseDiameter),
      referenceImages: [],
      clayType,
      notes,
    })

    if (newOrder) {
      setSubmittedOrder(newOrder)
      setCustomerName('')
      setCustomerPhone('')
      setCaliber('')
      setHeight('')
      setBaseDiameter('')
      setNotes('')
      setVesselType('cup')
      setClayType('white_porcelain')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    const found = orders.find((o) => o.id === searchOrderId.trim())
    if (found) {
      setSearchResult(found)
    } else {
      setSearchResult(null)
      setSearchError('未找到该订单，请核对订单号')
    }
  }

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="font-serif text-4xl md:text-5xl text-earth-brown mb-3">
            陶然工坊
          </h1>
          <p className="text-earth-brown/70 text-lg">
            专注手工陶瓷，每件作品都是独一无二的时光印记
          </p>
        </div>

        <div className="flex justify-center mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="inline-flex bg-white rounded-xl p-1 shadow-card">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-clay-orange text-white shadow-md'
                  : 'text-earth-brown/70 hover:text-earth-brown'
              }`}
            >
              提交定制
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'query'
                  ? 'bg-clay-orange text-white shadow-md'
                  : 'text-earth-brown/70 hover:text-earth-brown'
              }`}
            >
              <Clock size={16} />
              查询进度
            </button>
          </div>
        </div>

        {activeTab === 'submit' ? (
          <div className="bg-white rounded-2xl shadow-card p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-serif text-2xl text-earth-brown mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-clay-orange rounded-full" />
              定制订单提交
            </h2>

            {submittedOrder && (
              <div className="mb-6 p-4 bg-celadon-green/10 border border-celadon-green/30 rounded-lg animate-fade-in">
                <p className="text-celadon-green font-medium">
                  提交成功！您的订单号：<span className="font-mono">{submittedOrder.id}</span>
                </p>
                <p className="text-sm text-earth-brown/60 mt-1">请妥善保管订单号用于查询进度</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-earth-brown mb-2">
                    客户姓名
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-brown mb-2">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                    placeholder="请输入手机号"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-brown mb-2">
                  器型选择
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {VESSEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVesselType(opt.value)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        vesselType === opt.value
                          ? 'border-celadon-green bg-celadon-green/10 text-celadon-green'
                          : 'border-earth-brown/10 hover:border-earth-brown/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-brown mb-2">
                    口径（cm）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={caliber}
                    onChange={(e) => setCaliber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                    placeholder="如：8.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-brown mb-2">
                    高度（cm）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                    placeholder="如：10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-brown mb-2">
                    底径（cm）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={baseDiameter}
                    onChange={(e) => setBaseDiameter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                    placeholder="如：4"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-brown mb-2">
                  坯体类型
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CLAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClayType(opt.value)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        clayType === opt.value
                          ? 'border-celadon-green bg-celadon-green/10 text-celadon-green'
                          : 'border-earth-brown/10 hover:border-earth-brown/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-brown mb-2">
                  参考图片/手绘图
                </label>
                <div className="border-2 border-dashed border-earth-brown/20 rounded-lg p-8 text-center hover:border-celadon-green/50 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-earth-brown/40 mb-2" />
                  <p className="text-sm text-earth-brown/50">点击或拖拽上传图片</p>
                  <p className="text-xs text-earth-brown/40 mt-1">支持 JPG、PNG，单张不超过 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-brown mb-2">
                  备注说明
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all resize-none"
                  placeholder="如有特殊要求请在此说明..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-clay-orange text-white rounded-lg font-medium hover:bg-clay-orange/90 active:scale-[0.99] transition-all shadow-lg shadow-clay-orange/20"
              >
                提交定制申请
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-serif text-2xl text-earth-brown mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-clay-orange rounded-full" />
              订单进度查询
            </h2>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-brown/40" />
                  <input
                    type="text"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    placeholder="请输入订单号查询进度"
                    className="w-full pl-11 pr-4 py-3 border border-earth-brown/20 rounded-lg bg-rice-white/50 focus:border-celadon-green transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 active:scale-[0.99] transition-all"
                >
                  查询
                </button>
              </div>
              {searchError && (
                <p className="mt-3 text-sm text-red-500">{searchError}</p>
              )}
            </form>

            {searchResult && (
              <div className="animate-fade-in">
                <div className="p-4 bg-rice-white rounded-lg mb-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-earth-brown/60">订单号：</span>
                      <span className="font-mono text-earth-brown">{searchResult.id}</span>
                    </div>
                    <div>
                      <span className="text-earth-brown/60">器型：</span>
                      <span>{vesselTypeName(searchResult.vesselType)}</span>
                    </div>
                    <div>
                      <span className="text-earth-brown/60">坯体：</span>
                      <span>{clayTypeName(searchResult.clayType)}</span>
                    </div>
                    <div>
                      <span className="text-earth-brown/60">尺寸：</span>
                      <span>口径{searchResult.caliber} × 高{searchResult.height} × 底径{searchResult.baseDiameter} cm</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-earth-brown/60">提交时间：</span>
                      <span>{formatDate(searchResult.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-serif text-lg text-earth-brown mb-2">制作进度</h3>
                <OrderTimeline order={searchResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
