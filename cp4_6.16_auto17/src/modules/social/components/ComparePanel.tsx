import { X, TrendingUp, Mountain } from 'lucide-react';
import { Trail } from '@/shared/types';
import { formatDistance } from '@/shared/utils';

interface ComparePanelProps {
  trail1: Trail | null;
  trail2: Trail | null;
  onClose: () => void;
}

export function ComparePanel({ trail1, trail2, onClose }: ComparePanelProps) {
  if (!trail1 || !trail2) return null;

  const distanceDiff = Math.abs(trail1.distance - trail2.distance);
  const elevationDiff = Math.abs(trail1.avgElevation - trail2.avgElevation);
  const longerTrail = trail1.distance >= trail2.distance ? trail1 : trail2;
  const higherTrail = trail1.avgElevation >= trail2.avgElevation ? trail1 : trail2;

  return (
    <div className="compare-panel">
      <div className="compare-panel-header">
        <h3>轨迹对比</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="compare-legend">
        <div className="legend-item">
          <span className="legend-color blue"></span>
          <span>{trail1.name}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color orange"></span>
          <span>{trail2.name}</span>
        </div>
      </div>
      
      <div className="compare-stats">
        <div className="compare-stat-card">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">距离差</p>
            <p className="stat-value">{formatDistance(distanceDiff)}</p>
            <p className="stat-hint">
              {longerTrail.name} 更长
            </p>
          </div>
        </div>
        
        <div className="compare-stat-card">
          <div className="stat-icon">
            <Mountain size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">平均海拔差</p>
            <p className="stat-value">{Math.round(elevationDiff)} m</p>
            <p className="stat-hint">
              {higherTrail.name} 更高
            </p>
          </div>
        </div>
      </div>
      
      <div className="compare-details">
        <table className="compare-table">
          <thead>
            <tr>
              <th>指标</th>
              <th className="blue-text">{trail1.name}</th>
              <th className="orange-text">{trail2.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>总距离</td>
              <td>{formatDistance(trail1.distance)}</td>
              <td>{formatDistance(trail2.distance)}</td>
            </tr>
            <tr>
              <td>平均海拔</td>
              <td>{Math.round(trail1.avgElevation)} m</td>
              <td>{Math.round(trail2.avgElevation)} m</td>
            </tr>
            <tr>
              <td>点赞数</td>
              <td>{trail1.likes}</td>
              <td>{trail2.likes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
