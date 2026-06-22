import ToolPalette from '@/components/ToolPalette'
import StageEditor from '@/components/StageEditor'
import TimelinePanel from '@/components/TimelinePanel'

export default function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ backgroundColor: '#1A1A2E' }}>
      <div className="flex items-start" style={{ gap: '4px' }}>
        <ToolPalette />
        <StageEditor />
        <TimelinePanel />
      </div>
    </div>
  )
}
