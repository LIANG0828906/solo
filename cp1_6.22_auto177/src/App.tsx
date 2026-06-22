import { useEffect } from 'react'
import { useStore } from './store'
import SearchBar from './components/SearchBar'
import NoteList from './components/NoteList'
import NoteDetail from './components/NoteDetail'
import { BookOpen } from 'lucide-react'

export default function App() {
  const fetchNotes = useStore((s) => s.fetchNotes)
  const selectedNote = useStore((s) => s.selectedNote)

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <div className="h-screen flex flex-col bg-white">
      <SearchBar />
      <div className="flex-1 flex overflow-hidden relative">
        <NoteList />
        <NoteDetail />
        {!selectedNote && (
          <div className="hidden lg:flex w-[280px] border-l border-gray-100 items-center justify-center">
            <div className="text-center text-gray-300">
              <BookOpen size={40} strokeWidth={1} className="mx-auto mb-2" />
              <p className="text-xs">选择笔记查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
