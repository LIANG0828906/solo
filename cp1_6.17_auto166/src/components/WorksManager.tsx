import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import {
  fetchWorks,
  createWork,
  updateWork,
  deleteWork,
  fileToBase64,
  createExhibition,
} from '@/api'
import {
  Upload,
  Image,
  Calendar,
  Camera,
  Tag,
  Trash2,
  Save,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  Menu,
  BarChart3,
  Heart,
  Palette,
  ChevronDown,
  Check,
  LayoutGrid,
} from 'lucide-react'

const TAG_OPTIONS = ['风光', '人像', '纪实', '抽象'] as const
const TAG_COLORS: Record<string, string> = {
  '风光': 'bg-tag-landscape',
  '人像': 'bg-tag-portrait',
  '纪实': 'bg-tag-documentary',
  '抽象': 'bg-tag-abstract',
}
const TAG_HEX: Record<string, string> = {
  '风光': '#3498DB',
  '人像': '#2ECC71',
  '纪实': '#E67E22',
  '抽象': '#9B59B6',
}

export default function WorksManager() {
  const navigate = useNavigate()
  const {
    works,
    selectedWorks,
    editingWork,
    filterTag,
    sortOrder,
    sidebarOpen,
    setWorks,
    addWork,
    updateWork: updateWorkStore,
    removeWork,
    toggleSelectedWork,
    clearSelectedWorks,
    setEditingWork,
    setFilterTag,
    setSortOrder,
    setSidebarOpen,
  } = useStore()

  const [isDragging, setIsDragging] = useState(false)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [exhibitionName, setExhibitionName] = useState('')
  const [showExhibitionDialog, setShowExhibitionDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editTitleRef = useRef<HTMLInputElement>(null)
  const editDateRef = useRef<HTMLInputElement>(null)
  const editCameraRef = useRef<HTMLInputElement>(null)
  const [editTags, setEditTags] = useState<string[]>([])
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchWorks(filterTag || undefined, sortOrder || undefined).then(setWorks)
  }, [filterTag, sortOrder])

  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-id')
          if (id) {
            setVisibleImages((prev) => {
              const next = new Set(prev)
              if (entry.isIntersecting) {
                next.add(id)
              }
              return next
            })
          }
        })
      },
      { rootMargin: '100px' }
    )

    return () => observerRef.current?.disconnect()
  }, [])

  const cardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && observerRef.current) {
        observerRef.current.observe(node)
      }
    },
    [works.length]
  )

  const handleFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue
      if (file.size > 10 * 1024 * 1024) continue

      const base64 = await fileToBase64(file)
      const work = await createWork({
        title: file.name.replace(/\.[^.]+$/, ''),
        imageUrl: base64,
        shootDate: new Date().toISOString().split('T')[0],
        cameraParams: '',
        tags: [],
      })
      addWork(work)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleSaveEdit = async () => {
    if (!editingWork) return
    const updated = await updateWork(editingWork.id, {
      title: editTitleRef.current?.value || editingWork.title,
      shootDate: editDateRef.current?.value || editingWork.shootDate,
      cameraParams: editCameraRef.current?.value || editingWork.cameraParams,
      tags: editTags,
    })
    updateWorkStore(editingWork.id, updated)
    setEditingWork(null)
  }

  const handleDeleteWork = async (id: string) => {
    await deleteWork(id)
    removeWork(id)
    setEditingWork(null)
  }

  const openEditPanel = (work: typeof works[0]) => {
    setEditingWork(work)
    setEditTags(work.tags)
  }

  const handleGenerateExhibition = async () => {
    if (selectedWorks.length < 4) return
    const name = exhibitionName || `展览 ${new Date().toLocaleDateString('zh-CN')}`
    const exhibition = await createExhibition(name, selectedWorks)
    clearSelectedWorks()
    setShowExhibitionDialog(false)
    setExhibitionName('')
    navigate(`/exhibition/${exhibition.id}`)
  }

  const totalLikes = works.reduce((sum, w) => sum + w.likes, 0)
  const tagCounts = TAG_OPTIONS.reduce(
    (acc, tag) => {
      acc[tag] = works.filter((w) => w.tags.includes(tag)).length
      return acc
    },
    {} as Record<string, number>
  )
  const maxTagCount = Math.max(...Object.values(tagCounts), 1)

  const filteredWorks = works
    .filter((w) => (filterTag ? w.tags.includes(filterTag) : true))
    .sort((a, b) => {
      if (sortOrder === 'date') return new Date(b.shootDate).getTime() - new Date(a.shootDate).getTime()
      if (sortOrder === 'date-asc') return new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime()
      return 0
    })

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary transform transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Palette className="w-7 h-7 text-accent" />
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            光影工坊
          </h1>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          <button className="sidebar-link active w-full">
            <Image className="w-5 h-5" />
            <span>作品管理</span>
          </button>
          <button
            className="sidebar-link w-full"
            onClick={() => {
              if (works.length >= 4) {
                setShowExhibitionDialog(true)
              }
            }}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>生成展览</span>
          </button>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-white/30 text-xs">
            {works.length} 件作品 · {totalLikes} 次获赞
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-card hover:bg-surface-muted transition-colors duration-300"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5 text-primary" />
            </button>
            <h2 className="text-lg font-semibold text-primary">作品管理</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="btn-secondary flex items-center gap-1.5 text-sm"
                onClick={() => setFilterTag(filterTag ? '' : '__toggle')}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{filterTag || '标签筛选'}</span>
              </button>
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-panel shadow-lg border border-border/50 py-1 z-20">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-muted transition-colors"
                  onClick={() => { setFilterTag(''); }}
                >
                  全部
                </button>
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-muted transition-colors flex items-center gap-2"
                    onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TAG_HEX[tag] }}
                    />
                    {tag}
                    {tag === filterTag && <Check className="w-3.5 h-3.5 ml-auto text-accent" />}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-secondary flex items-center gap-1.5 text-sm"
              onClick={() => {
                if (sortOrder === 'date') setSortOrder('date-asc')
                else if (sortOrder === 'date-asc') setSortOrder('')
                else setSortOrder('date')
              }}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {sortOrder === 'date' ? '最新优先' : sortOrder === 'date-asc' ? '最早优先' : '日期排序'}
              </span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Data Dashboard */}
          <section className="bg-surface-muted rounded-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-primary">数据看板</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-card p-4 shadow-sm">
                <div className="text-2xl font-bold text-primary">{works.length}</div>
                <div className="text-sm text-primary/50">作品总数</div>
              </div>
              <div className="bg-white rounded-card p-4 shadow-sm">
                <div className="text-2xl font-bold text-heart-red">{totalLikes}</div>
                <div className="text-sm text-primary/50">总获赞数</div>
              </div>
              <div className="bg-white rounded-card p-4 shadow-sm">
                <div className="text-2xl font-bold text-accent">{selectedWorks.length}</div>
                <div className="text-sm text-primary/50">已选作品</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {TAG_OPTIONS.map((tag) => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-primary/70 text-right">{tag}</span>
                  <div className="flex-1 bg-white rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${TAG_COLORS[tag]} rounded-full bar-animate`}
                      style={{
                        width: `${(tagCounts[tag] / maxTagCount) * 100}%`,
                        minWidth: tagCounts[tag] > 0 ? '24px' : '0px',
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm text-primary/70 text-right">{tagCounts[tag]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Upload + Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Upload area */}
            <div className="lg:w-72 shrink-0">
              <div
                className={`border-2 border-dashed rounded-panel p-8 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? 'border-accent bg-accent/5 scale-[1.02]'
                    : 'border-border hover:border-accent/50 hover:bg-surface-muted'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 transition-colors duration-300 ${
                    isDragging ? 'text-accent' : 'text-primary/30'
                  }`}
                />
                <p className="text-sm text-primary/60 mb-1">
                  拖拽图片到此处上传
                </p>
                <p className="text-xs text-primary/40">
                  支持 JPG / PNG / WebP，最大 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {/* Generate Exhibition Button */}
              {selectedWorks.length >= 4 && (
                <button
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                  onClick={() => setShowExhibitionDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  生成展览 ({selectedWorks.length})
                </button>
              )}
              {selectedWorks.length > 0 && selectedWorks.length < 4 && (
                <p className="text-xs text-primary/40 mt-3 text-center">
                  还需选择 {4 - selectedWorks.length} 张作品即可生成展览
                </p>
              )}
            </div>

            {/* Works Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredWorks.map((work) => (
                  <div
                    key={work.id}
                    ref={cardRef}
                    data-id={work.id}
                    className={`work-card relative group ${
                      selectedWorks.includes(work.id) ? 'ring-2 ring-accent' : ''
                    }`}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        toggleSelectedWork(work.id)
                      } else {
                        openEditPanel(work)
                      }
                    }}
                  >
                    <div className="aspect-[3/4] overflow-hidden rounded-t-card relative">
                      {visibleImages.has(work.id) ? (
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="w-full h-full object-cover lazy-image loaded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-muted animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Heart className="w-3.5 h-3.5" />
                          {work.likes}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-primary truncate">{work.title}</h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary/40">
                        <Calendar className="w-3 h-3" />
                        {work.shootDate}
                      </div>
                      {work.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {work.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] rounded-full text-white"
                              style={{ backgroundColor: TAG_HEX[tag] }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Selection checkbox */}
                    <button
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                        selectedWorks.includes(work.id)
                          ? 'bg-accent border-accent text-white'
                          : 'border-white/60 bg-black/20 text-transparent hover:border-accent'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelectedWork(work.id)
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {filteredWorks.length === 0 && (
                <div className="text-center py-16 text-primary/30">
                  <Image className="w-12 h-12 mx-auto mb-3" />
                  <p>暂无作品，请上传您的第一张作品</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Panel Modal */}
      {editingWork && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setEditingWork(null)}
        >
          <div
            className="bg-white rounded-panel w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h3 className="font-semibold text-primary">编辑作品</h3>
              <button
                className="p-1 rounded-card hover:bg-surface-muted transition-colors"
                onClick={() => setEditingWork(null)}
              >
                <X className="w-5 h-5 text-primary/50" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="aspect-video rounded-card overflow-hidden bg-surface-muted">
                <img
                  src={editingWork.imageUrl}
                  alt={editingWork.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary/70 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Image className="w-4 h-4" />
                    标题
                  </span>
                </label>
                <input
                  ref={editTitleRef}
                  type="text"
                  defaultValue={editingWork.title}
                  className="form-input"
                  placeholder="输入作品标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary/70 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    拍摄日期
                  </span>
                </label>
                <input
                  ref={editDateRef}
                  type="date"
                  defaultValue={editingWork.shootDate}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary/70 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    相机参数
                  </span>
                </label>
                <input
                  ref={editCameraRef}
                  type="text"
                  defaultValue={editingWork.cameraParams}
                  className="form-input"
                  placeholder="如: Canon EOS R5, 50mm, f/1.8, 1/125s"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary/70 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    标签
                  </span>
                </label>
                <div className="relative">
                  <button
                    className="form-input text-left flex items-center justify-between"
                    onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                  >
                    <span className="flex flex-wrap gap-1">
                      {editTags.length > 0 ? (
                        editTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: TAG_HEX[tag] }}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-primary/30">选择标签</span>
                      )}
                    </span>
                    <ChevronDown className="w-4 h-4 text-primary/40" />
                  </button>
                  {tagDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-panel shadow-lg border border-border/50 py-1 z-10">
                      {TAG_OPTIONS.map((tag) => (
                        <button
                          key={tag}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-surface-muted transition-colors flex items-center gap-2"
                          onClick={() => {
                            setEditTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: TAG_HEX[tag] }}
                          />
                          {tag}
                          {editTags.includes(tag) && (
                            <Check className="w-3.5 h-3.5 ml-auto text-accent" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-t border-border/50">
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleSaveEdit}>
                <Save className="w-4 h-4" />
                保存
              </button>
              <button
                className="btn-danger flex items-center justify-center gap-2"
                onClick={() => handleDeleteWork(editingWork.id)}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exhibition Generation Dialog */}
      {showExhibitionDialog && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowExhibitionDialog(false)}
        >
          <div
            className="bg-white rounded-panel w-full max-w-sm shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-primary mb-4">生成虚拟展览</h3>
            <p className="text-sm text-primary/60 mb-4">
              已选择 {selectedWorks.length} 件作品，将为它们生成一个沉浸式虚拟展览厅
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary/70 mb-1">展览名称</label>
              <input
                type="text"
                value={exhibitionName}
                onChange={(e) => setExhibitionName(e.target.value)}
                className="form-input"
                placeholder="输入展览名称（可选）"
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={handleGenerateExhibition}
              >
                立即生成
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowExhibitionDialog(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
