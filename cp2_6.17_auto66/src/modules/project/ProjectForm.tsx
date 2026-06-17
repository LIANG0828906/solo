import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload } from 'lucide-react'
import { useProjectStore } from './store'

interface ProjectFormProps {
  onClose: () => void
}

interface FormErrors {
  title?: string
  description?: string
  images?: string
}

const MAX_TITLE_LEN = 50
const MAX_DESC_LEN = 500
const MAX_IMAGES = 4
const MIN_IMAGES = 2
const MAX_IMG_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export default function ProjectForm({ onClose }: ProjectFormProps) {
  const addProject = useProjectStore(s => s.addProject)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateField = useCallback((t: string, d: string, imgs: string[]) => {
    const newErrors: FormErrors = {}
    if (!t.trim()) newErrors.title = '请输入项目名称'
    else if (t.length > MAX_TITLE_LEN) newErrors.title = `名称不能超过${MAX_TITLE_LEN}字`

    if (!d.trim()) newErrors.description = '请输入项目描述'
    else if (d.length > MAX_DESC_LEN) newErrors.description = `描述不能超过${MAX_DESC_LEN}字`

    if (imgs.length < MIN_IMAGES) newErrors.images = `请上传至少${MIN_IMAGES}张图片`
    else if (imgs.length > MAX_IMAGES) newErrors.images = `最多上传${MAX_IMAGES}张图片`

    return newErrors
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrors(validateField(title, description, images))
    }, 80)
    return () => clearTimeout(timer)
  }, [title, description, images, validateField])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages: string[] = [...images]
    const validationErrors: string[] = []

    for (let i = 0; i < files.length && newImages.length < MAX_IMAGES; i++) {
      const file = files[i]

      if (!ACCEPTED_TYPES.includes(file.type)) {
        validationErrors.push('仅支持 JPG 和 PNG 格式')
        continue
      }
      if (file.size > MAX_IMG_SIZE) {
        validationErrors.push('每张图片不能超过 2MB')
        continue
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('文件读取失败'))
          reader.readAsDataURL(file)
        })
        newImages.push(dataUrl)
      } catch {
        validationErrors.push('图片读取失败，请重试')
      }
    }

    setImages(newImages)
    if (validationErrors.length > 0) {
      setErrors(prev => ({ ...prev, images: validationErrors[0] }))
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateField(title, description, images)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const project = await addProject({
      title: title.trim(),
      description: description.trim(),
      images,
    })
    console.info('[ProjectForm] 项目已创建并持久化到 IndexedDB:', project.id, {
      title: project.title,
      imageCount: project.images.length,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">创建新项目</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目名称 <span className="text-gray-400">({title.length}/{MAX_TITLE_LEN})</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入项目名称"
              className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors ${
                errors.title ? 'border-red-400' : 'border-gray-200 focus:border-green-500'
              }`}
              maxLength={MAX_TITLE_LEN}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目描述 <span className="text-gray-400">({description.length}/{MAX_DESC_LEN})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述项目内容、改造前后变化等"
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors resize-none ${
                errors.description ? 'border-red-400' : 'border-gray-200 focus:border-green-500'
              }`}
              maxLength={MAX_DESC_LEN}
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              对比图片 <span className="text-gray-400">({images.length}/{MAX_IMAGES}，需{MIN_IMAGES}-{MAX_IMAGES}张)</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={24} />
                  <span className="text-xs mt-1">{uploading ? '上传中...' : '上传'}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {errors.images && (
              <p className="mt-1.5 text-sm text-red-500">{errors.images}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-[#27AE60] text-white font-medium hover:bg-[#219150] transition-colors"
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
