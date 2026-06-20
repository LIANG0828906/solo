import React from 'react';
import { useDNAContext } from '../context/DNAContext';

const DetailPanel: React.FC = () => {
  const { highlightedBasePair } = useDNAContext();

  if (!highlightedBasePair) {
    return (
      <>
        <h2 className="panel-title">碱基对详情</h2>
        <div className="empty-detail">
          <div className="empty-detail-icon">🔬</div>
          <div className="empty-detail-text">
            点击三维场景中的
            <br />
            任意碱基对查看详细信息
          </div>
        </div>
      </>
    );
  }

  const { type, index, position, center } = highlightedBasePair;
  const grooveLabel = position === 'major' ? '大沟 (Major Groove)' : '小沟 (Minor Groove)';

  return (
    <>
      <h2 className="panel-title">碱基对详情</h2>

      <div className="detail-section">
        <div className="detail-section-title">基础信息</div>

        <div className="detail-row">
          <span className="detail-row-label">类型</span>
          <span className={`base-pair-tag ${type === 'AT' ? 'at' : 'gc'}`}>
            {type === 'AT' ? 'A · T' : 'G · C'}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-row-label">编号</span>
          <span className="detail-row-value">#{index}</span>
        </div>

        <div className="detail-row">
          <span className="detail-row-label">位置</span>
          <span className="groove-tag">{grooveLabel}</span>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">空间坐标</div>
        <div className="detail-row">
          <span className="detail-row-label">X</span>
          <span className="detail-row-value">{center[0].toFixed(3)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label">Y</span>
          <span className="detail-row-value">{center[1].toFixed(3)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row-label">Z</span>
          <span className="detail-row-value">{center[2].toFixed(3)}</span>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">生物学说明</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
          {type === 'AT' ? (
            <>
              <strong style={{ color: '#34d399' }}>A-T 碱基对</strong>：腺嘌呤（Adenine）与
              胸腺嘧啶（Thymine）通过两条氢键连接，是 DNA 双螺旋中较不稳定的配对。
            </>
          ) : (
            <>
              <strong style={{ color: '#fbbf24' }}>G-C 碱基对</strong>：鸟嘌呤（Guanine）与
              胞嘧啶（Cytosine）通过三条氢键连接，热稳定性高于 A-T 配对。
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DetailPanel;
