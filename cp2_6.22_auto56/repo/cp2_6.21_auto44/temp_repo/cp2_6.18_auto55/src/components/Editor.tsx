import React, { useCallback, useRef, useEffect } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import Toolbar from './Toolbar'

const Editor: React.FC = React.memo(() => {
  const { content, updateContent, activeDocId, updateFormatMarks } = useDocumentStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalUpdate = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content
      }
    }
    isInternalUpdate.current = false
  }, [content, activeDocId])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true
      updateContent(editorRef.current.innerHTML)
    }
  }, [updateContent])

  const getActiveFormatMarks = (): string[] => {
    const marks: string[] = []
    if (document.queryCommandState('bold')) marks.push('bold')
    if (document.queryCommandState('italic')) marks.push('italic')
    if (document.queryCommandState('underline')) marks.push('underline')
    const block = document.queryCommandValue('formatBlock')
    if (block === 'h1') marks.push('h1')
    if (block === 'h2') marks.push('h2')
    if (block === 'h3') marks.push('h3')
    if (block === 'pre') marks.push('codeBlock')
    if (block === 'blockquote') marks.push('blockquote')
    return marks
  }

  const syncContentAndMarks = useCallback((additionalMark: string | null = null) => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    const newContent = editorRef.current.innerHTML
    updateContent(newContent)
    let marks = getActiveFormatMarks()
    if (additionalMark && !marks.includes(additionalMark)) {
      marks = [...marks, additionalMark]
    }
    updateFormatMarks(marks)
  }, [updateContent, updateFormatMarks])

  const wrapWithCodeBlock = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      document.execCommand('formatBlock', false, 'pre')
      syncContentAndMarks('codeBlock')
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (selectedText.trim() === '') {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = '在此输入代码'
      pre.appendChild(code)
      range.deleteContents()
      range.insertNode(pre)

      range.setStart(code.firstChild || code, 0)
      range.setEnd(code.firstChild || code, code.textContent?.length || 0)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = selectedText
      pre.appendChild(code)

      range.deleteContents()
      range.insertNode(pre)

      range.setStartAfter(pre)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    syncContentAndMarks('codeBlock')
    editorRef.current?.focus()
  }, [syncContentAndMarks])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      let additionalMark: string | null = null

      if (e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        e.stopPropagation()
        additionalMark = 'codeBlock'
        wrapWithCodeBlock()
      } else if (e.key === 'b') {
        e.preventDefault()
        e.stopPropagation()
        additionalMark = 'bold'
        document.execCommand('bold')
      } else if (e.key === 'i') {
        e.preventDefault()
        e.stopPropagation()
        additionalMark = 'italic'
        document.execCommand('italic')
      } else if (e.key === 'u') {
        e.preventDefault()
        e.stopPropagation()
        additionalMark = 'underline'
        document.execCommand('underline')
      }

      if (additionalMark && additionalMark !== 'codeBlock') {
        setTimeout(() => syncContentAndMarks(additionalMark), 0)
      }
    }
  }, [wrapWithCodeBlock, syncContentAndMarks])

  const handleMouseUp = useCallback(() => {
    updateFormatMarks(getActiveFormatMarks())
  }, [updateFormatMarks])

  const handleKeyUp = useCallback(() => {
    updateFormatMarks(getActiveFormatMarks())
  }, [updateFormatMarks])

  const applyFormat = useCallback((command: string, value?: string) => {
    if (command === 'formatBlock' && value === 'pre') {
      wrapWithCodeBlock()
      return
    }

    document.execCommand(command, false, value)
    syncContentAndMarks(null)
    editorRef.current?.focus()
  }, [wrapWithCodeBlock, syncContentAndMarks])

  if (!activeDocId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
        请创建或选择一个文档开始编辑
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Toolbar onFormat={applyFormat} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        className="flex-1 outline-none overflow-y-auto bg-white border border-gray-300 rounded-lg p-4 text-base leading-relaxed focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors duration-200"
        style={{ minHeight: 300, wordBreak: 'break-word' }}
      />
    </div>
  )
})

Editor.displayName = 'Editor'

export default Editor
