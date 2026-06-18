import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '@/store'
import type { UIComponent, ComponentType, UIComponentProps } from '@/types'
import { generateId, getDefaultComponentProps } from '@/utils'

const TYPE_KEYWORDS: Record<string, ComponentType> = {
  '按钮': 'button',
  '输入框': 'input',
  '卡片': 'card',
  '导航': 'navbar',
  '表格': 'table',
  '文本': 'text',
  '图片': 'image',
  '复选框': 'checkbox',
  '下拉': 'select',
  '文本域': 'textarea',
  '分割线': 'divider',
  '头像': 'avatar',
  '标签': 'badge',
  '开关': 'switch',
  '滑块': 'slider',
  '进度': 'progress',
  button: 'button',
  input: 'input',
  card: 'card',
  navbar: 'navbar',
  table: 'table',
  text: 'text',
  image: 'image',
  checkbox: 'checkbox',
  select: 'select',
  textarea: 'textarea',
  divider: 'divider',
  avatar: 'avatar',
  badge: 'badge',
  switch: 'switch',
  slider: 'slider',
  progress: 'progress',
}

const COLOR_MAP: Record<string, string> = {
  '蓝绿': '#00BCD4',
  '蓝色': '#4A90D9',
  '红色': '#E74C3C',
  '绿色': '#27AE60',
  '橙色': '#FF6B35',
  '黄色': '#F1C40F',
  '紫色': '#9B59B6',
  '灰色': '#95A5A6',
  '黑色': '#333333',
  '白色': '#FFFFFF',
  '粉色': '#E91E63',
}

function parseComponentType(input: string): ComponentType {
  const sorted = Object.keys(TYPE_KEYWORDS).sort((a, b) => b.length - a.length)
  for (const keyword of sorted) {
    if (input.includes(keyword)) {
      return TYPE_KEYWORDS[keyword]
    }
  }
  return 'div'
}

function parseColors(input: string): { backgroundColor?: string; textColor?: string } {
  let backgroundColor: string | undefined
  let textColor: string | undefined

  const sortedColorKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)
  for (const key of sortedColorKeys) {
    if (input.includes(key)) {
      if (!backgroundColor) {
        backgroundColor = COLOR_MAP[key]
      }
      break
    }
  }

  const hexPattern = /#([0-9A-Fa-f]{6})/g
  const hexMatches = input.match(hexPattern)
  if (hexMatches && hexMatches.length > 0) {
    if (!backgroundColor) {
      backgroundColor = hexMatches[0]
    }
    if (hexMatches.length > 1) {
      textColor = hexMatches[1]
    }
  }

  const textColorPattern = /文字颜色[是为：:\s]*(#{1}[0-9A-Fa-f]{6}|[\u4e00-\u9fa5]+色|蓝绿)/
  const textColorMatch = input.match(textColorPattern)
  if (textColorMatch) {
    const val = textColorMatch[1]
    textColor = COLOR_MAP[val] || (val.startsWith('#') ? val : textColor)
  }

  return { backgroundColor, textColor }
}

function parseSize(input: string): { width?: number; height?: number } {
  let width: number | undefined
  let height: number | undefined

  const widthPattern = /(?:宽度|width)[:\s：]*(\d+)/i
  const heightPattern = /(?:高度|height)[:\s：]*(\d+)/i
  const shortWidthPattern = /宽[:\s：]*(\d+)/
  const shortHeightPattern = /高[:\s：]*(\d+)/

  const widthMatch = input.match(widthPattern) || input.match(shortWidthPattern)
  const heightMatch = input.match(heightPattern) || input.match(shortHeightPattern)

  if (widthMatch) width = parseInt(widthMatch[1], 10)
  if (heightMatch) height = parseInt(heightMatch[1], 10)

  return { width, height }
}

