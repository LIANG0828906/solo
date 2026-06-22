import { useState } from 'react'
import { Type, Star, Paintbrush, Palette, Download } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import './ToolbarPanel.css'

interface ToolbarPanelProps {
  onExportClick: () => void
}

type ToolGroupKey = 'text' | 'sticker' | 'draw' | 'background'

interface ToolGroup {
  key: ToolGroupKey
  icon: React.ReactNode
  label: string
  items: { key: string; label: string; value?: string }[]
}

const STICKERS = [
  '🎉', '❤️', '⭐', '🎂', '🌹', '🎈', '🌟', '💝',
  '🎁', '🎊', '🌸', '🌈', '🦋', '🍀', '✨', '💫',
]

const BACKGROUNDS = [
  '#ffffff', '#fdf2f8', '#eff6ff', '#fef3c7', '#ecfdf5',
  '#f5f3ff', '#fef9c3', '#fee2e2', '#dbeafe', '#d1fae5',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
]

const TEXT_PRESETS = [
  { key: 'title', label: '大标题', fontSize: 48 },
  { key: 'subtitle', label: '副标题', fontSize: 32 },
  { key: 'body', label: '正文', fontSize: 20 },
  { key: 'small', label: '小字', fontSize: 14 },
]

const DRAW_TOOLS = [
  { key: 'draw-brush', label: '画笔' },
  { key: 'draw-rect', label: '矩形' },
  { key: 'draw-circle', label: '圆形' },
]

function ToolbarPanel({ onExportClick }: ToolbarPanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<ToolGroupKey | null>(null)
  const addElement = useEditorStore((s) => s.addElement)
  const setBackground = useEditorStore((s) => s.setBackground)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const activeTool = useEditorStore((s) => s.activeTool)

  const toolGroups: ToolGroup[] = [
    { key: 'text', icon: <Type size={22} />, label: '文字', items: TEXT_PRESETS },
    { key: 'sticker', icon: <Star size={22} />, label: '贴纸', items: STICKERS.map(s => ({ key: s, label: s, value: s })) },
    { key: 'draw', icon: <Paintbrush size={22} />, label: '绘制', items: DRAW_TOOLS },
    { key: 'background', icon: <Palette size={22} />, label: '背景', items: BACKGROUNDS.map((b, i) => ({ key: `bg-${i}`, label: b, value: b })) },
  ]

  const handleGroupClick = (key: ToolGroupKey) => {
    if (key === ('export' as ToolGroupKey)) {
      onExportClick()
      return
    }
    setExpandedGroup(expandedGroup === key ? null : key)
    if (key !== 'draw') {
      setActiveTool(null)
    }
  }

  const handleTextClick = (preset: { key: string; label: string; fontSize: number }) => {
    addElement({
      type: 'text',
      content: preset.label === '大标题' ? '贺卡标题' : preset.label === '副标题' ? '副标题文字' : preset.label === '正文' ? '在这里输入正文内容...' : '小字说明',
      fontSize: preset.fontSize,
      width: preset.fontSize * 8,
      height: preset.fontSize * 2,
    })
  }

  const handleStickerClick = (emoji: string) => {
    const svgSrc = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" font-size="80" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`
    )}`
    addElement({
      type: 'sticker',
      src: svgSrc,
      width: 100,
      height: 100,
    })
  }

  const handleDrawClick = (toolKey: string) => {
    setActiveTool(activeTool === toolKey ? null : toolKey)
  }

  const handleBackgroundClick = (bg: string) => {
    setBackground(bg)
  }

  const renderGroupItems = (group: ToolGroup) => {
    if (!expandedGroup || expandedGroup !== group.key) return null

    return (
      <div className={`toolbar-items ${expandedGroup === group.key ? 'expanded' : ''}`}>
        {group.items.map((item) => (
          <button
            key={item.key}
            className="toolbar-item"
            onClick={() => {
              if (group.key === 'text') handleTextClick(item as { key: string; label: string; fontSize: number })
              else if (group.key === 'sticker') handleStickerClick(item.value || item.label)
              else if (group.key === 'draw') handleDrawClick(item.key)
              else if (group.key === 'background') handleBackgroundClick(item.value || item.label)
            }}
            style={group.key === 'background' ? { background: item.value || item.label } : {}}
          >
            {group.key === 'background' ? '' : item.label}
            {group.key === 'draw' && activeTool === item.key && <span className="active-dot" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="toolbar-panel">
      {toolGroups.map((group) => (
        <div key={group.key} className="toolbar-group">
          <button
            className={`toolbar-icon ${expandedGroup === group.key ? 'active' : ''} ${activeTool?.startsWith('draw') && group.key === 'draw' ? 'active' : ''}`}
            onClick={() => handleGroupClick(group.key)}
            title={group.label}
          >
            {group.icon}
          </button>
          {renderGroupItems(group)}
        </div>
      ))}
      <div className="toolbar-group">
        <button
          className="toolbar-icon toolbar-export"
          onClick={onExportClick}
          title="导出"
        >
          <Download size={22} />
        </button>
      </div>
    </div>
  )
}

export default ToolbarPanel
