import { useState } from 'react'
import { Plus, X, Edit2, Trash2, FlaskConical, Thermometer } from 'lucide-react'
import {
  useAppStore,
  GLAZE_BASE_LABELS,
  MATERIAL_LABELS,
} from '@/stores/useAppStore'
import { getGlazeGradient, materialName, glazeBaseName } from '@/utils/format'
import type { GlazeFormula, GlazeBase, RawMaterial, GlazeIngredient } from '../../shared/types'

const BASE_OPTIONS: Array<{ value: GlazeBase; label: string }> = [
  { value: 'transparent', label: '透明' },
  { value: 'opaque', label: '乳浊' },
  { value: 'crystalline', label: '结晶' },
  { value: 'metallic', label: '金属' },
]

const MATERIAL_OPTIONS: Array<{ value: RawMaterial; label: string }> = [
  { value: 'feldspar', label: '长石' },
  { value: 'quartz', label: '石英' },
  { value: 'kaolin', label: '高岭土' },
  { value: 'limestone', label: '石灰石' },
  { value: 'iron_oxide', label: '氧化铁' },
  { value: 'cobalt_oxide', label: '氧化钴' },
]

interface FormIngredient {
  material: RawMaterial
  percentage: string
}

function GlazeForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initialData?: GlazeFormula
  onSubmit: (data: Partial<GlazeFormula>) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const isEdit = !!initialData
  const [name, setName] = useState(initialData?.name || '')
  const [baseType, setBaseType] = useState<GlazeBase>(initialData?.baseType || 'transparent')
  const [targetTempMin, setTargetTempMin] = useState(String(initialData?.targetTempMin || 1200))
  const [targetTempMax, setTargetTempMax] = useState(String(initialData?.targetTempMax || 1250))
  const [heatingCurve, setHeatingCurve] = useState(initialData?.heatingCurve || '')
  const [holdingTime, setHoldingTime] = useState(String(initialData?.holdingTime || 30))
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    initialData?.ingredients.map((i) => ({
      material: i.material,
      percentage: String(i.percentage),
    })) || [
      { material: 'feldspar', percentage: '40' },
      { material: 'quartz', percentage: '25' },
      { material: 'kaolin', percentage: '20' },
      { material: 'limestone', percentage: '15' },
    ],
  )
  const [error, setError] = useState('')

  const totalPct = ingredients.reduce(
    (sum, ing) => sum + (parseFloat(ing.percentage) || 0),
    0,
  )
  const isPctValid = Math.abs(totalPct - 100) < 0.01

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('请输入配方名称')
      return
    }
    if (!isPctValid) {
      setError(`配料百分比总和必须为100%，当前为${totalPct.toFixed(1)}%`)
      return
    }

    onSubmit({
      name: name.trim(),
      baseType,
      targetTempMin: parseInt(targetTempMin),
      targetTempMax: parseInt(targetTempMax),
      heatingCurve: heatingCurve.trim(),
      holdingTime: parseInt(holdingTime),
      ingredients: ingredients.map((ing) => ({
        material: ing.material,
        percentage: parseFloat(ing.percentage),
      })),
    })
  }

  const updateIngredient = (idx: number, field: 'material' | 'percentage', value: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)),
    )
  }

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { material: 'feldspar', percentage: '0' }])
  }

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">配方名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
            placeholder="如：青瓷釉"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">基础釉类型</label>
          <select
            value={baseType}
            onChange={(e) => setBaseType(e.target.value as GlazeBase)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          >
            {BASE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">最低温度（°C）</label>
          <input
            type="number"
            value={targetTempMin}
            onChange={(e) => setTargetTempMin(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">最高温度（°C）</label>
          <input
            type="number"
            value={targetTempMax}
            onChange={(e) => setTargetTempMax(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-earth-brown mb-1">保温时间（分钟）</label>
          <input
            type="number"
            value={holdingTime}
            onChange={(e) => setHoldingTime(e.target.value)}
            className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-earth-brown mb-1">升温曲线描述</label>
        <textarea
          value={heatingCurve}
          onChange={(e) => setHeatingCurve(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-earth-brown/20 rounded-lg bg-rice-white/50 text-sm focus:border-celadon-green transition-all resize-none"
          placeholder="如：标准还原焰，升温速率150°C/小时"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-earth-brown">配料表</label>
          <button
            type="button"
            onClick={addIngredient}
            className="text-xs text-celadon-green hover:text-celadon-green/80 flex items-center gap-1"
          >
            <Plus size={14} /> 添加原料
          </button>
        </div>
        <div className={`p-3 rounded-lg border ${isPctValid ? 'border-earth-brown/10' : 'border-red-400'} bg-rice-white/30`}>
          <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-earth-brown/50">
            <div className="col-span-5">原料</div>
            <div className="col-span-5">百分比（%）</div>
            <div className="col-span-2"></div>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-2 last:mb-0">
              <div className="col-span-5">
                <select
                  value={ing.material}
                  onChange={(e) => updateIngredient(idx, 'material', e.target.value)}
                  className="w-full px-2 py-1.5 border border-earth-brown/20 rounded text-sm focus:border-celadon-green transition-all"
                >
                  {MATERIAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={ing.percentage}
                  onChange={(e) => updateIngredient(idx, 'percentage', e.target.value)}
                  className="w-full px-2 py-1.5 border border-earth-brown/20 rounded text-sm focus:border-celadon-green transition-all"
                />
              </div>
              <div className="col-span-2 flex justify-center">
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-earth-brown/40 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-earth-brown/10">
            <span className="text-sm text-earth-brown/60">总计</span>
            <span
              className={`text-sm font-medium ${
                isPctValid ? 'text-celadon-green' : 'text-red-500'
              }`}
            >
              {totalPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 transition-all"
        >
          {isEdit ? '保存修改' : '创建配方'}
        </button>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-all"
          >
            <Trash2 size={18} />
          </button>
        )}
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

function GlazeCard({
  glaze,
  onEdit,
  delay = 0,
}: {
  glaze: GlazeFormula
  onEdit: () => void
  delay?: number
}) {
  const gradient = getGlazeGradient(glaze.name)
  const isLight = glaze.name.includes('白') || glaze.name.includes('青瓷') || glaze.name.includes('吴须')

  return (
    <div
      onClick={onEdit}
      className="card-animate rounded-xl overflow-hidden cursor-pointer group"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="h-32 p-4 flex flex-col justify-end"
        style={{ background: gradient }}
      >
        <h3
          className={`font-serif text-xl font-semibold ${
            isLight ? 'text-earth-brown' : 'text-white'
          }`}
        >
          {glaze.name}
        </h3>
        <p
          className={`text-sm ${
            isLight ? 'text-earth-brown/70' : 'text-white/70'
          }`}
        >
          {glazeBaseName(glaze.baseType)}
        </p>
      </div>
      <div className="bg-white p-4 border-t border-earth-brown/5">
        <div className="flex items-center gap-2 text-sm text-earth-brown/60 mb-3">
          <Thermometer size={14} />
          <span>{glaze.targetTempMin} - {glaze.targetTempMax}°C</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {glaze.ingredients.slice(0, 3).map((ing, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 rounded-full bg-rice-white text-earth-brown/70"
            >
              {materialName(ing.material)} {ing.percentage}%
            </span>
          ))}
          {glaze.ingredients.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rice-white text-earth-brown/50">
              +{glaze.ingredients.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GlazesPage() {
  const { glazes, createGlaze, updateGlaze, deleteGlaze } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingGlaze, setEditingGlaze] = useState<GlazeFormula | null>(null)

  const handleSubmit = async (data: Partial<GlazeFormula>) => {
    if (editingGlaze) {
      await updateGlaze(editingGlaze.id, data)
    } else {
      await createGlaze(data)
    }
    setShowForm(false)
    setEditingGlaze(null)
  }

  const handleDelete = async () => {
    if (!editingGlaze) return
    if (confirm(`确定删除配方"${editingGlaze.name}"？`)) {
      await deleteGlaze(editingGlaze.id)
      setShowForm(false)
      setEditingGlaze(null)
    }
  }

  const handleEdit = (glaze: GlazeFormula) => {
    setEditingGlaze(glaze)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingGlaze(null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="font-serif text-3xl text-earth-brown mb-1">釉料配方管理</h1>
            <p className="text-earth-brown/60 text-sm">共 {glazes.length} 个配方</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 active:scale-[0.99] transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            新建配方
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-card p-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-earth-brown">
                {editingGlaze ? '编辑配方' : '新建配方'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingGlaze(null)
                }}
                className="p-2 text-earth-brown/40 hover:text-earth-brown/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <GlazeForm
              initialData={editingGlaze || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingGlaze(null)
              }}
              onDelete={editingGlaze ? handleDelete : undefined}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {glazes.map((glaze, idx) => (
            <GlazeCard
              key={glaze.id}
              glaze={glaze}
              onEdit={() => handleEdit(glaze)}
              delay={0.05 + idx * 0.03}
            />
          ))}
        </div>

        {glazes.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center animate-fade-up">
            <FlaskConical size={48} className="mx-auto text-earth-brown/20 mb-3" />
            <p className="text-earth-brown/50">暂无釉料配方，点击右上角创建第一个</p>
          </div>
        )}
      </div>
    </div>
  )
}
