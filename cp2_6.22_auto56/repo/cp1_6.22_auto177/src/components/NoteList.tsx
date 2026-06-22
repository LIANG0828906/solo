import { MessageSquare, Tag } from 'lucide-react'
import { useStore } from '@/store'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}

export default function NoteList() {
  const filteredNotes = useStore((s) => s.filteredNotes)
  const tagCounts = useStore((s) => s.tagCounts)
  const selectedTag = useStore((s) => s.selectedTag)
  const selectedNote = useStore((s) => s.selectedNote)
  const selectTag = useStore((s) => s.selectTag)
  const selectNote = useStore((s) => s.selectNote)
  const loading = useStore((s) => s.loading)
  const mobileMenuOpen = useStore((s) => s.mobileMenuOpen)

  const sortedTags = Object.keys(tagCounts).sort()

  return (
    <>
      <aside
        className={`w-[240px] bg-[#F8FAFC] border-r border-gray-100 shrink-0 overflow-y-auto transition-transform duration-300 z-20
          fixed md:relative inset-y-0 left-0 top-14 md:top-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            标签分类
          </h2>
          <nav className="space-y-1">
            <button
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 flex items-center justify-between group
                ${!selectedTag ? 'bg-[#6366F1]/10 text-[#6366F1] font-medium' : 'text-gray-600 hover:bg-gray-100 hover:scale-[1.02]'}`}
              onClick={() => selectTag(null)}
            >
              <span>全部笔记</span>
              <span className="text-xs text-[#60A5FA]">{filteredNotes.length}</span>
            </button>
            {sortedTags.map((tag) => (
              <button
                key={tag}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 flex items-center justify-between group
                  ${selectedTag === tag ? 'bg-[#6366F1]/10 text-[#6366F1] font-medium' : 'text-gray-600 hover:bg-gray-100 hover:scale-[1.02]'}`}
                onClick={() => selectTag(tag)}
              >
                <span className="flex items-center gap-2">
                  <Tag size={14} className="opacity-50" />
                  {tag}
                </span>
                <span className="text-xs text-[#60A5FA]">{tagCounts[tag]}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => useStore.getState().toggleMobileMenu()}
        />
      )}

      <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-50 rounded w-full mb-2" />
                <div className="h-3 bg-gray-50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <MessageSquare size={48} strokeWidth={1} className="mb-3" />
            <p className="text-sm">暂无匹配的笔记</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note, index) => (
              <article
                key={note.id}
                className={`rounded-xl border p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md
                  ${selectedNote?.id === note.id
                    ? 'border-[#6366F1]/40 shadow-[0_2px_8px_rgba(99,102,241,0.15)]'
                    : 'border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  }`}
                style={{
                  animation: `slideUp 0.3s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                }}
                onClick={() => selectNote(note.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {note.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap mt-1">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                  {truncate(note.content, 200)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: '#E0E7FF',
                          color: '#4338CA',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageSquare size={14} />
                    <span>{note.qa.length}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
