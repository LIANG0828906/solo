import React, { useMemo } from 'react';
import { useColorStore } from '../store/colorStore';
import ProductRenderer from './ProductRenderer';
import {
  PART_LABELS,
  ProductPart,
  getDifferenceLevel,
  getAverageDeltaE
} from '../utils/colorUtils';

const ComparisonView: React.FC = () => {
  const schemeA = useColorStore((state) => state.schemeA);
  const schemeB = useColorStore((state) => state.schemeB);
  const productType = useColorStore((state) => state.productType);
  const showDifference = useColorStore((state) => state.showDifference);
  const toggleDifference = useColorStore((state) => state.toggleDifference);
  const getColorDifference = useColorStore((state) => state.getColorDifference);
  const savedSchemes = useColorStore((state) => state.savedSchemes);
  const saveScheme = useColorStore((state) => state.saveScheme);
  const loadScheme = useColorStore((state) => state.loadScheme);
  const deleteScheme = useColorStore((state) => state.deleteScheme);

  const [schemeName, setSchemeName] = React.useState('');
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [showSavedList, setShowSavedList] = React.useState(false);

  const differences = useMemo(() => getColorDifference(), [schemeA, schemeB, getColorDifference]);
  const avgDeltaE = useMemo(() => getAverageDeltaE(differences), [differences]);

  const handleSave = () => {
    const success = saveScheme(schemeName);
    if (success) {
      setSchemeName('');
      setShowSaveDialog(false);
    } else {
      alert('最多只能保存10个方案，请先删除一些方案');
    }
  };

  const parts: ProductPart[] = ['body', 'trim', 'lining', 'stitching'];

  const getHeatColor = (deltaE: number): string => {
    const maxDelta = 30;
    const normalized = Math.min(deltaE / maxDelta, 1);
    
    if (normalized < 0.33) {
      return '#00ffff';
    } else if (normalized < 0.66) {
      return '#ffff00';
    } else {
      return '#ff0000';
    }
  };

  const heatmapOverlayB = useMemo(() => {
    if (!showDifference) return null;

    return (
      <div className="heatmap-svg-overlay">
        <svg viewBox="0 0 400 300" className="heatmap-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {parts.map((part) => (
              <filter key={part} id={`heat-filter-${part}`}>
                <feGaussianBlur stdDeviation="3" />
              </filter>
            ))}
          </defs>
          
          {productType === 'shoe' && (
            <>
              <ellipse cx="200" cy="130" rx="130" ry="70" fill={getHeatColor(differences.body)} opacity="0.5" />
              <path
                d="M 80 200 Q 50 180 80 160 L 120 100 Q 150 60 200 55 Q 250 50 300 70 L 340 100 Q 360 120 350 180"
                fill="none"
                stroke={getHeatColor(differences.trim)}
                strokeWidth="12"
                opacity="0.6"
              />
              <ellipse cx="130" cy="165" rx="35" ry="25" fill={getHeatColor(differences.lining)} opacity="0.5" />
              <path
                d="M 180 90 L 200 85 L 220 90 M 175 110 L 200 105 L 225 110 M 170 130 L 200 125 L 230 130"
                stroke={getHeatColor(differences.stitching)}
                strokeWidth="4"
                fill="none"
                opacity="0.7"
              />
            </>
          )}
          
          {productType === 'headphone' && (
            <>
              <path
                d="M 80 200 Q 80 80 200 60 Q 320 80 320 200"
                fill="none"
                stroke={getHeatColor(differences.body)}
                strokeWidth="30"
                opacity="0.5"
              />
              <ellipse cx="80" cy="200" rx="55" ry="75" fill={getHeatColor(differences.trim)} opacity="0.5" />
              <ellipse cx="320" cy="200" rx="55" ry="75" fill={getHeatColor(differences.trim)} opacity="0.5" />
              <ellipse cx="80" cy="205" rx="35" ry="50" fill={getHeatColor(differences.lining)} opacity="0.6" />
              <ellipse cx="320" cy="205" rx="35" ry="50" fill={getHeatColor(differences.lining)} opacity="0.6" />
              <path
                d="M 45 -30 Q 80 -40 115 -30"
                stroke={getHeatColor(differences.stitching)}
                strokeWidth="4"
                fill="none"
                opacity="0.7"
                transform="translate(0, 200)"
              />
            </>
          )}
          
          {productType === 'backpack' && (
            <>
              <rect x="60" y="90" width="230" height="230" rx="15" fill={getHeatColor(differences.body)} opacity="0.4" />
              <rect x="85" y="140" width="180" height="145" rx="10" fill={getHeatColor(differences.trim)} opacity="0.4" />
              <rect x="95" y="150" width="160" height="125" rx="5" fill={getHeatColor(differences.lining)} opacity="0.5" />
              <path
                d="M 100 160 L 250 160 M 100 200 L 250 200 M 100 240 L 250 240"
                stroke={getHeatColor(differences.stitching)}
                strokeWidth="3"
                opacity="0.7"
              />
            </>
          )}
        </svg>
      </div>
    );
  }, [showDifference, differences, productType]);

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <h2 className="comparison-title">双方案对比</h2>
        <div className="comparison-actions">
          <button
            className={`btn-diff-toggle ${showDifference ? 'active' : ''}`}
            onClick={toggleDifference}
          >
            {showDifference ? '隐藏差异' : '显示差异'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowSavedList(!showSavedList)}
          >
            方案列表 ({savedSchemes.length}/10)
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowSaveDialog(true)}
          >
            保存方案
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>保存配色方案</h3>
            <input
              type="text"
              className="scheme-name-input"
              placeholder="输入方案名称"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSaveDialog(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showSavedList && (
        <div className="saved-schemes-panel">
          <div className="saved-schemes-header">
            <h3>已保存方案</h3>
            <button className="btn-close" onClick={() => setShowSavedList(false)}>×</button>
          </div>
          <div className="saved-schemes-list">
            {savedSchemes.length === 0 ? (
              <p className="empty-state">暂无保存的方案</p>
            ) : (
              savedSchemes.map((scheme) => (
                <div key={scheme.id} className="saved-scheme-item">
                  <div className="scheme-info">
                    <span className="scheme-name">{scheme.name}</span>
                    <span className="scheme-product">{scheme.productType}</span>
                  </div>
                  <div className="scheme-colors">
                    <div className="scheme-color-preview" style={{ backgroundColor: scheme.schemeA.body }} title="方案A主体" />
                    <div className="scheme-color-preview" style={{ backgroundColor: scheme.schemeB.body }} title="方案B主体" />
                  </div>
                  <div className="scheme-actions">
                    <button className="btn-load" onClick={() => loadScheme(scheme.id)}>
                      加载
                    </button>
                    <button className="btn-delete" onClick={() => deleteScheme(scheme.id)}>
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="comparison-grid">
        <div className="comparison-column scheme-a-column">
          <div className="column-header">
            <span className="scheme-badge scheme-a-badge">方案 A</span>
          </div>
          <div className="product-display">
            <ProductRenderer
              colorConfig={schemeA}
              productType={productType}
            />
          </div>
          <div className="color-summary">
            {parts.map((part) => (
              <div key={part} className="color-summary-item">
                <div
                  className="color-dot"
                  style={{ backgroundColor: schemeA[part] }}
                />
                <span className="color-label">{PART_LABELS[part]}</span>
                <span className="color-value">{schemeA[part].toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="comparison-divider">
          <div className="divider-line" />
          <div className="divider-label">VS</div>
          <div className="divider-line" />
        </div>

        <div className="comparison-column scheme-b-column">
          <div className="column-header">
            <span className="scheme-badge scheme-b-badge">方案 B</span>
          </div>
          <div className="product-display">
            <ProductRenderer
              colorConfig={schemeB}
              productType={productType}
            />
            {showDifference && heatmapOverlayB}
          </div>
          <div className="color-summary">
            {parts.map((part) => (
              <div key={part} className="color-summary-item">
                <div
                  className="color-dot"
                  style={{ backgroundColor: schemeB[part] }}
                />
                <span className="color-label">{PART_LABELS[part]}</span>
                <span className="color-value">{schemeB[part].toUpperCase()}</span>
                {showDifference && (
                  <span
                    className="diff-indicator"
                    style={{ color: getHeatColor(differences[part]) }}
                    title={getDifferenceLevel(differences[part])}
                  >
                    ΔE: {differences[part].toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDifference && (
        <div className="difference-legend">
          <div className="legend-title">色差热力图图例</div>
          <div className="legend-bar">
            <div className="legend-gradient" />
            <div className="legend-labels">
              <span>差异小</span>
              <span>平均 ΔE: {avgDeltaE.toFixed(1)}</span>
              <span>差异大</span>
            </div>
          </div>
          <div className="legend-description">
            使用 CIE76 Delta-E 公式计算颜色差异，差异越大颜色越偏红
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
