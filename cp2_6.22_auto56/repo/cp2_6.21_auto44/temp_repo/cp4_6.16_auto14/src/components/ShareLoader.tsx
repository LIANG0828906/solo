import { useState, useEffect, memo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { loadCourse, saveCourse } from '@/utils/storage'
import useEditorStore from '@/stores/editorStore'
import { cn } from '@/lib/utils'
import { AlertCircle, Loader2 } from 'lucide-react'

const ShareLoader = memo(function ShareLoader() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const importCourse = useEditorStore((s) => s.importCourse)
  const setCurrentCourse = useEditorStore((s) => s.setCurrentCourse)
  const loadCourseById = useEditorStore((s) => s.loadCourseById)

  const [status, setStatus] = useState<'loading' | 'found' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!courseId) {
      setStatus('error')
      setErrorMsg('课件 ID 无效')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const result = await loadCourse(courseId)
        if (cancelled) return
        if (result) {
          setStatus('found')
          await loadCourseById(courseId)
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 500)
        } else {
          setStatus('error')
          setErrorMsg('未找到该课件，可能已被删除或链接无效')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg('加载课件时发生错误')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId, importCourse, setCurrentCourse, navigate, loadCourseById])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
          <p className="text-sm text-gray-500">正在加载课件...</p>
        </div>
      </div>
    )
  }

  if (status === 'found') {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">课件加载成功，正在跳转...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-canvas">
      <div className="flex flex-col items-center gap-4 text-center px-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">课件加载失败</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
        <Link
          to="/"
          className="mt-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
})

export default ShareLoader
