import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  TreePine,
  Building2,
  Flower2,
  Cog,
  Waves,
  Ruler,
  Sparkles,
  Lightbulb,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import {
  ordersApi,
  SCENE_STYLE_LABELS,
  DETAIL_LEVEL_LABELS,
  type SceneStyle,
  type DetailLevel,
} from '@/api'

const SCENE_STYLES: { value: SceneStyle; icon: React.ComponentType<{ className?: string }>; gradient: string }[] = [
  { value: 'fantasy_forest', icon: TreePine, gradient: 'from-green-600 to-emerald-900' },
  { value: 'british_corner', icon: Building2, gradient: 'from-amber-700 to-stone-800' },
  { value: 'japanese_garden', icon: Flower2, gradient: 'from-pink-600 to-rose-900' },
  { value: 'steampunk', icon: Cog, gradient: 'from-orange-600 to-amber-900' },
  { value: 'underwater', icon: Waves, gradient: 'from-cyan-600 to-blue-900' },
]

const DETAIL_LEVELS: { value: DetailLevel; description: string }[] = [
  { value: 'normal', description: '标准工艺，适合日常展示' },
  { value: 'high', description: '精细雕刻，细节丰富' },
  { value: 'ultra', description: '极致工艺，微缩级细节' },
]

export default function SubmitOrder() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [sceneStyle, setSceneStyle] = useState<SceneStyle>('fantasy_forest')
  const [width, setWidth] = useState<number | ''>(20)
  const [height, setHeight] = useState<number | ''>(15)
  const [depth, setDepth] = useState<number | ''>(10)
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('normal')
  const [hasLighting, setHasLighting] = useState(false)
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setReferenceImages((prev) => [...prev, result])
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      Array.from(files).forEach(handleFile)
    },
    [handleFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !customerEmail.trim()) return
    if (!width || !height || !depth) return

    setIsSubmitting(true)
    try {
      const order = await ordersApi.create({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        sceneStyle,
        width: Number(width),
        height: Number(height),
        depth: Number(depth),
        detailLevel,
        hasLighting,
        referenceImages,
      })
      navigate(`/order/${order.id}`)
    } catch (error) {
      console.error('创建订单失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    customerName.trim() !== '' &&
    customerEmail.trim() !== '' &&
    width !== '' &&
    height !== '' &&
    depth !== '' &&
    Number(width) > 0 &&
    Number(height) > 0 &&
    Number(depth) > 0

  return (
    <div className="min-h-screen w-full py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            定制微缩景观订单
          </h1>
          <p className="text-gray-400 text-sm">填写以下信息，开启您的微缩世界之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              客户信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="input-field">
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  姓名
                </label>
                <input
                  type="text"
                  placeholder="请输入您的姓名"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="input-field">
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  邮箱
                </label>
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              场景风格
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SCENE_STYLES.map(({ value, icon: Icon, gradient }) => {
                const isSelected = sceneStyle === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSceneStyle(value)}
                    className={`
                      relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                      transition-all duration-300 cursor-pointer overflow-hidden
                      ${isSelected
                        ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(156,39,176,0.5)] scale-105'
                        : 'ring-1 ring-white/10 hover:ring-white/20 hover:scale-102'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? 'rgba(156, 39, 176, 0.15)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white text-center">
                      {SCENE_STYLE_LABELS[value]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Ruler className="w-5 h-5 text-purple-400" />
              尺寸规格
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="input-field">
                <label className="text-xs text-gray-400 mb-1">宽度 (cm)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="20"
                  value={width}
                  onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="input-field">
                <label className="text-xs text-gray-400 mb-1">高度 (cm)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="15"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="input-field">
                <label className="text-xs text-gray-400 mb-1">深度 (cm)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              精细度等级
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DETAIL_LEVELS.map(({ value, description }) => {
                const isSelected = detailLevel === value
                return (
                  <label
                    key={value}
                    className={`
                      flex flex-col p-4 rounded-xl cursor-pointer transition-all duration-300
                      ${isSelected
                        ? 'bg-purple-500/15 ring-2 ring-purple-500 shadow-[0_0_15px_rgba(156,39,176,0.3)]'
                        : 'bg-white/5 ring-1 ring-white/10 hover:ring-white/20'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${isSelected ? 'border-purple-500' : 'border-gray-500'}
                        `}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                      </div>
                      <input
                        type="radio"
                        name="detailLevel"
                        value={value}
                        checked={isSelected}
                        onChange={() => setDetailLevel(value)}
                        className="sr-only"
                      />
                      <span className="font-medium text-white">{DETAIL_LEVEL_LABELS[value]}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 ml-8">{description}</p>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white">灯光组件</h2>
                  <p className="text-xs text-gray-400 mt-0.5">内置 LED 灯光系统，营造氛围</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasLighting(!hasLighting)}
                className={`
                  relative w-14 h-8 rounded-full transition-all duration-300
                  ${hasLighting ? 'bg-purple-600' : 'bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300
                    ${hasLighting ? 'left-7' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              参考图片
            </h2>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/15 hover:border-purple-500/50 hover:bg-white/5'
                }
              `}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-purple-400' : 'text-gray-400'}`} />
              <p className="text-sm text-white mb-1">
                拖拽图片到此处，或 <span className="text-purple-400 font-medium">点击上传</span>
              </p>
              <p className="text-xs text-gray-500">支持 JPG、PNG 等常见图片格式</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {referenceImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 list-enter">
                {referenceImages.map((src, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden ring-1 ring-white/10"
                  >
                    <img src={src} alt={`参考图 ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white
                        flex items-center justify-center opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-2 pb-8">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="btn-base btn-primary px-10 py-3 text-base min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交订单'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
