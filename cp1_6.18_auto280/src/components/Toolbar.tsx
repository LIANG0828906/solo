import { useFossilStore } from '@/store/useFossilStore';
import { RotateCcw, Paintbrush, HardHat, Dna } from 'lucide-react';
import './Toolbar.css';

export default function Toolbar() {
  const { toolSettings, setToolSettings, resetScene, boneFragments, fullyAssembled } = useFossilStore();
  const cleanedCount = boneFragments.filter(b => b.cleaned).length;
  const totalCount = boneFragments.length || 10;

  return (
    <div className="toolbar-container">
      <div className="toolbar-header">
        <Paintbrush size={18} color="#FFD700" />
        <h2 className="toolbar-title">挖掘工具</h2>
      </div>

      <div className="progress-section">
        <div className="progress-label-row">
          <Dna size={14} color="#4A90D9" />
          <span>骨骼清理进度</span>
          <span className="progress-num">{cleanedCount}/{totalCount}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(cleanedCount / totalCount) * 100}%` }}
          />
        </div>
        {fullyAssembled && (
          <div className="assembled-badge">骨架复原完成 ✓</div>
        )}
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="slider-legend">
            <Paintbrush size={14} />
            刷子大小
          </span>
          <span className="slider-value">{toolSettings.brushSize}</span>
        </div>
        <div className="custom-slider">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={toolSettings.brushSize}
            onChange={(e) => setToolSettings({ brushSize: Number(e.target.value) })}
            className="range-input"
          />
        </div>
        <div className="slider-scale">
          <span>细</span>
          <span>粗</span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="slider-legend">
            <HardHat size={14} />
            沙土硬度
          </span>
          <span className="slider-value">{(toolSettings.sandHardness * 100).toFixed(0)}%</span>
        </div>
        <div className="custom-slider">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={toolSettings.sandHardness}
            onChange={(e) => setToolSettings({ sandHardness: Number(e.target.value) })}
            className="range-input"
          />
        </div>
        <div className="slider-scale">
          <span>软</span>
          <span>硬</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => resetScene()}
        className="reset-button"
      >
        <RotateCcw size={16} />
        重新开始
      </button>

      <div className="hint-text">
        <p>💡 使用鼠标在沙盘上拖拽即可清理沙土</p>
        <p>清理全部 10 块骨骼后将自动拼接</p>
      </div>
    </div>
  );
}
