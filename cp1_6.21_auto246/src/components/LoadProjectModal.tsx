import { useEffect, useState } from 'react'
import { X, Loader2, Folder, Calendar } from 'lucide-react'
import axios from 'axios'
import { useStore } from '@/store'
import type { CanvasComponent } from '@/types'

interface ApiProject {
  id: string
  name: string
  description: string
  templateId: string
  data: Record<string, unknown> & { components?: CanvasComponent[] }
  createdAt: string
  updatedAt: string
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return dateStr
  }
}

export default function LoadProjectModal() {
  const open = useStore(state => state.loadProjectModal)
  const setLoadProjectModal = useStore(state => state.setLoadProjectModal)
  const setComponents = useStore(state => state.setComponents)
  const addToast = useStore(state => state.addToast)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      axios
        .get('/api/projects')
        .then(res => {
          if (res.data?.code === 0) {
            setProjects(res.data.data ?? [])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleSelect = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await axios.get(`/api/projects/${id}`)
      if (res.data?.code === 0) {
        const project = res.data.data as ApiProject
        const comps = project.data?.components ?? []
        if (Array.isArray(comps) && comps.length > 0) {
          setComponents(comps as CanvasComponent[])
        }
        addToast(`已加载项目：${project.name}`, 'success')
        setLoadProjectModal(false)
      }
    } catch {
      addToast('项目加载失败', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={() => setLoadProjectModal(false)}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 24,
          width: 'min(600px, 92vw)',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              color: '#F8FAFC',
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
            }}
          >
            加载项目
          </h2>
          <button
            onClick={() => setLoadProjectModal(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#334155'
              e.currentTarget.style.color = '#F8FAFC'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#94A3B8'
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              color: '#94A3B8',
            }}
          >
            <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite', marginRight: 12 }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            加载中...
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: '#94A3B8',
            }}
          >
            <Folder size={48} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 16 }} />
            <div style={{ fontSize: 14 }}>暂无保存的项目</div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {projects.map(project => {
              const comps = project.data?.components
              const compCount = Array.isArray(comps) ? comps.length : 0
              return (
                <div
                  key={project.id}
                  onClick={() => !loadingId && handleSelect(project.id)}
                  style={{
                    padding: 16,
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    border: '1px solid #334155',
                    cursor: loadingId === project.id ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: loadingId && loadingId !== project.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => {
                    if (loadingId !== project.id) {
                      e.currentTarget.style.borderColor = '#10B981'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#334155'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <Folder size={18} strokeWidth={2} color="#10B981" />
                        <span
                          style={{
                            color: '#F8FAFC',
                            fontSize: 15,
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.name}
                        </span>
                      </div>
                      {project.description && (
                        <div
                          style={{
                            color: '#94A3B8',
                            fontSize: 13,
                            marginLeft: 28,
                            marginBottom: 8,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {project.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          marginLeft: 28,
                          color: '#64748B',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} strokeWidth={2} />
                          {formatDate(project.updatedAt)}
                        </span>
                        <span>{compCount} 个组件</span>
                      </div>
                    </div>
                    {loadingId === project.id && (
                      <Loader2 size={18} strokeWidth={2} style={{ color: '#10B981', animation: 'spin 1s linear infinite' }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
