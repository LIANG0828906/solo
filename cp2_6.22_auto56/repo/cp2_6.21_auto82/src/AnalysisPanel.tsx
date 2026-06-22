import React, { useMemo } from 'react';
import { BarChart3, Eye, AlertTriangle, Heart, Sparkles } from 'lucide-react';
import {
  ColorBlindnessAccessibility,
  ColorBlindnessType,
  ColorPairDistance,
  FullColorBlindnessAnalysis,
  PaletteColor,
  analyzeColorEmotion,
  analyzePaletteColorBlindness,
  calculatePaletteDistances,
  wcagContrast,
  wcagLevel,
} from './colorEngine';

export interface AnalysisPanelProps {
  colors: PaletteColor[];
  selectedHex: string | null;
}

const CB_TYPES: { key: ColorBlindnessType; label: string; short: string }[] = [
  { key: 'protanopia', label: '红色盲', short: '红' },
  { key: 'deuteranopia', label: '绿色盲', short: '绿' },
  { key: 'tritanopia', label: '蓝色盲', short: '蓝' },
];

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ colors, selectedHex }) => {
  const filledColors = useMemo(
    () => colors.filter((c) => c.hex).map((c) => c.hex),
    [colors]
  );

  const selectedAnalysis = useMemo(() => {
    if (!selectedHex) return null;
    const white = '#FFFFFF';
    const black = '#000000';
    const ratioW = wcagContrast(selectedHex, white);
    const ratioB = wcagContrast(selectedHex, black);
    return {
      onWhite: {
        ratio: ratioW,
        level: wcagLevel(ratioW),
        bg: white,
        fg: selectedHex,
      },
      onBlack: {
        ratio: ratioB,
        level: wcagLevel(ratioB),
        bg: black,
        fg: selectedHex,
      },
    };
  }, [selectedHex]);

  const distances = useMemo<ColorPairDistance[]>(
    () => calculatePaletteDistances(filledColors),
    [filledColors]
  );

  const cbAnalysis = useMemo<FullColorBlindnessAnalysis[]>(
    () => analyzePaletteColorBlindness(filledColors),
    [filledColors]
  );

  const emotionAnalysis = useMemo(
    () => filledColors.map((hex) => ({ hex, emotion: analyzeColorEmotion(hex) })),
    [filledColors]
  );

  const warnCount = distances.filter((d) => d.warning).length;
  const poorCbCount = cbAnalysis.filter((a) => a.overall === 'poor').length;

  const getLevelClass = (level: string) => {
    if (level === 'AAA') return 'badge-pass';
    if (level === 'AA') return 'badge-warn';
    return 'badge-fail';
  };

  const getAccessibilityClass = (acc: ColorBlindnessAccessibility): string => {
    if (acc === 'good') return 'cb-badge-good';
    if (acc === 'fair') return 'cb-badge-fair';
    return 'cb-badge-poor';
  };

  const getDetailBadgeClass = (acc: ColorBlindnessAccessibility): string => {
    if (acc === 'good') return 'cb-badge-good';
    if (acc === 'fair') return 'cb-badge-fair';
    return 'cb-badge-poor';
  };

  return (
    <div className="analysis-section">
      <div className="panel-title">
        <BarChart3 className="panel-title-icon" size={18} />
        智能分析
      </div>

      {selectedAnalysis ? (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
            WCAG AA 对比度检测 - 选中色 {selectedHex}
          </div>
          <div className="contrast-card">
            <div
              className="contrast-preview"
              style={{ backgroundColor: selectedAnalysis.onWhite.bg, color: selectedAnalysis.onWhite.fg }}
            >
              <span>白背景示例文本</span>
              <div className="contrast-ratio" style={{ color: selectedAnalysis.onWhite.fg }}>
                {selectedAnalysis.onWhite.ratio.toFixed(2)}:1
              </div>
              <span className={`contrast-badge ${getLevelClass(selectedAnalysis.onWhite.level)}`}>
                {selectedAnalysis.onWhite.level === 'Fail' ? '不通过' : selectedAnalysis.onWhite.level}
              </span>
            </div>

            <div className="contrast-arrow">⇄</div>

            <div
              className="contrast-preview"
              style={{ backgroundColor: selectedAnalysis.onBlack.bg, color: selectedAnalysis.onBlack.fg }}
            >
              <span>黑背景示例文本</span>
              <div className="contrast-ratio" style={{ color: selectedAnalysis.onBlack.fg }}>
                {selectedAnalysis.onBlack.ratio.toFixed(2)}:1
              </div>
              <span className={`contrast-badge ${getLevelClass(selectedAnalysis.onBlack.level)}`}>
                {selectedAnalysis.onBlack.level === 'Fail' ? '不通过' : selectedAnalysis.onBlack.level}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          选择颜色查看 WCAG 对比度
        </div>
      )}

      {filledColors.length >= 2 && (
        <div className="distance-matrix">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: warnCount > 0 ? 'var(--accent-red)' : 'var(--text-secondary)',
              marginBottom: '4px',
            }}
          >
            <AlertTriangle size={14} />
            HSL 色差检测 ({distances.length}对
            {warnCount > 0 && <span style={{ color: 'var(--accent-red)' }}> · {warnCount}警告</span>})
          </div>
          {distances.slice(0, 15).map((d, i) => (
            <div key={i} className={`distance-item ${d.warning ? 'warn' : ''}`}>
              <div className="distance-swatches">
                <div
                  className="distance-swatch"
                  style={{ backgroundColor: filledColors[d.index1] }}
                />
                <div
                  className="distance-swatch"
                  style={{ backgroundColor: filledColors[d.index2] }}
                />
              </div>
              <div className="distance-bar">
                <div
                  className={`distance-bar-fill ${d.warning ? 'warn' : 'ok'}`}
                  style={{ width: `${d.distance}%` }}
                />
              </div>
              <div className={`distance-value ${d.warning ? 'warn' : ''}`}>
                {d.distance}%
              </div>
            </div>
          ))}
          {distances.length > 15 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4px' }}>
              仅显示前 15 对，共 {distances.length} 对
            </div>
          )}
        </div>
      )}

      {filledColors.length > 0 && (
        <div className="cb-accessibility-section">
          <div className="analysis-section-title">
            <Eye className="analysis-section-icon" size={16} />
            色盲友好度评估
            {poorCbCount > 0 && (
              <span style={{ color: 'var(--accent-yellow)', fontSize: '11px', marginLeft: '4px' }}>
                · {poorCbCount}个需优化
              </span>
            )}
          </div>
          <div className="cb-accessibility-grid">
            {filledColors.map((hex, i) => {
              const analysis = cbAnalysis[i];
              if (!analysis) return null;
              return (
                <div key={i} className="cb-accessibility-row">
                  <div
                    className="cb-accessibility-original"
                    style={{ backgroundColor: hex }}
                    data-hex={hex}
                  />
                  <div className="cb-accessibility-simulated">
                    <div className="cb-accessibility-types">
                      {CB_TYPES.map((t) => (
                        <div key={t.key} className="cb-accessibility-type">
                          <div
                            className="cb-accessibility-swatch"
                            style={{ backgroundColor: analysis[t.key].simulated }}
                          />
                          <div className="cb-accessibility-label">
                            {t.short} · {analysis[t.key].distanceToOriginal}%
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="cb-accessibility-detail">
                      {CB_TYPES.map((t) => (
                        <span
                          key={t.key}
                          className={`cb-detail-badge ${getDetailBadgeClass(analysis[t.key].accessibility)}`}
                          style={{ padding: '2px 5px', fontSize: '9px' }}
                        >
                          {t.short}:{analysis[t.key].accessibilityLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`cb-accessibility-badge ${getAccessibilityClass(analysis.overall)}`}>
                    {analysis.overallLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filledColors.length > 0 && (
        <div className="emotion-section">
          <div className="analysis-section-title">
            <Heart className="analysis-section-icon" size={16} />
            情感标签推荐
          </div>
          <div className="emotion-grid">
            {emotionAnalysis.map((item, i) => (
              <div key={i} className="emotion-card">
                <div
                  className="emotion-card-swatch"
                  style={{ backgroundColor: item.hex }}
                  data-hex={item.hex}
                />
                <div className="emotion-card-tags" style={{ marginTop: '14px' }}>
                  {item.emotion.tags.map((tag, j) => (
                    <span
                      key={j}
                      className={`emotion-tag-item ${item.emotion.intensity}`}
                    >
                      <Sparkles size={9} style={{ marginRight: '2px' }} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filledColors.length === 0 && (
        <div className="section-empty">
          <div className="section-empty-icon">📊</div>
          <div>添加颜色后启用智能分析</div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AnalysisPanel);
