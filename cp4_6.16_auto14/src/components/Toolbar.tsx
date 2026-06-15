import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export default function Toolbar() {
  const togglePreview = useEditorStore((s) => s.togglePreview);
  const toggleHistory = useEditorStore((s) => s.toggleHistory);

  return (
    <div className={cn('h-12 bg-primary-900 flex items-center px-4 gap-2 text-white')}>
      <span className="font-semibold text-sm mr-auto">CourseForge</span>
      <button
        onClick={toggleHistory}
        className={cn('px-3 py-1 rounded text-xs bg-primary-700 hover:bg-primary-600 transition-colors')}
      >
        History
      </button>
      <button
        onClick={togglePreview}
        className={cn('px-3 py-1 rounded text-xs bg-accent hover:bg-accent-600 transition-colors text-primary-900 font-medium')}
      >
        Preview
      </button>
    </div>
  );
}
