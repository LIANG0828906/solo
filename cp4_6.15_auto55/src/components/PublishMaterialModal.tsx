import { useState, useRef } from 'react'
import { X, Upload, Image, Palette } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { useStore } from '@/store'
import { MATERIAL_TYPES, CONDITION_EMOJIS } from '@/types'

const PublishMaterialModal = () => {
  const showPublishMaterial = useStore((s) => s.showPublishMaterial)
  const setShowPublishMaterial = useStore((s) => s.setShowPublishMaterial)
  const addMaterial = useStore((s) => s.addMaterial)

  const [photos, setPhotos] = useState<string[]>([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [dimensions, setDimensions] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [color, setColor] = useState('#888888')
  const [condition, setCondition] = useState(3)
  const [publisherName, setPublisherName] = useState('')
  const [contact, setContact] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showPublishMaterial) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remaining = 3 - photos.length
    const toProcess = Array.from(files).slice(0, remaining)

    toProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          setPhotos((prev) => (prev.length < 3 ? [...prev, result] : prev))
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!name.trim() || !materialType) return

    addMaterial({
      name: name.trim(),
      quantity,
      dimensions,
      materialType: materialType as any,
      color,
      condition,
      photos,
      publisherName: publisherName.trim(),
      contact: contact.trim(),
    })

    setPhotos([])
    setName('')
    setQuantity(1)
    setDimensions('')
    setMaterialType('')
    setColor('#888888')
    setCondition(3)
    setPublisherName('')
    setContact('')
    setShowColorPicker(false)
    setShowPublishMaterial(false)
  }

  const handleClose = () => {
    setShowPublishMaterial(false)
  }

  const isValid = name.trim() !== '' && materialType !== ''

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[600px] animate-fade-in rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-dark">发布余料</h2>
            <button
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  照片 <span className="text-gray-400">(最多3张)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative h-20 w-20">
                      <img
                        src={photo}
                        alt={`预览 ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      <button
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-forest/40 hover:text-forest"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入余料名称"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">尺寸</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="例如 120×60cm"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  材料类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                >
                  <option value="">请选择类型</option>
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">颜色</label>
                <div className="relative">
                  <button
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:border-forest/40"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    <Palette className="h-4 w-4 text-gray-400" />
                    <span>选择颜色</span>
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                  {showColorPicker && (
                    <div className="absolute left-0 top-full z-10 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <HexColorPicker color={color} onChange={setColor} />
                      <button
                        className="mt-2 w-full rounded-lg bg-forest/10 py-1.5 text-xs font-medium text-forest transition-colors hover:bg-forest/20"
                        onClick={() => setShowColorPicker(false)}
                      >
                        确定
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">成色</label>
                <div className="flex gap-2">
                  {CONDITION_EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all ${
                        condition === index + 1
                          ? 'ring-2 ring-forest ring-offset-1 bg-forest/5'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setCondition(index + 1)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">发布者姓名</label>
                <input
                  type="text"
                  value={publisherName}
                  onChange={(e) => setPublisherName(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">联系方式</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="请输入联系方式"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <button
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors ${
                isValid
                  ? 'bg-forest hover:bg-forest/90'
                  : 'cursor-not-allowed bg-forest/40'
              }`}
              onClick={handleSubmit}
              disabled={!isValid}
            >
              发布余料
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PublishMaterialModal
