import React, { useMemo } from 'react';
import { BarChart3, Eye, AlertTriangle } from 'lucide-react';
import {
  ColorBlindnessType,
  ColorPairDistance,
  PaletteColor,
  calculatePaletteDistances,
  simulatePaletteColorBlindness,
  wcagContrast,
  wcagLevel,
} from './colorEngine';

export interface AnalysisPanelProps {
  colors: PaletteColor[];
  selectedHex: string | null;
}

const CB_TYPES: { key: ColorBlindnessType; label: string; short: string }[] = [
  { key: 'protanopia', label: '红色盲 Protanopia', short: '红' },
  { key: 'deuteranopia', label: '绿色盲 Deuteranopia', short: '绿' },
  { key: 'tritanopia', label: '蓝色盲 Tritanopia', short: '蓝' },
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

  const cbPalettes = useMemo(() => {
    const result: Record<ColorBlindnessType, string[]> = {
      protanopia: [],
      deuteranopia: [],
      tritanopia: [],
    };
    if (filledColors.length === 0) return result;
    for (const t of CB_TYPES) {
      result[t.key] = simulatePaletteColorBlindness(filledColors, t.key);
    }
    return result;
  }, [filledColors]);

  const warnCount = distances.filter((d) => d.warning).length;

  const getLevelClass = (level: string) => {
    if (level === 'AAA') return 'badge-pass';
    if (level === 'AA') return 'badge-warn';
    return 'badge-fail';
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
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px',
            }}
          >
            <Eye size={16} className="panel-title-icon" />
            色盲模拟视图
          </div>
          <div className="cb-simulations">
            {CB_TYPES.map((t) => (
              <div key={t.key} className="cb-card">
                <div className="cb-card-title">
                  <span
                    style={{
                      display: 'inline-flex',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      background: 'rgba(255,255,255,0.08)',
                      fontWeight: 700,
                    }}
                  >
                    {t.short}
                  </span>
                  {t.label}
                </div>
                <div className="cb-palette">
                  {cbPalettes[t.key].length > 0 ? (
                    cbPalettes[t.key].map((c, i) => (
                      <div key={i} className="cb-swatch" style={{ backgroundColor: c }} />
                    ))
                  ) : (
                    <div style={{ gridColumn: '1/-1', padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                      暂无颜色
                    </div>
                  )}
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
