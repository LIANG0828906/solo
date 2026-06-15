import { useAppStore } from '../store/store';
import { buildingsData } from '../utils/buildingData';
import { dayOfYearToDate, hoursToTime } from '../data/sunCalculator';

export default function ControlPanel() {
  const dateTime = useAppStore((state) => state.dateTime);
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const setDateTime = useAppStore((state) => state.setDateTime);

  const selectedBuilding = buildingsData.find((b) => b.id === selectedBuildingId);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dayOfYear = parseInt(e.target.value, 10);
    setDateTime({ ...dateTime, dayOfYear });
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseFloat(e.target.value);
    setDateTime({ ...dateTime, hours });
  };

  const dateStr = dayOfYearToDate(dateTime.dayOfYear);
  const timeStr = hoursToTime(dateTime.hours);

  return (
    <div className="control-panel">
      <h2 className="panel-title">日照分析控制面板</h2>

      <div className="control-group">
        <label className="control-label">
          日期: <span className="control-value">{dateStr}</span>
        </label>
        <input
          type="range"
          min="1"
          max="365"
          step="1"
          value={dateTime.dayOfYear}
          onChange={handleDayChange}
          className="slider"
        />
        <div className="slider-labels">
          <span>1月</span>
          <span>6月</span>
          <span>12月</span>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">
          时间: <span className="control-value">{timeStr}</span>
        </label>
        <input
          type="range"
          min="6"
          max="18"
          step="0.25"
          value={dateTime.hours}
          onChange={handleHoursChange}
          className="slider"
        />
        <div className="slider-labels">
          <span>6:00</span>
          <span>12:00</span>
          <span>18:00</span>
        </div>
      </div>

      <div className="building-info-panel">
        <h3 className="info-title">建筑信息</h3>
        {selectedBuilding ? (
          <div className="building-info-card">
            <p className="info-text">
              该建筑可接受日照: <span className="highlight">{selectedBuilding.sunHours.toFixed(1)}小时</span>
            </p>
            <p className="info-subtext">
              建筑高度: {selectedBuilding.size.height} 单位
            </p>
            <p className="info-subtext">
              建筑尺寸: {selectedBuilding.size.width} × {selectedBuilding.size.depth} 单位
            </p>
          </div>
        ) : (
          <p className="info-placeholder">点击场景中的建筑查看日照信息</p>
        )}
      </div>

      <div className="instructions">
        <h4 className="instructions-title">操作说明</h4>
        <ul className="instructions-list">
          <li>鼠标左键拖拽: 旋转视角</li>
          <li>鼠标滚轮: 缩放视图</li>
          <li>鼠标右键拖拽: 平移视图</li>
          <li>点击建筑: 查看日照信息</li>
        </ul>
      </div>
    </div>
  );
}
