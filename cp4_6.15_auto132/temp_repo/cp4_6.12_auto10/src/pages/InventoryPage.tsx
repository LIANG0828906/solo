import { useState } from 'react'
import { Package, FlaskConical, ShoppingBasket, Star, Plus } from 'lucide-react'
import { useAppStore, VESSEL_LABELS, CLAY_LABELS, MATERIAL_LABELS } from '@/stores/useAppStore'
import { formatDate, qualityStars, getVesselShape, vesselTypeName, clayTypeName, materialName } from '@/utils/format'
import type { QualityRating, ShelfArea, ClayType, VesselType, RawMaterial } from '../../shared/types'

type TabType = 'greenware' | 'materials' | 'finished'

const TABS: Array<{ value: TabType; label: string; icon: typeof Package }> = [
  { value: 'greenware', label: '素坯库存', icon: Package },
  { value: 'materials', label: '原料库存', icon: FlaskConical },
  { value: 'finished', label: '成品库存', icon: ShoppingBasket },
]

const SHELF_OPTIONS: Array<{ value: ShelfArea; label: string }> = [
  { value: 'A', label: 'A区' },
  { value: 'B', label: 'B区' },
  { value: 'C', label: 'C区' },
]

function getGlazeNameById(glazes: Array<{ id: string; name: string }>, id: string | null): string {
  if (!id) return '-'
  const g = glazes.find((item) => item.id === id)
  return g?.name || '-'
}

