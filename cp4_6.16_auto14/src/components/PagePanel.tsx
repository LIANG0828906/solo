import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export default function PagePanel() {
  const pages = useEditorStore((s) => s.pages);
  const pageId = useEditorStore((s) => s.pageId);
  const setPageId = useEditorStore((s) => s.setPageId);

  return (
    <div className={cn('w-[260px] bg-white border-r border-gray-200 p-3 overflow-y-auto flex flex-col gap-2')}>
      {pages.map((page) => (
        <button
          key={page.id}
          onClick={() => setPageId(page.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
            page.id === pageId
              ? 'bg-accent/10 text-accent-700 border border-accent/30'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-transparent'
          )}
        >
          {page.title || 'Untitled'}
        </button>
      ))}
    </div>
  );
}
