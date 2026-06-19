import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useBoardStore from '@/store/boardStore';
import { BoardView } from '@/modules/board/BoardView';
import { CapturePanel } from '@/modules/capture/CapturePanel';
import { ExportDialog } from '@/modules/export/ExportDialog';
import '@/styles/components.css';

function App() {
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const loadFromIndexedDB = useBoardStore(state => state.loadFromIndexedDB);

  useEffect(() => {
    loadFromIndexedDB();
  }, [loadFromIndexedDB]);

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              <BoardView
                onOpenCapture={() => setIsCaptureOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            }
          />
        </Routes>
        
        <CapturePanel
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
        />
        
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
