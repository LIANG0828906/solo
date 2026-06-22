import { useStarStore } from '@/store/starStore';
import { X } from 'lucide-react';
import './StarInfo.css';

export function StarInfo() {
  const selectedStarId = useStarStore((state) => state.selectedStarId);
  const getStarById = useStarStore((state) => state.getStarById);
  const selectStar = useStarStore((state) => state.selectStar);

  const star = selectedStarId ? getStarById(selectedStarId) : null;
  const isVisible = !!star;

  const handleClose = () => {
    selectStar(null);
  };

  if (!star) return null;

  return (
    <div className={`star-info-panel ${isVisible ? 'visible' : ''}`}>
      <button className="star-info-close" onClick={handleClose} aria-label="关闭">
        <X size={18} />
      </button>

      <div className="star-info-header">
        <div
          className="star-info-color-indicator"
          style={{
            background: `linear-gradient(135deg, 
              rgb(${Math.round((star.temperature / 5000) * 255)}, ${Math.round(200 + (star.temperature - 3500) * 0.05)}, 255), 
              rgb(255, ${Math.round(150 + (star.temperature - 3500) * 0.04)}, ${Math.round(100 + (star.temperature - 3500) * 0.06)}))`,
          }}
        />
        <h2 className="star-info-name">{star.name}</h2>
        <div className="star-info-spectral">光谱类型: {star.spectralType}</div>
      </div>

      <div className="star-info-content">
        <div className="star-info-row">
          <span className="star-info-label">绝对星等</span>
          <span className="star-info-value">{star.magnitude.toFixed(2)}</span>
        </div>
        <div className="star-info-row">
          <span className="star-info-label">距地距离</span>
          <span className="star-info-value">{star.distance.toFixed(1)} 光年</span>
        </div>
        <div className="star-info-row">
          <span className="star-info-label">表面温度</span>
          <span className="star-info-value">{star.temperature.toFixed(0)} K</span>
        </div>
        <div className="star-info-row">
          <span className="star-info-label">恒星尺寸</span>
          <span className="star-info-value">{star.size.toFixed(2)} 单位</span>
        </div>
      </div>

      <div className="star-info-footer">
        <button className="star-info-btn" onClick={handleClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
