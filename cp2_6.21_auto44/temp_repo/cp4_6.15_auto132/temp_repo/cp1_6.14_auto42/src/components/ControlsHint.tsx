import React from 'react';

const ControlsHint: React.FC = () => {
  return (
    <div className="controls-hint">
      <div className="controls-hint-title">◆ 操作指南</div>
      <div className="controls-hint-row">
        <span className="controls-key">W</span>
        <span className="controls-key">A</span>
        <span className="controls-key">S</span>
        <span className="controls-key">D</span>
        <span>平移视角</span>
      </div>
      <div className="controls-hint-row" style={{ marginTop: 4 }}>
        <span style={{ display: 'inline-block', minWidth: 104, color: 'var(--color-neon-cyan)', fontSize: 11, fontWeight: 600 }}>
          鼠标左键拖拽
        </span>
        <span>旋转视角</span>
      </div>
      <div className="controls-hint-row" style={{ marginTop: 4 }}>
        <span style={{ display: 'inline-block', minWidth: 104, color: 'var(--color-neon-cyan)', fontSize: 11, fontWeight: 600 }}>
          滚轮
        </span>
        <span>缩放远近</span>
      </div>
      <div className="controls-hint-row" style={{ marginTop: 4 }}>
        <span style={{ display: 'inline-block', minWidth: 104, color: 'var(--color-neon-cyan)', fontSize: 11, fontWeight: 600 }}>
          点击星体
        </span>
        <span>查看详情</span>
      </div>
    </div>
  );
};

export default ControlsHint;
