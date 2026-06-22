import { memo } from 'react';
import { useColorStore } from '@/store/useColorStore';

const PalettePanel = memo(() => {
  const presets = useColorStore((s) => s.presets);
  const history = useColorStore((s) => s.history);
  const applyPreset = useColorStore((s) => s.applyPreset);
  const selectHistory = useColorStore((s) => s.selectHistory);

  return (
    <div className="palette-panel">
      <div className="panel-section">
        <h3 className="panel-title">预设色板</h3>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className="preset-swatch"
              style={{ background: preset.hex }}
              title={preset.name}
              onClick={() => applyPreset(preset.id)}
            >
              <span className="swatch-tooltip">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">最近使用</h3>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">暂无历史记录</div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                className="history-item"
                onClick={() => selectHistory(item.id)}
              >
                <span
                  className="history-swatch"
                  style={{ background: item.hex }}
                />
                <span className="history-hex">{item.hex}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

PalettePanel.displayName = 'PalettePanel';
export default PalettePanel;
