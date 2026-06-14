import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, Music, FileText, Type, Check, AlertCircle } from 'lucide-react'
import { uploadSong } from '@/api'
import Footer from '@/components/Footer'

const tagOptions = ['流行', '摇滚', '电子', '民谣', '古风', '氛围', '爵士', '嘻哈']

export default function UploadPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceDigital, setPriceDigital] = useState('')
  const [priceCD, setPriceCD] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [scoreFile, setScoreFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState('')
  const [flashProgress, setFlashProgress] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const scoreInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
    } else if (selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('请填写作品名称'); return }
    if (selectedTags.length === 0) { setError('请至少选择一个风格标签'); return }
    if (!priceDigital || !priceCD) { setError('请填写价格'); return }
    if (!audioFile) { setError('请上传音频文件'); return }
    if (!scoreFile) { setError('请上传乐谱文件'); return }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('tags', JSON.stringify(selectedTags))
    formData.append('priceDigital', priceDigital)
    formData.append('priceCD', priceCD)
    formData.append('lyrics', lyrics)
    formData.append('description', description)
    formData.append('audio', audioFile)
    formData.append('score', scoreFile)
    if (coverFile) formData.append('cover', coverFile)

    setUploading(true)
    setProgress(0)

    try {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95))
      }, 33)

      await uploadSong(formData, (p) => {
        clearInterval(interval)
        setProgress(p)
      })

      setFlashProgress(true)
      setTimeout(() => {
        setFlashProgress(false)
        setUploadComplete(true)
        setProgress(100)
      }, 500)
    } catch {
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-2">上传作品</h1>
        <p className="text-gray-400 mb-8">分享你的原创音乐，让更多人听到你的声音</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-brand-violet" />
              基本信息
            </h2>
            <div>
              <label className="block text-sm text-gray-300 mb-1">作品名称 *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors" placeholder="输入作品名称" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">风格标签 *（最多3个）</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 btn-press ${selectedTags.includes(tag) ? 'gradient-bg text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">数字下载价 (¥) *</label>
                <input type="number" step="0.1" min="0" value={priceDigital} onChange={(e) => setPriceDigital(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">实体CD价 (¥) *</label>
                <input type="number" step="0.1" min="0" value={priceCD} onChange={(e) => setPriceCD(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">作品简介</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none" placeholder="描述你的作品..." />
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-brand-violet" />
              文件上传
            </h2>
            <div>
              <label className="block text-sm text-gray-300 mb-1">音频文件 (MP3, ≤20MB) *</label>
              <div onClick={() => audioInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-brand-violet/30 transition-colors">
                <Music className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{audioFile ? audioFile.name : '点击上传音频文件'}</p>
              </div>
              <input ref={audioInputRef} type="file" accept=".mp3" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">乐谱文件 (PDF, ≤10MB) *</label>
              <div onClick={() => scoreInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-brand-violet/30 transition-colors">
                <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{scoreFile ? scoreFile.name : '点击上传乐谱文件'}</p>
              </div>
              <input ref={scoreInputRef} type="file" accept=".pdf" onChange={(e) => setScoreFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">封面图片（可选）</label>
              <div onClick={() => coverInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-brand-violet/30 transition-colors">
                <p className="text-sm text-gray-400">{coverFile ? coverFile.name : '点击上传封面图片'}</p>
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-brand-violet" />
              歌词
            </h2>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={6} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none" placeholder="输入歌词，每行一句..." />
          </div>

          {(uploading || uploadComplete) && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">
                  {uploadComplete ? '上传完成' : '上传中...'}
                </span>
                <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                {uploadComplete ? (
                  <div className="h-full bg-green-500 rounded-full flex items-center justify-center transition-all duration-500" style={{ width: '100%' }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className={`h-full progress-bar-fill rounded-full ${flashProgress ? 'animate-progress-flash' : ''}`} style={{ width: `${progress}%` }} />
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || uploadComplete}
              className="flex-1 py-3 rounded-xl gradient-bg text-white font-semibold btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-all duration-300 disabled:opacity-50"
            >
              {uploading ? '上传中...' : uploadComplete ? '上传完成' : '提交作品'}
            </button>
            {uploadComplete && (
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors btn-press"
              >
                前往市集
              </button>
            )}
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}
