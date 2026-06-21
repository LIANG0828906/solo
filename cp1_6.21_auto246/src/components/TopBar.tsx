import { useState } from 'react'
import { Save, FolderOpen, FileDown, LayoutGrid } from 'lucide-react'
import axios from 'axios'
import { useStore } from '@/store'
import { generatePreviewHTML } from '@/utils/htmlExporter'

export default function TopBar() {
  const components = useStore(state => state.components)
  const addToast = useStore(state => state.addToast)
  const setLoadProjectModal = useStore(state => state.setLoadProjectModal)
  const setTemplateModal = useStore(state => state.setTemplateModal)
  const [projectName, setProjectName] = useState('未命名项目')

  const handleSave = async () => {
    try {
      await axios.post('/api/projects', {
        name: projectName,
        templateId: 'default',
        data: { components },
      })
      addToast('项目保存成功', 'success')
    } catch {
      addToast('保存失败，请重试', 'error')
    }
  }

  const handleLoad = () => {
    setLoadProjectModal(true)
  }

  const handleExport = () => {
    const html = generatePreviewHTML(components)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleTemplate = () => {
    setTemplateModal(true)
  }

  const buttonBase =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white text-sm font-medium transition-all duration-200 hover:brightness-125 cursor-pointer border-0'

  return (
    <header
      style={{
        height: 56,
        backgroundColor: '#0F172A',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          迷你设计工坊
        </div>
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#F8FAFC',
            fontSize: 14,
            outline: 'none',
            width: 200,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          className={buttonBase}
          style={{ backgroundColor: '#3B82F6' }}
        >
          <Save size={16} strokeWidth={2} />
          <span>保存</span>
        </button>
        <button
          onClick={handleLoad}
          className={buttonBase}
          style={{ backgroundColor: '#10B981' }}
        >
          <FolderOpen size={16} strokeWidth={2} />
          <span>加载</span>
        </button>
        <button
          onClick={handleExport}
          className={buttonBase}
          style={{ backgroundColor: '#8B5CF6' }}
        >
          <FileDown size={16} strokeWidth={2} />
          <span>导出</span>
        </button>
        <button
          onClick={handleTemplate}
          className={buttonBase}
          style={{ backgroundColor: '#F59E0B' }}
        >
          <LayoutGrid size={16} strokeWidth={2} />
          <span>模板</span>
        </button>
      </div>
    </header>
  )
}
