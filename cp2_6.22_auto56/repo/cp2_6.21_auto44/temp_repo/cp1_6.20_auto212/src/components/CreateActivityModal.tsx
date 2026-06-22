import { useState, useRef, useCallback } from 'react'
import { X, Upload, GripVertical, Calendar, Hash, FileText } from 'lucide-react'
import type { Difficulty } from '@/types'
import { DIFFICULTY_LABELS } from '@/types'

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    date: string
    difficulty: Difficulty
    description: string
    routeImages: string[]
    maxMembers: number
    location: string
  }) => void
}

const difficultyOptions: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: DIFFICULTY_LABELS.easy, color: 'bg-difficulty-easy' },
  { value: 'medium', label: DIFFICULTY_LABELS.medium, color: 'bg-difficulty-medium' },
  { value: 'hard', label: DIFFICULTY_LABELS.hard, color: 'bg-difficulty-hard' },
]

export default function CreateActivityModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateActivityModalProps) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [description, setDescription] = useState('')
  const [routeImages, setRouteImages] = useState<string[]>([])
  const [maxMembers, setMaxMembers] = useState(10)
  const [location, setLocation] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !date) return
    onSubmit({
      name: name.trim(),
      date,
      difficulty,
      description: description.trim(),
      routeImages,
      maxMembers,
      location: location.trim() || '待定',
    })
    resetForm()
  }, [name, date, difficulty, description, routeImages, maxMembers, location, onSubmit])

  const resetForm = () => {
    setName('')
    setDate('')
    setDifficulty('easy')
    setDescription('')
    setRouteImages([])
    setMaxMembers(10)
    setLocation('')
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      resetForm()
    }, 300)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 3 - routeImages.length).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setRouteImages((prev) => {
            if (prev.length >= 3) return prev
            return [...prev, ev.target!.result as string]
          })
        }
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragStart = (idx: number) => {
    dragItem.current = idx
  }

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx
  }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const updated = [...routeImages]
    const dragged = updated.splice(dragItem.current, 1)[0]
    updated.splice(dragOverItem.current, 0, dragged)
    setRouteImages(updated)
    dragItem.current = null
    dragOverItem.current = null
  }

  if (!isOpen && !isClosing) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] bg-surface-card rounded-t-2xl shadow-xl
          flex flex-col transition-transform duration-300 ease-out
          ${isClosing ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-text-primary">创建新活动</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">活动名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入活动名称"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                placeholder:text-text-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                <Calendar size={14} className="inline mr-1" />
                活动日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                <Hash size={14} className="inline mr-1" />
                最大人数
              </label>
              <input
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">难度等级</label>
            <div className="flex gap-3">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200
                    ${
                      difficulty === opt.value
                        ? 'border-forest bg-forest-50 text-forest-dark'
                        : 'border-gray-200 text-text-secondary hover:border-gray-300'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              <FileText size={14} className="inline mr-1" />
              活动描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述活动内容、路线、注意事项等"
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                placeholder:text-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">活动地点</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入活动地点"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest
                placeholder:text-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              路线图（最多3张，可拖拽排序）
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              {routeImages.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 cursor-grab group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <GripVertical size={20} className="text-white" />
                  </div>
                  <button
                    onClick={() => setRouteImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {routeImages.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center
                    text-text-secondary hover:border-forest hover:text-forest transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-[10px] mt-1">上传</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-sm text-text-secondary rounded-lg hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !date}
            className="px-5 py-2.5 text-sm font-medium bg-forest text-white rounded-lg
              hover:bg-forest-light transition-colors
              active:scale-[0.96]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建活动
          </button>
        </div>
      </div>
    </div>
  )
}
