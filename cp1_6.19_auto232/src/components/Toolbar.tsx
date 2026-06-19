import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { exportSVG, exportPDF } from '../exportUtils';
import type { ToolMode } from '../types';

const IconSelect = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    <path d="M13 13l6 6" />
  </svg>
);

const IconBubble = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IconConnect = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="7" r="3" />
    <path d="M8.59 15.42 15.42 8.58" />
    <path d="M15.42 8.58c-1.5 1-2.5 2-2 3s2 2 3 2" />
    <polyline points="18 4 18 7 21 7" />
  </svg>
);

const IconSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconPDF = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 18 15 15" />
  </svg>
);

interface ToolButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

function ToolButton({ active, onClick, children, title }: ToolButtonProps) {
  return (
    <motion.div
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: 10,
        color: '#FFFFFF',
        transition: 'all 0.2s ease-out',
        background: active ? '#2B6CB0' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Toolbar() {
  const toolMode = useAppStore((s) => s.toolMode);
  const setToolMode = useAppStore((s) => s.setToolMode);
  const report = useAppStore((s) => s.report);

  const handleExportSVG = () => {
    const canvas = document.getElementById('bubble-map-canvas');
    if (canvas) exportSVG(canvas);
  };

  const handleExportPDF = () => {
    const canvas = document.getElementById('bubble-map-canvas');
    if (canvas && report) {
      exportPDF(canvas, report.content);
    } else if (canvas) {
      exportPDF(canvas, { zoning: '', circulation: '', ecology: '' });
    }
  };

  const setMode = (mode: ToolMode) => () => setToolMode(mode);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 60,
        height: '100vh',
        background: '#1A365D',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 24,
        gap: 16,
        zIndex: 50,
      }}
    >
      <ToolButton
        active={toolMode === 'select'}
        onClick={setMode('select')}
        title="选择工具"
      >
        <IconSelect />
      </ToolButton>
      <ToolButton
        active={toolMode === 'create'}
        onClick={setMode('create')}
        title="气泡工具"
      >
        <IconBubble />
      </ToolButton>
      <ToolButton
        active={toolMode === 'connect'}
        onClick={setMode('connect')}
        title="连线工具"
      >
        <IconConnect />
      </ToolButton>

      <div style={{ flex: 1 }} />

      <ToolButton onClick={handleExportSVG} title="导出SVG">
        <IconSVG />
      </ToolButton>
      <div style={{ marginBottom: 24 }}>
        <ToolButton onClick={handleExportPDF} title="导出PDF">
          <IconPDF />
        </ToolButton>
      </div>
    </div>
  );
}
