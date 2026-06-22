import React from 'react';
import type { GalaxyParams, SimulationParams } from '@/core/GalaxyGenerator';

type SimStatus = 'idle' | 'running' | 'paused' | 'finished';

interface Props {
  galaxyA: GalaxyParams;
  galaxyB: GalaxyParams;
  simParams: SimulationParams;
  simStatus: SimStatus;
  trailMode: boolean;
  elapsed: number;
  onGalaxyAChange: (p: Partial<GalaxyParams>) => void;
  onGalaxyBChange: (p: Partial<GalaxyParams>) => void;
  onSimParamsChange: (p: Partial<SimulationParams>) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onResetCamera: () => void;
  onToggleTrail: () => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export const ControlPanel: React.FC<Props> = ({
  galaxyA, galaxyB, simParams, simStatus, trailMode, elapsed,
  onGalaxyAChange, onGalaxyBChange, onSimParamsChange,
  onStart, onPause, onReset, onResetCamera, onToggleTrail,
}) => {
  return (
    <div className="control-panel">
      <h2 className="panel-title">🌌 星系碰撞模拟器</h2>

      <div className="panel-section">
        <h3 className="panel-section-title">星系 A (蓝色系)</h3>
        <div className="form-row">
          <label className="form-label">恒星数量</label>
          <input
            type="number"
            className="form-input"
            min={100} max={500} step={50}
            value={galaxyA.starCount}
            onChange={e => onGalaxyAChange({ starCount: clamp(+e.target.value || 100, 100, 500) })}
            disabled={simStatus === 'running'}
          />
        </div>
        <div className="form-row">
          <label className="form-label">分布形态</label>
          <select
            className="form-select"
            value={galaxyA.morphology}
            onChange={e => onGalaxyAChange({ morphology: e.target.value as 'spiral' | 'elliptical' })}
            disabled={simStatus === 'running'}
          >
            <option value="spiral">螺旋星系</option>
            <option value="elliptical">椭圆星系</option>
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">旋转方向</label>
          <select
            className="form-select"
            value={galaxyA.rotation}
            onChange={e => onGalaxyAChange({ rotation: e.target.value as 'cw' | 'ccw' })}
            disabled={simStatus === 'running'}
          >
            <option value="ccw">逆时针</option>
            <option value="cw">顺时针</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">星系 B (橙色系)</h3>
        <div className="form-row">
          <label className="form-label">恒星数量</label>
          <input
            type="number"
            className="form-input"
            min={100} max={500} step={50}
            value={galaxyB.starCount}
            onChange={e => onGalaxyBChange({ starCount: clamp(+e.target.value || 100, 100, 500) })}
            disabled={simStatus === 'running'}
          />
        </div>
        <div className="form-row">
          <label className="form-label">分布形态</label>
          <select
            className="form-select"
            value={galaxyB.morphology}
            onChange={e => onGalaxyBChange({ morphology: e.target.value as 'spiral' | 'elliptical' })}
            disabled={simStatus === 'running'}
          >
            <option value="spiral">螺旋星系</option>
            <option value="elliptical">椭圆星系</option>
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">旋转方向</label>
          <select
            className="form-select"
            value={galaxyB.rotation}
            onChange={e => onGalaxyBChange({ rotation: e.target.value as 'cw' | 'ccw' })}
            disabled={simStatus === 'running'}
          >
            <option value="ccw">逆时针</option>
            <option value="cw">顺时针</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">碰撞参数</h3>
        <div className="slider-row">
          <div className="slider-header">
            <span className="form-label">碰撞角度</span>
            <span className="slider-value">{simParams.collisionAngle}°</span>
          </div>
          <input
            type="range"
            className="slider"
            min={0} max={180} step={1}
            value={simParams.collisionAngle}
            onChange={e => onSimParamsChange({ collisionAngle: +e.target.value })}
            disabled={simStatus === 'running'}
          />
        </div>
        <div className="slider-row">
          <div className="slider-header">
            <span className="form-label">相对速度</span>
            <span className="slider-value">{simParams.relativeSpeed} u/s</span>
          </div>
          <input
            type="range"
            className="slider"
            min={50} max={200} step={5}
            value={simParams.relativeSpeed}
            onChange={e => onSimParamsChange({ relativeSpeed: +e.target.value })}
            disabled={simStatus === 'running'}
          />
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-section-title">模拟控制</h3>
        <div className="form-row" style={{ marginBottom: 12 }}>
          <span className="form-label">运行时间</span>
          <span className="slider-value">{elapsed.toFixed(1)}s / 60.0s</span>
        </div>
        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="form-label">轨迹模式</label>
          <button
            className={`btn ${trailMode ? 'btn-primary' : ''}`}
            style={{ flex: '0 0 auto', minWidth: 80 }}
            onClick={onToggleTrail}
          >
            {trailMode ? '已开启' : '已关闭'}
          </button>
        </div>
        <div className="button-row">
          {simStatus !== 'running' ? (
            <button className="btn btn-primary" onClick={onStart}>
              {simStatus === 'paused' ? '继续' : '开始模拟'}
            </button>
          ) : (
            <button className="btn btn-warn" onClick={onPause}>
              暂停
            </button>
          )}
          <button className="btn" onClick={onReset}>重置</button>
          <button className="btn" onClick={onResetCamera}>复位视角</button>
        </div>
      </div>
    </div>
  );
};
