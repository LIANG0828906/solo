import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useStore } from '@/store'
import type { CanvasComponent } from '@/types'
import { componentDefaults, defaultStyle } from '@/types'

interface ApiTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  defaultData: Record<string, unknown>
}

const thumbnailColors: Record<string, string> = {
  login: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  profile: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  product: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  dashboard: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  blog: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
}

function defaultDataToComponents(defaultData: Record<string, unknown>): CanvasComponent[] {
  const components: CanvasComponent[] = []
  let y = 20

  if (typeof defaultData.title === 'string') {
    components.push({
      id: `tpl_${Date.now()}_1`,
      type: 'text',
      x: 40,
      y,
      width: 400,
      height: 40,
      zIndex: 1,
      style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 28, borderWidth: 0 },
      content: defaultData.title as string,
    })
    y += 60
  }

  const fields = defaultData.fields as Array<Record<string, unknown>> | undefined
  if (Array.isArray(fields)) {
    fields.forEach((field, idx) => {
      components.push({
        id: `tpl_${Date.now()}_input_${idx}`,
        type: 'input',
        x: 40,
        y,
        width: 320,
        height: 44,
        zIndex: idx + 2,
        style: { ...componentDefaults.input!.style! },
        placeholder: (field.placeholder as string) ?? '',
      })
      y += 60
    })
  }

  if (typeof defaultData.name === 'string') {
    components.push({
      id: `tpl_${Date.now()}_name`,
      type: 'text',
      x: 180,
      y,
      width: 200,
      height: 32,
      zIndex: components.length + 1,
      style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 20, fontWeight: 600 as unknown as number, borderWidth: 0 },
      content: defaultData.name as string,
    })
    y += 48
  }

  if (typeof defaultData.bio === 'string') {
    components.push({
      id: `tpl_${Date.now()}_bio`,
      type: 'text',
      x: 40,
      y,
      width: 500,
      height: 48,
      zIndex: components.length + 1,
      style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 14, color: '#64748B', borderWidth: 0 },
      content: defaultData.bio as string,
    })
    y += 64
  }

  const stats = defaultData.stats as Array<Record<string, unknown>> | undefined
  if (Array.isArray(stats)) {
    let sx = 40
    stats.forEach((stat, idx) => {
      components.push({
        id: `tpl_${Date.now()}_stat_${idx}`,
        type: 'container',
        x: sx,
        y,
        width: 140,
        height: 80,
        zIndex: components.length + 1,
        style: { ...componentDefaults.container!.style! },
        children: [
          {
            id: `tpl_${Date.now()}_statv_${idx}`,
            type: 'text',
            x: 12,
            y: 8,
            width: 116,
            height: 32,
            zIndex: 1,
            style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 24, fontWeight: 700 as unknown as number, borderWidth: 0 },
            content: String(stat.value ?? 0),
          },
          {
            id: `tpl_${Date.now()}_statl_${idx}`,
            type: 'text',
            x: 12,
            y: 44,
            width: 116,
            height: 24,
            zIndex: 2,
            style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 12, color: '#64748B', borderWidth: 0 },
            content: (stat.label as string) ?? '',
          },
        ],
      })
      sx += 156
    })
    y += 100
  }

  if (typeof defaultData.price !== 'undefined') {
    components.push({
      id: `tpl_${Date.now()}_price`,
      type: 'text',
      x: 40,
      y,
      width: 200,
      height: 40,
      zIndex: components.length + 1,
      style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 32, fontWeight: 700 as unknown as number, color: '#EF4444', borderWidth: 0 },
      content: `¥${defaultData.price}`,
    })
    y += 56
  }

  if (typeof defaultData.description === 'string' && !components.some(c => c.content === defaultData.description)) {
    components.push({
      id: `tpl_${Date.now()}_desc`,
      type: 'text',
      x: 40,
      y,
      width: 500,
      height: 48,
      zIndex: components.length + 1,
      style: { ...defaultStyle, backgroundColor: 'transparent', fontSize: 14, color: '#64748B', borderWidth: 0 },
      content: defaultData.description as string,
    })
    y += 64
  }

  if (components.length < 2) {
    components.push({
      id: `tpl_${Date.now()}_container`,
      type: 'container',
      x: 40,
      y: 40,
      width: 500,
      height: 300,
      zIndex: 1,
      style: { ...componentDefaults.container!.style! },
    })
    components.push({
      id: `tpl_${Date.now()}_btn`,
      type: 'button',
      x: 40,
      y: 360,
      width: 160,
      height: 44,
      zIndex: 2,
      style: { ...componentDefaults.button!.style! },
      content: '立即操作',
    })
  } else if (!components.some(c => c.type === 'button')) {
    components.push({
      id: `tpl_${Date.now()}_btn`,
      type: 'button',
      x: 40,
      y,
      width: 160,
      height: 44,
      zIndex: components.length + 1,
      style: { ...componentDefaults.button!.style! },
      content: '提交',
    })
  }

  return components
}

export default function TemplateModal() {
  const open = useStore(state => state.templateModal)
  const setTemplateModal = useStore(state => state.setTemplateModal)
  const setComponents = useStore(state => state.setComponents)
  const addToast = useStore(state => state.addToast)
  const [templates, setTemplates] = useState<ApiTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      axios
        .get('/api/templates')
        .then(res => {
          if (res.data?.code === 0) {
            setTemplates(res.data.data ?? [])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleSelect = async (id: string, name: string) => {
    setLoadingId(id)
    try {
      const res = await axios.get(`/api/templates/${id}`)
      if (res.data?.code === 0) {
        const tpl = res.data.data as ApiTemplate
        const comps = defaultDataToComponents(tpl.defaultData ?? {})
        setComponents(comps)
        addToast(`已载入模板：${name}`, 'success')
        setTemplateModal(false)
      }
    } catch {
      addToast('模板载入失败', 'error')
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
      onClick={() => setTemplateModal(false)}
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
          width: 'min(900px, 92vw)',
          maxHeight: '85vh',
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
            选择模板
          </h2>
          <button
            onClick={() => setTemplateModal(false)}
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
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}
          >
            {templates.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => !loadingId && handleSelect(tpl.id, tpl.name)}
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: loadingId === tpl.id ? 'wait' : 'pointer',
                  border: '1px solid #334155',
                  transition: 'all 0.3s ease',
                  opacity: loadingId && loadingId !== tpl.id ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (loadingId !== tpl.id) {
                    e.currentTarget.style.borderColor = '#8B5CF6'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.2)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#334155'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    height: 100,
                    background: thumbnailColors[tpl.thumbnail] ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    position: 'relative',
                  }}
                >
                  {loadingId === tpl.id && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                  {tpl.name}
                </div>
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      color: '#F8FAFC',
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {tpl.name}
                  </div>
                  <div
                    style={{
                      color: '#94A3B8',
                      fontSize: 12,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tpl.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
