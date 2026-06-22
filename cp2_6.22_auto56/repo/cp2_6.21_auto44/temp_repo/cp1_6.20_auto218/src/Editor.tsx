import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Collaborator } from '@/types'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  collaborators: Collaborator[]
  className?: string
}

export default function Editor({
  content,
  onChange,
  collaborators,
  className,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const getLineCount = () => {
    return content.split('\n').length
  }

  const getCursorLine = (textarea: HTMLTextAreaElement) => {
    const pos = textarea.selectionStart
    return content.substring(0, pos).split('\n').length
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const updateCursor = () => {
      const line = getCursorLine(textarea)
      const event = new CustomEvent('cursorPosition', { detail: { line } })
      window.dispatchEvent(event)
    }

    textarea.addEventListener('keyup', updateCursor)
    textarea.addEventListener('click', updateCursor)

    return () => {
      textarea.removeEventListener('keyup', updateCursor)
      textarea.removeEventListener('click', updateCursor)
    }
  }, [content])

  const lineCount = getLineCount()
  const lineNumbers = Array.from({ length: line