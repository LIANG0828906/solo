import { GridPoint } from '../utils/dataLoader';

interface InfoPanelProps {
  selectedPoint: GridPoint | null;
  year: number;
  yearIndex: number;
}

function InfoPanel({ selectedPoint, year, yearIndex }: InfoPanelProps) {
  if (!selectedPoint) {
    return (
      <div className="panel info-panel">
        <div className="panel-title">网格点信息</div>
        <div className="info-panel-placeholder">
          点击地形上的网格点查看详情
        </div>
      </div>
    );
  }

  const currentDensity = selectedPoint.densities[yearIndex];
  const prevDensity = yearIndex > 0 ? selectedPoint.densities[yearIndex - 1] : currentDensity;
  
  const changeAmount = currentDensity - prevDensity;
  const changePercent = prevDensity > 0 ? (changeAmount / prevDensity) * 100 : 0;
  
  const isIncrease = changeAmount > 0;
  const isDecrease = changeAmount < 0;

  const trendClass = isIncrease ? 'trend-up' : isDecrease ? 'trend-down' : 'trend-flat';
  const trendArrow = isIncrease ? '↑' : isDecrease ? '↓' : '→';
  const trendText = isIncrease ? '上升' : isDecrease ? '下降' : '持平';

  return (
    <div className="panel info-panel">
      <div className="panel-title">网格点信息</div>
      
      <div className="info-card" key={selectedPoint.id + '-' + year}>
        <div className="info-card-header">
          <div className="info-card-region">{selectedPoint.region}</div>
          <div className="info-card-id">ID: {selectedPoint.id}</div>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div className="section-label">人口密度</div>
          <div className="density-value">{Math.round(currentDensity)}</div>
          <div className="density-unit">人 / 平方公里</div>
        </div>
        
        <div className={`trend-section ${trendClass}`}>
          <span className="trend-arrow">{trendArrow}</span>
          <span className="trend-text">
            {trendText} {Math.abs(changePercent).toFixed(1)}%
            {yearIndex > 0 && ` (较${year - 1}年)`}
          </span>
        </div>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <div className="section-label">位置信息</div>
        <div className="info-item">
          <span className="info-item-label">经度</span>
          <span className="info-item-value">{selectedPoint.lng.toFixed(2)}°E</span>
        </div>
        <div className="info-item">
          <span className="info-item-label">纬度</span>
          <span className="info-item-value">{selectedPoint.lat.toFixed(2)}°N</span>
        </div>
        <div className="info-item">
          <span className="info-item-label">海拔</span>
          <span className="info-item-value">{selectedPoint.height.toFixed(2)} 单位</span>
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
