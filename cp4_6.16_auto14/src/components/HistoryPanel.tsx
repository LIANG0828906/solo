import { memo, useCallback } from 'react'
import useEditorStore from '@/stores/editorStore'
import { X, RotateCcw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const HistoryPanel = memo(function HistoryPanel() {
  const isHistoryPanelOpen = useEditorStore((s) => s.isHistoryPanelOpen)
  const toggleHistoryPanel = useEditorStore((s) => s.toggleHistoryPanel)
  const versions = useEditorStore((s) => s.versions)
  const rollbackVersion = useEditorStore((s) => s.rollbackVersion)

  const handleRollback = useCallback(
    (versionId: string) => {
      if (confirm('确定要回退到此版本吗？当前未保存的更改将被撤销。')) {
        rollbackVersion(versionId)
      }
    },
    [rollbackVersion]
  )

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  if (!isHistoryPanelOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in md:hidden"
        onClick={toggleHistoryPanel}
      />

      <div
        className={cn(
          'w-[280px] bg-white border-l border-gray-200 flex flex-col',
          'h-full shrink-0 z-50 animate-slide-in-right'
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary-700" />
            <h3 className="font-semibold text-sm text-gray-800">版本历史</h3>
          </div>
          <button
            onClick={toggleHistoryPanel}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={32} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">暂无保存的版本</p>
              <p className="text-xs text-gray-300 mt-1">按 Ctrl+S 保存</p>
            </div>
          ) : (
            sortedVersions.map((version, index) => (
              <button
                key={version.id}
                onClick={() => handleRollback(version.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all duration-200',
                  'border border-transparent',
                  'hover:bg-accent/5 hover:border-accent/20',
                  'group'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-accent-700 transition-colors">
                      {version.note || `版本 ${sortedVersions.length - index}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(version.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded flex-shrink-0',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'bg-accent/10 text-accent-700'
                    )}
                    title="回退到此版本"
                  >
                    <RotateCcw size={14} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            最多保存 30 个版本
          </p>
        </div>
      </div>
    </>
  )
})

export default HistoryPanel
