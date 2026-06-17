/**
 * App 组件：应用主入口
 *
 * 模块职责：
 * - 整体布局（左右分栏，顶部工具栏）
 * - 管理面板折叠状态和导出模态框显示状态
 * - 组装所有子组件（Toolbar、TokenEditor、ComponentPreview、ExportModal）
 *
 * 调用关系：
 * - 组合所有子组件，传递状态和回调
 * - 数据流向：TokenEditor → store → ComponentPreview（单向数据流）
 */

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
