import { PhotoData, compareParams } from '../utils/photoData';
import RadarChart from './RadarChart';

interface CompareModeProps {
  photos: PhotoData[];
  onClose: () => void;
}

export default function CompareMode({ photos, onClose }: CompareModeProps) {
  const comparison = compareParams(photos);

  return (
    <div className="compare-mode">
      <div className="compare-mode-header">
        <h2 className="compare-mode-title">参数比较</h2>
        <button className="compare-mode-close" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="compare-columns">
        {photos.map((photo) => {
          const isMaxAperture = photo.params.aperture === comparison.maxAperture;
          const isMinAperture = photo.params.aperture === comparison.minAperture;
          const isMaxIso = photo.params.iso === comparison.maxIso;
          const isMinIso = photo.params.iso === comparison.minIso;
          const isMaxEv = photo.params.ev === comparison.maxEv;
          const isMinEv = photo.params.ev === comparison.minEv;

          const getParamClass = (isHigh: boolean, isLow: boolean) => {
            if (isHigh) return 'high';
            if (isLow) return 'low';
            return '';
          };

          return (
            <div key={photo.id} className="compare-column">
              <div className="compare-photo-wrapper">
                <img
                  src={photo.imageUrl}
                  alt=""
                  className="compare-photo"
                />
              </div>

              <div className="compare-params">
                <h3>拍摄参数</h3>
                <ul className="compare-params-list">
                  <li>
                    <span className="param-label">光圈</span>
                    <span className={`param-value ${getParamClass(isMaxAperture, isMinAperture)}`}>
                      f/{photo.params.aperture}
                    </span>
                  </li>
                  <li>
                    <span className="param-label">快门</span>
                    <span className="param-value">
                      {photo.params.shutterSpeed}s
                    </span>
                  </li>
                  <li>
                    <span className="param-label">ISO</span>
                    <span className={`param-value ${getParamClass(isMaxIso, isMinIso)}`}>
                      {photo.params.iso}
                    </span>
                  </li>
                  <li>
                    <span className="param-label">焦距</span>
                    <span className="param-value">
                      {photo.params.focalLength}mm
                    </span>
                  </li>
                  <li>
                    <span className="param-label">曝光值</span>
                    <span className={`param-value ${getParamClass(isMaxEv, isMinEv)}`}>
                      EV {photo.params.ev}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="radar-chart-container">
                <h3>画质评分</h3>
                <RadarChart data={photo.radarScores} size={180} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
