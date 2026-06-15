import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export default function HistoryPanel() {
  const isHistoryOpen = useEditorStore((s) => s.isHistoryOpen);
  const toggleHistory = useEditorStore((s) => s.toggleHistory);
  const versions = useEditorStore((s) => s.versions);
  const rollback = useEditorStore((s) => s.rollback);

  if (!isHistoryOpen) return null;

  return (
    <div className={cn('w-[280px] bg-white border-l border-gray-200 p-4 overflow-y-auto animate-slide-in-right')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-800">Version History</h3>
        <button onClick={toggleHistory} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
      {versions.length === 0 ? (
        <p className="text-xs text-gray-400">No versions saved yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => rollback(v.id)}
              className={cn('text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors')}
            >
              <div className="text-xs text-gray-600">{v.note || 'Auto save'}</div>
              <div className="text-[10px] text-gray-400 mt-1">{new Date(v.timestamp).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