function parseText(input: string): string | undefined {
  const patterns = [
    /文字[是为：:\s]*[""「」'']?([^,，\n]+?)[""「」'']?$/,
    /文字[是为：:\s]*[""「」'']([^""「」'']+)[""「」'']/,
    /text[:\s：]*[""「」'']?([^,，\n]+?)[""「」'']?$/i,
    /文本内容[：:\s]*[""「」'']?([^,，\n]+?)[""「」'']?$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

function parseBorderRadius(input: string): number | undefined {
  const patterns = [
    /圆角[:\s：]*(\d+)/,
    /radius[:\s：]*(\d+)/i,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return parseInt(match[1], 10)
  }
  return undefined
}

function parsePlaceholder(input: string): string | undefined {
  const pattern = /(?:占位符|placeholder)[:\s：]*[""「」'']?([^,，\n]+?)[""「」'']?$/i
  const match = input.match(pattern)
  return match ? match[1].trim() : undefined
}

function parseLine(line: string): Omit<UIComponent, 'id' | 'children'> | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const type = parseComponentType(trimmed)
  if (type === 'div') return null

  const defaults = getDefaultComponentProps(type) as Partial<UIComponentProps>
  const colors = parseColors(trimmed)
  const size = parseSize(trimmed)
  const text = parseText(trimmed)
  const borderRadius = parseBorderRadius(trimmed)
  const placeholder = parsePlaceholder(trimmed)

  const props: UIComponentProps = {
    x: 0,
    y: 0,
    width: size.width ?? defaults.width ?? 100,
    height: size.height ?? defaults.height ?? 40,
    ...defaults,
    ...colors,
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(placeholder !== undefined ? { placeholder } : {}),
  }

  return { type, props }
}

function parseInput(input: string): Omit<UIComponent, 'id' | 'children'>[] {
  return input
    .split('\n')
    .map((line) => parseLine(line))
    .filter((c): c is Omit<UIComponent, 'id' | 'children'> => c !== null)
}

export default function NL2Component() {
  const [input, setInput] = useState('')
  const [showList, setShowList] = useState(false)
  const components = useStore((s) => s.components)
  const addComponents = useStore((s) => s.addComponents)
  const selectComponent = useStore((s) => s.selectComponent)
  const canvas = useStore((s) => s.canvas)
  const isMobile = useStore((s) => s.isMobile)
  const inputPanelCollapsed = useStore((s) => s.inputPanelCollapsed)
  const setInputPanelCollapsed = useStore((s) => s.setInputPanelCollapsed)

  const handleGenerate = () => {
    const parsed = parseInput(input)
    if (parsed.length === 0) return

    const centerX = (window.innerWidth / 2 - canvas.offsetX) / canvas.scale
    const startY = (window.innerHeight / 2 - canvas.offsetY) / canvas.scale

    const newComponents: UIComponent[] = parsed.map((c, i) => ({
      id: generateId(),
      type: c.type,
      props: {
        ...c.props,
        x: centerX - (c.props.width ?? 100) / 2,
        y: startY - 100 + i * ((c.props.height ?? 40) + 20),
      },
    }))

    addComponents(newComponents)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const panelContent = (
    <div className="flex flex-col h-full" style={{ width: 280, background: '#F0F2F5' }}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-blue-500" />
          <span className="font-semibold text-sm text-gray-800">NL → 组件</span>
        </div>
        <textarea
          className="w-full h-32 p-3 text-sm rounded-lg border border-gray-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
          placeholder={"每行描述一个组件，如：\n一个蓝绿色圆角按钮，宽度120px，高度40px，文字是提交"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.98] transition-all"
          onClick={handleGenerate}
        >
          <Plus size={16} />
          生成组件
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col mt-2 px-4">
        <button
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1"
          onClick={() => setShowList(!showList)}
        >
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          组件列表 ({components.length})
        </button>
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto flex-1"
            >
              {components.length === 0 && (
                <div className="text-xs text-gray-400 py-2">暂无组件</div>
              )}
              {components.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-white/70 text-xs text-gray-700"
                  onClick={() => selectComponent(c.id)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="font-medium">{c.type}</span>
                  {c.props.text && (
                    <span className="truncate text-gray-400 ml-1">{c.props.text}</span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  if (isMobile) {
    if (inputPanelCollapsed) {
      return (
        <motion.button
          className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600"
          onClick={() => setInputPanelCollapsed(false)}
          whileTap={{ scale: 0.9 }}
        >
          <Sparkles size={20} />
        </motion.button>
      )
    }

    return (
      <motion.div
        className="fixed inset-0 z-50 flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="flex-1 bg-black/30"
          onClick={() => setInputPanelCollapsed(true)}
        />
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="h-full border-r border-gray-300 bg-[#F0F2F5]"
        >
          {panelContent}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div
      className="h-full shrink-0 border-r border-[#E0E0E0]"
      style={{ width: 280, background: '#F0F2F5' }}
    >
      {panelContent}
    </div>
  )
}
