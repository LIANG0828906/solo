import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileDown, ArrowLeft } from 'lucide-react'
import ResumePreview from '@/components/ResumePreview'
import { ResumeData, ModuleType, DEFAULT_MODULE_ORDER, THEME_CONFIG } from '@/data/resumeModel'
import { applyTheme } from '@/styles/resumeStyles'
import { exportToPDF, exportToPNG } from '@/utils/exportUtils'

interface ShareResponse {
  success: boolean
  resume?: {
    data: ResumeData
    theme: string
    moduleOrder: ModuleType[]
  }
  message?: string
}

export default function SharePage() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const previewRef = useRef<HTMLDivElement>(null)

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [theme, setTheme] = useState<string>('简洁灰')
  const [moduleOrder, setModuleOrder] = useState<ModuleType[]>(DEFAULT_MODULE_ORDER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true)
        const response = await axios.get<ShareResponse>(`/api/resumes/${hash}`)
        if (response.data.success && response.data.resume) {
          setResumeData(response.data.resume.data)
          setTheme(response.data.resume.theme)
          setModuleOrder(response.data.resume.moduleOrder)
          applyTheme(response.data.resume.theme)
        } else {
          setError(response.data.message || '简历不存在或已过期')
        }
      } catch (err) {
        setError('加载简历失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    if (hash) {
      fetchResume()
    }
  }, [hash])

  const handleExportPDF = async () => {
    if (!resumeData) return
    const currentThemeConfig = THEME_CONFIG[theme] || THEME_CONFIG['简洁灰']
    const { primary, background, text, accent } = currentThemeConfig
    await exportToPDF(resumeData, theme, { primary, background, text, accent }, setIsExporting)
  }

  const handleExportPNG = async () => {
    if (!previewRef.current) return
    await exportToPNG(previewRef.current, setIsExporting)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">正在加载简历...</p>
        </div>
      </div>
    )
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">无法加载简历</h2>
          <p className="text-gray-600 mb-6">{error || '简历数据为空'}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2196F3] to-[#1565C0] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft size={18} />
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">返回编辑器</span>
            </button>
            <div className="ml-4 h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#2196F3] to-[#1565C0] bg-clip-text text-transparent">
              简历生成器
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#2196F3] to-[#1565C0] text-white text-sm font-medium hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              <FileDown size={16} />
              导出 PDF
            </button>
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              <FileDown size={16} />
              导出 PNG
            </button>
          </div>
        </div>
      </header>

      {/* 简历预览 */}
      <main className="py-8 px-4 flex justify-center">
        <div className="relative">
          <ResumePreview
            ref={previewRef}
            data={resumeData}
            theme={theme}
            moduleOrder={moduleOrder}
          />

          {/* 导出加载遮罩 */}
          {isExporting && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[4px] z-20">
              <div className="flex flex-col items-center gap-4 bg-white px-8 py-6 rounded-xl shadow-2xl">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-700 font-medium">正在导出...</p>
              </div>
              </div>
          )}
        </div>
      </main>
    </div>
  )
}
