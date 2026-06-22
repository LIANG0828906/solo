import React, { useState } from 'react'
import { X, Hammer, Clock } from 'lucide-react'
import { useStore } from '@/store'
import { MATERIAL_TYPES, DIFFICULTIES } from '@/types'
import type { MaterialType, Difficulty } from '@/types'

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  '新手': 'bg-green-100 text-green-700 border-green-300',
  '进阶': 'bg-blue-100 text-blue-700 border-blue-300',
  '专家': 'bg-red-100 text-red-700 border-red-300',
}

const DIFFICULTY_RADIO_COLORS: Record<Difficulty, string> = {
  '新手': 'accent-green-600',
  '进阶': 'accent-blue-600',
  '专家': 'accent-red-600',
}

const PublishProjectModal: React.FC = React.memo(() => {
  const { showPublishProject, setShowPublishProject, addProject, materials } = useStore()

  const [name, setName] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<MaterialType[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('新手')
  const [estimatedHours, setEstimatedHours] = useState(1)
  const [publisherName, setPublisherName] = useState('')
  const [contact, setContact] = useState('')

  if (!showPublishProject) return null

  const toggleType = (type: MaterialType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const isValid =
    name.trim() !== '' &&
    selectedTypes.length >= 3 &&
    estimatedHours >= 1 &&
    estimatedHours <= 100

  const handleSubmit = () => {
    if (!isValid) return
    addProject({
      name: name.trim(),
      requiredMaterialTypes: selectedTypes,
      difficulty,
      estimatedHours,
      publisherName: publisherName.trim(),
      contact: contact.trim(),
    })
    setShowPublishProject(false)
  }

  const handleClose = () => {
    setShowPublishProject(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.25s_ease]">
      <div className="bg-white rounded-2xl w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto animate-[fadeIn_0.3s_ease]">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Hammer size={20} className="text-[#2C5F3B]" />
            发布项目灵感
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F3B]/40 focus:border-[#2C5F3B] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所需材料类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium ${
                  selectedTypes.length >= 3 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                已选 {selectedTypes.length}/3+
              </span>
              {selectedTypes.length > 0 && selectedTypes.length < 3 && (
                <span className="text-xs text-red-500">请至少选择3种材料类型</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_TYPES.map((type) => {
                const checked = selectedTypes.includes(type)
                return (
                  <label
                    key={type}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#2C5F3B]/10 border-[#2C5F3B] text-[#2C5F3B] font-medium'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleType(type)}
                      className="accent-[#2C5F3B] w-3.5 h-3.5"
                    />
                    {type}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              难度等级
            </label>
            <div className="flex gap-3">
              {DIFFICULTIES.map((d) => (
                <label
                  key={d}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    difficulty === d
                      ? DIFFICULTY_COLORS[d]
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={d}
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                    className={DIFFICULTY_RADIO_COLORS[d]}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              预计工时（小时）
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={estimatedHours}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v)) setEstimatedHours(Math.min(100, Math.max(1, v)))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F3B]/40 focus:border-[#2C5F3B] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              发布者姓名
            </label>
            <input
              type="text"
              value={publisherName}
              onChange={(e) => setPublisherName(e.target.value)}
              placeholder="输入姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F3B]/40 focus:border-[#2C5F3B] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              联系方式
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="输入联系方式"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F3B]/40 focus:border-[#2C5F3B] text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2C5F3B' }}
            >
              发布项目
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

PublishProjectModal.displayName = 'PublishProjectModal'

export default PublishProjectModal
