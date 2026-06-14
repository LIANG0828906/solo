import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import RippleButton from '@/components/RippleButton'
import Modal from '@/components/Modal'
import type { Resume } from '@shared/types'
import { Upload, FileText, User, Briefcase, Clock, Star, MessageSquare, Calendar } from 'lucide-react'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待筛选' },
  { key: 'interviewed', label: '已面试' },
  { key: 'hired', label: '已录用' },
  { key: 'rejected', label: '已淘汰' },
] as const

type TabKey = typeof TABS[number]['key']

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}个月前`
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000
}

export default function ResumesPage() {
  const { resumes, jobs, fetchResumes, fetchJobs, createResume } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', jobId: '' })

  useEffect(() => {
    fetchResumes()
    fetchJobs()
  }, [fetchResumes, fetchJobs])

  const filteredResumes = resumes.filter((r) => {
    if (activeTab === 'all') return true
    return r.status === activeTab
  })

  const validateFile = useCallback((file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) return '仅支持PDF、Word文件'
    if (file.size > 5 * 1024 * 1024) return '文件大小不能超过5MB'
    return null
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const error = validateFile(file)
      if (error) { alert(error); return }
      setSelectedFile(file)
      setFormModalOpen(true)
    }
  }, [validateFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = validateFile(file)
      if (error) { alert(error); return }
      setSelectedFile(file)
      setFormModalOpen(true)
    }
  }, [validateFile])

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !formData.name || !formData.email || !formData.jobId) return
    setUploading(true)
    setProgress(0)
    setFormModalOpen(false)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(timer); return 100 }
        return prev + 5
      })
    }, 100)

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (progress >= 95) { clearInterval(check); resolve() }
      }, 150)
      setTimeout(() => { clearInterval(check); resolve() }, 2200)
    })

    await createResume({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      jobId: formData.jobId,
      fileName: selectedFile.name,
    })

    clearInterval(timer)
    setProgress(100)
    setTimeout(() => {
      setUploading(false)
      setProgress(0)
      setSelectedFile(null)
      setFormData({ name: '', email: '', phone: '', jobId: '' })
    }, 500)
  }, [selectedFile, formData, createResume, progress])

  const handleSchedule = (resume: Resume) => {
    setSelectedResume(resume)
    setScheduleModalOpen(true)
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">简历库</h1>

      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragOver ? 'border-[#3b82f6] bg-blue-50 border-solid' : 'border-blue-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
      >
        <Upload className="mx-auto mb-2 text-blue-400" size={32} />
        <p className="text-gray-600">拖拽PDF/Word文件到此处上传</p>
        <p className="mt-1 text-sm text-gray-400">支持PDF、Word文件，最大5MB</p>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          id="resume-upload"
          onChange={handleFileSelect}
        />
        <label
          htmlFor="resume-upload"
          className="mt-3 inline-block cursor-pointer text-sm text-blue-500 hover:underline"
        >
          或点击选择文件
        </label>
      </div>

      {uploading && (
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-[2000ms]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">上传中... {progress}%</p>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {filteredResumes.map((resume) => (
          <div key={resume.id} className="relative rounded-lg bg-white p-4 shadow">
            {isNew(resume.uploadedAt) && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse" />
            )}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <User size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800">{resume.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Briefcase size={14} />
                  <span>{resume.jobTitle}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-400">
                  <Clock size={14} />
                  <span>{formatRelativeTime(resume.uploadedAt)}</span>
                </div>
              </div>
            </div>

            {resume.scores.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">{resume.averageScore.toFixed(1)}</span>
                <MessageSquare size={14} className="text-gray-400" />
                <span className="text-sm text-gray-400">{resume.scores.length}条评价</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  resume.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-600'
                    : resume.status === 'interviewed'
                    ? 'bg-blue-50 text-blue-600'
                    : resume.status === 'hired'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {resume.status === 'pending' ? '待筛选' : resume.status === 'interviewed' ? '已面试' : resume.status === 'hired' ? '已录用' : '已淘汰'}
              </span>
              <RippleButton variant="secondary" size="sm" onClick={() => handleSchedule(resume)}>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  安排面试
                </span>
              </RippleButton>
            </div>
          </div>
        ))}
      </div>

      {filteredResumes.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-40" />
          <p>暂无简历</p>
        </div>
      )}

      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title="上传简历">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">姓名 *</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">邮箱 *</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">手机</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">应聘职位 *</label>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400"
              value={formData.jobId}
              onChange={(e) => setFormData((p) => ({ ...p, jobId: e.target.value }))}
            >
              <option value="">请选择职位</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <FileText size={16} />
              <span className="truncate">{selectedFile.name}</span>
            </div>
          )}
          <RippleButton className="w-full" onClick={handleUpload} disabled={!formData.name || !formData.email || !formData.jobId}>
            提交上传
          </RippleButton>
        </div>
      </Modal>

      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="安排面试">
        {selectedResume && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-blue-50 px-4 py-3">
              <User size={18} className="text-blue-500" />
              <div>
                <p className="font-medium text-gray-800">{selectedResume.name}</p>
                <p className="text-sm text-gray-500">{selectedResume.jobTitle}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">请前往面试安排页面为此候选人设置面试时间。</p>
            <RippleButton className="w-full" onClick={() => setScheduleModalOpen(false)}>
              知道了
            </RippleButton>
          </div>
        )}
      </Modal>
    </div>
  )
}
