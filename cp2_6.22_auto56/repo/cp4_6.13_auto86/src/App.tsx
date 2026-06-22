import TextPanel from '@/components/TextPanel'
import IconPanel from '@/components/IconPanel'
import Canvas from '@/components/Canvas'
import DecorPanel from '@/components/DecorPanel'

export default function App() {
  return (
    <div className="min-h-screen bg-badge-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-badge-secondary/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-badge-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">创意字体徽章设计器</h1>
            <p className="text-[10px] text-gray-500">选择字体 · 拖拽图标 · 装饰导出</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-56 flex-shrink-0 border-r border-badge-secondary/30 p-3 overflow-y-auto">
          <TextPanel />
        </aside>

        <main className="flex-1 flex flex-col p-4 min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex justify-center">
              <Canvas />
            </div>
          </div>
          <div className="mt-3 border-t border-badge-secondary/30 pt-2">
            <DecorPanel />
          </div>
        </main>

        <aside className="w-52 flex-shrink-0 border-l border-badge-secondary/30 p-3 overflow-y-auto">
          <IconPanel />
        </aside>
      </div>
    </div>
  )
}
