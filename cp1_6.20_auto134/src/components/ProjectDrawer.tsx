import { useEffect } from 'react'
import { Plus, Trash2, X, FolderOpen } from 'lucide-react'
import { useStore } from '@/store'

interface ProjectDrawerProps {
  onLoadProject: (id: string) => void
  onDeleteProject: (id: string) => void
  onCreateProject: () => void
}

export default function ProjectDrawer({ onLoadProject, onDeleteProject, onCreateProject }: ProjectDrawerProps) {
  const drawerOpen = useStore((s) => s.drawerOpen)
  const setDrawerOpen = useStore((s) => s.setDrawerOpen)
  const projects = useStore((s) => s.projects)
  const setProjects = useStore((s) => s.setProjects)
  const setCurrentProject = useStore((s) => s.setCurrentProject)
  const setLoading = useStore((s) => s.setLoading)

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data))
  }, [])

  return (
    <div
      className="h-full bg-bg overflow-hidden flex flex-col shrink-0"
      style={{
        width: drawerOpen ? 280 : 0,
        transition: 'width 0.3s ease',
      }}
    >
      <div className="min-w-[280px] h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-grid">
          <span className="text-fg font-display text-sm font-semibold tracking-wide">Projects</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateProject}
              className="p-1.5 rounded hover:bg-panelHover text-accent transition-colors"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded hover:bg-panelHover text-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {projects.length === 0 && (
            <div className="text-muted text-xs text-center py-8">No projects yet</div>
          )}
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => {
                setLoading(true)
                onLoadProject(project.id)
                setDrawerOpen(false)
              }}
              className="bg-panel hover:bg-panelHover p-3 rounded-lg cursor-pointer group transition-all duration-200"
              style={{ transition: 'all 0.2s ease' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={14} className="text-accent shrink-0 mt-0.5" />
                  <span className="text-fg text-sm font-medium truncate">{project.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteProject(project.id)
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-accent text-muted transition-opacity shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="mt-1.5 pl-[22px] text-muted text-xs flex items-center gap-3">
                <span>{new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                <span>{project.tracks.length} tracks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
