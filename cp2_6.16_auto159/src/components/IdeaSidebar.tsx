import React, { useState, useRef, useEffect } from 'react'
import { Lightbulb, Plus, X, Trash2 } from 'lucide-react'
import { useWritingStore, Idea } from '@/store/writingStore'

interface IdeaSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const PAGE_SIZE = 20

export default function IdeaSidebar({ isOpen, onToggle, onClose }: IdeaSidebarProps) {
  const ideas = useWritingStore((s) => s.ideas)
  const addIdea = useWritingStore((s) => s.addIdea)
  const deleteIdea = useWritingStore((s) => s.deleteIdea)
  const appendIdeaToWriting = useWritingStore((s) => s.appendIdeaToWriting)

  const [showInput, setShowInput] = useState(false)
  const [newIdea, setNewIdea] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [toast, setToast] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sortedIdeas = [...ideas].sort((a, b) => b.createdAt - a.createdAt)
  const visibleIdeas = sortedIdeas.slice(0, visibleCount)

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < sortedIdeas.length) {
          setVisibleCount((c) => c + PAGE_SIZE)
        }
      },
      { root: el, threshold: 0.1 }
    )

    const sentinel = el.querySelector('[data-sentinel]')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [visibleCount, sortedIdeas.length, isOpen])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }

  const handleAddIdea = async () => {
    const trimmed = newIdea.trim()
    if (!trimmed) return
    await addIdea(trimmed)
    setNewIdea('')
    setShowInput(false)
    setVisibleCount((c) => Math.max(c, PAGE_SIZE))
    showToast('✨ 灵感已保存')
  }

  const handleAppend = async (idea: Idea) => {
    await appendIdeaToWriting(idea.id)
    await deleteIdea(idea.id)
    showToast('📝 已追加到写作区')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteIdea(id)
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-0 left-0 h-14 w-14 flex items-center justify-center z-50"
        style={{ backgroundColor: 'transparent' }}
      >
        <Lightbulb size={22} style={{ color: '#F39C12' }} />
      </button>
    )
  }

  return (
    <>
      <div
        className="h-full flex flex-col relative border-r border-[#E0DACD] fade-in"
        style={{
          width: '280px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0DACD]">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} style={{ color: '#F39C12' }} />
            <span className="font-bold text-sm" style={{ color: '#2C3E50' }}>
              灵感捕捉
            </span>
            <span className="text-xs text-gray-400">({ideas.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors hover:bg-[#FFE0B2]"
            style={{ backgroundColor: 'transparent' }}
          >
            <X size={16} style={{ color: '#666' }} />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {visibleIdeas.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Lightbulb size={32} style={{ color: '#ccc', margin: '0 auto 8px' }} />
              <div>还没有灵感</div>
              <div className="text-xs mt-1">点击右下角 + 号记录</div>
            </div>
          )}

          {visibleIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => handleAppend(idea)}
              className="group relative p-3 rounded-xl cursor-pointer transition-all duration-300 fade-in"
              style={{
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: '4px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ background: idea.gradient }}
              />
              <p className="text-sm leading-relaxed pr-6" style={{ color: '#2C3E50' }}>
                {idea.content}
              </p>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(idea.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <button
                onClick={(e) => handleDelete(e, idea.id)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                style={{ backgroundColor: 'rgba(231,76,60,0.1)' }}
              >
                <Trash2 size={12} style={{ color: '#E74C3C' }} />
              </button>
            </div>
          ))}

          {visibleCount < sortedIdeas.length && <div data-sentinel className="h-4" />}
        </div>

        {showInput && (
          <div className="absolute bottom-20 right-4 left-4 fade-in">
            <div
              className="rounded-2xl p-3 shadow-xl"
              style={{ backgroundColor: '#fff', border: '1px solid #E0DACD' }}
            >
              <textarea
                ref={inputRef}
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value.slice(0, 140))}
                placeholder="记录一闪而过的灵感..."
                className="w-full resize-none outline-none text-sm"
                rows={3}
                style={{ color: '#2C3E50', fontFamily: 'inherit' }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{newIdea.length}/140</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowInput(false)
                      setNewIdea('')
                    }}
                    className="px-3 py-1 text-xs text-gray-500"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddIdea}
                    className="px-3 py-1 text-xs text-white"
                    style={{ backgroundColor: '#27AE60' }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowInput(!showInput)}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
          style={{
            backgroundColor: showInput ? '#E74C3C' : '#F39C12',
            transform: showInput ? 'rotate(45deg)' : 'rotate(0)',
          }}
          onMouseEnter={(e) => {
            if (!showInput) e.currentTarget.style.backgroundColor = '#e67e22'
          }}
          onMouseLeave={(e) => {
            if (!showInput) e.currentTarget.style.backgroundColor = '#F39C12'
          }}
        >
          <Plus size={24} color="#fff" />
        </button>

        {toast && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm text-white fade-in"
            style={{ backgroundColor: 'rgba(44,62,80,0.9)' }}
          >
            {toast}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .h-full {
            width: 240px !important;
          }
        }
      `}</style>
    </>
  )
}
