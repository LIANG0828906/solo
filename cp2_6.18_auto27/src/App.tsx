import { useState } from 'react';
import TokenEditor from '@/components/TokenEditor';
import ComponentPreview from '@/components/ComponentPreview';
import Toolbar from '@/components/Toolbar';
import ExportModal from '@/components/ExportModal';

export default function App() {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="app-layout">
      <Toolbar
        onExport={() => setExportOpen(true)}
        onTogglePanel={() => setPanelCollapsed(!panelCollapsed)}
        panelCollapsed={panelCollapsed}
      />
      <div className="app-body">
        <aside
          className={`editor-panel ${panelCollapsed ? 'collapsed' : ''}`}
        >
          <TokenEditor />
        </aside>
        <main className="preview-area">
          <ComponentPreview />
        </main>
      </div>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
