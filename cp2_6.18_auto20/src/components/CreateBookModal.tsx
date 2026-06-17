import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRESET_TAGS } from '@/types'
import { useStore } from '@/store'

interface CreateBookModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateBookModal({ open, onClose }: CreateBookModalProps) {
  const createBookList = useStore((state) => state.createBookList)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    title?: string
    description?: string
    tags?: string
  }>({})

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setSelectedTags([])
      setErrors({})
    }
  }, [open])

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!title.trim()) {
      newErrors.title = '请输入书单标题'
    }

    if (!description.trim()) {
      newErrors.description = '请输入书单描述'
    } else if (description.length > 500) {
      newErrors.description = '描述不能超过500字'
    }

    if (selectedTags.length < 1 || selectedTags.length > 3) {
      newErrors.tags = '请选择1-3个标签'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    createBookList({
      title: title.trim(),
      description: description.trim(),
      tags: selectedTags,
    })

    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl animate-slideIn">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">创建新书单</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              书单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的书单起个名字"
              className={cn(
                'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                errors.title
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-amber-200 focus:border-amber-400'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              书单描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍一下你的书单..."
              rows={4}
              maxLength={500}
              className={cn(
                'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none',
                errors.description
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-amber-200 focus:border-amber-400'
              )}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-sm text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  'text-sm',
                  description.length > 500 ? 'text-red-500' : 'text-gray-400'
                )}
              >
                {description.length}/500
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择标签 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">（选择1-3个）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {errors.tags && (
              <p className="mt-2 text-sm text-red-500">{errors.tags}</p>
            )}
            <p className="mt-2 text-sm text-gray-400">
              已选择 {selectedTags.length}/3 个标签
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              创建书单
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
