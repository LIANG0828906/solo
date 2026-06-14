import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import NodePanel from '@/components/NodePanel'
import TreeEditor from '@/components/TreeEditor'
import { SceneViewer } from '@/components/SceneViewer'
import ControlBar from '@/components/ControlBar'
import { useBehaviorTreeStore } from '@/stores/behaviorTreeStore'

export default function App() {
  const panelCollapsed = useBehaviorTreeStore((state) => state.panelCollapsed)
  const togglePanel = useBehaviorTreeStore((state) => state.togglePanel)

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a1a2e] text-[#e0e0e0]">
      <style>{`
        @media (max-width: 767px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
      <DndProvider backend={HTML5Backend}>
        <NodePanel collapsed={panelCollapsed} onToggle={togglePanel} />
        <div
          className="main-content flex flex-col h-full transition-all duration-300 ease-in-out"
          style={{
            marginLeft: panelCollapsed ? '48px' : '240px',
            marginBottom: '60px',
          }}
        >
          <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
            <div className="flex-1 h-full relative min-h-0">
              <TreeEditor />
            </div>
            <div className="flex-1 h-full relative border-l border-white/10 min-h-0">
              <SceneViewer />
            </div>
          </div>
        </div>
        <ControlBar />
      </DndProvider>
    </div>
  )
}
