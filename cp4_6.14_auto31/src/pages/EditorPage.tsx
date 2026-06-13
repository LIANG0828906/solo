import { useEffect, useRef, useState } from 'react'
import {
  Download,
  Image,
  FileText,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import useResumeStore from '@/store/useResumeStore'
import ResumePreview from '@/components/ResumePreview'
import {
  exportToPDF,
  exportToPNG,
  generateShareLink,
  copyToClipboard,
} from '@/utils/exportUtils'
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateDateRange,
  MAX_WORK_EXPERIENCE,
  MAX_EDUCATION,
  MAX_SKILLS,
  MAX_PROJECTS,
  ModuleType,
  WorkExperience,
  Education,
  Skill,
  Project,
  THEME_CONFIG,
} from '@/data/resumeModel'
import { applyTheme } from '@/styles/resumeStyles'
import { cn } from '@/lib/utils'

// 定义表单错误类型
interface FormErrors {
  [key: string]: string
}

export default function EditorPage() {
  // 从 store 获取状态和方法
  const {
    resumeData,
    theme,
    moduleOrder,
    setTheme,
    setModuleOrder,
    updatePersonal,
    addWork,
    updateWork,
    removeWork,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addProject,
    updateProject,
    removeProject,
  } = useResumeStore()

  // 预览组件的 ref，用于导出
  const previewRef = useRef<HTMLDivElement>(null)

  // 加载状态
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)

  // 分享链接
  const [shareUrl, setShareUrl] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // 表单错误
  const [errors, setErrors] = useState<FormErrors>({})
  const [visibleErrors, setVisibleErrors] = useState<FormErrors>({})

  // 技能输入
  const [skillInput, setSkillInput] = useState('')

  // 主题下拉菜单
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const themeDropdownRef = useRef<HTMLDivElement>(null)

  // 主题名称列表
  const themeNames = Object.keys(THEME_CONFIG)

  // 初始化主题
  useEffect(() => {
    applyTheme(theme)
  }, [])

  // 切换主题时应用主题
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsThemeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 错误提示淡入动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleErrors(errors)
    }, 300)
    return () => clearTimeout(timer)
  }, [errors])

  // 验证个人信息
  const validatePersonalField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!validateRequired(value)) return '姓名不能为空'
        break
      case 'email':
        if (!validateRequired(value)) return '邮箱不能为空'
        if (!validateEmail(value)) return '邮箱格式不正确'
        break
      case 'phone':
        if (!validateRequired(value)) return '手机号不能为空'
        if (!validatePhone(value)) return '手机号格式不正确'
        break
      default:
        break
    }
    return ''
  }

  // 处理个人信息输入变化
  const handlePersonalChange = (
    field: keyof typeof resumeData.personal,
    value: string
  ) => {
    updatePersonal(field, value)
    const error = validatePersonalField(field, value)
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[`personal.${field}`] = error
      } else {
        delete newErrors[`personal.${field}`]
      }
      return newErrors
    })
  }

  // 添加工作经历
  const handleAddWork = () => {
    if (resumeData.work.length >= MAX_WORK_EXPERIENCE) return
    const newWork: WorkExperience = {
      id: uuidv4(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: [],
    }
    addWork(newWork)
  }

  // 更新工作经历
  const handleWorkChange = (
    id: string,
    field: keyof WorkExperience,
    value: string
  ) => {
    updateWork(id, field, value)
    const workItem = resumeData.work.find((w) => w.id === id)
    if (!workItem) return

    const index = resumeData.work.findIndex((w) => w.id === id)
    const newErrors = { ...errors }

    if (field === 'company') {
      if (!validateRequired(value)) {
        newErrors[`work[${index}].company`] = '公司名称不能为空'
      } else {
        delete newErrors[`work[${index}].company`]
      }
    }
    if (field === 'position') {
      if (!validateRequired(value)) {
        newErrors[`work[${index}].position`] = '职位不能为空'
      } else {
        delete newErrors[`work[${index}].position`]
      }
    }
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : workItem.startDate
      const end = field === 'endDate' ? value : workItem.endDate
      if (start && end && !validateDateRange(start, end)) {
        newErrors[`work[${index}].date`] = '开始日期不能晚于结束日期'
      } else {
        delete newErrors[`work[${index}].date`]
      }
    }

    setErrors(newErrors)
  }

  // 删除工作经历
  const handleRemoveWork = (id: string) => {
    removeWork(id)
    // 清除相关错误
    const index = resumeData.work.findIndex((w) => w.id === id)
    const newErrors = { ...errors }
    delete newErrors[`work[${index}].company`]
    delete newErrors[`work[${index}].position`]
    delete newErrors[`work[${index}].date`]
    setErrors(newErrors)
  }

  // 添加教育背景
  const handleAddEducation = () => {
    if (resumeData.education.length >= MAX_EDUCATION) return
    const newEdu: Education = {
      id: uuidv4(),
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: '',
    }
    addEducation(newEdu)
  }

  // 更新教育背景
  const handleEducationChange = (
    id: string,
    field: keyof Education,
    value: string
  ) => {
    updateEducation(id, field, value)
    const eduItem = resumeData.education.find((e) => e.id === id)
    if (!eduItem) return

    const index = resumeData.education.findIndex((e) => e.id === id)
    const newErrors = { ...errors }

    if (field === 'school') {
      if (!validateRequired(value)) {
        newErrors[`education[${index}].school`] = '学校名称不能为空'
      } else {
        delete newErrors[`education[${index}].school`]
      }
    }
    if (field === 'degree') {
      if (!validateRequired(value)) {
        newErrors[`education[${index}].degree`] = '学历不能为空'
      } else {
        delete newErrors[`education[${index}].degree`]
      }
    }
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : eduItem.startDate
      const end = field === 'endDate' ? value : eduItem.endDate
      if (start && end && !validateDateRange(start, end)) {
        newErrors[`education[${index}].date`] = '开始日期不能晚于结束日期'
      } else {
        delete newErrors[`education[${index}].date`]
      }
    }

    setErrors(newErrors)
  }

  // 删除教育背景
  const handleRemoveEducation = (id: string) => {
    removeEducation(id)
    const index = resumeData.education.findIndex((e) => e.id === id)
    const newErrors = { ...errors }
    delete newErrors[`education[${index}].school`]
    delete newErrors[`education[${index}].degree`]
    delete newErrors[`education[${index}].date`]
    setErrors(newErrors)
  }

  // 添加技能
  const handleAddSkill = () => {
    if (!skillInput.trim()) return
    if (resumeData.skills.length >= MAX_SKILLS) return

    const newSkill: Skill = {
      id: uuidv4(),
      name: skillInput.trim(),
      level: 80,
      category: '',
    }
    addSkill(newSkill)
    setSkillInput('')
  }

  // 技能输入框按键处理
  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  // 添加项目经历
  const handleAddProject = () => {
    if (resumeData.projects.length >= MAX_PROJECTS) return
    const newProject: Project = {
      id: uuidv4(),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
      technologies: [],
      highlights: [],
    }
    addProject(newProject)
  }

  // 更新项目经历
  const handleProjectChange = (
    id: string,
    field: keyof Project,
    value: string
  ) => {
    updateProject(id, field, value)
    const projectItem = resumeData.projects.find((p) => p.id === id)
    if (!projectItem) return

    const index = resumeData.projects.findIndex((p) => p.id === id)
    const newErrors = { ...errors }

    if (field === 'name') {
      if (!validateRequired(value)) {
        newErrors[`projects[${index}].name`] = '项目名称不能为空'
      } else {
        delete newErrors[`projects[${index}].name`]
      }
    }
    if (field === 'role') {
      if (!validateRequired(value)) {
        newErrors[`projects[${index}].role`] = '担任角色不能为空'
      } else {
        delete newErrors[`projects[${index}].role`]
      }
    }
    if (field === 'startDate' || field === 'endDate') {
      const start = field === 'startDate' ? value : projectItem.startDate
      const end = field === 'endDate' ? value : projectItem.endDate
      if (start && end && !validateDateRange(start, end)) {
        newErrors[`projects[${index}].date`] = '开始日期不能晚于结束日期'
      } else {
        delete newErrors[`projects[${index}].date`]
      }
    }

    setErrors(newErrors)
  }

  // 删除项目经历
  const handleRemoveProject = (id: string) => {
    removeProject(id)
    const index = resumeData.projects.findIndex((p) => p.id === id)
    const newErrors = { ...errors }
    delete newErrors[`projects[${index}].name`]
    delete newErrors[`projects[${index}].role`]
    delete newErrors[`projects[${index}].date`]
    setErrors(newErrors)
  }

  // 导出 PDF
  const handleExportPDF = async () => {
    if (isExporting) return
    try {
      const currentThemeConfig = THEME_CONFIG[theme] || THEME_CONFIG['简洁灰']
      const { primary, background, text, accent } = currentThemeConfig
      await exportToPDF(
        resumeData,
        theme,
        { primary, background, text, accent },
        setIsExporting
      )
    } catch (error) {
      console.error('导出PDF失败:', error)
    }
  }

  // 导出 PNG
  const handleExportPNG = async () => {
    if (!previewRef.current || isExporting) return
    try {
      await exportToPNG(previewRef.current, setIsExporting)
    } catch (error) {
      console.error('导出PNG失败:', error)
    }
  }

  // 生成分享链接
  const handleGenerateShare = async () => {
    if (isGeneratingShare) return
    try {
      const url = await generateShareLink(resumeData, setIsGeneratingShare)
      setShareUrl(url)
    } catch (error) {
      console.error('生成分享链接失败:', error)
    }
  }

  // 复制分享链接
  const handleCopyShare = async () => {
    if (!shareUrl) return
    try {
      await copyToClipboard(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 处理模块重新排序
  const handleModuleReorder = (newOrder: ModuleType[]) => {
    setModuleOrder(newOrder)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* 左侧：应用名称 */}
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">简历生成器</h1>
        </div>

        {/* 中间：主题切换下拉菜单 */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            <span>主题：{theme}</span>
            <svg
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isThemeDropdownOpen && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* 下拉菜单 */}
          {isThemeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {themeNames.map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setTheme(themeName)
                    setIsThemeDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-200',
                    theme === themeName && 'bg-blue-50 text-blue-600'
                  )}
                >
                  {themeName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：导出和分享按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
          >
            <Image className="w-4 h-4" />
            <span>导出PNG</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>导出PDF</span>
          </button>
          <button
            onClick={handleGenerateShare}
            disabled={isGeneratingShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>
        </div>
      </header>

      {/* 分享链接区域 */}
      {shareUrl && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm text-blue-700 font-medium">分享链接：</span>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded text-sm text-gray-700 focus:outline-none"
            />
          </div>
          <button
            onClick={handleCopyShare}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ml-4',
              isCopied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 主体布局 */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左侧：表单区域 */}
        <div className="w-full lg:w-[35%] border-r border-gray-200 bg-white overflow-y-auto p-6 space-y-6">
          {/* 个人信息区块 */}
          <section className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              个人信息
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resumeData.personal.name}
                  onChange={(e) => handlePersonalChange('name', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                    errors['personal.name']
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  )}
                  placeholder="请输入姓名"
                />
                {visibleErrors['personal.name'] && (
                  <p className="mt-1 text-xs text-red-500 animate-fade-in">
                    {visibleErrors['personal.name']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  职位
                </label>
                <input
                  type="text"
                  value={resumeData.personal.title}
                  onChange={(e) => handlePersonalChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="请输入职位"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={resumeData.personal.email}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                    errors['personal.email']
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  )}
                  placeholder="请输入邮箱"
                />
                {visibleErrors['personal.email'] && (
                  <p className="mt-1 text-xs text-red-500 animate-fade-in">
                    {visibleErrors['personal.email']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  手机 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={resumeData.personal.phone}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                    errors['personal.phone']
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  )}
                  placeholder="请输入手机号"
                />
                {visibleErrors['personal.phone'] && (
                  <p className="mt-1 text-xs text-red-500 animate-fade-in">
                    {visibleErrors['personal.phone']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所在地
                </label>
                <input
                  type="text"
                  value={resumeData.personal.location}
                  onChange={(e) => handlePersonalChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="请输入所在地"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  个人简介
                </label>
                <textarea
                  value={resumeData.personal.summary}
                  onChange={(e) => handlePersonalChange('summary', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                  placeholder="请输入个人简介"
                />
              </div>
            </div>
          </section>

          {/* 工作经历区块 */}
          <section className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-green-600 rounded-full"></span>
                工作经历
              </h2>
              <button
                onClick={handleAddWork}
                disabled={resumeData.work.length >= MAX_WORK_EXPERIENCE}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            <div className="space-y-4">
              {resumeData.work.map((work, index) => (
                <div
                  key={work.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <button
                      onClick={() => handleRemoveWork(work.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">第 {index + 1} 条</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={work.company}
                        onChange={(e) =>
                          handleWorkChange(work.id, 'company', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                          errors[`work[${index}].company`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                        )}
                        placeholder="请输入公司名称"
                      />
                      {visibleErrors[`work[${index}].company`] && (
                        <p className="mt-1 text-xs text-red-500 animate-fade-in">
                          {visibleErrors[`work[${index}].company`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        职位 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={work.position}
                        onChange={(e) =>
                          handleWorkChange(work.id, 'position', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                          errors[`work[${index}].position`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                        )}
                        placeholder="请输入职位"
                      />
                      {visibleErrors[`work[${index}].position`] && (
                        <p className="mt-1 text-xs text-red-500 animate-fade-in">
                          {visibleErrors[`work[${index}].position`]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          开始日期
                        </label>
                        <input
                          type="date"
                          value={work.startDate}
                          onChange={(e) =>
                            handleWorkChange(work.id, 'startDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          结束日期
                        </label>
                        <input
                          type="date"
                          value={work.endDate}
                          onChange={(e) =>
                            handleWorkChange(work.id, 'endDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    {visibleErrors[`work[${index}].date`] && (
                      <p className="text-xs text-red-500 animate-fade-in">
                        {visibleErrors[`work[${index}].date`]}
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        工作描述
                      </label>
                      <textarea
                        value={work.description}
                        onChange={(e) =>
                          handleWorkChange(work.id, 'description', e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="请输入工作描述"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        成就（可选，每行一个）
                      </label>
                      <textarea
                        value={work.achievements.join('\n')}
                        onChange={(e) => {
                          const achievements = e.target.value
                            .split('\n')
                            .filter((line) => line.trim())
                          updateWork(work.id, 'achievements', achievements)
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="请输入工作成就，每行一个"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {resumeData.work.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  暂无工作经历，点击上方按钮添加
                </p>
              )}
              {resumeData.work.length >= MAX_WORK_EXPERIENCE && (
                <p className="text-center text-xs text-orange-500">
                  最多可添加 {MAX_WORK_EXPERIENCE} 条工作经历
                </p>
              )}
            </div>
          </section>

          {/* 教育背景区块 */}
          <section className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
                教育背景
              </h2>
              <button
                onClick={handleAddEducation}
                disabled={resumeData.education.length >= MAX_EDUCATION}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            <div className="space-y-4">
              {resumeData.education.map((edu, index) => (
                <div
                  key={edu.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <button
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">第 {index + 1} 条</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        学校名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) =>
                          handleEducationChange(edu.id, 'school', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                          errors[`education[${index}].school`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                        )}
                        placeholder="请输入学校名称"
                      />
                      {visibleErrors[`education[${index}].school`] && (
                        <p className="mt-1 text-xs text-red-500 animate-fade-in">
                          {visibleErrors[`education[${index}].school`]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          学历 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            handleEducationChange(edu.id, 'degree', e.target.value)
                          }
                          className={cn(
                            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                            errors[`education[${index}].degree`]
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300'
                          )}
                          placeholder="如：本科"
                        />
                        {visibleErrors[`education[${index}].degree`] && (
                          <p className="mt-1 text-xs text-red-500 animate-fade-in">
                            {visibleErrors[`education[${index}].degree`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          专业
                        </label>
                        <input
                          type="text"
                          value={edu.major}
                          onChange={(e) =>
                            handleEducationChange(edu.id, 'major', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          placeholder="请输入专业"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          开始日期
                        </label>
                        <input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) =>
                            handleEducationChange(edu.id, 'startDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          结束日期
                        </label>
                        <input
                          type="date"
                          value={edu.endDate}
                          onChange={(e) =>
                            handleEducationChange(edu.id, 'endDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    {visibleErrors[`education[${index}].date`] && (
                      <p className="text-xs text-red-500 animate-fade-in">
                        {visibleErrors[`education[${index}].date`]}
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        描述
                      </label>
                      <textarea
                        value={edu.description}
                        onChange={(e) =>
                          handleEducationChange(edu.id, 'description', e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="请输入描述"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {resumeData.education.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  暂无教育背景，点击上方按钮添加
                </p>
              )}
              {resumeData.education.length >= MAX_EDUCATION && (
                <p className="text-center text-xs text-orange-500">
                  最多可添加 {MAX_EDUCATION} 条教育背景
                </p>
              )}
            </div>
          </section>

          {/* 技能标签区块 */}
          <section className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-yellow-600 rounded-full"></span>
                技能标签
              </h2>
              <span className="text-xs text-gray-500">
                {resumeData.skills.length}/{MAX_SKILLS}
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="输入技能后按回车添加"
                disabled={resumeData.skills.length >= MAX_SKILLS}
              />
              <button
                onClick={handleAddSkill}
                disabled={
                  !skillInput.trim() || resumeData.skills.length >= MAX_SKILLS
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm transition-all duration-200 hover:bg-blue-200"
                >
                  {skill.name}
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="ml-1 text-blue-500 hover:text-red-500 transition-colors duration-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              {resumeData.skills.length === 0 && (
                <p className="text-sm text-gray-400">暂无技能标签</p>
              )}
            </div>
          </section>

          {/* 项目经历区块 */}
          <section className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                项目经历
              </h2>
              <button
                onClick={handleAddProject}
                disabled={resumeData.projects.length >= MAX_PROJECTS}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
            <div className="space-y-4">
              {resumeData.projects.map((project, index) => (
                <div
                  key={project.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <button
                      onClick={() => handleRemoveProject(project.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">第 {index + 1} 条</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        项目名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) =>
                          handleProjectChange(project.id, 'name', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                          errors[`projects[${index}].name`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                        )}
                        placeholder="请输入项目名称"
                      />
                      {visibleErrors[`projects[${index}].name`] && (
                        <p className="mt-1 text-xs text-red-500 animate-fade-in">
                          {visibleErrors[`projects[${index}].name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        担任角色 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.role}
                        onChange={(e) =>
                          handleProjectChange(project.id, 'role', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                          errors[`projects[${index}].role`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300'
                        )}
                        placeholder="请输入担任角色"
                      />
                      {visibleErrors[`projects[${index}].role`] && (
                        <p className="mt-1 text-xs text-red-500 animate-fade-in">
                          {visibleErrors[`projects[${index}].role`]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          开始日期
                        </label>
                        <input
                          type="date"
                          value={project.startDate}
                          onChange={(e) =>
                            handleProjectChange(project.id, 'startDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          结束日期
                        </label>
                        <input
                          type="date"
                          value={project.endDate}
                          onChange={(e) =>
                            handleProjectChange(project.id, 'endDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    {visibleErrors[`projects[${index}].date`] && (
                      <p className="text-xs text-red-500 animate-fade-in">
                        {visibleErrors[`projects[${index}].date`]}
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        项目描述
                      </label>
                      <textarea
                        value={project.description}
                        onChange={(e) =>
                          handleProjectChange(project.id, 'description', e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="请输入项目描述"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        技术栈（每行一个）
                      </label>
                      <textarea
                        value={project.technologies.join('\n')}
                        onChange={(e) => {
                          const technologies = e.target.value
                            .split('\n')
                            .filter((line) => line.trim())
                          updateProject(project.id, 'technologies', technologies)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="React&#10;TypeScript&#10;Node.js"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        项目亮点（每行一个）
                      </label>
                      <textarea
                        value={project.highlights.join('\n')}
                        onChange={(e) => {
                          const highlights = e.target.value
                            .split('\n')
                            .filter((line) => line.trim())
                          updateProject(project.id, 'highlights', highlights)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                        placeholder="请输入项目亮点，每行一个"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {resumeData.projects.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  暂无项目经历，点击上方按钮添加
                </p>
              )}
              {resumeData.projects.length >= MAX_PROJECTS && (
                <p className="text-center text-xs text-orange-500">
                  最多可添加 {MAX_PROJECTS} 条项目经历
                </p>
              )}
            </div>
          </section>
        </div>

        {/* 右侧：预览区域 */}
        <div className="w-full lg:w-[65%] bg-gray-100 p-6 overflow-auto relative">
          {/* 加载遮罩 */}
          {(isExporting || isGeneratingShare) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm">
                  {isExporting ? '正在导出...' : '正在生成分享链接...'}
                </p>
              </div>
            </div>
          )}

          {/* 预览标题 */}
          <div className="text-center mb-4">
            <h3 className="text-sm font-medium text-gray-600">简历预览</h3>
          </div>

          {/* 简历预览 */}
          <div className="flex justify-center">
            <div
              style={{
                transition: 'all 0.5s ease',
              }}
            >
              <ResumePreview
                ref={previewRef}
                data={resumeData}
                theme={theme}
                moduleOrder={moduleOrder}
                onModuleReorder={handleModuleReorder}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 全局样式 - 错误淡入动画 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 300ms ease-out;
        }
      `}</style>
    </div>
  )
}
