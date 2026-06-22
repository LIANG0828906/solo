import { memo, useEffect } from 'react'
import useEditorStore from '@/stores/editorStore'
import Toolbar from '@/components/Toolbar'
import PagePanel from '@/components/PagePanel'
import Canvas from '@/components/Canvas'
import HistoryPanel from '@/components/HistoryPanel'
import PreviewMode from '@/components/PreviewMode'
import { cn } from '@/lib/utils'
import { Plus, BookOpen } from 'lucide-react'

const EditorLayout = memo(function EditorLayout() {
  const isHistoryOpen = useEditorStore((s) => s.isHistoryPanelOpen)
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode)
  const courses = useEditorStore((s) => s.courses)
  const currentCourseId = useEditorStore((s) => s.currentCourseId)
  const createCourse = useEditorStore((s) => s.createCourse)

  useEffect(() => {
    if (!currentCourseId && courses.length === 0) {
      createCourse('我的课件')
    }
  }, [currentCourseId, courses.length, createCourse])

  if (!currentCourseId && courses.length > 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">请选择一个课件开始编辑</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      <div className="flex-shrink-0 relative z-20">
        <Toolbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn('hidden md:flex flex-shrink-0 h-full')}>
          <PagePanel />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Canvas />
        </div>

        {isHistoryOpen && (
          <div className="hidden md:block flex-shrink-0 h-full">
            <HistoryPanel />
          </div>
        )}
      </div>

      <div className={cn('md:hidden flex-shrink-0 border-t border-gray-200 bg-white max-h-[40vh] overflow-y-auto')}>
        <PagePanel />
      </div>

      {isPreviewMode && <PreviewMode />}
    </div>
  )
})

export default EditorLayout
