import { useState } from 'react'
import { Square, Type, Image, Layout, Box, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentType } from '@/types'
import { cn } from '@/lib/utils'

interface ToolbarItem {
  type: ComponentType
  name: string
  icon: React.ReactNode
}

const toolbarItems: ToolbarItem[] = [
  { type: 'button', name: '按钮', icon: <Square className="w-5 h-5" /> },
  { type: 'input', name: '输入框', icon: <Type className="w-5 h-5" /> },
  { type: 'text', name: '文本块', icon: <Box className="w-5 h-5" /> },
  { type: 'image', name: '图片框', icon: <Image className="w-5 h-5" /> },
  { type: 'container', name: '容器', icon: <Layout className="w-5 h-5" /> },
]

export default function Toolbar() {
  const [collapsed, setCollapsed] = useState(false)

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px] lg:w-[260px]'
      )}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: collapsed ? 12 : 16,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        {!collapsed && (
          <h2 className="text-white font-semibold text-lg select-none">组件库</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center rounded-lg transition-colors',
            'hover:bg-slate-700 text-slate-400 hover:text-white',
            collapsed ? 'w-full h-10' : 'w-8 h-8'
          )}
          title={collapsed ? '展开面板' : '折叠面板'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <div className={cn('flex flex-col gap-3 overflow-y-auto', collapsed ? 'items-center' : '')}>
        {toolbarItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type)}
            className={cn(
              'flex cursor-grab active:cursor-grabbing select-none',
              'hover:-translate-y-0.5 transition-all duration-200 ease-out',
              collapsed
                ? 'w-12 h-12 items-center justify-center'
                : 'h-16 items-center gap-3 px-4'
            )}
            style={{
              backgroundColor: '#334155',
              borderRadius: 8,
              color: '#FFFFFF',
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
            title={collapsed ? item.name : undefined}
          >
            <span className="shrink-0 text-white">{item.icon}</span>
            {!collapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
          </div>
        ))}
      </div>
    </aside>
  )
}
