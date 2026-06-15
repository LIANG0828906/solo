import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export default function Canvas() {
  const pageId = useEditorStore((s) => s.pageId);
  const pages = useEditorStore((s) => s.pages);
  const blocks = useEditorStore((s) => s.blocks);

  const currentPage = pages.find((p) => p.id === pageId);
  const pageBlocks = blocks.filter((b) => b.pageId === pageId);

  return (
    <div className={cn('flex-1 bg-canvas overflow-auto flex items-start justify-center p-8')}>
      {currentPage ? (
        <div
          className={cn('w-[800px] min-h-[500px] rounded-lg shadow-md relative')}
          style={{ backgroundColor: currentPage.backgroundColor || '#ffffff' }}
        >
          {pageBlocks.map((block) => (
            <div
              key={block.id}
              className={cn('absolute bg-white rounded shadow-sm border border-gray-100 p-2')}
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
              }}
            >
              {block.type === 'text' && (
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: (block as import('@/types').TextBlock).content }} />
              )}
              {block.type === 'image' && (
                <img src={(block as import('@/types').ImageBlock).url} alt={(block as import('@/types').ImageBlock).alt} className="w-full h-full object-cover rounded" />
              )}
              {block.type === 'quiz' && (
                <div className="text-sm font-medium">{(block as import('@/types').QuizBlock).question}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('text-gray-400 text-sm')}>Select a page to edit</div>
      )}
    </div>
  );
}
