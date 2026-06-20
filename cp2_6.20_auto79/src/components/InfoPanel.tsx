import { useTerrainStore } from '../store';

const brushTypeLabels: Record<string, string> = {
  raise: '隆起笔刷',
  lower: '凹陷笔刷',
  smooth: '平滑笔刷',
};

export default function InfoPanel() {
  const { brush, mouseGridInfo, water, toggleWaterRunning, setBrushIntensity } =
    useTerrainStore();

  return (
    <div className="info-panel">
      <h3 className="info-title">实时信息</h3>

      <div className="info-row">
        <span className="info-label">当前笔刷</span>
        <span className="info-value">{brushTypeLabels[brush.type]}</span>
      </div>

      <div className="info-row">
        <span className="info-label">压力强度</span>
        <span className="info-value">{brush.strength} / 10</span>
      </div>

      <div className="info-row">
        <span className="info-label">笔刷倍率</span>
        <span className="info-value">{brush.intensity.toFixed(1)}x</span>
      </div>

      <div className="info-divider" />

      {mouseGridInfo ? (
        <>
          <div className="info-row">
            <span className="info-label">网格坐标</span>
            <span className="info-value mono">
              ({mouseGridInfo.gridX}, {mouseGridInfo.gridZ}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">海拔高度</span>
            <span className="info-value mono">
              {mouseGridInfo.height.toFixed(1)} 单位
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">坡度</span>
            <span className="info-value mono">
              {mouseGridInfo.slope.toFixed(1)}°
            </span>
          </div>
        </>
      ) : (
        <div className="info-hint">将鼠标移至地形查看数据</div>
      )}

      <div className="info-divider" />

      <div className="info-row">
        <span className="info-label">水流模拟</span>
        <span className="info-value">
          {water.startPoint ? '运行中' : '未设置'}
        </span>
      </div>

      <button
        className={`water-toggle ${water.isRunning ? 'running' : 'paused'}`}
        onClick={toggleWaterRunning}
        disabled={!water.startPoint}
      >
        {water.isRunning ? '⏸ 暂停水流' : '▶ 启动水流'}
      </button>

      <div className="info-divider" />

      <div className="info-row">
        <span className="info-label">强度倍率</span>
      </div>
      <input
        type="range"
        min="0.1"
        max="2.0"
        step="0.1"
        value={brush.intensity}
        onChange={(e) => setBrushIntensity(Number(e.target.value))}
        className="intensity-slider"
      />
      <div className="slider-labels">
        <span>0.1x</span>
        <span>2.0x</span>
      </div>
    </div>
  );
}
