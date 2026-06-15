import { X, TrendingUp, Mountain, Calendar, Heart, MapPin } from 'lucide-react';
import { Trail } from '@/shared/types';
import { formatDistance } from '@/shared/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ComparePanelProps {
  trail1: Trail | null;
  trail2: Trail | null;
  onClose: () => void;
}

export function ComparePanel({ trail1, trail2, onClose }: ComparePanelProps) {
  if (!trail1 || !trail2) return null;

  const distanceDiff = trail1.distance - trail2.distance;
  const elevationDiff = trail1.avgElevation - trail2.avgElevation;
  const likesDiff = trail1.likes - trail2.likes;

  const formatSignedDistance = (diff: number) => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatDistance(diff)}`;
  };

  const formatSignedNumber = (diff: number, unit: string = '') => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${Math.round(diff)}${unit}`;
  };

  return (
    <div className="compare-panel">
      <div className="compare-panel-header">
        <h3>
          <TrendingUp size={18} />
          轨迹对比
        </h3>
        <button className="close-btn" onClick={onClose} title="关闭对比面板">
          <X size={18} />
        </button>
      </div>
      
      <div className="compare-legend">
        <div className="legend-item legend-blue">
          <span className="legend-color blue"></span>
          <span className="legend-label">①</span>
          <span className="legend-name" title={trail1.name}>{trail1.name}</span>
        </div>
        <div className="legend-item legend-orange">
          <span className="legend-color orange"></span>
          <span className="legend-label">②</span>
          <span className="legend-name" title={trail2.name}>{trail2.name}</span>
        </div>
      </div>
      
      <div className="compare-stats">
        <div className={`compare-stat-card ${distanceDiff !== 0 ? (distanceDiff > 0 ? 'diff-positive' : 'diff-negative') : ''}`}>
          <div className="stat-icon">
            <MapPin size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">距离差</p>
            <p className="stat-value">{formatSignedDistance(distanceDiff)}</p>
            <p className="stat-hint">
              {distanceDiff === 0 ? '距离相同' : 
                distanceDiff > 0 ? `① 更长 ${formatDistance(Math.abs(distanceDiff))}` :
                `② 更长 ${formatDistance(Math.abs(distanceDiff))}`}
            </p>
          </div>
        </div>
        
        <div className={`compare-stat-card ${elevationDiff !== 0 ? (elevationDiff > 0 ? 'diff-positive' : 'diff-negative') : ''}`}>
          <div className="stat-icon elevation-icon">
            <Mountain size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">平均海拔差</p>
            <p className="stat-value">{formatSignedNumber(elevationDiff, ' m')}</p>
            <p className="stat-hint">
              {elevationDiff === 0 ? '海拔相同' : 
                elevationDiff > 0 ? `① 更高 ${Math.round(Math.abs(elevationDiff))}m` :
                `② 更高 ${Math.round(Math.abs(elevationDiff))}m`}
            </p>
          </div>
        </div>
      </div>
      
      <div className="compare-details">
        <h4 className="compare-details-title">详细数据</h4>
        <table className="compare-table">
          <thead>
            <tr>
              <th>指标</th>
              <th className="blue-text">① {trail1.name.length > 6 ? trail1.name.slice(0, 6) + '...' : trail1.name}</th>
              <th className="orange-text">② {trail2.name.length > 6 ? trail2.name.slice(0, 6) + '...' : trail2.name}</th>
              <th className="diff-text">差值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="metric-label">
                <MapPin size={12} />
                总距离
              </td>
              <td>{formatDistance(trail1.distance)}</td>
              <td>{formatDistance(trail2.distance)}</td>
              <td className={`diff-value ${distanceDiff > 0 ? 'diff-pos' : distanceDiff < 0 ? 'diff-neg' : ''}`}>
                {formatSignedDistance(distanceDiff)}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Mountain size={12} />
                平均海拔
              </td>
              <td>{Math.round(trail1.avgElevation)} m</td>
              <td>{Math.round(trail2.avgElevation)} m</td>
              <td className={`diff-value ${elevationDiff > 0 ? 'diff-pos' : elevationDiff < 0 ? 'diff-neg' : ''}`}>
                {formatSignedNumber(elevationDiff, ' m')}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Heart size={12} />
                点赞数
              </td>
              <td>{trail1.likes}</td>
              <td>{trail2.likes}</td>
              <td className={`diff-value ${likesDiff > 0 ? 'diff-pos' : likesDiff < 0 ? 'diff-neg' : ''}`}>
                {formatSignedNumber(likesDiff)}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Calendar size={12} />
                记录时间
              </td>
              <td>{format(new Date(trail1.createdAt), 'yyyy/MM/dd', { locale: zhCN })}</td>
              <td>{format(new Date(trail2.createdAt), 'yyyy/MM/dd', { locale: zhCN })}</td>
              <td className="diff-value">
                {format(new Date(trail1.createdAt), 'MM/dd', { locale: zhCN })} - {format(new Date(trail2.createdAt), 'MM/dd', { locale: zhCN })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="compare-panel-footer">
        <button className="compare-exit-btn" onClick={onClose}>
          <X size={14} />
          退出对比模式
        </button>
      </div>
    </div>
  );
}
