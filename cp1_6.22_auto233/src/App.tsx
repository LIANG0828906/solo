import { useRef, useCallback } from 'react';
import { BoardProvider, useBoard } from '@/data/cardStore';
import BoardCanvas from '@/canvas/BoardCanvas';
import Toolbar from '@/components/Toolbar';
import CardEditorModal from '@/components/CardEditorModal';
import { exportBoardAsPNG } from '@/export/exportBoard';
import '@/styles/global.css';

function AppContent() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { state } = useBoard();

  const handleExport = useCallback(async () => {
    const canvas = document.querySelector('.board-canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('找不到画布元素');
      return;
    }

    try {
      await exportBoardAsPNG(canvas, state.projectName);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  }, [state.projectName]);

  return (
    <div className="app">
      <Toolbar onExport={handleExport} />
      <div ref={canvasContainerRef} style={{ flex: 1, display: 'flex' }}>
        <BoardCanvas />
      </div>
      <CardEditorModal />
    </div>
  );
}

export default function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  );
}
