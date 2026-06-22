import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface PlantFormData {
  name: string
  category: string
  purchaseDate: string
  wateringCycle: number
  fertilizingCycle: number
  lightRequirement: string
}

interface AddPlantModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (plant: PlantFormData) => void
}

const categoryOptions = [
  { value: 'succulent', label: '多肉' },
  { value: 'foliage', label: '观叶' },
  { value: 'flowering', label: '开花' },
  { value: 'other', label: '其他' },
]

const lightOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialFormData: PlantFormData = {
  name: '',
  category: 'succulent',
  purchaseDate: getTodayString(),
  wateringCycle: 7,
  fertilizingCycle: 30,
  lightRequirement: 'medium',
}

export default function AddPlantModal({ isOpen, onClose, onSubmit }: AddPlantModalProps) {
  const [formData, setFormData] = useState<PlantFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof PlantFormData, string>>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
      setErrors({})
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlantFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '植物名称不能为空'
    }

    if (formData.wateringCycle <= 0) {
      newErrors.wateringCycle = '浇水周期必须为正数'
    }

    if (formData.fertilizingCycle <= 0) {
      newErrors.fertilizingCycle = '施肥周期必须为正数'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof PlantFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl animate-slide-in-top">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">添加植物</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              植物名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入植物名称"
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                errors.name ? 'border-red-400' : 'border-gray-200'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              种类
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              购买日期
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              浇水周期（天）
            </label>
            <input
              type="number"
              min="1"
              value={formData.wateringCycle}
              onChange={(e) => handleChange('wateringCycle', Number(e.target.value))}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                errors.wateringCycle ? 'border-red-400' : 'border-gray-200'
              )}
            />
            {errors.wateringCycle && (
              <p className="mt-1 text-xs text-red-500">{errors.wateringCycle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              施肥周期（天）
            </label>
            <input
              type="number"
              min="1"
              value={formData.fertilizingCycle}
              onChange={(e) => handleChange('fertilizingCycle', Number(e.target.value))}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                errors.fertilizingCycle ? 'border-red-400' : 'border-gray-200'
              )}
            />
            {errors.fertilizingCycle && (
              <p className="mt-1 text-xs text-red-500">{errors.fertilizingCycle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              光照需求
            </label>
            <div className="flex gap-4">
              {lightOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors',
                    formData.lightRequirement === option.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="lightRequirement"
                    value={option.value}
                    checked={formData.lightRequirement === option.value}
                    onChange={(e) => handleChange('lightRequirement', e.target.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
