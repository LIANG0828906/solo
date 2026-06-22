import React from 'react';
import { useStore, ColorInfo } from '../store';

const Recommendations: React.FC = () => {
  const harmonyResult = useStore((s) => s.harmonyResult);
  const selectedRecommendation = useStore((s) => s.selectedRecommendation);
  const setSelectedRecommendation = useStore((s) => s.setSelectedRecommendation);
  const setPrimaryColors = useStore((s) => s.setPrimaryColors);

  const recommendations = harmonyResult?.recommendations || [];

  if (recommendations.length === 0) {
    return (
      <div className="card">
        <h3>推荐方案</h3>
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>分析完成后将显示推荐方案</p>
      </div>
    );
  }

  const titles = ['方案一', '方案二', '方案三'];

  const toHex = (rgb: number[]): string => {
    return '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="card">
      <h3>推荐方案</h3>
      <div className="recommendations">
        {recommendations.slice(0, 3).map((rec, index) => {
          const colorsInfo: ColorInfo[] = rec.colors_info || [];
          const colorsRgb: number[][] = rec.colors || [];

          return (
            <div
              key={index}
              className={`rec-card${selectedRecommendation === index ? ' selected' : ''}`}
              onClick={() => {
                setSelectedRecommendation(index);
                if (colorsInfo.length > 0) {
                  setPrimaryColors(colorsInfo);
                }
              }}
            >
              <h4>{titles[index]}</h4>
              <div className="rec-colors">
                {colorsRgb.slice(0, 5).map((rgb, ci) => {
                  const hex = colorsInfo[ci]?.hex || toHex(rgb);
                  return (
                    <div
                      key={ci}
                      className="rec-swatch"
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
              <div className="rec-reason">{rec.reason}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recommendations;
