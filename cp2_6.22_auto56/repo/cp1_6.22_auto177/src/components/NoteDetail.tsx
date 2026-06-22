import { useState } from 'react'
import { X, MessageSquare, Send, Clock } from 'lucide-react'
import { useStore } from '@/store'

function formatFullDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export default function NoteDetail() {
  const selectedNote = useStore((s) => s.selectedNote)
  const detailOpen = useStore((s) => s.detailOpen)
  const setDetailOpen = useStore((s) => s.setDetailOpen)
  const addQuestion = useStore((s) => s.addQuestion)
  const [question, setQuestion] = useState('')

  if (!selectedNote || !detailOpen) return null

  const sortedQA = [...selectedNote.qa].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleSubmit = async () => {
    if (!question.trim()) return
    await addQuestion(selectedNote.id, question.trim())
    setQuestion('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-20 lg:hidden"
        onClick={() => setDetailOpen(false)}
      />
      <aside className="fixed lg:relative right-0 top-14 lg:top-0 bottom-0 w-[280px] bg-white border-l border-gray-100 flex flex-col z-20 shadow-lg lg:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">笔记详情</h2>
          <button
            className="lg:hidden p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => setDetailOpen(false)}
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {selectedNote.title}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {formatFullDate(selectedNote.createdAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {selectedNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {selectedNote.content}
            </div>
          </div>

          <div className="border-t border-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-[#6366F1]" />
              <h4 className="text-sm font-semibold text-gray-700">
                问答 ({sortedQA.length})
              </h4>
            </div>

            {sortedQA.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                暂无提问，来发起第一个吧
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {sortedQA.map((qa) => (
                  <div
                    key={qa.id}
                    className="rounded-lg bg-gray-50 p-3 text-sm"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#6366F1] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Q
                      </span>
                      <p className="text-gray-700 leading-relaxed">
                        {qa.question}
                      </p>
                    </div>
                    {qa.answer ? (
                      <div className="flex items-start gap-2 ml-0">
                        <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                          A
                        </span>
                        <p className="text-gray-500 leading-relaxed">
                          {qa.answer}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 ml-7">
                        等待回答中...
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 ml-7">
                      <Clock size={10} className="text-gray-300" />
                      <span className="text-[10px] text-gray-300">
                        {formatFullDate(qa.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 p-3 shrink-0">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
              placeholder="输入你的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="px-3 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#6366F1]/90 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              onClick={handleSubmit}
              disabled={!question.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