export default function InventoryPage() {
  const {
    greenware,
    rawMaterials,
    finishedProducts,
    glazes,
    warnings,
    loadInventory,
    dismissWarning,
    isWarningDismissed,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('greenware')
  const [showAddForm, setShowAddForm] = useState(false)

  const visibleWarnings = warnings.filter((w) => !isWarningDismissed(w.id))

  const [gwClayType, setGwClayType] = useState<ClayType>('white_porcelain')
  const [gwVesselType, setGwVesselType] = useState<VesselType>('cup')
  const [gwQuantity, setGwQuantity] = useState('')
  const [gwShelf, setGwShelf] = useState<ShelfArea>('A')

  const [matMaterial, setMatMaterial] = useState<RawMaterial>('feldspar')
  const [matStock, setMatStock] = useState('')
  const [matThreshold, setMatThreshold] = useState('')

  const [fpOrderId, setFpOrderId] = useState('')
  const [fpGlazeId, setFpGlazeId] = useState('')
  const [fpFiringBatchId, setFpFiringBatchId] = useState('')
  const [fpCaliber, setFpCaliber] = useState('')
  const [fpHeight, setFpHeight] = useState('')
  const [fpWeight, setFpWeight] = useState('')
  const [fpQuality, setFpQuality] = useState<QualityRating>(5)

  const handleAddGreenware = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gwQuantity) return
    // 简化处理：实际项目中应该调用 store 方法
    alert('素坯库存添加成功（演示）')
    setShowAddForm(false)
    setGwQuantity('')
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matStock || !matThreshold) return
    alert('原料库存添加成功（演示）')
    setShowAddForm(false)
    setMatStock('')
    setMatThreshold('')
  }

  const handleAddFinished = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpCaliber || !fpHeight || !fpWeight) return
    alert('成品登记成功（演示）')
    setShowAddForm(false)
    setFpCaliber('')
    setFpHeight('')
    setFpWeight('')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'greenware':
        return (
          <div className="animate-fade-in">
            {showAddForm && (
              <div className="mb-6 bg-white rounded-xl shadow-card p-6">
                <h3 className="font-serif text-lg text-earth-brown mb-4">添加素坯库存</h3>
                <form onSubmit={handleAddGreenware} className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">坯体类型</label>
                    <select
                      value={gwClayType}
                      onChange={(e) => setGwClayType(e.target.value as ClayType)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    >
                      {Object.entries(CLAY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">器型</label>
                    <select
                      value={gwVesselType}
                      onChange={(e) => setGwVesselType(e.target.value as VesselType)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    >
                      {Object.entries(VESSEL_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">数量</label>
                    <input
                      type="number"
                      value={gwQuantity}
                      onChange={(e) => setGwQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">存放区</label>
                    <select
                      value={gwShelf}
                      onChange={(e) => setGwShelf(e.target.value as ShelfArea)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    >
                      {SHELF_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </form>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-earth-brown/70 hover:bg-earth-brown/5 rounded-lg text-sm font-medium transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddGreenware}
                    className="px-5 py-2 bg-celadon-green text-white rounded-lg text-sm font-medium hover:bg-celadon-green/90 transition-all"
                  >
                    添加
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-rice-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">坯体类型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">器型</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">数量</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">存放区</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-brown/5">
                  {greenware.map((item, idx) => (
                    <tr key={item.id} className="animate-fade-up hover:bg-rice-white/30 transition-colors" style={{ animationDelay: `${idx * 0.02}s` }}>
                      <td className="px-4 py-3 text-sm">{clayTypeName(item.clayType)}</td>
                      <td className="px-4 py-3 text-sm">{vesselTypeName(item.vesselType)}</td>
                      <td className="px-4 py-3 text-sm text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-celadon-green/10 text-celadon-green">
                          {item.shelfArea}区
                        </span>
                      </td>
                    </tr>
                  ))}
                  {greenware.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-earth-brown/50">
                        暂无素坯库存
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'materials':
        return (
          <div className="animate-fade-in">
            {showAddForm && (
              <div className="mb-6 bg-white rounded-xl shadow-card p-6">
                <h3 className="font-serif text-lg text-earth-brown mb-4">添加原料库存</h3>
                <form onSubmit={handleAddMaterial} className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">原料</label>
                    <select
                      value={matMaterial}
                      onChange={(e) => setMatMaterial(e.target.value as RawMaterial)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    >
                      {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">当前库存（g）</label>
                    <input
                      type="number"
                      value={matStock}
                      onChange={(e) => setMatStock(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">预警阈值（g）</label>
                    <input
                      type="number"
                      value={matThreshold}
                      onChange={(e) => setMatThreshold(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      min="0"
                      required
                    />
                  </div>
                </form>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-earth-brown/70 hover:bg-earth-brown/5 rounded-lg text-sm font-medium transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    className="px-5 py-2 bg-celadon-green text-white rounded-lg text-sm font-medium hover:bg-celadon-green/90 transition-all"
                  >
                    添加
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-rice-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">原料名称</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">当前库存（g）</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">预警阈值（g）</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-brown/5">
                  {rawMaterials.map((item, idx) => {
                    const isLow = item.currentStock < item.minThreshold
                    return (
                      <tr key={item.id} className="animate-fade-up hover:bg-rice-white/30 transition-colors" style={{ animationDelay: `${idx * 0.02}s` }}>
                        <td className="px-4 py-3 text-sm">{materialName(item.material)}</td>
                        <td className={`px-4 py-3 text-sm text-center font-medium ${isLow ? 'text-warn-red' : ''}`}>
                          {item.currentStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{item.minThreshold.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-warn-red/10 text-warn-red">
                              库存不足
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-status-done/10 text-status-done">
                              正常
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {rawMaterials.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-earth-brown/50">
                        暂无原料库存
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'finished':
        return (
          <div className="animate-fade-in">
            {showAddForm && (
              <div className="mb-6 bg-white rounded-xl shadow-card p-6">
                <h3 className="font-serif text-lg text-earth-brown mb-4">登记成品</h3>
                <form onSubmit={handleAddFinished} className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">关联订单ID（可选）</label>
                    <input
                      type="text"
                      value={fpOrderId}
                      onChange={(e) => setFpOrderId(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">釉料配方（可选）</label>
                    <select
                      value={fpGlazeId}
                      onChange={(e) => setFpGlazeId(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    >
                      <option value="">无</option>
                      {glazes.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">烧制批次（可选）</label>
                    <input
                      type="text"
                      value={fpFiringBatchId}
                      onChange={(e) => setFpFiringBatchId(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">口径（cm）</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fpCaliber}
                      onChange={(e) => setFpCaliber(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">高度（cm）</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fpHeight}
                      onChange={(e) => setFpHeight(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">重量（g）</label>
                    <input
                      type="number"
                      value={fpWeight}
                      onChange={(e) => setFpWeight(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-brown mb-1">品相评级</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFpQuality(n as QualityRating)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            n <= fpQuality ? 'text-amber-400' : 'text-earth-brown/20'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-earth-brown/70 hover:bg-earth-brown/5 rounded-lg text-sm font-medium transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddFinished}
                    className="px-5 py-2 bg-celadon-green text-white rounded-lg text-sm font-medium hover:bg-celadon-green/90 transition-all"
                  >
                    登记
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-rice-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">缩略图</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">器型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">釉料</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">尺寸</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">重量</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-earth-brown/70">品相</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-earth-brown/70">入库时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-brown/5">
                  {finishedProducts.map((item, idx) => (
                    <tr key={item.id} className="animate-fade-up hover:bg-rice-white/30 transition-colors" style={{ animationDelay: `${idx * 0.02}s` }}>
                      <td className="px-4 py-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br from-d7ccc8 to-bcaaa4 border border-earth-brown/10 ${getVesselShape('cup')}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.orderId ? (
                          <span className="text-celadon-green text-xs">订单 #{item.orderId.slice(0, 8)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{getGlazeNameById(glazes, item.glazeId)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {item.caliber}×{item.height}cm
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item.weight}g</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-amber-400 text-sm">{qualityStars(item.qualityRating)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-earth-brown/60">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {finishedProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-earth-brown/50">
                        暂无成品库存
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="font-serif text-3xl text-earth-brown mb-1">库存管理</h1>
            <p className="text-earth-brown/60 text-sm">
              素坯 {greenware.length} 类 · 原料 {rawMaterials.length} 种 · 成品 {finishedProducts.length} 件
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 active:scale-[0.99] transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            {showAddForm ? '取消' : '添加记录'}
          </button>
        </div>

        <div className="inline-flex bg-white rounded-xl p-1 shadow-card mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value)
                setShowAddForm(false)
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.value
                  ? 'bg-clay-orange text-white shadow-md'
                  : 'text-earth-brown/70 hover:text-earth-brown'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </div>
  )
}
