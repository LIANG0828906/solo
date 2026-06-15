import { useState, useEffect } from 'react';
import { X, Wind, Gauge, MapPin, Calendar, Clock } from 'lucide-react';
import { useStormStore } from '@/store/useStormStore';
import { getStormById } from '@/data/stormDataLoader';
import { categoryToColor } from '@/utils/colorScale';
import { format } from 'd3-time-format';

export default function StormDetailPanel() {
  const { selectedStormId, selectStorm } = useStormStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const storm = selectedStormId ? getStormById(selectedStormId) : null;

  useEffect(() => {
    if (selectedStormId) {
      setIsVisible(true);
    }
  }, [selectedStormId]);

  const handleClose = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsFlipping(false);
      selectStorm(null);
    }, 300);
  };

  if (!storm && !isVisible) {
    return (
      <div className="storm-detail-collapsed">
        <div className="storm-detail-collapsed-bar">
          <span className="text-xs opacity-70">详情</span>
        </div>
      </div>
    );
  }

  const catColor = categoryToColor(storm?.category || 1);

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), '%Y-%m-%d');
    } catch {
      return timestamp;
    }
  };

  return (
    <div
      className={`storm-detail-panel ${isVisible ? 'visible' : ''} ${isFlipping ? 'flipping' : ''}`}
    >
      <div className="storm-detail-card">
        <button className="storm-detail-close" onClick={handleClose}>
          <X size={18} />
        </button>

        <div className="storm-detail-header">
          <h2 className="storm-detail-name">{storm?.name}</h2>
          <div
            className="storm-detail-category"
            style={{ backgroundColor: catColor }}
          >
            {storm?.category}级
          </div>
        </div>

        <div className="storm-detail-subtitle">
          {storm?.basin === 'NA' && '北大西洋飓风'}
          {storm?.basin === 'EP' && '东太平洋飓风'}
          {storm?.basin === 'WP' && '西北太平洋台风'}
          {storm?.basin === 'NI' && '北印度洋气旋'}
          {storm?.basin === 'SI' && '南印度洋气旋'}
          {storm?.basin === 'SP' && '南太平洋气旋'}
        </div>

        <div className="storm-detail-stats">
          <div className="stat-item">
            <Calendar size={16} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">发生年份</span>
              <span className="stat-value highlight">{storm?.year}</span>
            </div>
          </div>

          <div className="stat-item">
            <Wind size={16} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">最大风速</span>
              <span className="stat-value highlight">{storm?.maxWind} knots</span>
            </div>
          </div>

          <div className="stat-item">
            <Gauge size={16} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">最低气压</span>
              <span className="stat-value highlight">{storm?.minPressure} hPa</span>
            </div>
          </div>

          <div className="stat-item">
            <MapPin size={16} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">登陆区域</span>
              <span className="stat-value">{storm?.landfall}</span>
            </div>
          </div>

          <div className="stat-item">
            <Clock size={16} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">持续时间</span>
              <span className="stat-value">{storm?.durationDays} 天</span>
            </div>
          </div>
        </div>

        <div className="storm-detail-pathinfo">
          <h4 className="pathinfo-title">路径概览</h4>
          <div className="pathinfo-points">
            {storm?.path.slice(0, 5).map((point, idx) => (
              <div key={idx} className="path-point">
                <div
                  className="path-dot"
                  style={{ backgroundColor: windSpeedToColor(point.windSpeed) }}
                />
                <span className="path-date">{formatDate(point.timestamp)}</span>
                <span className="path-wind">{point.windSpeed} kt</span>
              </div>
            ))}
            {storm && storm.path.length > 5 && (
              <div className="path-more">+{storm.path.length - 5} 个数据点</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function windSpeedToColor(windSpeed: number): string {
  if (windSpeed >= 137) return '#ef4444';
  if (windSpeed >= 113) return '#f87171';
  if (windSpeed >= 96) return '#fb923c';
  if (windSpeed >= 83) return '#facc15';
  if (windSpeed >= 64) return '#4ade80';
  return '#38bdf8';
}
