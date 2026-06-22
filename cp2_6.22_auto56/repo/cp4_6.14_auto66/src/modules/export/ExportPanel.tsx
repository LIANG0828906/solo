import { useState } from 'react';
import { StoryboardPanel } from '../../types';
import { buildExportData, exportJson, exportPdf } from './exportUtils';

interface ExportPanelProps {
  title: string;
  participants: string[];
  panels: StoryboardPanel[];
}

export default function ExportPanel({ title, participants, panels }: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const canExport = panels.length > 0;

  const handleJsonExport = async () => {
    if (!canExport) return;
    setExporting('json');
    try {
      await new Promise((r) => setTimeout(r, 250));
      const data = buildExportData(title, participants, panels);
      exportJson(data);
    } finally {
      setExporting(null);
    }
  };

  const handlePdfExport = async () => {
    if (!canExport) return;
    setExporting('pdf');
    try {
      await new Promise((r) => setTimeout(r, 350));
      const data = buildExportData(title, participants, panels);
      exportPdf(data);
    } finally {
      setExporting(null);
    }
  };

  const btnBase = {
    padding: '9px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    background: '#8b5cf6',
    cursor: canExport ? 'pointer' : 'not-allowed',
    opacity: canExport ? 1 : 0.5,
    transition: 'background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
    boxShadow: canExport ? '0 2px 8px rgba(139,92,246,0.3)' : 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 50,
        display: 'flex',
        gap: 10,
        padding: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
      }}
    >
      <button
        onClick={handleJsonExport}
        disabled={!canExport || !!exporting}
        className="press-animate"
        style={btnBase}
        onMouseEnter={(e) => {
          if (canExport) (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed';
        }}
        onMouseLeave={(e) => {
          if (canExport) (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6';
        }}
      >
        <span style={{ fontSize: 14 }}>{exporting === 'json' ? '⏳' : '📄'}</span>
        {exporting === 'json' ? '导出中...' : '导出 JSON'}
      </button>

      <button
        onClick={handlePdfExport}
        disabled={!canExport || !!exporting}
        className="press-animate"
        style={btnBase}
        onMouseEnter={(e) => {
          if (canExport) (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed';
        }}
        onMouseLeave={(e) => {
          if (canExport) (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6';
        }}
      >
        <span style={{ fontSize: 14 }}>{exporting === 'pdf' ? '⏳' : '📑'}</span>
        {exporting === 'pdf' ? '导出中...' : '导出 PDF'}
      </button>
    </div>
  );
}
