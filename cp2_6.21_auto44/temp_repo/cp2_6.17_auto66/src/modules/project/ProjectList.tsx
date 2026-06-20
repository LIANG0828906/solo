import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Plus, Search } from 'lucide-react'
import { useProjectStore } from './store'
import { useDebounce, useLazyImage } from '@/utils/hooks'
import ProjectForm from './ProjectForm'

function ProjectCard({
  id,
  title,
  cover,
  likeCount,
  commentCount,
}: {
  id: string
  title: string
  cover: string
  likeCount: number
  commentCount: number
}) {
  const navigate = useNavigate()
  const { ref, isVisible } = useLazyImage<HTMLDivElement>()

  return (
    <div
      ref={ref}
      onClick={() => navigate(`/project/${id}`)}
      className="w-[240px] h-[320px] rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 ease-out"
    >
      <div className="p-4 pb-0 flex-shrink-0">
        <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-[#ECF0F1]">
          {isVisible ? (
            <img src={cover} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-[#ECF0F1] animate-pulse" />
          )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="text-[18px] font-bold text-gray-800 leading-snug line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-[14px] text-gray-500">
          <span className="flex items-center gap-1">
            <Heart size={16} className="text-gray-400" />
            {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={16} className="text-gray-400" />
            {commentCount}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ProjectList() {
  const projects = useProjectStore(s => s.projects)
  const likesMap = useProjectStore(s => s.likes)
  const commentsMap = useProjectStore(s => s.comments)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 300)

  const filteredProjects = useMemo(() => {
    if (!debouncedSearch.trim()) return projects
    const keyword = debouncedSearch.trim().toLowerCase()
    return projects.filter(p => p.title.toLowerCase().includes(keyword))
  }, [projects, debouncedSearch])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">社区空间改造项目</h1>
          <p className="text-gray-500 mt-1">记录社区变迁，共建美好家园</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#27AE60] text-white rounded-lg font-medium hover:bg-[#219150] transition-colors"
        >
          <Plus size={18} />
          新建项目
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索项目名称..."
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white outline-none focus:border-[#27AE60] transition-colors"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#ECF0F1] flex items-center justify-center mb-4">
            <Search size={28} className="text-gray-400" />
          </div>
          <p className="text-[#999] text-center">暂无匹配项目</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              cover={project.images[0] || ''}
              likeCount={likesMap[project.id]?.length ?? 0}
              commentCount={commentsMap[project.id]?.length ?? 0}
            />
          ))}
        </div>
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
