import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

const categoryOptions = [
  { value: 'electronics', label: '电子' },
  { value: 'furniture', label: '家具' },
  { value: 'books', label: '书籍' },
  { value: 'clothing', label: '衣物' },
  { value: 'other', label: '其他' },
]

const conditionOptions = [
  { value: 'new', label: '全新' },
  { value: 'like-new', label: '几乎全新' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
]

interface PreviewImage {
  file: File
  previewUrl: string
}

export default function Publish() {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('electronics')
  const [condition, setCondition] = useState('good')
  const [description, setDescription] = useState('')
  const [previews, setPreviews] = useState<PreviewImage[]>([])
  const [submitting, setSubmitting] = useState(false)

  const processImageWithCanvas = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxWidth = 800
          const scale = Math.min(1, maxWidth / img.width)
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } else {
            resolve(e.target?.result as string || '')
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remaining = 3 - previews.length
    const toAdd = Array.from(files).slice(0, remaining)

    const newPreviews: PreviewImage[] = []
    for (const file of toAdd) {
      const previewUrl = await processImageWithCanvas(file)
      newPreviews.push({ file, previewUrl })
    }

    setPreviews((prev) => [...prev, ...newPreviews])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [previews.length, processImageWithCanvas])

  const handleRemovePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim() || previews.length === 0) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('category', category)
      formData.append('condition', condition)
      formData.append('description', description)
      formData.append('userId', currentUser.id)
      formData.append('userName', currentUser.name)
      formData.append('userAvatar', currentUser.avatar)

      for (const preview of previews) {
        formData.append('images', preview.file)
      }

      await axios.post('/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/')
    } catch {
      alert('发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = title.trim() && previews.length > 0 && !submitting

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      <h1 className="mb-6 text-xl font-bold text-gray-900">发布闲置物品</h1>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">物品标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的物品起个名字"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">类别</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">成色</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {conditionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">物品描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述一下物品的状况、使用时长等..."
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            上传照片 <span className="text-gray-400 font-normal">（最多3张，将自动压缩至800px宽）</span>
          </label>

          <div className="flex flex-wrap gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative h-28 w-28 overflow-hidden rounded-lg border border-gray-200"
              >
                <img
                  src={preview.previewUrl}
                  alt={`预览 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemovePreview(index)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {previews.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex h-28 w-28 flex-col items-center justify-center rounded-lg',
                  'border-2 border-dashed border-gray-300 text-gray-400',
                  'hover:border-primary hover:text-primary transition-colors'
                )}
              >
                <ImagePlus className="h-6 w-6" />
                <span className="mt-1 text-xs">添加照片</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-medium transition-colors',
            canSubmit
              ? 'bg-primary text-white hover:bg-primary-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {submitting ? '发布中...' : '发布物品'}
        </button>
      </div>
    </div>
  )
}
