import React, { useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
} from 'lucide-react'
import { useDocumentStore, DocumentState } from '@/store/documentStore'

interface ToolbarProps {
  onFormat: (command: string, value?: string) => void
}

interface FormatButton {
  command: string
  value?: string
  icon: React.ReactNode
  label: string
  mark: string
}

const formatButtons: FormatButton[] = [
  { command: 'formatBlock', value: 'h1', icon: <Heading1 size={16} />, label: 'H1', mark: 'h1' },
  { command: 'formatBlock', value: 'h2', icon: <Heading2 size={16} />, label: 'H2', mark: 'h2' },
  { command: 'formatBlock', value: 'h3', icon: <Heading3 size={16} />, label: 'H3', mark: 'h3' },
  { command: 'bold', icon: <Bold size={16} />, label: '加粗', mark: 'bold' },
  { command: 'italic', icon: <Italic size={16} />, label: '斜体', mark: 'italic' },
  { command: 'underline', icon: <Underline size={16} />, label: '下划线', mark: 'underline' },
  { command: 'insertUnorderedList', icon: <List size={16} />, label: '无序列表', mark: 'insertUnorderedList' },
  { command: 'insertOrderedList', icon: <ListOrdered size={16} />, label: '有序列表', mark: 'insertOrderedList' },
  { command: 'formatBlock', value: 'pre', icon: <Code size={16} />, label: '代码块', mark: 'codeBlock' },
  { command: 'formatBlock', value: 'blockquote', icon: <Quote size={16} />, label: '引用', mark: 'blockquote' },
]

const formatMarksSelector = (s: DocumentState) => s.formatMarks

const Toolbar: React.FC<ToolbarProps> = React.memo(({ onFormat }) => {
  const formatMarks = useDocumentStore(formatMarksSelector)

  const handleClick = useCallback((btn: FormatButton) => {
    onFormat(btn.command, btn.value)
  }, [onFormat])

  return (
    <div className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded-lg mb-2 flex-wrap">
      {formatButtons.map((btn) => {
        const isActive = formatMarks.includes(btn.mark)
        return (
          <button
            key={btn.mark}
            onClick={() => handleClick(btn)}
            title={btn.label}
            className={`p-2 rounded-md transition-colors duration-200 ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {btn.icon}
          </button>
        )
      })}
    </div>
  )
})

Toolbar.displayName = 'Toolbar'

export default Toolbar
