import React, { useState, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { BlockData, ThermalApi } from '../module_api/ThermalApi';

interface ControlPanelProps {
  solarIntensity: number;
  greenRate: number;
  buildingDensity: number;
  heatmapEnabled: boolean;
  onSolarChange: (value: number) => void;
  onGreenRateChange: (value: number) => void;
  onBuildingDensityChange: (value: number) => void;
  onHeatmapToggle: (enabled: boolean) => void;
  onSolarChangeEnd: (value: number) => void;
  onGreenRateChangeEnd: (value: number) => void;
  onBuildingDensityChangeEnd: (value: number) => void;
  selectedBlock: BlockData | null;
  selectedBlockScreenPos: { x: number; y: number } | null;
  onCloseBlockInfo: () => void;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

export function ControlPanel({
  solarIntensity,
  greenRate,
  buildingDensity,
  heatmapEnabled,
  onSolarChange,
  onGreenRateChange,
  onBuildingDensityChange,
  onHeatmapToggle,
  onSolarChangeEnd,
  onGreenRateChangeEnd,
  onBuildingDensityChangeEnd,
  selectedBlock,
  selectedBlockScreenPos,
  onCloseBlockInfo,
  isPanelCollapsed,
  onTogglePanel,
}: ControlPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = useCallback(async () => {
    if (!selectedBlock) return;
    setExporting(true);
    try {
      const data = await ThermalApi.getBlockHistory(selectedBlock.id);
      const rows = [
        ['时间', '热力值', '温度(°C)'],
        ...data.history.map((h) => [h.time, h.heatValue.toFixed(4), h.temperature.toFixed(2)]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${selectedBlock.name}_24小时热力数据.csv`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [selectedBlock]);

  return (
    <>
      <div className={`control-panel ${isPanelCollapsed ? 'collapsed' : 'open'}`}>
        <h2>环境控制</h2>

        <div className="toggle-group">
          <label>显示热力叠加层</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={heatmapEnabled}
              onChange={(e) => onHeatmapToggle(e.target.checked)}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div style={{ height: '16px' }} />

        <div className="slider-group">
          <label>
            <span>☀️ 太阳辐射强度</span>
            <span className="slider-value">{solarIntensity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={solarIntensity}
            onChange={(e) => onSolarChange(Number(e.target.value))}
            onMouseUp={(e) => onSolarChangeEnd(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) =>
              onSolarChangeEnd(Number((e.target as HTMLInputElement).value))
            }
          />
        </div>

        <div className="slider-group">
          <label>
            <span>🌳 绿化覆盖率</span>
            <span className="slider-value">{greenRate}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={greenRate}
            onChange={(e) => onGreenRateChange(Number(e.target.value))}
            onMouseUp={(e) => onGreenRateChangeEnd(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) =>
              onGreenRateChangeEnd(Number((e.target as HTMLInputElement).value))
            }
          />
        </div>

        <div className="slider-group">
          <label>
            <span>🏢 建筑密度</span>
            <span className="slider-value">{buildingDensity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={buildingDensity}
            onChange={(e) => onBuildingDensityChange(Number(e.target.value))}
            onMouseUp={(e) =>
              onBuildingDensityChangeEnd(Number((e.target as HTMLInputElement).value))
            }
            onTouchEnd={(e) =>
              onBuildingDensityChangeEnd(Number((e.target as HTMLInputElement).value))
            }
          />
        </div>

        <div style={{ marginTop: '30px', padding: '14px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>操作提示</div>
          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>
            • 鼠标拖拽旋转视角<br />
            • 滚轮缩放场景<br />
            • 点击街区查看详情<br />
            • Shift+拖拽/右键框选区域
          </div>
        </div>
      </div>

      {isPanelCollapsed && (
        <div className="floating-toggle" onClick={onTogglePanel}>
          ⚙️
        </div>
      )}

      {selectedBlock && selectedBlockScreenPos && (
        <div
          className="block-info-popup"
          style={{
            left: Math.min(selectedBlockScreenPos.x + 10, window.innerWidth - 240),
            top: Math.min(selectedBlockScreenPos.y - 80, window.innerHeight - 220),
          }}
        >
          <button className="popup-close" onClick={onCloseBlockInfo}>
            ×
          </button>
          <h3>{selectedBlock.name}</h3>
          <p>
            当前温度:{' '}
            <span className="info-value">
              {selectedBlock.temperature?.toFixed(1) || '--'}°C
            </span>
          </p>
          <p>
            绿化率:{' '}
            <span className="info-value">{(selectedBlock.greenRate * 100).toFixed(0)}%</span>
          </p>
          <p>
            建筑密度:{' '}
            <span className="info-value">
              {(selectedBlock.buildingDensity * 100).toFixed(0)}%
            </span>
          </p>
          <p>
            坐标:{' '}
            <span className="info-value">
              ({selectedBlock.x}, {selectedBlock.z})
            </span>
          </p>
          <button className="export-btn" onClick={handleExportCSV} disabled={exporting}>
            {exporting ? '导出中...' : '📥 导出24小时数据 (CSV)'}
          </button>
        </div>
      )}
    </>
  );
}
