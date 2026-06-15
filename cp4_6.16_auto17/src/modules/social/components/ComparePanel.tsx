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

const getSafeNumber = (value: number | undefined | null): number | null => {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return value;
};

const getSafeString = (value: string | undefined | null, fallback: string = '--'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const getSafeDate = (value: Date | undefined | null): Date | null => {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDiffValue = (value: number | null, unit: string = '', suffix: string = ''): string => {
  if (value === null) return '--';
  if (value === 0) return `0${unit}${suffix}`;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${unit}${suffix}`;
};

const isTrailDataComplete = (trail: Trail | null): boolean => {
  if (!trail) return false;
  const dist = getSafeNumber(trail.distance);
  const elev = getSafeNumber(trail.avgElevation);
  const name = getSafeString(trail.name);
  const date = getSafeDate(trail.createdAt);
  const likes = getSafeNumber(trail.likes);
  return dist !== null && elev !== null && name !== '--' && date !== null && likes !== null;
};

export function ComparePanel({ trail1, trail2, onClose }: ComparePanelProps) {
  if (!trail1 || !trail2) return null;

  const t1Distance = getSafeNumber(trail1.distance);
  const t2Distance = getSafeNumber(trail2.distance);
  const t1Elevation = getSafeNumber(trail1.avgElevation);
  const t2Elevation = getSafeNumber(trail2.avgElevation);
  const t1Likes = getSafeNumber(trail1.likes);
  const t2Likes = getSafeNumber(trail2.likes);
  const t1Name = getSafeString(trail1.name);
  const t2Name = getSafeString(trail2.name);
  const t1CreatedAt = getSafeDate(trail1.createdAt);
  const t2CreatedAt = getSafeDate(trail2.createdAt);

  const distanceDiff = (t1Distance !== null && t2Distance !== null) ? t1Distance - t2Distance : null;
  const elevationDiff = (t1Elevation !== null && t2Elevation !== null) ? t1Elevation - t2Elevation : null;
  const likesDiff = (t1Likes !== null && t2Likes !== null) ? t1Likes - t2Likes : null;

  const dataComplete = isTrailDataComplete(trail1) && isTrailDataComplete(trail2);

  const formatSignedDistance = (diff: number | null): string => {
    if (diff === null) return '--';
    if (diff === 0) return formatDistance(0);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatDistance(Math.abs(diff))}`;
  };

  const formatSignedNumber = (diff: number | null, unit: string = ''): string => {
    if (diff === null) return '--';
    if (diff === 0) return `0${unit}`;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${Math.round(Math.abs(diff))}${unit}`;
  };

  const getDiffClass = (diff: number | null): string => {
    if (diff === null || diff === 0) return '';
    return diff > 0 ? 'diff-pos' : 'diff-neg';
  };

  const getCardDiffClass = (diff: number | null): string => {
    if (diff === null || diff === 0) return '';
    return diff > 0 ? 'diff-positive' : 'diff-negative';
  };

  if (!dataComplete) {
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
            <span className="legend-name skeleton">加载中...</span>
          </div>
          <div className="legend-item legend-orange">
            <span className="legend-color orange"></span>
            <span className="legend-label">②</span>
            <span className="legend-name skeleton">加载中...</span>
          </div>
        </div>

        <div className="compare-stats">
          <div className="compare-stat-card skeleton-card">
            <div className="stat-icon skeleton-icon">
              <MapPin size={20} />
            </div>
            <div className="stat-content">
              <p className="stat-label">距离差</p>
              <p className="stat-value skeleton-text">--</p>
              <p className="stat-hint skeleton-text">数据加载中</p>
            </div>
          </div>

          <div className="compare-stat-card skeleton-card">
            <div className="stat-icon elevation-icon skeleton-icon">
              <Mountain size={20} />
            </div>
            <div className="stat-content">
              <p className="stat-label">平均海拔差</p>
              <p className="stat-value skeleton-text">--</p>
              <p className="stat-hint skeleton-text">数据加载中</p>
            </div>
          </div>
        </div>

        <div className="compare-details">
          <h4 className="compare-details-title">详细数据</h4>
          <table className="compare-table">
            <thead>
              <tr>
                <th>指标</th>
                <th className="blue-text">① --</th>
                <th className="orange-text">② --</th>
                <th className="diff-text">差值</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-label">
                  <MapPin size={12} />
                  总距离
                </td>
                <td className="skeleton-text">--</td>
                <td className="skeleton-text">--</td>
                <td className="diff-value skeleton-text">--</td>
              </tr>
              <tr>
                <td className="metric-label">
                  <Mountain size={12} />
                  平均海拔
                </td>
                <td className="skeleton-text">--</td>
                <td className="skeleton-text">--</td>
                <td className="diff-value skeleton-text">--</td>
              </tr>
              <tr>
                <td className="metric-label">
                  <Heart size={12} />
                  点赞数
                </td>
                <td className="skeleton-text">--</td>
                <td className="skeleton-text">--</td>
                <td className="diff-value skeleton-text">--</td>
              </tr>
              <tr>
                <td className="metric-label">
                  <Calendar size={12} />
                  记录时间
                </td>
                <td className="skeleton-text">--</td>
                <td className="skeleton-text">--</td>
                <td className="diff-value skeleton-text">--</td>
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
          <span className="legend-name" title={t1Name}>{t1Name}</span>
        </div>
        <div className="legend-item legend-orange">
          <span className="legend-color orange"></span>
          <span className="legend-label">②</span>
          <span className="legend-name" title={t2Name}>{t2Name}</span>
        </div>
      </div>
      
      <div className="compare-stats">
        <div className={`compare-stat-card ${getCardDiffClass(distanceDiff)}`}>
          <div className="stat-icon">
            <MapPin size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">距离差</p>
            <p className="stat-value">{formatSignedDistance(distanceDiff)}</p>
            <p className="stat-hint">
              {distanceDiff === null ? '数据不完整' :
                distanceDiff === 0 ? '距离相同' : 
                distanceDiff > 0 ? `① 更长 ${formatDistance(Math.abs(distanceDiff))}` :
                `② 更长 ${formatDistance(Math.abs(distanceDiff))}`}
            </p>
          </div>
        </div>
        
        <div className={`compare-stat-card ${getCardDiffClass(elevationDiff)}`}>
          <div className="stat-icon elevation-icon">
            <Mountain size={20} />
          </div>
          <div className="stat-content">
            <p className="stat-label">平均海拔差</p>
            <p className="stat-value">{formatSignedNumber(elevationDiff, ' m')}</p>
            <p className="stat-hint">
              {elevationDiff === null ? '数据不完整' :
                elevationDiff === 0 ? '海拔相同' : 
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
              <th className="blue-text">① {t1Name.length > 6 ? t1Name.slice(0, 6) + '...' : t1Name}</th>
              <th className="orange-text">② {t2Name.length > 6 ? t2Name.slice(0, 6) + '...' : t2Name}</th>
              <th className="diff-text">差值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="metric-label">
                <MapPin size={12} />
                总距离
              </td>
              <td>{t1Distance !== null ? formatDistance(t1Distance) : '--'}</td>
              <td>{t2Distance !== null ? formatDistance(t2Distance) : '--'}</td>
              <td className={`diff-value ${getDiffClass(distanceDiff)}`}>
                {formatSignedDistance(distanceDiff)}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Mountain size={12} />
                平均海拔
              </td>
              <td>{t1Elevation !== null ? `${Math.round(t1Elevation)} m` : '--'}</td>
              <td>{t2Elevation !== null ? `${Math.round(t2Elevation)} m` : '--'}</td>
              <td className={`diff-value ${getDiffClass(elevationDiff)}`}>
                {formatSignedNumber(elevationDiff, ' m')}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Heart size={12} />
                点赞数
              </td>
              <td>{t1Likes !== null ? t1Likes : '--'}</td>
              <td>{t2Likes !== null ? t2Likes : '--'}</td>
              <td className={`diff-value ${getDiffClass(likesDiff)}`}>
                {formatSignedNumber(likesDiff)}
              </td>
            </tr>
            <tr>
              <td className="metric-label">
                <Calendar size={12} />
                记录时间
              </td>
              <td>{t1CreatedAt ? format(t1CreatedAt, 'yyyy/MM/dd', { locale: zhCN }) : '--'}</td>
              <td>{t2CreatedAt ? format(t2CreatedAt, 'yyyy/MM/dd', { locale: zhCN }) : '--'}</td>
              <td className="diff-value">
                {t1CreatedAt && t2CreatedAt
                  ? `${format(t1CreatedAt, 'MM/dd', { locale: zhCN })} - ${format(t2CreatedAt, 'MM/dd', { locale: zhCN })}`
                  : '--'}
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
