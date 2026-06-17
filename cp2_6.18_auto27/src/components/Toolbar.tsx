import { useDesignTokenStore, type PresetName } from '@/store/designTokenStore';
import { Palette, RotateCcw, Flower2, Zap, Clock } from 'lucide-react';

const PRESET_CONFIG: { key: PresetName; label: string; icon: React.ReactNode }[] = [
  { key: 'soft', label: '柔和', icon: <Flower2 size={14} /> },
  { key: 'modern', label: '现代', icon: <Zap size={14} /> },
  { key: 'retro', label: '复古', icon: <Clock size={14} /> },
];

export default function Toolbar({
  onExport,
  onTogglePanel,
  panelCollapsed,
}: {
  onExport: () => void;
  onTogglePanel: () => void;
  panelCollapsed: boolean;
}) {
  const applyPreset = useDesignTokenStore((s) => s.applyPreset);
  const resetAll = useDesignTokenStore((s) => s.resetAll);

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-btn toggle-btn"
          onClick={onTogglePanel}
          title={panelCollapsed ? '展开编辑面板' : '折叠编辑面板'}
          type="button"
        >
          <Palette size={16} />
          <span>StyleSeed</span>
        </button>
      </div>
      <div className="toolbar-center">
        {PRESET_CONFIG.map((p) => (
          <button
            key={p.key}
            className="toolbar-btn preset-btn"
            onClick={() => applyPreset(p.key)}
            type="button"
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
        <button className="toolbar-btn reset-btn" onClick={resetAll} type="button">
          <RotateCcw size={14} />
          <span>重置</span>
        </button>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn export-btn" onClick={onExport} type="button">
          导出 CSS
        </button>
      </div>
    </div>
  );
}
