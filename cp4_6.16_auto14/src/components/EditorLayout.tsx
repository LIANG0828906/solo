import { memo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import Toolbar from '@/components/Toolbar';
import PagePanel from '@/components/PagePanel';
import Canvas from '@/components/Canvas';
import HistoryPanel from '@/components/HistoryPanel';
import PreviewMode from '@/components/PreviewMode';
import { cn } from '@/lib/utils';

const EditorLayout = memo(function EditorLayout() {
  const isHistoryOpen = useEditorStore((s) => s.isHistoryOpen);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      <div className="flex-shrink-0">
        <Toolbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn('hidden md:flex flex-shrink-0')}>
          <PagePanel />
        </div>

        <div className="flex-1 overflow-hidden">
          <Canvas />
        </div>

        {isHistoryOpen && (
          <div className="flex-shrink-0">
            <HistoryPanel />
          </div>
        )}
      </div>

      <div className={cn('md:hidden flex-shrink-0 border-t border-gray-200 bg-white max-h-[40vh] overflow-y-auto')}>
        <PagePanel />
      </div>

      <PreviewMode />
    </div>
  );
});

export default EditorLayout;
