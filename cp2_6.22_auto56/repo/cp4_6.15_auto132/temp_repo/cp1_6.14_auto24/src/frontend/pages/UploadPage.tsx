import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import {
  loadImage,
  calculateCropArea,
  processImage,
  createPreviewCanvas,
  type CropArea,
  type ImageProcessResult,
} from '@/utils/canvas'

interface DropPoint {
  id: string
  name: string
  address: string
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publishYear: '',
    description: '',
    dropPointId: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<ImageProcessResult | null>(null)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [previewContainer, setPreviewContainer] = useState<HTMLDivElement | null>(null)
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewRef.current) {
      setPreviewContainer(previewRef.current)
    }
  }, [])

  useEffect(() => {
    const fetchDropPoints = async () => {
      try {
        const res = await axios.get('/api/drop-points')
        setDropPoints(res.data.points)
        if (res.data.points.length > 0) {
          setFormData(prev => ({ ...prev, dropPointId: res.data.points[0].id }))
        }
      } catch (error) {
        console.error('Failed to fetch drop points:', error)
      }
    }
    fetchDropPoints()
  }, [])

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setSelectedFile(file)

    try {
      const img = await loadImage(file)
      setLoadedImage(img)

      const area = calculateCropArea(img.naturalWidth, img.naturalHeight, 3, 4)
      setCropArea(area)

      if (previewContainer) {
        previewContainer.innerHTML = ''
        const { canvas, updateCrop } = createPreviewCanvas(previewContainer, img, 3 / 4)
        previewContainer.appendChild(canvas)
        updateCrop(area)
      }

      const result = await processImage(img, 800, 0.85, area)
      setProcessedImage(result)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('图片处理失败，请重试')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    if (!formData.title || !formData.author || !formData.dropPointId) {
      alert('请填写书名、作者和选择漂流点')
      return
    }

    if (!processedImage) {
      alert('请上传图书封面')
      return
    }

    setLoading(true)

    try {
      const uploadRes = await axios.post('/api/upload', {
        image: processedImage.dataUrl,
      })

      const bookRes = await axios.post('/api/books', {
        ...formData,
        publishYear: Number(formData.publishYear) || 0,
        coverUrl: uploadRes.data.url,
      })

      alert('图书上传成功！')
      navigate('/')
    } catch (error: any) {
      console.error('Failed to upload book:', error)
      alert(error.response?.data?.error || '上传失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!user && !authLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-brown hover:text-brown-dark transition-colors"
          >
            ← 返回地图
          </button>
        </div>

        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(92, 64, 51, 0.1)',
          }}
        >
          <h1 className="font-serif font-bold text-2xl text-brown mb-6 text-center">
            📖 上传漂流图书
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-brown font-medium mb-2">
                图书封面 *
              </label>
              <div
                ref={previewRef}
                className="mb-3 flex justify-center"
              />
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-brown/30 rounded-xl p-8 text-center hover:border-brown/50 transition-colors">
                  {selectedFile ? (
                    <div>
                      <p className="text-brown font-medium">{selectedFile.name}</p>
                      {processedImage && (
                        <p className="text-xs text-brown-light mt-1">
                          已压缩至 {processedImage.width}px 宽
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📷</p>
                      <p className="text-brown">点击选择封面图片</p>
                      <p className="text-xs text-brown-light mt-1">
                        支持 JPG、PNG 格式，将自动裁剪为 3:4 比例并压缩至 800px 宽
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brown font-medium mb-2">
                  书名 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="请输入书名"
                  className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
                />
              </div>

              <div>
                <label className="block text-brown font-medium mb-2">
                  作者 *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="请输入作者"
                  className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brown font-medium mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="可选"
                  className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
                />
              </div>

              <div>
                <label className="block text-brown font-medium mb-2">
                  出版年份
                </label>
                <input
                  type="number"
                  name="publishYear"
                  value={formData.publishYear}
                  onChange={handleInputChange}
                  placeholder="可选"
                  className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-brown font-medium mb-2">
                漂流点 *
              </label>
              <select
                name="dropPointId"
                value={formData.dropPointId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown focus:outline-none focus:border-brown transition-colors"
              >
                {dropPoints.map(point => (
                  <option key={point.id} value={point.id}>
                    {point.name} - {point.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-brown font-medium mb-2">
                图书简介
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="简单介绍一下这本书..."
                rows={4}
                className="w-full px-4 py-2.5 border border-brown/20 rounded-xl bg-white text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brown text-cream rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loading ? '上传中...' : '发布漂流图书'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
