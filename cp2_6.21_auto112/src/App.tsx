import React, { useRef, useState } from 'react';
import { ControlPanel } from './modules/panel/ControlPanel';
import {
  ComparisonView, ComparisonViewHandle } from './modules/render/ComparisonView';
import { useControls } from './modules/panel/useControls';
import { exportComparison } from './modules/render/exportUtils';

export default function App() {
  const { columns, text } = useControls();
  const comparisonRef = useRef<ComparisonViewHandle>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const els = comparisonRef.current?.getColumnElements();
    if (!els) return;
    setExporting(true);
    try {
      await exportComparison(els, columns, text);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar-title">Typography Lab — 字体排印实验工具</div>
        <div className="toolbar-actions">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '📦 导出对比'}
          </button>
        </div>
      </header>
      <div className="main-content">
        <ControlPanel />
        <ComparisonView ref={comparisonRef} />
      </div>
    </div>
  );
}
